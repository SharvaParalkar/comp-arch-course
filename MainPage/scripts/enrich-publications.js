/**
 * Build publications content from Wix publication.html.
 * Copies PDFs + BibTeX into static/uploads/publications/.
 * Run: node scripts/enrich-publications.js
 */
const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

const ROOT = path.join(__dirname, "..");
const REF = path.join(ROOT, "refwebmostafa/www.mostafaakbari.net");
const html = fs.readFileSync(path.join(REF, "publication.html"), "utf8");
const extracted = JSON.parse(
  fs.readFileSync(path.join(ROOT, "scripts/mostafa-extracted.json"), "utf8")
);

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function decode(s) {
  return String(s || "")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&rsquo;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function copyAsset(relHref, destName) {
  // href like _files/ugd/4249cf_....pdf or ....txt@dn=8_IASS_2023.txt
  const clean = relHref.split("?")[0];
  const srcName = path.basename(clean);
  // On disk, Wix export keeps the @dn= suffix for txt files
  const srcPath = path.join(REF, "_files", "ugd", srcName);
  const altPath = path.join(REF, clean.replace(/\//g, path.sep));
  const from = fs.existsSync(srcPath) ? srcPath : altPath;
  if (!fs.existsSync(from)) {
    console.warn("  missing asset:", relHref);
    return null;
  }
  const uploads = path.join(ROOT, "static/uploads/publications");
  ensureDir(uploads);
  const dest = path.join(uploads, destName);
  fs.copyFileSync(from, dest);
  return `/uploads/publications/${destName}`;
}

const headings = (extracted["publication.html"]?.headings || [])
  .map((h) => decode(h.text))
  .filter((t) => t && t !== "MOSTAFA AKBARI");

const pubs = [];
for (let i = 0; i + 2 < headings.length; i += 3) {
  pubs.push({
    title: headings[i],
    authors: headings[i + 1],
    venue: headings[i + 2],
  });
}

// Media covers in order
const mediaIds = [];
const seenMedia = new Set();
for (const m of html.matchAll(/https:\/\/static\.wixstatic\.com\/media\/([^/"'?]+)/g)) {
  const id = decodeURIComponent(m[1]).replace(/%7E/gi, "~");
  if (seenMedia.has(id) || id.startsWith("4249cf_84aa5645") || id.includes("66e6eba4")) {
    continue;
  }
  seenMedia.add(id);
  mediaIds.push(id);
}
const covers = mediaIds.map((id) => `https://static.wixstatic.com/media/${id}`);

// File links in document order (PDF / BibTeX pairs after an optional lone PDF)
const fileHrefs = [];
for (const m of html.matchAll(/href="(_files\/ugd\/[^"]+)"/gi)) {
  fileHrefs.push(m[1]);
}
// Drop leading orphan PDF if the next items form pairs and we have one extra
let files = fileHrefs.slice();
if (files.length === pubs.length * 2 + 1 && /\.pdf$/i.test(files[0])) {
  files = files.slice(1);
}

const pairs = [];
for (let i = 0; i < files.length; i += 2) {
  pairs.push({
    pdf: files[i] || "",
    bib: files[i + 1] || "",
  });
}

const outDir = path.join(ROOT, "content/publications");
ensureDir(outDir);
for (const f of fs.readdirSync(outDir)) {
  if (f.endsWith(".yml")) fs.unlinkSync(path.join(outDir, f));
}

const usedSlugs = new Set();
pubs.forEach((pub, idx) => {
  let slug = slugify(pub.title);
  if (usedSlugs.has(slug)) slug = `${slug}-${idx + 1}`;
  usedSlugs.add(slug);

  const yearMatch = pub.venue.match(/(19|20)\d{2}/);
  const pair = pairs[idx] || {};
  const pdfUrl = pair.pdf ? copyAsset(pair.pdf, `${slug}.pdf`) : "";
  let bibtexUrl = "";
  let bibtex = "";
  if (pair.bib) {
    bibtexUrl = copyAsset(pair.bib, `${slug}.bib.txt`);
    if (bibtexUrl) {
      const local = path.join(ROOT, "static", bibtexUrl.replace(/^\//, "").replace(/\//g, path.sep));
      if (fs.existsSync(local)) bibtex = fs.readFileSync(local, "utf8").trim();
    }
  }

  const data = {
    title: pub.title,
    authors: pub.authors,
    venue: pub.venue,
    year: yearMatch ? yearMatch[0] : "",
    sort_order: idx + 1,
    image: covers[idx] || "",
    pdf_url: pdfUrl || "",
    bibtex_url: bibtexUrl || "",
    article_url: "",
    bibtex: bibtex || "",
  };

  fs.writeFileSync(
    path.join(outDir, `${slug}.yml`),
    yaml.dump(data, { lineWidth: 100, noRefs: true }),
    "utf8"
  );
  console.log(
    "wrote",
    slug,
    data.image ? "img" : "noimg",
    data.pdf_url ? "pdf" : "nopdf",
    data.bibtex_url ? "bib" : "nobib"
  );
});

const page = {
  title: "Publications",
  permalink: "/publications.html",
  body_class: "body",
  seo: {
    description: "Selected publications by Mostafa Akbari",
    og_title: "Publications | Mostafa Akbari",
  },
  body_mode: "sections",
  show_publications_list: true,
  sections: [{ type: "headline", text: "Publications" }],
};
fs.writeFileSync(
  path.join(ROOT, "content/pages/publications.yml"),
  yaml.dump(page, { lineWidth: 100, noRefs: true }),
  "utf8"
);
console.log("updated publications page");
console.log("Done.");
