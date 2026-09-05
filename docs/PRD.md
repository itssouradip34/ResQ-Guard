# Product Requirements Document (PRD)
## FCK (Fueling Campus Knights) Food Delivery Platform

## 1. Product Overview

Build a mobile-first web application for **FCK (Fueling Campus Knights)**, a small food delivery business that currently publishes daily menus through a WhatsApp group.

The application should replace manual WhatsApp ordering with a simple customer ordering and payment flow while keeping WhatsApp useful for marketing and notifications.

This is a small-business ordering platform, **not a marketplace or Swiggy/Zomato clone**.

## 2. Business Model

The owner:

- Publishes a different menu on different days.
- Uploads food/product photos.
- Sets prices for each day's offerings.
- May offer multiple sizes, quantities, or variants.
- May have limited stock.
- Sets an order cutoff time, commonly around 5:30 PM.
- Delivers to defined areas such as hostels/campus areas.
- Currently accepts orders through WhatsApp/calls.

The system must allow the owner to operate the business primarily from a phone.

## 3. Goals

### Primary goals

1. Make ordering significantly easier than WhatsApp messages.
2. Allow the owner to publish and modify a daily menu without developer assistance.
3. Support food photos, variants, quantity-based pricing, and limited availability.
4. Accept online payments securely.
5. Give the owner a clear order-management dashboard.
6. Preserve WhatsApp as a communication/marketing channel.
7. Keep the first release simple enough for a small business to operate.

### Non-goals for the initial release

Do NOT build these unless explicitly requested later:

- Multi-vendor marketplace functionality.
- Native Android/iOS applications.
- Live delivery GPS tracking.
- Complex loyalty systems.
- AI recommendations.
- Restaurant discovery/search.
- Multi-kitchen enterprise management.

## 4. Target Users

### Customer

A person who sees the daily menu through WhatsApp, social media, a QR code, or the website and wants to place an order quickly.

### Owner/Admin

The food-business operator who manages menus, prices, availability, orders, payments, and delivery status.

## 5. Customer Requirements

### 5.1 Today's Menu

The customer should be able to:

- See today's available menu.
- See food/product photographs.
- See descriptions where provided.
- See price and variant information.
- See availability/sold-out state.
- See the order cutoff time.
- Understand delivery areas/charges.

### 5.2 Menu Item Variants

A menu item may have multiple purchasable variants.

Examples:

- Prawns Malai Curry:
  - 2 pcs — ₹160
  - 4 pcs — ₹300
- Katla:
  - Standard — ₹90/pc
  - Big — ₹120/pc
- Steamed Rice:
  - Single serving — ₹60

The data model must NOT assume every item has only one price.

### 5.3 Cart

Customers can:

- Add items.
- Select variants.
- Change quantities.
- Remove items.
- See subtotal.
- See delivery charges where applicable.
- See final total.

Totals must be calculated and validated server-side before order creation/payment.

### 5.4 Checkout

Initial checkout should support guest checkout.

Collect only necessary information, such as:

- Customer name.
- Phone number.
- Delivery address.
- Delivery area/location.
- Optional order notes.

Avoid forcing account creation unless there is a strong business reason.

### 5.5 Payment

The system must support online payment through an appropriate Indian payment provider.

Important rules:

- Never trust a client-side "payment successful" flag.
- Payment status must be verified server-side.
- Webhooks must be authenticated/verified according to the payment provider.
- Webhook processing must be idempotent.
- Duplicate callbacks must not create duplicate orders/payments.
- Secrets must never be committed to source control.

The specific payment provider should be selected during architecture planning.

### 5.6 Order Confirmation

After successful order/payment processing, show:

- Order number.
- Items.
- Quantities/variants.
- Total.
- Payment status.
- Delivery information.
- Current order status.

Provide a clear way to contact the business if required.

## 6. Admin Requirements

Admin functionality must be mobile-friendly.

### 6.1 Authentication

Only authorized administrators may access admin functionality.

Admin APIs must enforce authorization server-side.

### 6.2 Menu Management

Admin can:

- Create a daily menu.
- Add menu items.
- Upload/change images.
- Set prices.
- Add multiple variants.
- Set availability.
- Set stock/quantity limits where applicable.
- Mark an item sold out.
- Edit/delete items.
- Publish/unpublish a menu.
- Set order cutoff time.

### 6.3 Order Management

Admin can view:

- New orders.
- Paid/unpaid state.
- Customer information.
- Items and variants.
- Total amount.
- Delivery address.
- Order creation time.
- Payment reference/status.
- Order status.

Initial order states should be explicitly modeled, for example:

`PENDING_PAYMENT → PAID → ACCEPTED → PREPARING → OUT_FOR_DELIVERY → DELIVERED`

with appropriate failure/cancellation states.

Do not allow arbitrary invalid state transitions.

### 6.4 Notifications

The architecture should support notifications to the owner, including WhatsApp where technically and legally appropriate.

The first implementation may use a simpler notification mechanism if WhatsApp Business API integration is not yet configured.

### 6.5 Historical Orders

Admin should be able to view previous orders and basic order details.

## 7. Daily Menu Concept

The daily menu is a first-class business concept.

Example:

**1 September**

- Prawns Malai Curry
  - 2 pcs — ₹160
  - 4 pcs — ₹300
- Katla Fry
  - 1 pc — ₹110
  - 2 pcs — ₹200
- Steamed Rice
  - 1 serving — ₹60

Tomorrow's menu may contain completely different items and prices.

Do not hard-code menu data into frontend code.

## 8. Images

Food/product images should be stored in dedicated object/image storage, not directly as database blobs unless there is a deliberate architectural reason.

Database records should reference the stored image.

The admin upload flow should validate:

- File type.
- File size.
- Reasonable dimensions.
- Upload success/failure.

## 9. Delivery

The system should support:

- Defined delivery areas.
- Optional delivery charges.
- Order cutoff time.
- Delivery notes.

Exact delivery rules are a business decision and should remain configurable rather than hard-coded.

## 10. Business Rules

At minimum:

1. A customer cannot order an unavailable/sold-out item.
2. A customer cannot order after the configured cutoff if the menu is closed.
3. Prices used for an order must come from trusted server-side data.
4. Historical orders must preserve the purchased price and item information even if the menu changes later.
5. Payment status must be independent from UI state.
6. Stock changes must be handled safely to avoid overselling.
7. Monetary values must be represented safely; do not use floating-point arithmetic for financial calculations.
8. All important server inputs must be validated.
9. Admin-only operations require server-side authorization.

## 11. UX Requirements

The experience should prioritize:

- Mobile-first design.
- Fast page loading.
- Large, clear food images.
- Clear prices.
- Minimal checkout steps.
- Obvious cart state.
- Clear sold-out/cutoff messages.
- Good usability on common Android phones.
- Accessible buttons and readable text.

The visual design should be based on the actual business identity and food photography, not on a generic restaurant template.

## 12. Security Requirements

At minimum:

- Secure admin authentication.
- Server-side authorization.
- Input validation.
- CSRF protection where applicable.
- Rate limiting for sensitive endpoints.
- Secure session/cookie configuration.
- Secrets only in environment/configuration management.
- No sensitive payment information stored unnecessarily.
- Verified payment webhooks.
- Idempotent payment/order operations.
- Auditability for important admin actions where practical.

## 13. Reliability Requirements

The system should handle:

- Payment failure.
- Payment success followed by browser closure.
- Duplicate payment webhooks.
- Customer refreshing checkout.
- Network failures.
- Admin accidentally opening multiple tabs.
- Stock becoming unavailable during checkout.
- Menu cutoff occurring during checkout.

Critical operations must be designed so that retries do not create duplicate orders or payments.

## 14. Analytics — Initial Scope

Basic metrics are sufficient:

- Number of orders.
- Gross sales.
- Orders by date.
- Popular menu items.
- Payment success/failure counts.

Do not build an elaborate analytics platform in v1.

## 15. Acceptance Criteria

The MVP is acceptable when:

1. Admin can create and publish a daily menu from a phone.
2. Admin can upload food images.
3. Admin can configure multiple variants/prices.
4. Customers can browse the published menu.
5. Customers can add variants to a cart.
6. Customers can complete checkout.
7. Server validates the order.
8. Online payment can be initiated and verified.
9. Successful payment creates exactly one valid paid order.
10. Duplicate webhook delivery does not duplicate the order.
11. Admin can see incoming orders.
12. Admin can update order status.
13. Sold-out items cannot be purchased.
14. Orders cannot be placed after the configured cutoff.
15. Historical orders retain their original prices/details.
16. The complete customer journey works on a mobile viewport.
17. Automated tests cover critical business/payment/order logic.
18. Browser-based end-to-end verification has been performed.

## 16. Development Principle

Prefer the **simplest architecture that is reliable, secure, maintainable, and appropriate for a small business**.

Do not introduce infrastructure merely because it is technically interesting.

Before adding a major dependency or service, justify why it is necessary.
