const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

const CONTENT_DIR = path.join(__dirname, "content");

function readYamlFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".yml") || f.endsWith(".yaml"))
    .map((f) => {
      const raw = fs.readFileSync(path.join(dir, f), "utf8");
      const data = yaml.load(raw) || {};
      const slug = f.replace(/\.ya?ml$/, "");
      return { ...data, slug, _filename: f };
    });
}

function loadSiteSettings() {
  const sitePath = path.join(CONTENT_DIR, "site.yml");
  if (!fs.existsSync(sitePath)) return {};
  return yaml.load(fs.readFileSync(sitePath, "utf8")) || {};
}

module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "static/admin": "admin" });
  eleventyConfig.addPassthroughCopy({ "static/robots.txt": "robots.txt" });
  eleventyConfig.addPassthroughCopy({ "static/uploads": "uploads" });

  eleventyConfig.addGlobalData("site", loadSiteSettings);

  eleventyConfig.addCollection("pages", () =>
    readYamlFiles(path.join(CONTENT_DIR, "pages"))
  );
  eleventyConfig.addCollection("projects", () =>
    readYamlFiles(path.join(CONTENT_DIR, "projects"))
  );
  eleventyConfig.addCollection("publications", () =>
    readYamlFiles(path.join(CONTENT_DIR, "publications"))
  );
  eleventyConfig.addCollection("teaching", () =>
    readYamlFiles(path.join(CONTENT_DIR, "teaching"))
  );

  eleventyConfig.addFilter("sortProjects", (projects) =>
    [...(projects || [])].sort((a, b) => {
      const ao = Number.isFinite(a.sort_order) ? a.sort_order : 9999;
      const bo = Number.isFinite(b.sort_order) ? b.sort_order : 9999;
      if (ao !== bo) return ao - bo;
      return String(a.title || "").localeCompare(String(b.title || ""));
    })
  );

  eleventyConfig.addFilter("hrefPath", (permalink) => {
    const value = String(permalink || "");
    return value.startsWith("/") ? value.slice(1) : value;
  });

  eleventyConfig.addFilter("markdown", (value) => value || "");

  eleventyConfig.addFilter("safeHtml", (value) => value || "");

  function plainText(value) {
    return String(value || "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function looksLikeAuthorLine(text) {
    if (!text || text.length > 280) return false;
    const commas = (text.match(/,/g) || []).length;
    if (commas < 1 && !/^instructors?:/i.test(text)) return false;
    if (/[.!?]/.test(text.replace(/\bet al\.?/gi, ""))) return false;
    return (
      /^instructors?:/i.test(text) ||
      /\bAkbari\b/.test(text) ||
      /^[A-Z][a-z]+ [A-Z]/.test(text)
    );
  }

  function looksLikePubTitle(text) {
    if (!text || text.length > 140) return false;
    if (/[.!?]$/.test(text)) return false;
    if (looksLikeAuthorLine(text)) return false;
    const words = text.split(/\s+/).filter(Boolean);
    const commas = (text.match(/,/g) || []).length;
    return words.length >= 3 && words.length <= 22 && commas <= 1;
  }

  function cleanDetailHtml(html, entry) {
    let body = String(html || "");
    const title = String(entry?.title || "").trim();

    body = body.replace(/<p>\s*(?:<strong>)?\s*\d{4}\s*(?:<\/strong>)?\s*<\/p>/gi, "");
    body = body.replace(/<p>\s*<em>[\s\S]*?<\/em>\s*<\/p>/i, "");
    body = body.replace(/<h3>\s*related publications\s*:?\s*<\/h3>/gi, "");
    body = body.replace(/<h3>\s*acknowledg?ments?\s*:?\s*<\/h3>/gi, "");
    if (title) {
      const escaped = title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      body = body.replace(new RegExp(`<p>\\s*${escaped}\\s*</p>`, "i"), "");
    }

    const blocks = body.match(/<(p|h[1-6])\b[\s\S]*?<\/\1>/gi) || [];
    if (!blocks.length) return body.trim();

    const related = [];
    const rest = [];
    let collectingRelated = true;
    let strippedAuthors = false;

    for (const block of blocks) {
      const text = plainText(block);
      if (!text) continue;
      if (!strippedAuthors && looksLikeAuthorLine(text)) {
        strippedAuthors = true;
        continue;
      }
      if (collectingRelated && looksLikePubTitle(text)) {
        related.push(text);
        continue;
      }
      collectingRelated = false;
      rest.push(block);
    }

    if (!rest.length && !related.length) return "";

    const relatedHtml = related.length
      ? `<div class="detail-related"><h3>Related publications</h3><ul>${related
          .map((item) => `<li>${item}</li>`)
          .join("")}</ul></div>`
      : "";

    return `${relatedHtml}${rest.join("")}`.trim();
  }

  eleventyConfig.addFilter("plainText", plainText);

  eleventyConfig.addFilter("detailAuthors", (entry) => {
    if (entry?.authors) return String(entry.authors).trim();
    const sections = entry?.sections || [];
    for (const section of sections) {
      if (section?.type !== "rich_text" || !section.body) continue;
      const em = String(section.body).match(/<p>\s*<em>([\s\S]*?)<\/em>\s*<\/p>/i);
      if (em) {
        const authors = plainText(em[1]).replace(/^instructors?:\s*/i, "");
        if (authors) return authors;
      }
      const firstP = String(section.body).match(/<p\b[\s\S]*?<\/p>/i);
      if (firstP) {
        const text = plainText(firstP[0]);
        if (looksLikeAuthorLine(text)) return text.replace(/^instructors?:\s*/i, "");
      }
    }
    return "";
  });

  const MEDIA_TYPES = new Set(["image", "video", "image_gallery", "hero_image", "hero_video"]);

  eleventyConfig.addFilter("detailMedia", (sections) =>
    (sections || []).filter((section) => MEDIA_TYPES.has(section?.type))
  );

  eleventyConfig.addFilter("detailCopy", (sections) =>
    (sections || []).filter(
      (section) => section && !MEDIA_TYPES.has(section.type) && section.type !== "headline" && section.type !== "home_masthead"
    )
  );

  eleventyConfig.addFilter("detailSections", (sections, entry, enabled) => {
    if (!enabled || !Array.isArray(sections)) return sections || [];
    let skippedHeadline = false;
    return sections
      .filter((section) => {
        if (!section) return false;
        if (!skippedHeadline && section.type === "headline") {
          skippedHeadline = true;
          return false;
        }
        if (section.type === "rich_text") {
          const cleaned = cleanDetailHtml(section.body, entry);
          return Boolean(plainText(cleaned));
        }
        return true;
      })
      .map((section) => {
        if (section.type !== "rich_text") return section;
        return { ...section, body: cleanDetailHtml(section.body, entry) };
      });
  });

  eleventyConfig.addPassthroughCopy({ "static/css": "css" });

  return {
    dir: {
      input: "src",
      includes: "_includes",
      data: "_data",
      output: "site",
    },
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
    templateFormats: ["njk", "md"],
  };
};
