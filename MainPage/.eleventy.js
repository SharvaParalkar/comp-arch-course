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

  eleventyConfig.addFilter("markdown", (value) => value || "");

  eleventyConfig.addFilter("safeHtml", (value) => value || "");

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
