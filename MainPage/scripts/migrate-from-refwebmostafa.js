/**
 * Migrates text-only content from refwebmostafa Wix export into CMS YAML.
 * Run: npm run migrate:mostafa
 */
const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

const ROOT = path.join(__dirname, "..");
const REF = path.join(ROOT, "refwebmostafa", "www.mostafaakbari.net");
const CONTENT = path.join(ROOT, "content");

const SKIP_PROJECT_FILES = new Set([
  "copy-of-projects-1-knitting-1.html", // teaching course detail
  "copy-of-projects-5-shellular-struc.html",
  "copy-of-projects-6-self-folding.html",
]);

const PAGE_MAP = {
  "index.html": { slug: "home", permalink: "/index.html" },
  "about-page.html": { slug: "about", permalink: "/about.html" },
  "projects2.html": { slug: "projects", permalink: "/projects.html" },
  "teaching.html": { slug: "teaching", permalink: "/teaching.html" },
  "publication.html": { slug: "publications", permalink: "/publications.html" },
};

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function decode(s) {
  return s
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&ldquo;/g, "\u201C")
    .replace(/&rdquo;/g, "\u201D")
    .replace(/\s+/g, " ")
    .trim();
}

function stripTags(html) {
  return decode(html.replace(/<[^>]+>/g, " "));
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function writeYaml(dir, slug, data) {
  ensureDir(dir);
  const file = path.join(dir, `${slug}.yml`);
  fs.writeFileSync(file, yaml.dump(data, { lineWidth: 120, noRefs: true }), "utf8");
  console.log(`  wrote ${path.relative(ROOT, file)}`);
}

function extractPage(file) {
  const html = fs.readFileSync(path.join(REF, file), "utf8");
  const title = decode((html.match(/<title>([^<]*)<\/title>/i) || [])[1] || "");

  const paragraphs = [];
  for (const m of html.matchAll(
    /<p[^>]*class="[^"]*wixui-rich-text[^"]*"[^>]*>([\s\S]*?)<\/p>/gi
  )) {
    const t = stripTags(m[1]);
    if (t.length > 15 && t !== "Computational Designer | Architect") {
      paragraphs.push(t);
    }
  }

  const headings = [];
  for (const m of html.matchAll(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi)) {
    const t = stripTags(m[2]);
    if (t.length > 1 && t !== "MOSTAFA AKBARI") headings.push({ level: m[1], text: t });
  }

  return { file, title, headings, paragraphs };
}

function isYear(text) {
  return /^\d{4}(-\d{4})?$/.test(text.trim());
}

function isNoise(text) {
  const t = text.trim();
  if (!t || t === "MOSTAFA AKBARI" || t === "Computational Designer | Architect") return true;
  if (/^top of page$/i.test(t)) return true;
  if (/^©|^&copy;/i.test(t)) return true;
  return false;
}

function uniqueTexts(items) {
  return [...new Set(items.filter((t) => !isNoise(t)))];
}

function richSection(body) {
  return { type: "rich_text", body };
}

function headlineSection(text) {
  return { type: "headline", text };
}

function paragraphsToHtml(paragraphs) {
  return paragraphs.map((p) => `<p>${p}</p>`).join("\n");
}

function headingsToSections(headings, paragraphs = []) {
  const sections = [];
  const uniqueParas = uniqueTexts(paragraphs);

  if (uniqueParas.length) {
    sections.push(richSection(paragraphsToHtml(uniqueParas)));
  }

  const items = headings.filter((h) => !isNoise(h.text));
  let i = 0;
  while (i < items.length) {
    const h = items[i];
    const text = h.text.trim();

    if (isYear(text)) {
      i += 1;
      continue;
    }

    if (text.startsWith("|") || (text.includes("|") && text.length < 120)) {
      sections.push(headlineSection(text.replace(/^\|\s*/, "").replace(/\s*\|$/, "")));
      i += 1;
      if (i < items.length && isYear(items[i].text)) {
        sections.push(richSection(`<p><strong>${items[i].text}</strong></p>`));
        i += 1;
      }
      const bodyParts = [];
      while (i < items.length) {
        const next = items[i].text.trim();
        if (next.startsWith("|") || (next.includes("| Seminar") || next.includes("| Research") || next.includes("| workshop"))) {
          break;
        }
        if (isYear(next) && bodyParts.length > 0) break;
        bodyParts.push(next);
        i += 1;
      }
      if (bodyParts.length) {
        sections.push(richSection(paragraphsToHtml(bodyParts)));
      }
      continue;
    }

    if (text.length > 180) {
      sections.push(richSection(`<p>${text}</p>`));
    } else if (/^(Instructor|Instructors|Related Publications|Acknowledgments)/i.test(text)) {
      sections.push(headlineSection(text.replace(/:$/, "")));
    } else {
      sections.push(richSection(`<p><strong>${text}</strong></p>`));
    }
    i += 1;
  }

  return sections;
}

function parseProjectPage(data) {
  const items = data.headings.filter((h) => !isNoise(h.text));
  let title = "Untitled Project";
  let year = "";
  const meta = [];
  const body = [];

  for (let i = 0; i < items.length; i += 1) {
    const text = items[i].text.trim();
    if (isYear(text)) {
      year = text;
      continue;
    }
    if (!title || title === "Untitled Project") {
      if (text.length < 120 && !/^(Related|Acknowledgments|Instructor)/i.test(text)) {
        title = text;
        continue;
      }
    }
    if (/^(Instructor|Instructors|Related Publications|Acknowledgments)/i.test(text)) {
      meta.push(`<h3>${text}</h3>`);
      continue;
    }
    if (text.length < 100 && i < 4) {
      meta.push(`<p><em>${text}</em></p>`);
      continue;
    }
    body.push(`<p>${text}</p>`);
  }

  for (const p of uniqueTexts(data.paragraphs)) {
    body.push(`<p>${p}</p>`);
  }

  const sections = [
    headlineSection(title),
  ];
  if (year) sections.push(richSection(`<p><strong>${year}</strong></p>`));
  if (meta.length) sections.push(richSection(meta.join("\n")));
  if (body.length) sections.push(richSection(body.join("\n")));

  return { title, year, sections };
}

function buildSiteSettings(about) {
  const bio = about.paragraphs.filter((p) => p.length > 100);
  const description =
    bio[0] ||
    "Mostafa Akbari — computational designer, architect, and researcher in structural form finding and advanced manufacturing.";

  return {
    site_name: "Mostafa Akbari",
    tagline: "Computational Designer | Architect | Architectural Technologist",
    copyright: "© Mostafa Akbari. All rights reserved.",
    navigation: [
      { label: "About", url: "about.html" },
      { label: "Projects", url: "projects.html" },
      { label: "Publications", url: "publications.html" },
      { label: "Teaching", url: "teaching.html" },
    ],
    social_links: [],
    footer_links: [],
    default_seo: {
      description: description.slice(0, 300),
      og_image: "",
    },
  };
}

function buildHomePage(index, about) {
  const bio = about.paragraphs.filter((p) => p.length > 100);
  const tagline =
    uniqueTexts(index.paragraphs).find((p) => p.includes("Technologist")) ||
    "Architectural Technologist | Designer";

  return {
    title: "Mostafa Akbari",
    permalink: "/index.html",
    body_class: "body is-black",
    seo: {
      description:
        "Mostafa Akbari — computational designer and architectural technologist specializing in shellular funicular structures, digital fabrication, and computational design.",
      og_title: "Mostafa Akbari | Architectural Technologist",
    },
    body_mode: "sections",
    sections: [
      headlineSection("Mostafa Akbari"),
      { type: "headline", text: tagline },
      richSection(
        paragraphsToHtml(
          bio.length
            ? bio.slice(0, 2)
            : [
                "Computational designer and researcher with expertise in structural form finding, 3D graphic statics, and advanced manufacturing.",
              ]
        )
      ),
      richSection(
        `<p><a href="about.html">About</a> · <a href="projects.html">Projects</a> · <a href="publications.html">Publications</a> · <a href="teaching.html">Teaching</a></p>`
      ),
    ],
  };
}

function buildStandardPage(title, permalink, extracted, pageHeading) {
  return {
    title,
    permalink,
    body_class: "body",
    seo: {
      description: uniqueTexts(extracted.paragraphs)[0] || title,
      og_title: `${title} | Mostafa Akbari`,
    },
    body_mode: "sections",
    sections: [
      headlineSection(pageHeading || title),
      ...headingsToSections(extracted.headings, extracted.paragraphs),
    ],
  };
}

function clearDir(dir, keep = new Set()) {
  if (!fs.existsSync(dir)) return;
  for (const f of fs.readdirSync(dir)) {
    if (f.endsWith(".yml") && !keep.has(f)) {
      fs.unlinkSync(path.join(dir, f));
      console.log(`  removed ${path.relative(ROOT, path.join(dir, f))}`);
    }
  }
}

function main() {
  console.log("Extracting content from refwebmostafa...");
  const pages = {};
  for (const file of fs.readdirSync(REF).filter((f) => f.endsWith(".html"))) {
    pages[file] = extractPage(file);
  }

  const about = pages["about-page.html"];
  const index = pages["index.html"];

  console.log("\nWriting site settings...");
  writeYaml(CONTENT, "site", buildSiteSettings(about));

  console.log("\nWriting pages...");
  clearDir(path.join(CONTENT, "pages"));
  writeYaml(path.join(CONTENT, "pages"), "home", buildHomePage(index, about));
  writeYaml(
    path.join(CONTENT, "pages"),
    "about",
    buildStandardPage("About", "/about.html", about, "About")
  );
  writeYaml(
    path.join(CONTENT, "pages"),
    "teaching",
    buildStandardPage("Teaching", "/teaching.html", pages["teaching.html"], "Teaching")
  );
  writeYaml(
    path.join(CONTENT, "pages"),
    "publications",
    buildStandardPage(
      "Publications",
      "/publications.html",
      pages["publication.html"],
      "Publications"
    )
  );

  console.log("\nWriting projects...");
  clearDir(path.join(CONTENT, "projects"));

  const projectFiles = fs
    .readdirSync(REF)
    .filter((f) => f.startsWith("copy-of-projects-") && f.endsWith(".html"))
    .filter((f) => !SKIP_PROJECT_FILES.has(f));

  if (pages["gallery-clay.html"]?.headings.some((h) => h.text.includes("Bio-Based"))) {
    projectFiles.push("gallery-clay.html");
  }

  const usedSlugs = new Set();
  const projectIndex = [];
  let sortOrder = 1;

  for (const file of projectFiles) {
    const data = pages[file];
    if (!data) continue;

    const parsed = parseProjectPage(data);
    if (parsed.title === "Untitled Project" && parsed.sections.length <= 2) {
      console.log(`  skip ${file} (no content)`);
      continue;
    }

    let slug = slugify(parsed.title);
    if (usedSlugs.has(slug)) slug = `${slug}-${sortOrder}`;
    usedSlugs.add(slug);

    const project = {
      title: parsed.title,
      permalink: `/projects/${slug}.html`,
      body_class: "body",
      featured: sortOrder <= 3,
      sort_order: sortOrder,
      seo: {
        description: parsed.sections
          .flatMap((s) => (s.body || s.text || "").replace(/<[^>]+>/g, " "))
          .join(" ")
          .slice(0, 280),
        og_title: `${parsed.title} | Mostafa Akbari`,
      },
      body_mode: "sections",
      sections: parsed.sections,
    };

    writeYaml(path.join(CONTENT, "projects"), slug, project);
    projectIndex.push({ title: parsed.title, slug, year: parsed.year });
    sortOrder += 1;
  }

  writeYaml(path.join(CONTENT, "pages"), "projects", {
    title: "Projects",
    permalink: "/projects.html",
    body_class: "body",
    seo: {
      description: "Research and design projects by Mostafa Akbari",
      og_title: "Projects | Mostafa Akbari",
    },
    body_mode: "sections",
    show_projects_grid: true,
    sections: [headlineSection("Projects")],
  });

  console.log("\nEnriching project cards from listing...");
  try {
    require("./enrich-project-cards.js");
  } catch (err) {
    console.warn("  card enrichment skipped:", err.message);
  }

  console.log("\nRemoving legacy collections...");
  clearDir(path.join(CONTENT, "platforms"));
  clearDir(path.join(CONTENT, "jobs"));

  console.log("\nDone. Run npm run build to regenerate the site.");
}

main();
