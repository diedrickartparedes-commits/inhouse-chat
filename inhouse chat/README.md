# Commonroom

A small in-house message board built with Next.js, PostgreSQL, and Vercel. Everyone joins the Commons room automatically. Other rooms are created by the admin; members can request access, and only the admin can approve those requests. Accounts use usernames and passwords, with no email or phone verification.

## Run locally

1. Install Node.js 20 or newer and PostgreSQL.
2. Copy `.env.example` to `.env` and set `DATABASE_URL` and a random `SESSION_SECRET` of at least 32 characters.
3. Run `npm install`, then `npm run db:push`, then `npm run dev`.
4. Open `http://localhost:3000`.

New users choose a username and receive a one-time temporary password on screen. They should save it; password reset is not included.

## Deploy on Vercel

1. Push this repository to GitHub and import it in Vercel.
2. Create a hosted PostgreSQL database (such as Neon) and add its `DATABASE_URL` in Vercel project settings.
3. Add a unique `SESSION_SECRET` (at least 32 characters) in Vercel project settings.
4. Deploy. The build runs `prisma generate`; run `npx prisma db push` once against the production database before the first deployment (set the same `DATABASE_URL` locally, or run it in your deployment workflow).

## Admin account

The initial admin credentials are set in `src/lib/admin.ts`. Sign in with them to initialize the admin account, then create rooms and approve membership requests. These credentials are present in the Git source as requested. Treat repository access as access to the admin password, and change the credentials in source before using the app for sensitive conversations.

## Notes

- Passwords are stored as bcrypt hashes; sessions use signed, HTTP-only cookies.
- Database persistence is required. Vercel's serverless filesystem is not used for user data.
- Messages refresh automatically every four seconds. Real time sockets, password recovery, moderation tools, and file uploads are not included.
