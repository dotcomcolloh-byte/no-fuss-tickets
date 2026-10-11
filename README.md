# No Fuss Tickets

That image contains everything even admin panel should match the images exactly Build a production-ready, mobile-first event ticketing platform called:

TUMDO KALENJIN CONNECT

Tagline:
“Events. Tickets. Memories.”

IMPORTANT:
- Do NOT create a login/signup page for customers.
- Customers must be able to browse events, select tickets, enter their details, pay, and receive their ticket without creating an account.
- Use a bold modern RED + WHITE visual identity.
- Use rounded cards, clean typography, subtle shadows, modern icons and responsive layouts.
- The interface should feel similar to a professional Kenyan event-ticketing platform.
- Currency: Kenyan Shillings (KES / KSh).
- Optimize the customer experience primarily for mobile phones, but make the organiser dashboard responsive for desktop/tablet.
- Use the uploaded reference design as the visual inspiration for layout, spacing, cards, ticket design and branding.

==================================================
1. CUSTOMER WEBSITE — BROWSE EVENTS
==================================================

Create a public homepage with:

Header:
- Tumdo Kalenjin Connect logo
- Search icon
- Shopping/cart/ticket icon
- NO profile/account icon
- Red header
- Sticky mobile navigation

Hero section:
- Large event promotional image
- Event title
- Event category
- Date
- Location
- Short description
- “Get Tickets” red CTA button

Search:
“Search events, concerts, festivals, comedy, sports…”

Categories:
- All
- Music
- Festivals
- Comedy
- Sports
- Conferences
- Cultural

Event cards should display:
- Event image
- Event name
- Event type
- Date
- Location
- Starting price
- Tickets remaining where appropriate
- “Get Tickets” button

Bottom navigation:
- Home
- Search
- Tickets
- Events

Do NOT include a profile/account icon.

==================================================
2. EVENT DETAILS + SELECT TICKETS
==================================================

When the customer clicks an event:

Show:
- Event cover image
- Event name
- Event type
- Date and time
- Venue
- Location
- Description
- Organiser information
- Ticket categories

Example:

General Admission — KSh 2,000
VIP — KSh 5,000
VVIP — KSh 10,000

Each ticket type should have:
- Price
- Quantity selector
- Minus button
- Quantity
- Plus button
- Remaining ticket quantity

Show a sticky order summary:
- Selected tickets
- Quantities
- Subtotal
- Fees if applicable
- Total

CTA:
“Proceed to Checkout”

Prevent customers from purchasing more tickets than the available quantity.

==================================================
3. CHECKOUT — NO CUSTOMER LOGIN
==================================================

Checkout must collect:

Customer Details:
- Full Name
- Email Address
- Phone Number

Optional:
- National ID / Passport number if required by the organiser

Payment method:
- M-Pesa
- Card
- Other configured payment methods

Order summary:
- Event
- Ticket type
- Quantity
- Price
- Fees
- Total

CTA:
“Pay Now”

Clearly display:
“Your payment is securely processed and verified before your ticket is issued.”

The customer must NOT need an account.

==================================================
4. PAYMENT PROCESSING
==================================================

IMPORTANT SECURITY REQUIREMENT:

Payments MUST be processed server-side.

Never trust payment success information coming directly from the browser.

Implement:

Customer:
1. Enters name, email and phone.
2. Selects payment method.
3. Clicks Pay Now.
4. Frontend sends the order/payment request to the backend.
5. Backend creates a pending transaction.
6. Backend initiates payment through the configured payment provider.
7. Payment provider processes payment.
8. Backend receives webhook/callback.
9. Backend verifies the transaction with the payment provider.
10. Only after successful server-side verification should the order become PAID.
11. Generate the ticket only after verified payment.
12. Send ticket email to customer.

Never issue a ticket simply because the frontend says payment was successful.

Use idempotency protection so duplicate payment callbacks cannot generate duplicate tickets.

Store:
- Transaction ID
- Payment provider
- Provider transaction/reference number
- Customer name
- Customer email
- Customer phone
- Event ID
- Ticket type
- Quantity
- Amount
- Currency
- Payment status
- Payment timestamp
- Verification status

Payment statuses:
- Pending
- Processing
- Paid
- Failed
- Cancelled
- Refunded

==================================================
5. TICKET GENERATOR
==================================================

After successful server-side payment verification:

Automatically generate a unique ticket.

Every ticket must contain:

TUMDO KALENJIN CONNECT

Event image

Event name
Event type
Date
Time
Venue
Location

Customer:
Full Name
Email Address

Ticket type:
General / VIP / VVIP

Ticket ID:
Unique non-guessable ticket ID

QR Code:
Generate a unique QR code for every ticket.

The QR code should NOT contain sensitive customer information.

Instead, encode a secure ticket token/identifier that the backend can validate.

Ticket status:
VALID

Create a beautiful digital ticket card inspired by the provided reference image.

The ticket should look professional enough to be used as:
- Mobile ticket
- Email ticket
- Printable ticket

==================================================
6. EMAIL TICKET DELIVERY
==================================================

After payment verification and ticket generation:

Automatically email the customer.

Email subject:
“Your Tumdo Kalenjin Connect Ticket — [Event Name]”

Email should contain:

Tumdo Kalenjin Connect branding

Event image

“Thank you for your purchase!”

Customer:
Name
Email

Event:
Event name
Event type
Date
Time
Venue

Ticket type

Ticket ID

QR code

Instructions:
“Present this QR code at the entrance.”

Payment:
Amount paid
Transaction reference
Payment status

Include a button:
“View Ticket”

The email should contain the ticket as a polished ticket card.

Do not email a ticket before payment is verified.

==================================================
7. GATE SCANNER
==================================================

Create an organiser/staff scanning interface that works with a phone camera.

Screen:
“Scan Ticket”

Request camera permission.

Use the phone camera to scan QR codes.

After scanning, send the ticket token to the backend.

Backend validates:

- Ticket exists
- Ticket belongs to the event
- Payment is verified
- Ticket is not cancelled/refunded
- Ticket has not already been used

If valid:

Show:
✓ TICKET VERIFIED

Customer name
Event
Ticket type
Ticket ID

Button:
“Allow Entry”

When entry is confirmed:
- Mark ticket as USED
- Store scan time
- Store gate/scanner information
- Prevent the same ticket from being admitted again

If invalid:
Show:
✕ INVALID TICKET

If already scanned:
Show:
⚠ TICKET ALREADY USED

==================================================
8. ORGANISER DASHBOARD
==================================================

Create a secure organiser/admin dashboard.

Dashboard cards:

Total Sales
Tickets Sold
Tickets Remaining
Attendance
Pending Payments
Verified Payments
Used Tickets
Refunded Tickets

Charts:
- Sales over time
- Tickets sold by event
- Attendance
- Ticket type performance

Recent transactions table:

Date
Customer Name
Email
Event
Ticket Type
Amount
Transaction Reference
Payment Status

Ticket status:
- Valid
- Used
- Cancelled
- Refunded

Include search and filtering.

==================================================
9. EVENT MANAGEMENT
==================================================

Organisers can:

Create event
Edit event
Publish event
Unpublish event
Cancel event

Event fields:

Event name
Event type
Description
Cover image
Date
Start time
End time
Venue
Location

Ticket types:

Ticket name
Price
Quantity available
Sales start date
Sales end date

Examples:

General Admission
Price: KSh 2,000
Quantity: 500

VIP
Price: KSh 5,000
Quantity: 200

VVIP
Price: KSh 10,000
Quantity: 500

Automatically prevent overselling.

Show:
Tickets sold
Tickets remaining

==================================================
10. PAYMENT RECORDS
==================================================

Create a payment records page.

Columns:

Transaction ID
Date
Customer Name
Email
Phone
Event
Ticket Type
Amount
Currency
Payment Method
Provider Reference
Payment Status
Verification Status

Allow:
- Search
- Filter
- Sort
- Export CSV

Only verified transactions should be considered completed sales.

==================================================
11. CUSTOMER TICKET PAGE
==================================================

Create a public ticket-view page accessible using a secure ticket link.

Display:

Tumdo Kalenjin Connect

Event image

Event name
Event type
Date
Time
Venue

Customer name
Customer email

Ticket type
Ticket ID
QR code

Status:
VALID / USED / CANCELLED

Do not expose sensitive payment information publicly.

==================================================
12. DATABASE STRUCTURE
==================================================

Create a proper relational database with at least:

users
organisers
events
ticket_types
orders
order_items
customers
payments
tickets
ticket_scans
email_logs

Important relationships:

Organiser → Events

Event → Ticket Types

Customer → Orders

Order → Order Items

Order → Payment

Order → Tickets

Ticket → Ticket Scan History

==================================================
13. SECURITY
==================================================

Implement secure backend architecture.

Requirements:

- Never expose payment secret keys in frontend code.
- Never trust frontend payment status.
- Verify payments server-side.
- Verify payment webhooks.
- Validate webhook signatures where supported.
- Use idempotency keys.
- Prevent duplicate ticket generation.
- Use secure random ticket tokens.
- Do not put sensitive personal information inside QR codes.
- Validate ticket ownership/event association during scanning.
- Protect organiser/admin routes.
- Validate all input server-side.
- Rate-limit payment and ticket verification endpoints.
- Prevent SQL injection.
- Sanitize user input.
- Protect against duplicate orders.
- Use environment variables for secrets.

==================================================
14. PAYMENT ARCHITECTURE
==================================================

Create a payment abstraction/service layer so the platform can support:

M-Pesa
Card payments
Additional payment providers later

Use server-side endpoints such as:

POST /api/orders
POST /api/payments/initiate
POST /api/payments/webhook
GET /api/payments/:id/status
POST /api/tickets/generate
GET /api/tickets/:token
POST /api/scanner/verify

The exact implementation should depend on the selected backend/payment provider.

Do not hard-code fake payment success into production logic.

For development, create a clearly labelled sandbox/mock payment mode that can be disabled in production.

==================================================
15. DESIGN SYSTEM
==================================================

Brand:
TUMDO KALENJIN CONNECT

Primary colour:
Red

Secondary:
White

Supporting colours:
Dark charcoal
Light grey
Green for successful verification
Amber for pending states
Add animations

Buttons:
Rounded red buttons with white text.

Cards:
Rounded corners
Clean shadows
High-quality event photography

Typography:
Modern bold sans-serif.

Overall feel:
Premium
Modern
African event culture
Fast
Trustworthy
Mobile-first

==================================================
16. CUSTOMER FLOW
==================================================

The complete customer journey should be:

Homepage
↓
Browse events
↓
Select event
↓
Select ticket type + quantity
↓
Checkout
↓
Enter name + email + phone
↓
Select payment method
↓
Pay
↓
Payment processed server-side
↓
Payment verified
↓
Ticket generated
↓
Email sent
↓
Customer receives QR ticket
↓
Customer arrives at event
↓
Gate scanner scans QR
↓
Backend verifies ticket
↓
Entry granted
↓
Ticket marked USED

==================================================
17. NO LOGIN CUSTOMER EXPERIENCE
==================================================

There must be NO customer login page.

Customers can purchase tickets as guests.

The email address becomes the delivery/contact address.

Customers can retrieve tickets using:
- Secure ticket link from email with download 

- Ticket ID + secure verification mechanism if implemented

Only organisers/admin/staff should have authenticated dashboard access.

==================================================
18. IMPORTANT UI PAGES
==================================================

Build these pages:

CUSTOMER:
1. Home
2. Browse Events
3. Event Details
4. Select Tickets
5. Checkout
6. Payment Processing
7. Payment Success
8. Ticket
9. Ticket Lookup
10. Ticket Verification Result

ORGANISER:
11. Organiser Login with email collinsrono359@gmail.com password Co12923557!
12. Dashboard
13. Events
14. Create Event
15. Edit Event
16. Ticket Types
17. Orders
18. Payments
19. Attendance
20. Ticket Scanner

22. Settings

==================================================
19. FINAL REQUIREMENT
==================================================

Build this as a real functional application, not just static mockups.

All buttons should have working navigation.

Forms should validate correctly.

Ticket quantities should update totals dynamically.

Payment status should come from the backend.

Tickets should only be generated after verified payment.

QR codes should be unique and securely validated by the backend.

Emails should only be sent after verified payment and successful ticket generation.

The entire customer experience should be fast, simple and require NO customer account/login.

Use “Tumdo Kalenjin Connect” consistently throughout the application.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://no-fuss-tickets.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/2c7b8531-f19b-4b89-bf41-c9edd3103eca).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
