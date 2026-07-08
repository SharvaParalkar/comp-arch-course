/**
 * Extracts content from RefWeb HTML export into Decap CMS YAML files.
 * Run: npm run migrate
 */
const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

const ROOT = path.join(__dirname, "..");
const REFWEB = path.join(ROOT, "RefWeb", "www.oxman.com");
const CONTENT = path.join(ROOT, "content");

const PAGE_FILES = [
  "index",
  "mission",
  "company",
  "work",
  "contact",
  "careers",
  "future-talent",
  "terms-and-policies",
];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function extractMeta(html, attr) {
  const re = new RegExp(
    `<meta[^>]+(?:name|property)="${attr}"[^>]+content="([^"]*)"`,
    "i"
  );
  const m = html.match(re);
  if (m) return m[1];
  const re2 = new RegExp(
    `<meta[^>]+content="([^"]*)"[^>]+(?:name|property)="${attr}"`,
    "i"
  );
  const m2 = html.match(re2);
  return m2 ? m2[1] : "";
}

function extractTitle(html) {
  const m = html.match(/<title>([^<]*)<\/title>/i);
  return m ? m[1].replace(/\s*\|.*$/, "").trim() : "";
}

function extractMain(html) {
  const m = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  return m ? m[1].trim() : "";
}

function extractBodyClass(html) {
  const m = html.match(/<body[^>]*class="([^"]*)"/i);
  return m ? m[1] : "body";
}

function slugFromFilename(filename) {
  return filename.replace(/\.html$/, "");
}

function writeYaml(dir, slug, data) {
  ensureDir(dir);
  const file = path.join(dir, `${slug}.yml`);
  fs.writeFileSync(
    file,
    yaml.dump(data, { lineWidth: 120, noRefs: true }),
    "utf8"
  );
  console.log(`  wrote ${path.relative(ROOT, file)}`);
}

function pagePermalink(slug) {
  if (slug === "index") return "/index.html";
  return `/${slug}.html`;
}

function migratePage(htmlPath, slug, collection = "pages") {
  const html = fs.readFileSync(htmlPath, "utf8");
  const data = {
    title: extractTitle(html) || slug,
    permalink: pagePermalink(slug),
    body_class: extractBodyClass(html),
    seo: {
      description: extractMeta(html, "description"),
      og_title: extractMeta(html, "og:title"),
      og_description: extractMeta(html, "og:description"),
      og_image: extractMeta(html, "og:image"),
    },
    body_mode: "legacy",
    main_html: extractMain(html),
  };
  const dir = path.join(CONTENT, collection);
  const fileSlug = slug === "index" ? "home" : slug;
  writeYaml(dir, fileSlug, data);
}

function migrateProjectOrPlatform(htmlPath, collection) {
  const filename = path.basename(htmlPath);
  const slug = slugFromFilename(filename);
  const html = fs.readFileSync(htmlPath, "utf8");
  const prefix = collection === "projects" ? "projects" : "platforms";

  const data = {
    title: extractTitle(html) || slug,
    permalink: `/${prefix}/${slug}.html`,
    body_class: extractBodyClass(html),
    seo: {
      description: extractMeta(html, "description"),
      og_title: extractMeta(html, "og:title"),
      og_description: extractMeta(html, "og:description"),
      og_image: extractMeta(html, "og:image"),
    },
    body_mode: "legacy",
    main_html: extractMain(html),
  };
  writeYaml(path.join(CONTENT, collection), slug, data);
}

function migrateJob(htmlPath) {
  const filename = path.basename(htmlPath);
  const slug = slugFromFilename(filename);
  const html = fs.readFileSync(htmlPath, "utf8");

  const titleMatch = html.match(/<h1[^>]*class="job-title"[^>]*>([^<]*)</i);
  const deptMatch = html.match(/department="([^"]*)"/i);

  const data = {
    title: titleMatch ? titleMatch[1].trim() : extractTitle(html) || slug,
    permalink: `/job/${slug}.html`,
    department: deptMatch ? deptMatch[1] : "",
    body_class: extractBodyClass(html) || "body",
    seo: {
      description: extractMeta(html, "description"),
    },
    body_mode: "legacy",
    main_html: extractMain(html) || html.match(/<div class="job-page-div">[\s\S]*?<\/div>\s*<footer/i)?.[0]?.replace(/<footer[\s\S]*$/, "").trim() || "",
  };

  if (!data.main_html) {
    const jobDiv = html.match(/<div class="job-page-div">([\s\S]*?)<\/div>\s*<footer/i);
    data.main_html = jobDiv ? jobDiv[1].trim() : "";
  }

  writeYaml(path.join(CONTENT, "jobs"), slug, data);
}

function migrateSiteSettings() {
  const data = {
    site_name: "OXMAN",
    tagline:
      "Envision a future of complete synergy between Nature and humanity.",
    copyright: "© OXMAN 2026. All rights reserved",
    navigation: [
      { label: "Mission", url: "mission.html" },
      { label: "Company", url: "company.html" },
      { label: "Work", url: "work.html" },
      { label: "Careers", url: "careers.html" },
      { label: "Contact", url: "contact.html" },
    ],
    social_links: [
      {
        label: "YouTube",
        url: "https://www.youtube.com/channel/UCWA9MwbHMrutAzyLBYhs9KQ",
      },
      {
        label: "LinkedIn",
        url: "https://www.linkedin.com/company/oxman/",
      },
      {
        label: "Instagram",
        url: "https://www.instagram.com/oxmanofficial/",
      },
    ],
    footer_links: [{ label: "Terms and Policies", url: "terms-and-policies.html" }],
    default_seo: {
      description:
        "Envision a future of complete synergy between Nature and humanity. OXMAN is accelerating systems-level change by fusing design, technology, and biology in a radical shift from human-centric design to Nature-centric design.",
      og_image:
        "https://cdn.prod.website-files.com/690e0b6e2e2a0cbc45ab116e/696fe3952005ae09bb201fdc_OXMAN-OG-image.jpg",
    },
  };
  writeYaml(CONTENT, "site", data);
}

function main() {
  if (!fs.existsSync(REFWEB)) {
    console.error(`RefWeb not found at ${REFWEB}`);
    process.exit(1);
  }

  console.log("Migrating RefWeb content to CMS YAML files...\n");

  migrateSiteSettings();

  console.log("\nPages:");
  for (const slug of PAGE_FILES) {
    const htmlPath = path.join(REFWEB, `${slug}.html`);
    if (fs.existsSync(htmlPath)) migratePage(htmlPath, slug);
  }

  // Careers ashby detail pages
  for (const f of fs.readdirSync(REFWEB)) {
    if (f.startsWith("careers@")) {
      migratePage(path.join(REFWEB, f), slugFromFilename(f));
    }
  }

  console.log("\nProjects:");
  const projectsDir = path.join(REFWEB, "projects");
  for (const f of fs.readdirSync(projectsDir)) {
    if (f.endsWith(".html")) {
      migrateProjectOrPlatform(path.join(projectsDir, f), "projects");
    }
  }

  console.log("\nPlatforms:");
  const platformsDir = path.join(REFWEB, "platforms");
  for (const f of fs.readdirSync(platformsDir)) {
    if (f.endsWith(".html")) {
      migrateProjectOrPlatform(path.join(platformsDir, f), "platforms");
    }
  }

  console.log("\nJobs:");
  const jobsDir = path.join(REFWEB, "job");
  for (const f of fs.readdirSync(jobsDir)) {
    if (f.endsWith(".html")) migrateJob(path.join(jobsDir, f));
  }

  // Copy robots.txt
  ensureDir(path.join(ROOT, "static"));
  const robots = path.join(REFWEB, "robots.txt");
  if (fs.existsSync(robots)) {
    fs.copyFileSync(robots, path.join(ROOT, "static", "robots.txt"));
  }

  console.log("\nDone! Run `npm run build` to generate the site.");
}

main();
