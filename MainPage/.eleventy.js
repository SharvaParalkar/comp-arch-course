const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");
const MarkdownIt = require("markdown-it");

const markdownRenderer = new MarkdownIt({ html: true, linkify: true, typographer: true });

const CONTENT_DIR = path.join(__dirname, "content");

// The visual editor stores an entry's editable content in one object so it can
// be saved atomically from Decap. Entries that have never been opened in the
// visual editor keep using their original top-level fields unchanged.
function applyVisualPage(data) {
  const visual = data && data.visual_page;
  if (!visual || typeof visual !== "object") return data;
  const merged = { ...data };
  for (const [key, value] of Object.entries(visual)) {
    if (key !== "version") merged[key] = value;
  }
  return merged;
}

function readYamlFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".yml") || f.endsWith(".yaml"))
    .map((f) => {
      const raw = fs.readFileSync(path.join(dir, f), "utf8");
      const data = applyVisualPage(yaml.load(raw) || {});
      const slug = f.replace(/\.ya?ml$/, "");
      return { ...data, slug, _filename: f };
    });
}

function numberInRange(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

function frameStyleFrom(widthValue, alignValue, radiusValue) {
  const hasWidth = widthValue !== undefined && widthValue !== null && widthValue !== "";
  const hasAlign = alignValue !== undefined && alignValue !== null && alignValue !== "";
  const hasRadius = radiusValue !== undefined && radiusValue !== null && radiusValue !== "";
  if (!hasWidth && !hasAlign && !hasRadius) return "";
  const width = hasWidth ? numberInRange(widthValue, 10, 100, 100) : 100;
  const align = ["left", "center", "right"].includes(alignValue) ? alignValue : "center";
  const radius = radiusValue;
  const styles = [];
  if (width < 100) styles.push(`width:${width}%`, `max-width:${width}%`);
  if (hasAlign || width < 100) {
    if (align === "center") styles.push("justify-self:center", "margin-left:auto", "margin-right:auto");
    else if (align === "right") styles.push("justify-self:end", "margin-left:auto", "margin-right:0");
    else styles.push("justify-self:start", "margin-left:0", "margin-right:auto");
  }
  if (radius === "rounded") styles.push("border-radius:12px", "overflow:hidden");
  else if (radius === "soft") styles.push("border-radius:4px", "overflow:hidden");
  return styles.join(";");
}

function mediaFrameStyle(item, fallback) {
  if (!item) return "";
  const base = fallback || {};
  return frameStyleFrom(
    item.image_width != null ? item.image_width : base.image_width,
    item.image_align != null ? item.image_align : base.image_align,
    item.image_radius != null ? item.image_radius : base.image_radius
  );
}

function pageImageFrameStyle(entry) {
  if (!entry) return "";
  return frameStyleFrom(entry.page_image_width, entry.page_image_align, entry.page_image_radius);
}

function cardImageStyle(entry, kind) {
  if (!entry) return "";
  const publication = kind === "publication";
  const scaleValue = publication ? entry.image_scale : entry.card_image_scale;
  const positionValue = publication ? entry.image_position : entry.card_image_position;
  const hasScale = scaleValue !== undefined && scaleValue !== null && scaleValue !== "";
  const hasPosition = positionValue !== undefined && positionValue !== null && positionValue !== "";
  if (!hasScale && !hasPosition) return "";
  const scale = numberInRange(scaleValue, 100, 180, 100);
  const position = String(positionValue || "center");
  const safePosition = ["center", "top", "bottom", "left", "right"].includes(position) ? position : "center";
  if (scale === 100 && safePosition === "center") return "";
  const styles = [];
  if (safePosition !== "center" || scale !== 100) styles.push(`object-position:${safePosition}`);
  if (scale !== 100) styles.push(`transform:scale(${(scale / 100).toFixed(3)})`, "transform-origin:center");
  return styles.join(";");
}

function loadSiteSettings() {
  const sitePath = path.join(CONTENT_DIR, "site.yml");
  if (!fs.existsSync(sitePath)) return {};
  return yaml.load(fs.readFileSync(sitePath, "utf8")) || {};
}

module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "static/admin": "admin" });
  eleventyConfig.addPassthroughCopy({ "static/robots.txt": "robots.txt" });
  eleventyConfig.addPassthroughCopy({ "static/_redirects": "_redirects" });
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

  // Reviewed copies of the same image, including local and legacy Wix URLs.
  const imageAliases = new Map();
  for (const group of require("./scripts/image-duplicates.json")) {
    const canonical = sourceKey(group[0]);
    for (const source of group) imageAliases.set(sourceKey(source), canonical);
  }

  function mediaKey(src) {
    const key = sourceKey(src);
    return imageAliases.get(key) || key;
  }

  function sourceKey(src) {
    const value = String(src || "").trim();
    if (!value) return "";
    const wix = value.match(/\/media\/([a-z0-9]+_[a-f0-9]+)/i);
    if (wix) return `wix:${wix[1].toLowerCase()}`;
    try {
      const url = new URL(value, "https://local.invalid");
      return `${url.origin === "https://local.invalid" ? "" : url.origin}${decodeURIComponent(url.pathname).replace(/\/+$/, "")}`;
    } catch {
      return value.split("?")[0].toLowerCase();
    }
  }

  eleventyConfig.addFilter("styleAttr", (style) => (style ? ` style="${style}"` : ""));
  eleventyConfig.addFilter("mediaFrameStyle", mediaFrameStyle);
  eleventyConfig.addFilter("pageImageFrameStyle", pageImageFrameStyle);
  eleventyConfig.addFilter("cardImageStyle", cardImageStyle);

  eleventyConfig.addFilter("galleryItems", (entry) => {
    const items = [];
    const seen = new Set();
    const push = (src, alt, kind) => {
      const raw = String(src || "").trim();
      const key = mediaKey(raw);
      if (!key || seen.has(key)) return;
      seen.add(key);
      items.push({
        src: raw,
        alt: alt || entry?.title || "",
        kind: kind || "image",
      });
    };

    for (const section of entry?.sections || []) {
      if (!section) continue;
      if (section.type === "image" || section.type === "hero_image") {
        push(section.image, section.alt || section.caption || entry?.title, "image", mediaFrameStyle(section));
      } else if (section.type === "video" || section.type === "hero_video") {
        push(section.video_url, section.caption || entry?.title, "video", mediaFrameStyle(section));
      } else if (section.type === "image_gallery" && Array.isArray(section.images)) {
        for (const item of section.images) {
          push(item?.image, item?.alt || item?.caption || entry?.title, "image", mediaFrameStyle(item, section));
        }
      }
    }

    if (!items.length && entry?.cover_image) {
      push(entry.cover_image, entry.card_title || entry?.title, "image", mediaFrameStyle(entry));
    }

    return items;
  });

  eleventyConfig.addFilter("projectCardImages", (project) => {
    if (Array.isArray(project?.card_images) && project.card_images.length) {
      const seen = new Set();
      return project.card_images.filter((item) => {
        const key = mediaKey(item?.image);
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      }).slice(0, 2).map((item) => ({
        image: item.image,
        alt: item.alt || project.title || "",
        style: cardImageStyle(project, "card"),
      }));
    }
    const images = [];
    const seen = new Set();
    const push = (src, alt) => {
      const image = String(src || "").trim();
      const key = mediaKey(image);
      if (!key || seen.has(key)) return;
      seen.add(key);
      images.push({ image, alt: alt || project?.title || "", style: cardImageStyle(project, "card") });
    };

    for (const section of project?.sections || []) {
      if (section?.type === "image_gallery" && Array.isArray(section.images)) {
        for (const item of section.images) {
          push(item?.image, item?.alt || project?.title);
        }
      }
    }

    if (!images.length) {
      push(project?.cover_image, project?.card_title || project?.title);
    } else if (project?.cover_image) {
      // Prefer cover as the opening frame when it isn't already in the gallery.
      const cover = String(project.cover_image).trim();
      if (cover && !seen.has(mediaKey(cover))) {
        images.unshift({ image: cover, alt: project.card_title || project.title || "", style: cardImageStyle(project, "card") });
      }
    }

    return images.slice(0, 2);
  });

  const publicationImages = require("./scripts/publication-images.json");

  eleventyConfig.addFilter("publicationCardImages", (publication) => {
    const sources = Array.isArray(publication?.images)
      ? publication.images
      : publication?.image
        ? [publication.image]
        : [];
    const seen = new Set();
    return sources
      .map((item) => typeof item === "string" ? { image: item } : item)
      .filter((item) => {
        const image = String(item?.image || "").trim();
        const key = mediaKey(image);
        if (!key || seen.has(key)) return false;
        seen.add(key);
        item.image = image;
        return true;
      }).map((item) => {
        const optimized = publicationImages[item.image];
        return optimized ? { ...item, alt: optimized.alt || item.alt, original: optimized.source, image: `${optimized.thumbnail}-960.webp`, srcset: `${optimized.thumbnail}-480.webp 480w, ${optimized.thumbnail}-960.webp 960w`, style: cardImageStyle(publication, "publication") } : { ...item, style: cardImageStyle(publication, "publication") };
      });
  });

  eleventyConfig.addFilter("teachingCardImages", (teaching) => {
    const images = [];
    const seen = new Set();
    const push = (src, alt) => {
      const image = String(src || "").trim();
      const key = mediaKey(image);
      if (!key || seen.has(key)) return;
      seen.add(key);
      images.push({ image, alt: alt || teaching?.card_title || teaching?.title || "", style: cardImageStyle(teaching, "card") });
    };

    push(teaching?.cover_image);
    for (const section of teaching?.sections || []) {
      if (section?.type === "image" || section?.type === "hero_image") {
        push(section.image, section.alt || section.caption);
      } else if (section?.type === "image_gallery" && Array.isArray(section.images)) {
        for (const item of section.images) push(item?.image, item?.alt || item?.caption);
      }
    }
    return images;
  });

  eleventyConfig.addFilter("hrefPath", (permalink) => {
    const value = String(permalink || "");
    return value.startsWith("/") ? value.slice(1) : value;
  });

  eleventyConfig.addFilter("markdown", (value) => markdownRenderer.render(String(value || "")));

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

  eleventyConfig.addFilter("detailMedia", (sections) => {
    const media = (sections || []).filter((section) => MEDIA_TYPES.has(section?.type));
    const hasGallery = media.some((section) => section.type === "image_gallery");
    // Project entries often repeat the gallery's lead image as a separate image section.
    // Keep the gallery version so it appears once in the bento grid.
    return hasGallery ? media.filter((section) => section.type !== "image") : media;
  });

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
  eleventyConfig.addPassthroughCopy({ "static/js": "js" });

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
