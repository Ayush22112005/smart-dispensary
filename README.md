# Smart Dispensary – Thapar

Campus healthcare web app for Thapar students. Book dispensary appointments, chat with a doctor,
request an ambulance, order medicines, keep health records and get quick advice from a health
assistant.

## Stack

- React 19 + TanStack Start / Router
- Tailwind CSS, shadcn/ui
- Supabase (Postgres, auth, storage, realtime)
- Gemini API for the health assistant

## Running locally

You need Node 20+ and a Supabase project (free tier is fine).

1. **Database** – open your Supabase project → SQL Editor → paste the contents of
   `supabase/schema.sql` → Run. This creates all tables, RLS policies, the storage bucket and some
   seed data.
   Already set up with an older version? Run `supabase/update.sql` instead (safe to run again).
2. **Env** – copy `.env.example` to `.env` and fill in the values from
   Supabase → Project Settings → API (Project URL and anon/publishable key). Add a
   `GEMINI_API_KEY` from https://aistudio.google.com/apikey if you want the assistant page to work.
3. **Run**

   ```sh
   npm install
   npm run dev
   ```

   App runs at http://localhost:3000

### Auth notes

- Supabase asks new users to confirm their email by default. For local testing you can turn that
  off in Authentication → Sign In / Providers → Email → "Confirm email".
- Add `http://localhost:3000` to Authentication → URL Configuration → Redirect URLs.
- Google sign-in needs the Google provider enabled in Supabase (Authentication → Providers).

### Admin account

Sign up with `admin@thapar.edu` and that account gets the admin role automatically. To make any
other existing user an admin, run in the SQL editor:

```sql
insert into public.user_roles (user_id, role)
select id, 'admin' from auth.users where email = 'you@example.com';
```

Admins can add doctor slots, medicines, notices and emergency numbers from `/admin`.

### Roles

Give each account its role in Admin console → People & roles. Each role unlocks a desk in the sidebar:

| role      | desk             | can do                                                                 |
| --------- | ---------------- | ---------------------------------------------------------------------- |
| student   | –                | book / cancel slots, consult, order medicines (pay on delivery), SOS    |
| doctor    | `/doctor`        | see their patients, cancel (patient is notified), leave, block slots    |
| reception | `/reception`     | book and cancel appointments for any registered patient                 |
| ambulance | `/ambulance-desk`| see who called, their phone, live location and contacts; update status |
| chemist   | `/pharmacy`      | add / edit medicines, handle orders; their phone is shown after COD    |
| admin     | `/admin`         | doctors, doctor leave, notices, medicines, roles, plus every desk       |

Staff sign in at `/staff-login` (pick the role first). For ready-made logins for every role, run
`supabase/demo-accounts.sql` after `update.sql`; the emails and the shared password are listed at the
top of that file.

A doctor account is linked to its doctor profile by the **Login email** field in Admin → Doctors.
The chemist's phone comes from the Phone field on their own Profile page.

## Scripts

| command           | what it does              |
| ----------------- | ------------------------- |
| `npm run dev`     | start dev server          |
| `npm run build`   | production build          |
| `npm run preview` | serve the production build |
| `npm run lint`    | eslint                    |
