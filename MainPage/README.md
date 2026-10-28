# Main site

The site is built with Eleventy and deployed to Cloudflare Pages.

## Contact form and Mailjet

The contact form sends name, email, subject, message, and up to two optional PDFs (10 MB combined) to `sharvaparalkar@tamu.edu` using Mailjet's Send API. The verified sender is configured as `info@calab.net` by default. PDFs are sent as email attachments; uploads are not stored by the site. Visitors who run into file limits can email files directly to `info@calab.net`.

The Pages Function reads `MAILJET_API_KEY` and `MAILJET_API_SECRET` from Cloudflare secrets. In the Cloudflare dashboard, add both under **Workers & Pages → calab-site → Settings → Variables and Secrets** for Production and Preview. Or use the Wrangler prompts:

```powershell
npx wrangler pages secret put MAILJET_API_KEY --project-name=calab-site
npx wrangler pages secret put MAILJET_API_SECRET --project-name=calab-site
```

Make sure `info@calab.net` is authorized as a sender in Mailjet. To use another verified sender, set `CONTACT_FROM_EMAIL` in the Pages project variables.

For local development, create a `.dev.vars` file in this directory with the same secret names. It is git-ignored. Start the complete local Pages preview with:

```dotenv
MAILJET_API_KEY="your-mailjet-api-key"
MAILJET_API_SECRET="your-mailjet-secret-key"
```

Replace the example values locally; do not commit the file.

```powershell
npm run dev
```

This builds the site and serves its static pages and Functions at `http://localhost:8081`. Re-run `npm run build` after content or template changes while the preview is running.

After setting the production secrets, deploy a new Pages build for the Function to use them.
