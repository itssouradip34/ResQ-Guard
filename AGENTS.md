# Instructions for AI Coding Agents

## Project context

This repository contains a small-business food delivery platform for FCK
(Fueling Campus Knights).

The business publishes changing daily menus and currently takes orders
through WhatsApp.

Read `docs/PRD.md` before implementing product behavior.

## Operating principles

1. Inspect the repository before changing it.
2. Prefer small, coherent changes.
3. Do not rewrite working code without a concrete reason.
4. Do not invent APIs, database fields, environment variables, or provider behavior.
5. Follow existing project conventions unless they conflict with security or correctness.
6. Explain architectural changes before implementing them.
7. Verify behavior rather than assuming code correctness.

## Product rules

- Menus are date-specific.
- Prices may change between menus/days.
- Menu items can have multiple variants.
- Availability can change during the day.
- Orders must preserve historical pricing and purchased item details.
- Order cutoff is configurable.
- Customers should be able to use guest checkout unless requirements change.
- Admin functionality must be protected server-side.

## Financial rules

- Never trust client-provided prices.
- Never trust client-provided payment status.
- Recalculate/validate order totals on the server.
- Do not use floating-point arithmetic for monetary values.
- Payment confirmation must be verified server-side.
- Payment webhooks must be idempotent.
- Retries must not create duplicate orders.

## Database rules

- Use proper foreign keys and constraints.
- Add indexes based on actual query patterns.
- Use transactions for operations that must be atomic.
- Avoid storing derived financial values without understanding their consistency requirements.
- Historical order records must remain correct after menu edits.

## Security rules

- Never commit secrets.
- Never expose privileged credentials to the browser.
- Validate and sanitize untrusted input.
- Enforce authorization on the server.
- Protect sensitive endpoints against abuse.
- Do not log secrets or unnecessary sensitive customer/payment information.

## Image rules

- Do not store large images directly in the relational database unless explicitly justified.
- Validate uploads.
- Use an image/object storage service.
- Store stable references to images in the database.

## UI rules

- Mobile-first.
- Optimize for ordinary Android phones.
- Keep checkout short.
- Make prices and variants unambiguous.
- Clearly communicate sold-out and cutoff states.
- Avoid unnecessary animations or heavy dependencies.

## Testing rules

For meaningful changes, run the relevant:
- Unit tests.
- Integration tests.
- Type checking.
- Linting.
- Build.
- Browser/end-to-end verification when UI behavior is affected.

Critical flows should have automated coverage:
- Menu publication.
- Variant selection.
- Cart totals.
- Order creation.
- Stock/availability.
- Cutoff enforcement.
- Payment verification.
- Duplicate webhook handling.
- Admin authorization.

## Agent behavior

Before coding a non-trivial task:
1. Inspect relevant files.
2. Identify dependencies and affected components.
3. State the implementation plan.
4. Implement the smallest correct change.
5. Run appropriate verification.
6. Report files changed and verification performed.

If requirements are ambiguous and the decision could cause rework, ask rather than guessing.
For minor implementation details that do not materially affect architecture, choose the simplest reasonable option and proceed.
Never claim a feature is "working" solely because the code compiles. Verify it.
