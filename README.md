This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The local administrator account is stored in `data/auth-store.json`, which is not committed to Git. Vercel therefore starts with no users and shows **Create administrator** until you set login credentials as environment variables.

In the Vercel project go to **Settings → Environment Variables** and add:

| Name | Example |
| --- | --- |
| `DATABASE_URL` | your Neon `DATABASE_URL` from `.env` |
| `AUTH_SECRET` | a random string, 32+ characters |

Then **Redeploy**. The live site will load users and app data from Neon. Sign in with the same local accounts (for example `Muhammad-usama`).

`AUTH_SECRET` should stay the same across deploys so existing sessions stay valid. Generate one with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

To copy local files into Neon again later:

```bash
npm run push-db
```
"# pfrmp-assistant" 
