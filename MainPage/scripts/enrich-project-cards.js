/**
 * Enrich project YAML with card fields (cover, year, category, summary)
 * extracted from the Wix projects listing. Run: node scripts/enrich-project-cards.js
 */
const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

const ROOT = path.join(__dirname, "..");
const html = fs.readFileSync(
  path.join(ROOT, "refwebmostafa/www.mostafaakbari.net/projects2.html"),
  "utf8"
);
const extracted = JSON.parse(
  fs.readFileSync(path.join(ROOT, "scripts/mostafa-extracted.json"), "utf8")
);

const ALIASES = {
  saltature: "saltatur-the-dancer.yml",
  "soap coating cellular structures": null, // create stub
  "self-folding origami structures": null,
};

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function norm(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function score(a, b) {
  const na = norm(a);
  const nb = norm(b);
  if (!na || !nb) return 0;
  if (na === nb) return 100;
  if (na.includes(nb) || nb.includes(na)) return 80;
  const aw = new Set(na.split(" "));
  const bw = nb.split(" ");
  const hit = bw.filter((w) => aw.has(w)).length;
  return (hit / Math.max(bw.length, 1)) * 60;
}

function cleanUrl(u) {
  const first = String(u).split(/\s+/)[0];
  // Prefer a stable base media URL for stills
  const idMatch = first.match(/\/media\/([^/?]+)/);
  if (idMatch && /\.(jpe?g|png|webp)$/i.test(idMatch[1].replace(/~.*/, ""))) {
    return `https://static.wixstatic.com/media/${idMatch[1]}`;
  }
  if (idMatch && /~mv2\.(jpe?g|png|gif|webp)/i.test(idMatch[1])) {
    return `https://static.wixstatic.com/media/${idMatch[1]}`;
  }
  return first;
}

const headings = (extracted["projects2.html"]?.headings || []).map((h) => h.text.trim());
const cards = [];
for (let i = 0; i < headings.length; i++) {
  const t = headings[i];
  if (!(t.includes("|") && (t.includes("Research") || t.includes("Design")))) continue;
  const year = headings[i + 1] || "";
  const title = headings[i + 2] || "";
  const summary = headings[i + 3] || "";
  if (!/^\d{4}/.test(year)) continue;
  const parts = t
    .split("|")
    .map((p) => p.trim())
    .filter(Boolean);
  const category = parts[parts.length - 1] || "Research";
  const overlay = parts.slice(0, -1).join(" / ") || title;
  cards.push({ overlay, category, year, title, summary });
}

const allImgs = [...html.matchAll(/https:\/\/static\.wixstatic\.com\/media\/([^/"'?]+)/g)];
const mediaOrder = [];
const seen = new Set();
for (const m of allImgs) {
  const rawId = m[1];
  const id = decodeURIComponent(rawId).replace(/%7E/gi, "~");
  if (seen.has(id)) continue;
  if (id.startsWith("4249cf_84aa5645")) continue;
  seen.add(id);
  mediaOrder.push(cleanUrl(`https://static.wixstatic.com/media/${rawId}`));
}

// Drop known non-project loader gif at start
let covers = mediaOrder.filter((u) => !u.includes("66e6eba4"));
// Keep one cover per card index; also drop mid-list decorative gifs when we have extras
if (covers.length > cards.length) {
  covers = covers.filter((u) => !u.endsWith(".gif"));
}

const projDir = path.join(ROOT, "content/projects");
const projects = fs
  .readdirSync(projDir)
  .filter((f) => f.endsWith(".yml"))
  .map((f) => ({
    file: f,
    data: yaml.load(fs.readFileSync(path.join(projDir, f), "utf8")),
  }));

const usedFiles = new Set();
const mapping = cards.map((card, idx) => {
  const aliasKey = norm(card.overlay.split("/")[0] || card.title);
  const aliasFile = ALIASES[aliasKey];
  let best = null;
  let bestScore = 0;

  if (aliasFile) {
    best = projects.find((p) => p.file === aliasFile) || null;
    bestScore = best ? 100 : 0;
  } else {
    for (const p of projects) {
      if (usedFiles.has(p.file)) continue;
      const s = Math.max(
        score(card.title, p.data.title),
        score(card.overlay, p.data.title),
        score(card.overlay.split("/")[0], p.data.title)
      );
      if (s > bestScore) {
        bestScore = s;
        best = p;
      }
    }
    if (!(best && bestScore >= 35)) best = null;
  }

  if (best) usedFiles.add(best.file);

  return { card, project: best, score: bestScore, cover: covers[idx] || null, idx };
});

function applyCardFields(data, card, cover, sortOrder) {
  data.year = card.year;
  data.category = card.category;
  data.card_title = card.overlay;
  data.summary = card.summary.replace(/\s*\[\.\.\.\]\s*$/, "").trim();
  if (cover) data.cover_image = cover;
  data.sort_order = sortOrder;
  data.featured = data.featured === true;
  return data;
}

for (const m of mapping) {
  const sortOrder = m.idx + 1;
  if (m.project) {
    const data = applyCardFields(m.project.data, m.card, m.cover, sortOrder);
    fs.writeFileSync(
      path.join(projDir, m.project.file),
      yaml.dump(data, { lineWidth: 100, noRefs: true }),
      "utf8"
    );
    console.log("updated", m.project.file);
    continue;
  }

  // Create stub project pages for listing-only items
  const slug = slugify(m.card.title);
  const file = `${slug}.yml`;
  const data = applyCardFields(
    {
      title: m.card.title,
      permalink: `/projects/${slug}.html`,
      body_class: "body",
      featured: false,
      seo: {
        description: m.card.summary.slice(0, 280),
        og_title: `${m.card.title} | Mostafa Akbari`,
      },
      body_mode: "sections",
      sections: [
        { type: "headline", text: m.card.title },
        { type: "rich_text", body: `<p><strong>${m.card.year}</strong></p>` },
        { type: "rich_text", body: `<p>${m.card.summary}</p>` },
      ],
    },
    m.card,
    m.cover,
    sortOrder
  );
  fs.writeFileSync(path.join(projDir, file), yaml.dump(data, { lineWidth: 100, noRefs: true }), "utf8");
  console.log("created", file);
}

const projectsPage = {
  title: "Projects",
  permalink: "/projects.html",
  body_class: "body",
  seo: {
    description: "Research and design projects by Mostafa Akbari",
    og_title: "Projects | Mostafa Akbari",
  },
  body_mode: "sections",
  show_projects_grid: true,
  sections: [{ type: "headline", text: "Projects" }],
};
fs.writeFileSync(
  path.join(ROOT, "content/pages/projects.yml"),
  yaml.dump(projectsPage, { lineWidth: 100, noRefs: true }),
  "utf8"
);
console.log("updated projects listing page");
console.log("Done.");

module.exports = { cards: mapping.map((m) => m.card) };

if (require.main === module) {
  // already ran above when executed directly
}
