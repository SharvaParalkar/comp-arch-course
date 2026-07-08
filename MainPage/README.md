# Main Page — Decap CMS + Eleventy

This site is built from CMS-managed YAML content and deployed as static HTML (Cloudflare Pages → `calab-main.pages.dev`).

## Quick start

```bash
cd MainPage
npm install
npm run migrate   # one-time: import content from RefWeb HTML export
npm run build     # generate site/ output
npm run dev       # local preview at http://localhost:8080
```

## CMS admin

After building/deploying, open **`/admin/`** on your site (e.g. `https://calab.net/admin/`).

Uses the same GitHub OAuth backend as the course CMS (`cms-auth` Cloudflare Worker).

## Content structure

| Collection | Folder | Description |
|------------|--------|-------------|
| Site Settings | `content/site.yml` | Nav, footer, social links, default SEO |
| Pages | `content/pages/` | Home, Mission, Company, Work, Contact, etc. |
| Projects | `content/projects/` | Project detail pages |
| Platforms | `content/platforms/` | Platform detail pages |
| Jobs | `content/jobs/` | Job postings |

## Editing content

Each page supports two modes:

1. **Legacy HTML** — edit the full page body in the HTML code editor (migrated from the Webflow export).
2. **Structured sections** — build pages from reusable blocks (hero, headlines, two-column text, video, image, stat, rich text).

Switch modes via the **Body Mode** field in the CMS.

## Deploying to calab.net

This site is served at **https://calab.net** via the `calab-router` worker, which proxies root traffic to the **`calab-main`** Cloudflare Pages project.

### Option A — Cloudflare Pages (Git integration)

In the Cloudflare dashboard, create or connect a Pages project named **`calab-main`**:

| Setting | Value |
|---------|-------|
| Root directory | `MainPage` |
| Build command | `npm run build` |
| Build output directory | `site` |
| Node.js version | `20` |

Connect the GitHub repo (`SharvaParalkar/comp-arch-course`) and deploy on push to `main`.

### Option B — GitHub Actions

The workflow at `.github/workflows/deploy-calab-main.yml` builds and deploys when files under `MainPage/` change.

Add these repository secrets:

- `CLOUDFLARE_API_TOKEN` — token with **Cloudflare Pages Edit** permission
- `CLOUDFLARE_ACCOUNT_ID` — your Cloudflare account ID

### Option C — Manual deploy

```bash
cd MainPage
npm install
npm run deploy   # builds site/ then runs wrangler pages deploy
```

Requires [Wrangler](https://developers.cloudflare.com/workers/wrangler/) authenticated (`wrangler login`).

### Verify

After deploy, check:

- https://calab-main.pages.dev — Pages preview URL
- https://calab.net — production (via `calab-router`)
- https://calab.net/admin/ — Decap CMS

## Workflow

1. Edit content in Decap CMS at `/admin/`
2. Save → commits to GitHub
3. CI builds `MainPage/site/` and deploys to Cloudflare Pages
4. Changes appear on `calab.net`

## Re-importing from RefWeb

If you update the Webflow export in `RefWeb/`, run `npm run migrate` again. This overwrites YAML files in `content/` — commit or back up changes first.

## Template reference

The original Webflow export is kept in `RefWeb/` as a design reference. The live site is generated from `content/` + Eleventy templates in `src/`.
