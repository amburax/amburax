import { trackEvent } from './analytics.js';
import { siteConfig } from './site-config.js';

function setFormNote(formNote, message, status = 'default') {
  formNote.textContent = message;
  formNote.classList.toggle('success', status === 'success');
  formNote.classList.toggle('error', status === 'error');
}

function resetTimingField(startedAtField) {
  if (startedAtField) {
    startedAtField.value = String(Date.now());
  }
}

function openMailtoDraft(payload, recipient) {
  const subject = encodeURIComponent(`Amburax inquiry from ${payload.name}${payload.company ? ` - ${payload.company}` : ''}`);
  const body = encodeURIComponent(
    [
      'Hello Amburax,',
      '',
      `Name: ${payload.name}`,
      `Email: ${payload.email}`,
      `Company: ${payload.company || 'Not provided'}`,
      `Primary project area: ${payload.service || 'Not provided'}`,
      '',
      'Project brief:',
      payload.brief,
      '',
      `Page: ${payload.page}`,
      'Sent from the Amburax website inquiry form.',
    ].join('\n')
  );

  window.location.href = `mailto:${recipient}?subject=${subject}&body=${body}`;
}

export function initContactForm({ contactForm, formNote }) {
  if (!contactForm || !formNote) {
    return;
  }

  const startedAtField = document.getElementById('contact-started-at');
  const pageField = document.getElementById('contact-page');
  let startedTracked = false;

  resetTimingField(startedAtField);

  if (pageField) {
    pageField.value = window.location.href;
  }

  contactForm.addEventListener('focusin', () => {
    if (startedTracked) {
      return;
    }

    startedTracked = true;
    trackEvent('contact_form_started', { location: 'contact_section' });
  });

  contactForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const name = document.getElementById('contact-name');
    const email = document.getElementById('contact-email');
    const company = document.getElementById('contact-company');
    const service = document.getElementById('contact-service');
    const brief = document.getElementById('contact-brief');
    const consent = document.getElementById('contact-consent');
    const website = document.getElementById('contact-website');

    if (!name || !email || !brief || !consent) {
      return;
    }

    const cleanName = name.value.trim();
    const cleanEmail = email.value.trim();
    const cleanCompany = company ? company.value.trim() : '';
    const cleanService = service ? service.value.trim() : '';
    const cleanBrief = brief.value.trim();
    const cleanWebsite = website ? website.value.trim() : '';
    const startedAt = Number(startedAtField?.value || Date.now());
    const elapsed = Date.now() - startedAt;

    if (!cleanName || !cleanEmail || !cleanBrief) {
      setFormNote(formNote, 'Please complete the required fields so we can draft a useful project brief.', 'error');
      return;
    }

    if (!email.validity.valid) {
      setFormNote(formNote, 'Please enter a valid work email address so Amburax can reply.', 'error');
      return;
    }

    if (cleanBrief.length < siteConfig.contact.minBriefLength) {
      setFormNote(
        formNote,
        `Please share a little more detail so the brief is useful. Aim for at least ${siteConfig.contact.minBriefLength} characters.`,
        'error'
      );
      return;
    }

    if (!consent.checked) {
      setFormNote(formNote, 'Please confirm consent so Amburax can respond to your inquiry.', 'error');
      return;
    }

    if (cleanWebsite || elapsed < siteConfig.contact.minSubmitDelayMs) {
      trackEvent('contact_form_blocked', { reason: cleanWebsite ? 'honeypot' : 'too_fast' });
      setFormNote(formNote, 'Please wait a moment and try again.', 'error');
      resetTimingField(startedAtField);
      return;
    }

    const payload = {
      name: cleanName,
      email: cleanEmail,
      company: cleanCompany,
      service: cleanService || 'Not provided',
      brief: cleanBrief,
      page: pageField?.value || window.location.href,
    };

    if (siteConfig.contact.endpoint) {
      const submitButton = contactForm.querySelector('button[type="submit"]');
      submitButton?.setAttribute('disabled', 'disabled');

      fetch(siteConfig.contact.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error('Request failed');
          }

          trackEvent('contact_form_submitted', { location: 'contact_section', mode: 'endpoint' });
          setFormNote(formNote, 'Thanks. Your inquiry was sent successfully and Amburax can follow up from here.', 'success');
          contactForm.reset();
          resetTimingField(startedAtField);
          if (pageField) {
            pageField.value = window.location.href;
          }
          startedTracked = false;
        })
        .catch(() => {
          trackEvent('contact_form_fallback', { location: 'contact_section', mode: 'mailto_after_failure' });
          setFormNote(formNote, 'The secure endpoint is unavailable right now, so we are opening a drafted email fallback instead.', 'error');
          openMailtoDraft(payload, siteConfig.contact.recipient);
        })
        .finally(() => {
          submitButton?.removeAttribute('disabled');
        });

      return;
    }

    trackEvent('contact_form_submitted', { location: 'contact_section', mode: 'mailto' });
    setFormNote(formNote, 'Opening your email app with a drafted brief. Review it there before sending.', 'success');
    openMailtoDraft(payload, siteConfig.contact.recipient);
    resetTimingField(startedAtField);
  });
}
