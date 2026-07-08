const { execSync } = require("child_process");
const path = require("path");

const root = path.join(__dirname, "..");
execSync("npx @11ty/eleventy", { cwd: root, stdio: "inherit" });
