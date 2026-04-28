const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
};

function jsonResponse(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...JSON_HEADERS,
      ...extraHeaders,
    },
  });
}

function getAllowedOrigins(env) {
  return String(env.CONTACT_ALLOWED_ORIGIN || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

function getCorsHeaders(request, env) {
  const requestOrigin = request.headers.get('Origin');
  const allowedOrigins = getAllowedOrigins(env);
  const allowedOrigin = allowedOrigins.includes(requestOrigin || '')
    ? requestOrigin
    : allowedOrigins[0] || requestOrigin || '*';

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  };
}

function sanitizeText(value, maxLength = 4000) {
  return String(value || '')
    .replace(/\r\n/g, '\n')
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, maxLength);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildEmailPayload(data, env) {
  const submittedAt = new Date().toISOString();
  const lines = [
    'New Amburax website inquiry',
    '',
    `Name: ${data.name}`,
    `Email: ${data.email}`,
    `Company: ${data.company || 'Not provided'}`,
    `Primary project area: ${data.service || 'Not provided'}`,
    `Page: ${data.page || 'Not provided'}`,
    `Submitted at: ${submittedAt}`,
    '',
    'Project brief:',
    data.brief,
  ];

  const html = `
    <div style="font-family: Inter, Arial, sans-serif; color: #1a1a2e; line-height: 1.7;">
      <h2 style="margin: 0 0 16px;">New Amburax website inquiry</h2>
      <p style="margin: 0 0 8px;"><strong>Name:</strong> ${escapeHtml(data.name)}</p>
      <p style="margin: 0 0 8px;"><strong>Email:</strong> ${escapeHtml(data.email)}</p>
      <p style="margin: 0 0 8px;"><strong>Company:</strong> ${escapeHtml(data.company || 'Not provided')}</p>
      <p style="margin: 0 0 8px;"><strong>Primary project area:</strong> ${escapeHtml(data.service || 'Not provided')}</p>
      <p style="margin: 0 0 8px;"><strong>Page:</strong> ${escapeHtml(data.page || 'Not provided')}</p>
      <p style="margin: 0 0 20px;"><strong>Submitted at:</strong> ${escapeHtml(submittedAt)}</p>
      <div style="padding: 18px; border-radius: 16px; background: #f5f7ff; border: 1px solid rgba(79,70,229,0.12);">
        <strong style="display: block; margin-bottom: 10px;">Project brief</strong>
        <p style="margin: 0; white-space: pre-wrap;">${escapeHtml(data.brief)}</p>
      </div>
    </div>
  `.trim();

  return {
    from: env.RESEND_FROM_EMAIL,
    to: [env.CONTACT_TO_EMAIL],
    subject: `Amburax inquiry from ${data.name}${data.company ? ` - ${data.company}` : ''}`,
    html,
    text: lines.join('\n'),
    reply_to: data.email,
    tags: [
      { name: 'source', value: 'website' },
      { name: 'flow', value: 'contact_form' },
    ],
  };
}

export function onRequestOptions(context) {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(context.request, context.env),
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const corsHeaders = getCorsHeaders(request, env);
  const requestOrigin = request.headers.get('Origin');
  const allowedOrigins = getAllowedOrigins(env);

  if (requestOrigin && allowedOrigins.length > 0 && !allowedOrigins.includes(requestOrigin)) {
    return jsonResponse(
      { ok: false, error: 'Origin not allowed.' },
      403,
      corsHeaders
    );
  }

  if (!env.RESEND_API_KEY || !env.RESEND_FROM_EMAIL || !env.CONTACT_TO_EMAIL) {
    return jsonResponse(
      { ok: false, error: 'Email delivery is not configured correctly.' },
      500,
      corsHeaders
    );
  }

  let body;

  try {
    body = await request.json();
  } catch {
    return jsonResponse(
      { ok: false, error: 'Invalid JSON payload.' },
      400,
      corsHeaders
    );
  }

  const data = {
    name: sanitizeText(body.name, 120),
    email: sanitizeText(body.email, 160),
    company: sanitizeText(body.company, 160),
    service: sanitizeText(body.service, 160),
    brief: sanitizeText(body.brief, 5000),
    page: sanitizeText(body.page, 500),
  };

  if (!data.name || !data.email || !data.brief) {
    return jsonResponse(
      { ok: false, error: 'Missing required inquiry fields.' },
      400,
      corsHeaders
    );
  }

  if (!isValidEmail(data.email)) {
    return jsonResponse(
      { ok: false, error: 'A valid email address is required.' },
      400,
      corsHeaders
    );
  }

  if (data.brief.length < 40) {
    return jsonResponse(
      { ok: false, error: 'Project brief is too short.' },
      400,
      corsHeaders
    );
  }

  const resendResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
      'User-Agent': 'amburax-cloudflare-pages/1.0',
      'Idempotency-Key': crypto.randomUUID(),
    },
    body: JSON.stringify(buildEmailPayload(data, env)),
  });

  if (!resendResponse.ok) {
    let resendError = 'Resend rejected the message.';

    try {
      const errorBody = await resendResponse.json();
      resendError = errorBody?.message || errorBody?.error?.message || resendError;
    } catch {
      // Keep the generic error if Resend did not return JSON.
    }

    return jsonResponse(
      { ok: false, error: resendError },
      502,
      corsHeaders
    );
  }

  const resendData = await resendResponse.json();

  return jsonResponse(
    {
      ok: true,
      id: resendData.id || null,
      message: 'Inquiry delivered successfully.',
    },
    200,
    corsHeaders
  );
}
