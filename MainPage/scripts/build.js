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
