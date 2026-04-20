# PartyOps

Booking software for party rental and event hire businesses. Calendar, bookings, customers, invoicing, card payments, and an embeddable booking widget, all in one place.

Built with Next.js 16 (App Router), Supabase, Stripe Connect, and Tailwind v4.

## What's inside

- **Dashboard** with today's schedule, upcoming events, revenue trend and recent activity
- **Calendar** month view that spans multi-day bookings across dates
- **Bookings** list with status tabs, payment filters, search, quick-confirm and quick-complete actions, plus a full detail page with danger zone
- **Customers CRM** derived from booking history, with repeat-customer detection, lifetime value, and per-customer profiles
- **Items** (products) with images, stock, delivery fee, and drag-and-drop-style add/edit
- **Blocked dates** for holidays and owner time off
- **Invoicing** with auto-incremented numbers, dynamic line items, tax rate, drafts/sent/paid/void statuses, overdue detection, and a print-ready invoice view
- **Billing** page with Starter / Pro / Scale plans and Stripe Connect status
- **Embed** page with a single-line `<script>` snippet, live test preview, and setup instructions
- **Settings** for business details, manual payment instructions, and Stripe Connect onboarding
- **Booking widget** customers use on the owner's site, with live availability, Stripe Checkout (Apple Pay / Google Pay / card) or manual payment fallback
- **Multi-tenant** isolation: every table is keyed by `auth.uid()` via Row Level Security
- **Public API** with CORS so the widget can read availability and create bookings from any origin

## Quick start

### 1. Install

```bash
npm install
```

### 2. Create a Supabase project

Grab the project URL, anon key, and service role key from Settings > API.

### 3. Environment variables

Copy `.env.local.example` to `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Stripe (optional, required for card payments)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### 4. Database

Run the migrations in `supabase/migrations/` in order via the Supabase SQL editor. They create tables, RLS policies, availability functions, the atomic booking RPC, invoice numbering, and a trigger that auto-creates a `businesses` row when a new auth user signs up.

### 5. Run

```bash
npm run dev
```

Visit http://localhost:3000.

## Using it

1. Sign up at `/admin/signup`.
2. Add items at `/admin/products`.
3. Optionally connect Stripe at `/admin/settings` to accept card payments.
4. Copy the snippet from `/admin/embed` and paste it into any website:

```html
<script src="https://yourdomain.com/widget.js" data-business-id="YOUR_BUSINESS_ID"></script>
```

Customers pick an item, pick dates, enter their details, and pay. Bookings show up in `/admin/bookings` immediately.

## Public API

All public endpoints support CORS.

- `GET /api/products?business_id=<uuid>` returns the business's items
- `POST /api/availability` body `{ product_id, start_date, end_date }` returns `{ available, remaining }`
- `POST /api/bookings` body `{ business_id, product_id, customer_name, email, phone, address, start_date, end_date }` creates a booking via the atomic RPC
- `POST /api/stripe/checkout` creates a Stripe Checkout session attached to the connected account

Totals are calculated server-side (`price_per_day * days + delivery_fee`). Clients cannot override them.

## Project structure

```
src/
  app/
    page.tsx                  marketing landing
    layout.tsx                root layout
    globals.css               design tokens + po-* utility classes
    admin/
      layout.tsx              admin shell (hidden on login/signup)
      login/ signup/ logout/
      page.tsx                dashboard
      calendar/               month view
      bookings/               list, detail, new
      customers/              list and profile
      products/               list, new, edit
      invoices/               list, detail, new
      blocked/                blocked dates
      embed/                  embed snippet + live preview
      billing/                plan selection + Stripe status
      settings/               business details, payment, Stripe Connect
    api/
      products/  availability/  bookings/   (public, CORS)
      stripe/    connect/       checkout/   webhook/
    embed/[businessId]/
      page.tsx                hosted widget page (iframe target)
      BookingWidget.tsx       client widget UI
      layout.tsx              minimal embed shell
  components/
    admin/                    Sidebar, PageHeader, StatTile, Badge,
                              BookingSearch, CopySnippet, InvoiceForm,
                              PrintButton, EmptyState
    ui/                       Icon set, Logo
    ImageUpload.tsx
  lib/
    supabase.ts               server + admin clients
    supabase-client.ts        browser client
    stripe.ts                 Stripe server client
    format.ts                 date + currency helpers
    cors.ts                   CORS helper
    api/                      products, bookings, customers, invoices
    types.ts
  middleware.ts               session refresh, /admin gate
public/
  widget.js                   embeddable script (creates an iframe)
supabase/
  migrations/                 schema + RLS + RPCs + invoices
```

## Design system

PartyOps uses a single design system defined in `globals.css` and `@theme` tokens:

- **Colours**: `brand-*` (violet 500), `accent-*` (coral 500), `ink-*` (warm neutrals), plus standard Tailwind palettes for status tones
- **Components**: `po-card`, `po-input`, `po-btn`, `po-btn-primary`, `po-btn-secondary`, `po-btn-ghost`, `po-btn-danger`, `po-hero-bg`, `po-mesh`
- **Typography**: system font stack, tracking-tight on headings

## Security notes

- RLS denies everything by default. Every admin query is scoped to `auth.uid()`.
- Public widget reads use a service-role admin client server-side and only return non-sensitive product fields.
- Bookings are inserted via a `SECURITY DEFINER` Postgres function that locks the product row, prevents overselling, and computes the price.
- The atomic booking function takes `FOR UPDATE` locks so two simultaneous bookings cannot both succeed when only one slot is left.
- Stripe uses Connect with Express accounts. Funds deposit directly to the business's bank. PartyOps takes a small application fee and never touches the money.

## Deploy

### Supabase

Run every SQL file in `supabase/migrations/` in order via the SQL editor.

### Vercel

1. Push to GitHub.
2. Import in Vercel.
3. Add env vars listed above.
4. Set the Stripe webhook endpoint to `https://yourdomain.com/api/stripe/webhook` and copy the signing secret into `STRIPE_WEBHOOK_SECRET`.
5. Deploy.

## Roadmap

- Email confirmations (Resend)
- SMS reminders (Twilio)
- Recurring bookings
- Team accounts with roles
- Mobile app for drivers / installers
