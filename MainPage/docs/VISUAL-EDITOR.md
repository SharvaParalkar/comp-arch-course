# Visual editor

The site has a Wix-style visual editor powered by [GrapesJS](https://grapesjs.com/). It is built into the existing Decap CMS, so GitHub sign-in, drafts, save, and publish still protect every change.

## Opening the editor

1. Go to `/admin/` on the site and sign in with GitHub.
2. Open one of these collections:
   - **2 · Pages**: Home, Team, Projects listing, Publications listing, Teaching listing, Contact, CV, and other standalone pages.
   - **3 · Projects**: each project detail page and its listing card.
   - **4 · Publications**: each publication card.
   - **5 · Teaching**: each teaching detail page and its listing card.
3. Open an entry.
4. Click **Open visual editor** under the collection's visual editor field.

The editor opens in a full-screen window. Click **How to edit** inside it for the same quick instructions.

> The editor URL (`/admin/visual/`) cannot save anything by itself. If you open it directly in a tab, it shows a lock screen. It only starts when the authenticated CMS opens it and hands it the entry data.

## What you can edit

### Pages

**Page tab (right side)**

- Page heading.
- Introduction text.
- Introduction image and its description.
- Image position, size, alignment, and corners.
- Automatic sections: Projects grid, Publications list, Teaching grid, Team grid, and Contact form.

**On the page**

- Click text to edit it in place.
- Click a section to change its image, caption, layout, video, PDF, and design in the **Section** tab.
- Drag sections to reorder, or use **On this page** and its arrow buttons.
- Use **Add** to insert text, media, hero, or document sections.
- Undo, redo, and desktop, tablet, and phone previews are in the top bar.

### Projects and Teaching

These entries have two editing modes, switched in the top bar:

- **Detail page**: a true two-column preview of the published detail layout. Text blocks sit in the left column and media sits in the right column. Add text blocks to the left column and images, galleries, or videos to the right. Drag within each column to reorder. Click the introduction placeholder to write the page introduction.
- **Listing card**: a preview of the card that appears on the Projects or Teaching page. Click the summary and instructors to edit them. Use the **Card** tab for the cover image, card images, image zoom, and crop focus.

The **Page** tab controls category, instructors (Teaching), summary, and introduction text. The **Section** tab controls the selected section, including image size, alignment, corners, and section media.

### Publications

Each publication is edited as the card that appears on the Publications page. Click the authors or venue to edit them in place. Use the **Card** tab for the image, PDF and BibTeX links, inline BibTeX, image zoom, and crop focus.

### Image and card design controls

The editor exposes structured design fields, not free-form CSS:

- **Image size**: 20% to 100% of the available width.
- **Image alignment**: left, center, or right.
- **Image corners**: square, slightly rounded, or rounded.
- **Card image zoom**: 100% to 180%.
- **Card image crop focus**: center, top, or bottom.

Project, teaching, and publication cards use the zoom and crop focus fields. Page and section images use size, alignment, and corners. Gallery sections can set a default for all images; each gallery item can also override it in the section fields.

## What stays in the normal CMS form

These are intentionally not duplicated in the visual editor:

- Entry title and web address.
- Year, sort order, and the featured flag.
- Home page hero logo and hero text.
- Team members and team groups.
- Search and social preview (SEO) fields.

They stay in the form next to the visual editor.

## Apply versus Publish

- **Apply changes** stages the entry inside the CMS form. The entry becomes unsaved.
- **Publish** (top right of the CMS) commits the entry to GitHub and starts the Cloudflare Pages build.

Nothing is written to GitHub until Publish. Closing the editor without applying changes nothing. Cancel asks before discarding unsaved edits.

## How content is stored

Every edited entry gets one `visual_page` object in its YAML file. The fields differ by collection.

A page:

```yaml
visual_page:
  version: 1
  page_heading: Projects
  page_content: <p>...</p>
  page_image: /uploads/media/example.jpg
  page_image_alt: Example
  page_image_position: right
  page_image_width: 70
  page_image_align: center
  page_image_radius: rounded
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

A project or teaching entry:

```yaml
visual_page:
  version: 1
  cover_image: /uploads/media/example.jpg
  card_images:
    - image: /uploads/media/example-2.jpg
      alt: Example
  card_title: Short card title
  category: Research
  instructors: Mostafa Akbari, Yao Lu
  summary: Short card summary.
  quick_content: <p>Introduction text.</p>
  body_class: body
  card_image_scale: 130
  card_image_position: top
  sections: []
```

A publication:

```yaml
visual_page:
  version: 1
  authors: Mostafa Akbari, ...
  venue: IASS 2024
  image: /uploads/media/example.jpg
  pdf_url: /uploads/publications/example.pdf
  bibtex_url: /uploads/publications/example.bib.txt
  article_url: ""
  bibtex: "@article{...}"
  image_scale: 130
  image_position: top
```

The Eleventy data loader merges every key in `visual_page` over the original top-level fields. Entries that have never been opened in the visual editor render exactly as before. An entry migrated to `visual_page` with the same values produces byte-identical HTML.

Sections and design fields remain structured data, so the existing Nunjucks templates own the markup and CSS. The design does not drift.

## Media

The **Choose file** button offers three ways to pick media:

1. **Site files**: an index of everything under `static/uploads`, generated during `npm run build` as `site/admin/media-index.json`.
2. **Cloudinary**: the same Cloudinary account the CMS already uses. It opens Cloudinary's media library for upload or selection.
3. **Paste a link**: any `/uploads/...` path or a full `https://` URL.

Nothing is uploaded to GitHub by the editor. Cloudinary files stay on Cloudinary; site files are chosen from what is already committed.

## Safety and limits

- The editor changes content and a fixed set of design fields. It does not expose arbitrary CSS, JavaScript, or HTML page templates.
- Rich text HTML is cleaned before saving: editor-only attributes, generated IDs, and GrapesJS markers are removed.
- A section that requires media (Image, Image hero, Video, Video hero, Image gallery, PDF) blocks **Apply** until a file is chosen.
- The detail layout is a true two-column preview. Use the device buttons to check tablet and phone layouts; the desktop canvas is scaled to fit the editing panel.
- Titles, permalinks, years, and SEO stay in the CMS form because other pages and lists use them directly.

## Developer notes

Files:

| Path | Purpose |
| --- | --- |
| `static/admin/visual/index.html` | Editor shell |
| `static/admin/visual/editor.js` | GrapesJS setup, modes, panels, serialization |
| `static/admin/visual/renderer.js` | Mirrors the site's page, detail, and card markup |
| `static/admin/visual/media.js` | Site, Cloudinary, and URL media chooser |
| `static/admin/visual/editor.css` | Editor chrome |
| `static/admin/visual/canvas.css` | Editor-only helpers inside the canvas iframe |
| `static/admin/visual/vendor/` | Vendored GrapesJS 0.23.9 and markdown-it 14.3.0 |
| `static/admin/visual-widget.js` | Decap custom widget `visual_page` |
| `static/admin/visual-widget.css` | Widget card and full-screen overlay |
| `scripts/build.js` | Writes `site/admin/media-index.json` |
| `.eleventy.js` | Merges `visual_page` and builds image/card style filters |

How it fits together:

1. Decap renders the `visual_page` field with the custom widget.
2. The widget renders a card and opens `/admin/visual/index.html` in an iframe.
3. The editor posts `ready`; the widget answers with `{ page, entry, pageData, sections }`.
4. The editor dispatches on `page.context`: `page`, `project`, `teaching`, or `publication`. Projects and teaching can switch between `detail` and `card` modes.
5. Apply posts `{ page, sections }`. The widget calls Decap's `onChange` with a `visual_page` object. Decap owns GitHub auth, YAML serialization, and publishing.

Data contract:

- `pageData` fields by context:
  - `page`: `page_heading`, `page_content`, `page_image`, `page_image_alt`, `page_image_position`, `page_image_width`, `page_image_align`, `page_image_radius`, `body_class`, `show_*`.
  - `project` and `teaching`: `cover_image`, `card_images`, `card_title`, `category`, `instructors` (Teaching), `summary`, `quick_content`, `body_class`, `card_image_scale`, `card_image_position`.
  - `publication`: `authors`, `venue`, `image`, `pdf_url`, `bibtex_url`, `article_url`, `bibtex`, `image_scale`, `image_position`.
- `sections`: `headline`, `rich_text`, `image`, `image_gallery`, `image_text`, `two_column`, `hero_image`, `hero_video`, `video`, `home_masthead`, `stat`, `pdf`.
- Section design fields: `image_width`, `image_align`, `image_radius` on image, image text, and gallery sections or gallery items.

To update GrapesJS:

1. Download the new `grapesjs` package.
2. Replace `static/admin/visual/vendor/grapes.min.js`, `grapes.min.css`, and `LICENSE`.
3. Run `npm run build` and check the editor manually.

Testing without a CMS login: the repo excludes local harnesses, but you can create a page under `site/admin/visual/` that embeds the editor, posts a `cms-visual` `init` message with a sample payload, and asserts the returned `apply` message. The editor never needs network access beyond the page's own CSS.
