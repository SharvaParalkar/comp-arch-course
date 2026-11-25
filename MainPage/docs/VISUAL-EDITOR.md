# Visual page editor

The site now has a Wix-style visual editor powered by [GrapesJS](https://grapesjs.com/). It is built into the existing Decap CMS, so the same GitHub sign-in, drafts, save, and publish flow still protect every change.

## Opening the editor

1. Go to `/admin/` on the site and sign in with GitHub.
2. Open **2 · Pages**.
3. Choose a page (Home, Team, Projects, Publications, Teaching, Contact, CV, …).
4. Scroll to **Page Body — Visual Editor** and click **Open visual editor**.

The editor opens in a full-screen window. You can also click **How to edit** inside it for the same quick instructions.

> The editor URL (`/admin/visual/`) cannot save anything by itself. If you open it directly in a tab, it shows a lock screen. It only starts when the authenticated CMS opens it and hands it the page data.

## What you can edit

**Page tab (right side)**

- Page heading (the large title at the top).
- Introduction text.
- Introduction image, its description (alt text), and left/right position.
- Automatic sections: Projects grid, Publications list, Teaching grid, Team grid, and Contact form. Turn them on or off.

**On the page**

- Click any text to edit it in place. The small toolbar adds bold, italic, underline, and links.
- Click a section to change its image, caption, layout, video, PDF, and other settings in the **Section** tab.
- Drag sections to reorder them, or use **On this page** in the left panel and its arrow buttons.
- **Add** tab: click a section to append it, or drag it onto the page.
- Undo and redo buttons are in the top bar.
- Desktop, tablet, and phone preview buttons are in the top bar.

## What stays in the normal CMS form

These are intentionally not duplicated in the visual editor:

- Page title (browser tab / Pages list).
- Web address (permalink).
- Home page hero logo and hero title text.
- Team members and team groups.
- Search and social preview (SEO) fields.

They are safe to edit in the form next to the visual editor. The visual editor note reminds the editor where they are.

## Apply versus Publish

- **Apply changes** stages the page inside the CMS form. The CMS entry becomes unsaved.
- **Publish** (top right of the CMS) commits the page to GitHub and starts the Cloudflare Pages build.

Nothing is written to GitHub until Publish. If you close the editor without applying, nothing changes. Cancel asks before discarding unsaved edits.

## How content is stored

Pages edited visually get one new field in their YAML file:

```yaml
visual_page:
  version: 1
  page_heading: Projects
  page_content: <p>...</p>
  page_image: /uploads/media/example.jpg
  page_image_alt: Example
  page_image_position: right
  body_class: body
  show_projects_grid: true
  show_publications_list: false
  show_teaching_grid: false
  show_team_grid: false
  show_contact_form: false
  sections:
    - type: headline
      text: ...
```

The Eleventy data loader merges this object over the original top-level fields. That gives two important properties:

- Pages that have never been opened in the visual editor render exactly as before.
- A page migrated to `visual_page` with the same values produces byte-identical HTML.

Sections remain structured data (not a saved HTML blob), so the existing Nunjucks templates still own the markup and CSS. This is why the design does not drift.

## Media

The **Choose file** button offers three ways to pick media:

1. **Site files** — an index of everything under `static/uploads`, generated during `npm run build` as `site/admin/media-index.json`.
2. **Cloudinary** — the same Cloudinary account the CMS already uses. It opens Cloudinary's media library for upload or selection.
3. **Paste a link** — any `/uploads/...` path or full `https://` URL.

Nothing is uploaded to GitHub by the editor. Cloudinary files stay on Cloudinary; site files are chosen from what is already committed.

## Safety and limits

- The editor only changes page content. It does not expose arbitrary CSS, JavaScript, or HTML page templates, which keeps the existing design and security posture intact.
- Rich text HTML is cleaned before saving: editor-only attributes, generated IDs, and GrapesJS markers are removed.
- A section that requires media (Image, Image hero, Video, Video hero, Image gallery, PDF) blocks **Apply** until a file is chosen, so an empty section cannot accidentally go live.
- Project and Teaching **detail** pages keep their structured section list. Those pages use a special two-column detail layout, so a stacked visual canvas would not match the published result. Their list labels and hints were clarified instead.
- The visual editor is for page bodies. Collection items (individual projects, publications, teaching pages) remain in their normal CMS forms.

## Developer notes

Files:

| Path | Purpose |
| --- | --- |
| `static/admin/visual/index.html` | Editor shell |
| `static/admin/visual/editor.js` | GrapesJS setup, panels, serialization |
| `static/admin/visual/renderer.js` | Mirrors `sections/render.njk` and page basics |
| `static/admin/visual/media.js` | Site/Cloudinary/URL media chooser |
| `static/admin/visual/editor.css` | Editor chrome |
| `static/admin/visual/canvas.css` | Editor-only helpers inside the canvas iframe |
| `static/admin/visual/vendor/` | Vendored GrapesJS 0.23.9 and markdown-it 14.3.0 |
| `static/admin/visual-widget.js` | Decap custom widget `visual_page` |
| `static/admin/visual-widget.css` | Widget card and full-screen overlay |
| `scripts/build.js` | Writes `site/admin/media-index.json` |
| `.eleventy.js` | Merges `visual_page` over legacy page fields |

How it fits together:

1. Decap renders the `visual_page` field with the custom widget.
2. The widget renders a card and opens `/admin/visual/index.html` in an iframe.
3. The editor posts `ready`; the widget answers with `{ page, entry, pageData, sections }`.
4. The editor renders page basics and sections with the site's own CSS, then posts `{ page, sections }` when Apply is clicked.
5. The widget calls Decap's `onChange` with a `visual_page` object. Decap owns GitHub auth, YAML serialization, and publishing.

Data contract:

- `pageData`: `page_heading`, `page_content`, `page_image`, `page_image_alt`, `page_image_position`, `body_class`, `show_projects_grid`, `show_publications_list`, `show_teaching_grid`, `show_team_grid`, `show_contact_form`.
- `sections`: the same section objects the site already used (`headline`, `rich_text`, `image`, `image_gallery`, `image_text`, `two_column`, `hero_image`, `hero_video`, `video`, `home_masthead`, `stat`, `pdf`).

To update GrapesJS:

1. Download the new `grapesjs` package.
2. Replace `static/admin/visual/vendor/grapes.min.js`, `grapes.min.css`, and `LICENSE`.
3. Run `npm run build` and check the editor manually.

Testing without a CMS login: the repo excludes the local harnesses, but you can create a page under `site/admin/visual/` that embeds the editor, posts a `cms-visual` `init` message with a sample payload, and asserts the returned `apply` message. The editor never needs network access beyond the page's own CSS.
