# QA Checklist

## Core flow

1. Verify the homepage loads without console errors.
2. Verify the hero CTA scrolls to the contact section.
3. Verify the logo link returns to the top without errors.
4. Verify the mobile menu opens, closes, and closes on `Escape`.

## Inquiry form

1. Required fields should block empty submissions.
2. The consent checkbox should be required.
3. The hidden spam field should remain empty in normal use.
4. The form should reject ultra-fast submissions.
5. Without a configured endpoint, the form should draft an email.
6. With a configured endpoint, the form should show a success state after a valid response.

## Layout breakpoints

1. Mobile: hero text remains readable, buttons stack cleanly, nav menu works.
2. Tablet: cards wrap cleanly, footer columns remain readable, CTA form spacing stays balanced.
3. Desktop: hero glass card, service hovers, and reveal motion feel smooth without layout shift.

## Content and trust

1. Footer links to `privacy.html` and `terms.html` should work.
2. LinkedIn and email links should open correctly.
3. Sitemap and manifest should resolve without 404s.
4. Metadata title and description should match the production positioning.
