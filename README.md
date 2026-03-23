# Loads of Love Scheduler

Next.js rebuild of the Christ's Loving Hands Loads of Love scheduling app, designed to run on Vercel with Supabase Postgres and MailerSend.

## Local Setup

1. Copy `.env.example` to `.env.local`.
2. Point `DATABASE_URL` to the Servingnetwork Supabase database.
3. Install dependencies with `npm install`.
4. Run `npm run dev`.

## Database

- Schema SQL: `supabase/migrations/0000_parched_mastermind.sql`
- Seed SQL: `supabase/seeds/0000_loads_of_love_seed.sql`
- Supabase reminder scheduler SQL: `supabase/cron/0000_loads_of_love_jobs.sql`

Import order:

1. Run the schema migration against the Servingnetwork Supabase database.
2. Run the seed SQL to import the current JSON snapshot into the prefixed Loads of Love tables.

The seed file is generated from `database/*.json` by:

```bash
node scripts/generate-seed-sql.mjs
```

## MailerSend

Set these env vars in Vercel and locally:

- `MAILERSEND_API_KEY`
- `MAILERSEND_FROM_EMAIL`
- `MAILERSEND_FROM_NAME`
- `ADMIN_NOTIFICATION_EMAILS`

## Vercel

- Target account: `mark-7862`
- Project name: `loads-of-love-scheduler`

Vercel Hobby does not support the scheduling flexibility this app originally used for reminders, so the project does not use Vercel Cron.
Instead:

- confirmation emails are sent immediately when a registration is created
- reminder emails are triggered by Supabase Cron using `pg_cron` + `pg_net`
- recurring monthly events are created lazily inside the app whenever events are fetched, so they do not require a scheduler

Required Vercel env vars:

- `DATABASE_URL`
- `JWT_SECRET`
- `APP_URL`
- `NEXT_PUBLIC_APP_URL`
- `MAILERSEND_API_KEY`
- `MAILERSEND_FROM_EMAIL`
- `MAILERSEND_FROM_NAME`
- `ADMIN_NOTIFICATION_EMAILS`
- `CRON_SECRET`

## Supabase Cron

Use the existing Servingnetwork Supabase project to schedule reminder processing.

1. Open the SQL editor in Supabase.
2. Set the correct production app URL and cron secret in `supabase/cron/0000_loads_of_love_jobs.sql`.
3. Run that SQL.

This creates one daily Supabase Cron job that calls the app endpoint `/api/cron/reminders`.
The app sends one reminder per confirmed registration on the day before the appointment.

## Verification

Run:

```bash
npm run check
npm run build
```
