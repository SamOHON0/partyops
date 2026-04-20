import Link from 'next/link'
import { LogoWordmark, LogoMark } from '@/components/ui/Logo'
import {
  ArrowRightIcon,
  CalendarIcon,
  BookingsIcon,
  UsersIcon,
  InvoiceIcon,
  BoltIcon,
  ShieldIcon,
  SparklesIcon,
  CheckIcon,
  TrendingUpIcon,
} from '@/components/ui/Icon'

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-ink-900">
      <SiteNav />
      <Hero />
      <Features />
      <HowItWorks />
      <DeepFeatures />
      <Pricing />
      <FAQ />
      <CTA />
      <Footer />
    </div>
  )
}

/* ------------------- Nav ------------------- */

function SiteNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-ink-100/80 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
        <LogoWordmark />
        <nav className="hidden items-center gap-7 text-sm font-medium text-ink-600 md:flex">
          <a href="#features" className="hover:text-ink-900">Features</a>
          <a href="#how" className="hover:text-ink-900">How it works</a>
          <a href="#pricing" className="hover:text-ink-900">Pricing</a>
          <a href="#faq" className="hover:text-ink-900">FAQ</a>
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/login"
            className="hidden text-sm font-medium text-ink-600 hover:text-ink-900 sm:inline-flex px-3 py-2"
          >
            Sign in
          </Link>
          <Link href="/admin/signup" className="po-btn po-btn-primary">
            Start free
            <ArrowRightIcon size={16} />
          </Link>
        </div>
      </div>
    </header>
  )
}

/* ------------------- Hero ------------------- */

function Hero() {
  return (
    <section className="relative overflow-hidden po-hero-bg">
      <div className="mx-auto max-w-6xl px-4 pb-20 pt-16 sm:px-6 sm:pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/80 px-3 py-1 text-xs font-medium text-brand-700 shadow-sm">
            <SparklesIcon size={14} /> Built for Irish party hire operators
          </span>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-ink-900 sm:text-6xl">
            Run your party hire business
            <span className="block bg-gradient-to-r from-brand-600 via-brand-500 to-accent-500 bg-clip-text text-transparent">
              from one place.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-ink-600">
            Bookings, calendar, customers, invoices, and card payments. An all-in-one
            operations platform for bouncy castle, marquee, and event hire businesses.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/admin/signup" className="po-btn po-btn-primary px-5 py-3 text-[15px]">
              Start free for 14 days
              <ArrowRightIcon size={16} />
            </Link>
            <Link href="#how" className="po-btn po-btn-secondary px-5 py-3 text-[15px]">
              See how it works
            </Link>
          </div>
          <p className="mt-4 text-xs text-ink-500">
            No credit card needed. Switch from spreadsheets in under 10 minutes.
          </p>
        </div>

        <div className="relative mx-auto mt-16 max-w-5xl">
          <DashboardPreview />
        </div>
      </div>
    </section>
  )
}

/* ------------------- Preview mock ------------------- */

function DashboardPreview() {
  return (
    <div className="relative rounded-2xl border border-ink-200 bg-white shadow-2xl shadow-brand-900/10">
      <div className="flex items-center gap-1.5 border-b border-ink-100 px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-ink-200" />
        <span className="h-2.5 w-2.5 rounded-full bg-ink-200" />
        <span className="h-2.5 w-2.5 rounded-full bg-ink-200" />
        <span className="ml-3 text-[11px] text-ink-400">app.partyops.io / dashboard</span>
      </div>
      <div className="grid grid-cols-12 gap-0">
        <aside className="col-span-3 hidden border-r border-ink-100 p-4 sm:block">
          <div className="flex items-center gap-2">
            <LogoMark size={22} />
            <span className="text-sm font-semibold">PartyOps</span>
          </div>
          <nav className="mt-6 space-y-1 text-[13px]">
            {[
              { label: 'Dashboard', active: true, icon: <TrendingUpIcon size={14} /> },
              { label: 'Bookings', icon: <BookingsIcon size={14} /> },
              { label: 'Calendar', icon: <CalendarIcon size={14} /> },
              { label: 'Customers', icon: <UsersIcon size={14} /> },
              { label: 'Invoices', icon: <InvoiceIcon size={14} /> },
            ].map((item) => (
              <div
                key={item.label}
                className={`flex items-center gap-2.5 rounded-md px-2.5 py-1.5 ${
                  item.active
                    ? 'bg-brand-50 font-medium text-brand-700'
                    : 'text-ink-600'
                }`}
              >
                {item.icon}
                {item.label}
              </div>
            ))}
          </nav>
        </aside>
        <main className="col-span-12 p-5 sm:col-span-9">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-ink-900">This week</div>
              <div className="text-xs text-ink-500">April 13 - April 19</div>
            </div>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
              On track
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Revenue', value: '€4,280', change: '+18%' },
              { label: 'Bookings', value: '32', change: '+4' },
              { label: 'Utilisation', value: '87%', change: '+9%' },
            ].map((m) => (
              <div key={m.label} className="rounded-lg border border-ink-100 p-3">
                <div className="text-[10px] uppercase tracking-wide text-ink-500">{m.label}</div>
                <div className="mt-1 text-xl font-semibold tracking-tight">{m.value}</div>
                <div className="text-[10px] font-medium text-emerald-600">{m.change} vs last week</div>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-lg border border-ink-100 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-semibold">Upcoming</div>
              <span className="text-[10px] text-ink-500">5 this week</span>
            </div>
            <div className="space-y-2">
              {[
                { name: 'Róisín M.', item: 'Princess Castle', date: 'Sat 20', tone: 'bg-brand-500' },
                { name: 'Aoife K.', item: 'Soft Play Set', date: 'Sat 20', tone: 'bg-accent-400' },
                { name: 'Sean F.', item: 'Marquee 6x9', date: 'Sun 21', tone: 'bg-emerald-500' },
              ].map((b) => (
                <div key={b.name} className="flex items-center justify-between rounded-md bg-ink-50/50 px-3 py-2">
                  <div className="flex items-center gap-2.5">
                    <span className={`h-2 w-2 rounded-full ${b.tone}`} />
                    <span className="text-[13px] font-medium text-ink-800">{b.name}</span>
                    <span className="text-[11px] text-ink-500">{b.item}</span>
                  </div>
                  <span className="text-[11px] font-medium text-ink-500">{b.date}</span>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

/* ------------------- Trusted by ------------------- */

/* ------------------- Features ------------------- */

function Features() {
  const features = [
    {
      icon: <BookingsIcon size={20} />,
      title: 'Online booking, zero hassle',
      body: 'Embed a widget on your website in one line. Customers book and pay themselves. Stop playing phone tag.',
    },
    {
      icon: <CalendarIcon size={20} />,
      title: 'A calendar that cannot double-book',
      body: 'Atomic availability checks stop two customers booking the same item on the same day. Ever.',
    },
    {
      icon: <UsersIcon size={20} />,
      title: 'Every customer in one place',
      body: 'Repeat bookers, lifetime value, contact details, history. Know your best customers at a glance.',
    },
    {
      icon: <InvoiceIcon size={20} />,
      title: 'Invoices without the spreadsheet',
      body: 'Turn any booking into a professional invoice in one click. Mark paid. Send by email. Done.',
    },
    {
      icon: <BoltIcon size={20} />,
      title: 'Card payments on autopilot',
      body: 'Connect Stripe and let customers pay when they book. Money lands in your bank, not on your kitchen table.',
    },
    {
      icon: <ShieldIcon size={20} />,
      title: 'Your data, safe and sound',
      body: 'Every business is isolated with row-level security. Daily backups. GDPR-friendly. Built on Supabase.',
    },
  ]
  return (
    <section id="features" className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Everything you need, nothing you don&apos;t.
        </h2>
        <p className="mt-4 text-ink-600">
          Party hire is hard enough. Your back office should not be the hard part.
        </p>
      </div>
      <div className="mt-14 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-ink-200 bg-ink-100 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <div key={f.title} className="bg-white p-6">
            <div className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              {f.icon}
            </div>
            <h3 className="text-base font-semibold">{f.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-600">{f.body}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ------------------- How it works ------------------- */

function HowItWorks() {
  const steps = [
    {
      n: '01',
      title: 'Add your kit',
      body: 'Upload photos, set prices, say how many of each you own. Ten minutes and you are live.',
    },
    {
      n: '02',
      title: 'Drop a widget on your site',
      body: 'One line of code. Works on Wix, Shopify, Squarespace, WordPress, or a plain HTML page.',
    },
    {
      n: '03',
      title: 'Get paid while you sleep',
      body: 'Customers book and pay. You wake up to confirmed jobs and cleared card payments.',
    },
  ]
  return (
    <section id="how" className="border-t border-ink-100 bg-ink-50/30 py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Up and running by tonight.
          </h2>
          <p className="mt-4 text-ink-600">
            No developers, no agency, no course to buy. Just three short steps.
          </p>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="po-card p-6">
              <div className="text-sm font-semibold text-accent-500">{s.n}</div>
              <h3 className="mt-3 text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-600">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ------------------- Deep features ------------------- */

function DeepFeatures() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
      <DeepRow
        eyebrow="Dashboard"
        title="See your week at a glance."
        body="Revenue, new requests, items out today, utilisation, busiest day of the week. The numbers that actually matter for your business."
        bullets={[
          'Live revenue and booking trends',
          'Top performing items',
          'Confirmation rate and busiest days',
        ]}
        visual={<DashboardPreview />}
      />
      <div className="h-16" />
      <DeepRow
        eyebrow="Calendar"
        title="Never say sorry, we double-booked."
        body="Everything on one timeline. Block out holidays, bank holidays, repair days. Filter by item. Drag to reschedule."
        bullets={[
          'Month and week views',
          'Block-out dates per item or across the whole shop',
          'Atomic booking engine prevents oversells',
        ]}
        visual={<CalendarPreview />}
        reverse
      />
      <div className="h-16" />
      <DeepRow
        eyebrow="Customers"
        title="Your best customers, visible."
        body="Every booking is automatically linked to a customer. See who is worth most to you, who has been quiet, and who to call for next weekend."
        bullets={[
          'Lifetime value and last booking date',
          'Full booking history on one page',
          'Export a CSV for email campaigns',
        ]}
        visual={<CustomersPreview />}
      />
    </section>
  )
}

function DeepRow({
  eyebrow,
  title,
  body,
  bullets,
  visual,
  reverse,
}: {
  eyebrow: string
  title: string
  body: string
  bullets: string[]
  visual: React.ReactNode
  reverse?: boolean
}) {
  return (
    <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-2 md:gap-16">
      <div className={reverse ? 'md:order-2' : ''}>
        <div className="text-xs font-semibold uppercase tracking-wider text-brand-600">{eyebrow}</div>
        <h3 className="mt-2 text-3xl font-semibold tracking-tight">{title}</h3>
        <p className="mt-3 text-ink-600">{body}</p>
        <ul className="mt-5 space-y-2.5">
          {bullets.map((b) => (
            <li key={b} className="flex items-start gap-2.5 text-sm text-ink-700">
              <span className="mt-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                <CheckIcon size={12} />
              </span>
              {b}
            </li>
          ))}
        </ul>
      </div>
      <div className={reverse ? 'md:order-1' : ''}>{visual}</div>
    </div>
  )
}

function CalendarPreview() {
  const days = Array.from({ length: 28 }, (_, i) => i + 1)
  const booked: Record<number, { tone: string; name: string }> = {
    5: { tone: 'bg-brand-500', name: 'Castle' },
    6: { tone: 'bg-brand-500', name: 'Castle' },
    12: { tone: 'bg-accent-400', name: 'Marquee' },
    13: { tone: 'bg-accent-400', name: 'Marquee' },
    19: { tone: 'bg-emerald-500', name: 'Soft play' },
    20: { tone: 'bg-emerald-500', name: 'Soft play' },
    20.5: { tone: 'bg-brand-500', name: 'Castle' },
    26: { tone: 'bg-brand-500', name: 'Castle' },
  }
  return (
    <div className="po-card p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-semibold">April 2026</div>
        <div className="flex gap-1">
          <span className="rounded-md bg-ink-100 px-2 py-0.5 text-[10px] font-medium text-ink-600">Month</span>
          <span className="px-2 py-0.5 text-[10px] font-medium text-ink-500">Week</span>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-[10px] font-medium text-ink-400">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <div key={i} className="px-1 py-0.5">{d}</div>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {days.map((d) => (
          <div key={d} className="aspect-square rounded-md border border-ink-100 p-1.5 text-[10px] text-ink-500">
            <div className="font-medium text-ink-700">{d}</div>
            {booked[d] && (
              <div className={`mt-1 h-1 w-full rounded ${booked[d].tone}`} />
            )}
            {booked[d + 0.5] && (
              <div className={`mt-0.5 h-1 w-full rounded ${booked[d + 0.5].tone}`} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function CustomersPreview() {
  const rows = [
    { name: 'Róisín Murphy', ltv: '€1,840', count: 9, last: '3 days ago' },
    { name: 'Aoife Kelly', ltv: '€1,120', count: 5, last: '2 weeks ago' },
    { name: 'Sean Farrell', ltv: '€890', count: 4, last: 'last month' },
    { name: 'Niamh Doyle', ltv: '€720', count: 3, last: 'last month' },
    { name: 'Conor Walsh', ltv: '€540', count: 2, last: '2 months ago' },
  ]
  return (
    <div className="po-card overflow-hidden">
      <div className="border-b border-ink-100 px-4 py-3 text-sm font-semibold">Top customers</div>
      <div className="divide-y divide-ink-100 text-sm">
        {rows.map((r, i) => (
          <div key={r.name} className="flex items-center justify-between px-4 py-2.5">
            <div className="flex items-center gap-2.5">
              <div className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold text-white ${i === 0 ? 'bg-brand-600' : 'bg-ink-400'}`}>
                {r.name.split(' ').map((x) => x[0]).join('')}
              </div>
              <div>
                <div className="text-[13px] font-medium text-ink-800">{r.name}</div>
                <div className="text-[11px] text-ink-500">{r.count} bookings &middot; {r.last}</div>
              </div>
            </div>
            <div className="text-sm font-semibold">{r.ltv}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ------------------- Pricing ------------------- */

function Pricing() {
  const tiers = [
    {
      name: 'Starter',
      price: '€0',
      cadence: 'forever',
      description: 'All the basics. For operators with up to 10 bookings a month.',
      features: [
        'Up to 10 bookings / month',
        'Unlimited items',
        'Booking widget',
        'Bank transfer payment info',
        'Email support',
      ],
      cta: 'Start free',
      highlight: false,
    },
    {
      name: 'Pro',
      price: '€29',
      cadence: 'per month',
      description: 'For busy operators who want card payments and automation.',
      features: [
        'Unlimited bookings',
        'Stripe card payments',
        'Customers CRM',
        'Invoices',
        'Calendar + blocked dates',
        'Priority support',
      ],
      cta: 'Start 14-day trial',
      highlight: true,
    },
    {
      name: 'Scale',
      price: '€79',
      cadence: 'per month',
      description: 'Multi-staff teams and higher volumes. Everything in Pro plus:',
      features: [
        'Up to 5 staff accounts',
        'API access',
        'Custom invoice branding',
        'CSV exports',
        'Dedicated onboarding',
      ],
      cta: 'Talk to us',
      highlight: false,
    },
  ]
  return (
    <section id="pricing" className="border-t border-ink-100 bg-ink-50/30 py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Fair pricing. No surprises.</h2>
          <p className="mt-4 text-ink-600">
            Start free, upgrade when you outgrow it. Cancel anytime. Card payments charged at 1.5% + 25c via Stripe.
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {tiers.map((t) => (
            <div
              key={t.name}
              className={`flex flex-col rounded-2xl border bg-white p-6 ${
                t.highlight
                  ? 'border-brand-500 shadow-xl shadow-brand-600/10 ring-1 ring-brand-500'
                  : 'border-ink-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{t.name}</h3>
                {t.highlight && (
                  <span className="rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                    Popular
                  </span>
                )}
              </div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-4xl font-semibold tracking-tight">{t.price}</span>
                <span className="text-sm text-ink-500">/ {t.cadence}</span>
              </div>
              <p className="mt-2 min-h-[44px] text-sm text-ink-600">{t.description}</p>
              <ul className="mt-5 flex-1 space-y-2.5 text-sm">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-ink-700">
                    <CheckIcon size={14} className="mt-0.5 text-brand-600" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/admin/signup"
                className={`mt-6 po-btn ${t.highlight ? 'po-btn-primary' : 'po-btn-secondary'} w-full`}
              >
                {t.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ------------------- FAQ ------------------- */

function FAQ() {
  const qs = [
    {
      q: 'Is PartyOps only for bouncy castles?',
      a: 'Not at all. It works beautifully for bouncy castles, marquees, soft play, games, dance floors, and pretty much anything you hire out by the day. If you rent it, you can manage it.',
    },
    {
      q: 'How does the booking widget work on my website?',
      a: 'Copy one line of code from your PartyOps dashboard and paste it anywhere on your site. It drops in an iframe that loads your branded booking form. Works on Wix, Shopify, Squarespace, WordPress, Webflow, or plain HTML.',
    },
    {
      q: 'Do I need Stripe to accept payments?',
      a: 'Only if you want card payments. Many operators start with bank transfer instructions or a Revolut link. When you are ready, connecting Stripe takes two minutes and money lands directly in your bank.',
    },
    {
      q: 'What if a customer books something that is already out?',
      a: 'They cannot. PartyOps uses atomic availability checks at the database level, so two people cannot book the same item on the same dates. No more awkward apology phone calls.',
    },
    {
      q: 'Can I import my existing bookings?',
      a: 'Yes. You can add past bookings manually via the admin, and CSV import is on the Scale plan. If you have a spreadsheet, we will help you get it in.',
    },
    {
      q: 'What happens when my trial ends?',
      a: 'Nothing bad. You drop to the free Starter plan automatically. You will not be charged unless you choose to upgrade.',
    },
  ]
  return (
    <section id="faq" className="mx-auto max-w-3xl px-4 py-24 sm:px-6">
      <h2 className="text-center text-3xl font-semibold tracking-tight sm:text-4xl">
        Questions, answered.
      </h2>
      <dl className="mt-10 space-y-3">
        {qs.map((item) => (
          <details
            key={item.q}
            className="group rounded-xl border border-ink-200 bg-white p-5 open:shadow-sm"
          >
            <summary className="flex cursor-pointer items-center justify-between text-sm font-semibold text-ink-900">
              {item.q}
              <span className="ml-4 text-ink-400 transition-transform group-open:rotate-180">
                <ArrowRightIcon size={16} className="rotate-90" />
              </span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-ink-600">{item.a}</p>
          </details>
        ))}
      </dl>
    </section>
  )
}

/* ------------------- CTA ------------------- */

function CTA() {
  return (
    <section className="border-t border-ink-100 px-4 py-24 sm:px-6">
      <div className="mx-auto max-w-3xl overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-600 to-accent-500 p-10 text-center text-white shadow-2xl">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Get your weekends back.</h2>
        <p className="mx-auto mt-3 max-w-xl text-white/80">
          The first 14 days are on us. No credit card. Cancel with one click.
        </p>
        <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/admin/signup"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-5 py-3 text-[15px] font-semibold text-brand-700 shadow-sm transition hover:bg-white/90"
          >
            Start your free trial
            <ArrowRightIcon size={16} />
          </Link>
          <Link
            href="#pricing"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/25 px-5 py-3 text-[15px] font-semibold text-white transition hover:bg-white/10"
          >
            See pricing
          </Link>
        </div>
      </div>
    </section>
  )
}

/* ------------------- Footer ------------------- */

function Footer() {
  return (
    <footer className="border-t border-ink-100 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 px-4 py-12 sm:px-6 md:flex-row">
        <div className="max-w-sm">
          <LogoWordmark />
          <p className="mt-3 text-sm text-ink-500">
            The operating system for party hire businesses. Made in Dublin.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-10 text-sm sm:grid-cols-3">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">Product</div>
            <ul className="mt-3 space-y-2 text-ink-600">
              <li><a href="#features" className="hover:text-ink-900">Features</a></li>
              <li><a href="#pricing" className="hover:text-ink-900">Pricing</a></li>
              <li><a href="#faq" className="hover:text-ink-900">FAQ</a></li>
            </ul>
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">Company</div>
            <ul className="mt-3 space-y-2 text-ink-600">
              <li><a href="mailto:hello@partyops.app" className="hover:text-ink-900">Contact</a></li>
              <li><Link href="/admin/login" className="hover:text-ink-900">Sign in</Link></li>
              <li><Link href="/admin/signup" className="hover:text-ink-900">Get started</Link></li>
            </ul>
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">Legal</div>
            <ul className="mt-3 space-y-2 text-ink-600">
              <li><a className="hover:text-ink-900" href="#">Privacy</a></li>
              <li><a className="hover:text-ink-900" href="#">Terms</a></li>
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-ink-100 py-5 text-center text-xs text-ink-400">
        &copy; {new Date().getFullYear()} PartyOps. All rights reserved.
      </div>
    </footer>
  )
}

