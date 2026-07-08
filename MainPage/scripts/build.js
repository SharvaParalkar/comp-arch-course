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

cleanGeneratedOutput(site);
execSync("npx @11ty/eleventy", { cwd: root, stdio: "inherit" });
