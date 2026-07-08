const fs = require("fs");
const path = require("path");

const REF = path.join(__dirname, "..", "refwebmostafa", "www.mostafaakbari.net");

function decode(s) {
  return s
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function stripTags(html) {
  return decode(html.replace(/<[^>]+>/g, " "));
}

function extractPage(file) {
  const html = fs.readFileSync(path.join(REF, file), "utf8");
  const title = decode((html.match(/<title>([^<]*)<\/title>/i) || [])[1] || "");

  const paragraphs = [];
  for (const m of html.matchAll(
    /<p[^>]*class="[^"]*wixui-rich-text[^"]*"[^>]*>([\s\S]*?)<\/p>/gi
  )) {
    const t = stripTags(m[1]);
    if (t.length > 15) paragraphs.push(t);
  }

  const headings = [];
  for (const m of html.matchAll(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi)) {
    const t = stripTags(m[2]);
    if (t.length > 1) headings.push({ level: m[1], text: t });
  }

  const links = [];
  for (const m of html.matchAll(/href="([^"]+\.html)"/gi)) {
    const href = m[1];
    if (!href.includes("wix") && !links.includes(href)) links.push(href);
  }

  return { file, title, headings, paragraphs, links };
}

const files = fs.readdirSync(REF).filter((f) => f.endsWith(".html"));
const all = {};
for (const f of files) {
  all[f] = extractPage(f);
}

const out = path.join(__dirname, "..", "scripts", "mostafa-extracted.json");
fs.writeFileSync(out, JSON.stringify(all, null, 2));
console.log("Wrote", out);
console.log("Pages:", files.length);

for (const key of [
  "index.html",
  "about-page.html",
  "projects2.html",
  "teaching.html",
  "publication.html",
]) {
  const p = all[key];
  console.log("\n===", key, "===");
  console.log("Title:", p.title);
  console.log("Headings:", p.headings.slice(0, 8).map((h) => h.text).join(" | "));
  console.log("Paragraphs:", p.paragraphs.length);
  p.paragraphs.slice(0, 3).forEach((x) => console.log(" -", x.slice(0, 150)));
}
