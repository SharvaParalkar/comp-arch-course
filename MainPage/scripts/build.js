const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const site = path.join(root, "site");

function cleanGeneratedOutput(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "admin" || entry.name === "uploads") continue;
      cleanGeneratedOutput(full);
      if (fs.existsSync(full) && fs.readdirSync(full).length === 0) {
        fs.rmdirSync(full);
      }
    } else if (entry.name.endsWith(".html")) {
      fs.unlinkSync(full);
    }
  }
}

const PAGES_MAX_BYTES = 25 * 1024 * 1024;

function walkFiles(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkFiles(full, acc);
    else acc.push(full);
  }
  return acc;
}

cleanGeneratedOutput(site);
execSync("npx @11ty/eleventy", { cwd: root, stdio: "inherit" });

// The visual editor's media chooser reads a generated index instead of
// requiring an authenticated directory listing.
function writeMediaIndex() {
  const uploads = path.join(root, "static", "uploads");
  const extensions = {
    image: new Set([".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif", ".svg"]),
    video: new Set([".mp4", ".webm", ".mov", ".m4v"]),
    pdf: new Set([".pdf"]),
  };
  const index = { generated: new Date().toISOString(), images: [], videos: [], pdfs: [] };
  if (fs.existsSync(uploads)) {
    for (const file of walkFiles(uploads)) {
      const ext = path.extname(file).toLowerCase();
      const relative = path.relative(uploads, file).split(path.sep).join("/");
      if (relative === ".gitkeep") continue;
      const entry = {
        path: "/uploads/" + relative,
        name: path.basename(file),
        folder: path.dirname(relative) === "." ? "" : path.dirname(relative),
        size: fs.statSync(file).size,
      };
      if (extensions.image.has(ext)) index.images.push(entry);
      else if (extensions.video.has(ext)) index.videos.push(entry);
      else if (extensions.pdf.has(ext)) index.pdfs.push(entry);
    }
  }
  for (const key of ["images", "videos", "pdfs"]) {
    index[key].sort((a, b) => a.path.localeCompare(b.path));
  }
  const adminDir = path.join(site, "admin");
  fs.mkdirSync(adminDir, { recursive: true });
  fs.writeFileSync(path.join(adminDir, "media-index.json"), JSON.stringify(index, null, 2));
}

writeMediaIndex();

// Keep Cloudflare Pages under the 25 MiB asset limit. Oversized media must be CDN URLs in content.
const OVERSIZED_ALLOWLIST_REMOVE = [
  path.join(site, "uploads", "media", "home-hero-ultra.mp4"),
];
for (const file of OVERSIZED_ALLOWLIST_REMOVE) {
  if (fs.existsSync(file)) {
    fs.unlinkSync(file);
    console.warn(`Removed oversized deploy asset: ${path.relative(site, file)}`);
  }
}

const oversized = walkFiles(site).filter((file) => fs.statSync(file).size > PAGES_MAX_BYTES);
if (oversized.length) {
  const list = oversized
    .map((file) => {
      const mb = (fs.statSync(file).size / (1024 * 1024)).toFixed(1);
      return `  ${path.relative(site, file)} (${mb} MiB)`;
    })
    .join("\n");
  throw new Error(
    `Cloudflare Pages rejects files over 25 MiB:\n${list}\nHost them on Cloudinary (or another CDN) and link the URL instead.`
  );
}
