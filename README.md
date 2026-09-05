# FCK Food Delivery Platform

A mobile-first ordering platform for FCK (Fueling Campus Knights), a small daily food-delivery business.

## What this project does

The business currently publishes daily food menus through WhatsApp.

This application provides:

- Daily menu publishing.
- Food/product photos.
- Variants and quantity-based pricing.
- Availability/stock control.
- Customer cart and checkout.
- Online payments.
- Order management.
- Delivery information.
- Admin dashboard.
- WhatsApp-compatible notification/marketing workflow.

## Product philosophy

This is **not** intended to be a Swiggy/Zomato clone.

The application should optimize for:

- A small number of daily menu items.
- Rapid menu changes.
- Mobile administration.
- Very simple customer checkout.
- Reliable payment/order processing.
- Low operational complexity.

## Repository structure

The exact structure is determined by the approved technical architecture. Keep responsibilities separated and avoid unnecessary abstractions.

Suggested high-level organization:

```text
src/
  app/
  components/
  features/
  lib/
  server/

docs/
  PRD.md
  ARCHITECTURE.md
  DEVELOPMENT.md
  SECURITY.md
```

## Development rules

- Read `docs/PRD.md` before implementing product behavior.
- Read `AGENTS.md` before making significant changes.
- Do not hard-code menu items or prices.
- Do not trust client-side totals or payment status.
- Validate important inputs on the server.
- Preserve historical order data.
- Treat payment/webhook processing as idempotent.
- Keep admin functionality server-authorized.
- Keep the customer experience mobile-first.
- Run tests, type checks, and linting after meaningful changes.
- Use browser verification for customer/admin flows.

## Local development

The exact commands depend on the selected stack.

The canonical commands must be documented here once the project foundation is established.

Expected categories:

```bash
# install dependencies
# start development server
# run unit/integration tests
# run lint
# run type checking
# build production bundle
```

Do not invent commands that are not supported by the actual repository.

## Environment variables

Never commit secrets.

A `.env.example` file should document required configuration without containing real credentials.

Likely categories include:

```text
DATABASE_URL=
AUTH_SECRET=
PAYMENT_PROVIDER_KEY=
PAYMENT_PROVIDER_SECRET=
PAYMENT_WEBHOOK_SECRET=
IMAGE_STORAGE_CONFIGURATION=
WHATSAPP_CONFIGURATION=
```

The final variable names must match the actual implementation.

## Deployment

Deployment should use a managed hosting/database/storage setup appropriate for a small production application.

The final deployment procedure must document:

1. Database setup/migrations.
2. Environment variables.
3. Image storage.
4. Payment configuration.
5. Webhook URL configuration.
6. Domain configuration.
7. Production smoke tests.
8. Backup/recovery expectations.

## Status

Current status: **Planning / architecture**

Do not treat this README as proof that a feature is implemented. The implementation and verification status must reflect the actual repository.
