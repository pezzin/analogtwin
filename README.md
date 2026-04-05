# AnalogTwin

**Real-time monitoring dashboard for legacy electrical panels.**

AnalogTwin creates a digital twin of physical electrical panels — an HD camera reads the panel state using AI vision, writes the data to a database, and the dashboard displays it live. No wiring required on the legacy hardware.

---

## Features

- **Live panel view** — front-view replica of the electrical panel with breakers, switches, and analog gauges
- **Real-time updates** — dashboard updates instantly when new readings arrive via Supabase Realtime
- **Threshold alerts** — set above/below thresholds on any gauge; email notifications fire automatically on violation
- **On-change alerts** — get notified when a breaker or switch changes state
- **Alert history** — every triggered alert is logged to the database
- **Live camera feed** — view the latest image captured by the HD camera
- **Email notifications** — sent via SMTP (Brevo, Gmail, or any provider)
- **Settings page** — manage notification recipients
- **Password protection** — simple access control via environment variable

---

## Tech Stack

- [Next.js 16](https://nextjs.org/) — frontend & API routes
- [Supabase](https://supabase.com/) — database, real-time subscriptions
- [Tailwind CSS](https://tailwindcss.com/) — styling
- [Nodemailer](https://nodemailer.com/) — email delivery
- [Vercel](https://vercel.com/) — deployment

---

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/pezzin/analogtwin.git
cd analogtwin
npm install
```

### 2. Set up environment variables

Create a `.env.local` file in the root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your_supabase_anon_key

# SMTP (Brevo, Gmail, etc.)
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_key
SMTP_FROM=AnalogTwin Alerts <you@yourdomain.com>

# Dashboard password
APP_PASSWORD=your_password
```

### 3. Set up the database

Run the SQL in `supabase-schema.sql` in your Supabase SQL Editor. This creates all tables and seeds the initial panel data.

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Simulating live data

To test real-time updates, insert a new reading in the Supabase SQL Editor:

```sql
-- Update the ammeter to 300A
INSERT INTO readings (component_id, value)
VALUES ('gauge-1', '{"value": 300}');
```

The dashboard will update instantly. If a threshold alert is configured below 320A, an email will fire.

---

## Deployment

Deploy to Vercel. Set the same environment variables in the Vercel dashboard under **Settings → Environment Variables**.

---

## Roadmap

- [ ] User authentication (Supabase Auth)
- [ ] Reports & trend charts from historical readings
- [ ] Real HD camera feed integration
- [ ] Stale data detection (alert if no reading received in X minutes)
- [ ] Multi-panel support
