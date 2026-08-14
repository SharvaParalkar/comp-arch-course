const fs = require("fs");
const path = require("path");
const https = require("https");

const ROOT = path.join(__dirname, "..");
const EXPORT = path.join(
  ROOT,
  "..",
  "mostafa-akbari-export",
  "mostafa-akbari-export",
  "projects"
);
const DEST = path.join(ROOT, "static", "uploads", "media", "projects", "covers");

const copies = [
  [
    path.join(
      EXPORT,
      "project_01_bio-based-shell",
      "images",
      "4249cf_66e6eba4f8a54856b5cb78e7a7ecd0fa~mv2.gif"
    ),
    "bio-based.gif",
  ],
  [
    path.join(EXPORT, "project_02_electrochemical-healing", "images", "1-scaled.jpg"),
    "electrochemical.jpg",
  ],
  [path.join(EXPORT, "project_03_soap-coating", "images", "Picture2.jpg"), "soap-coating.jpg"],
  [
    path.join(EXPORT, "project_04_shellular-materials", "images", "ADFM-3214_OFC-1-438x576.jpg"),
    "shellular-materials.jpg",
  ],
  [
    path.join(EXPORT, "project_05_structurally-adaptable-shoes", "images", "7.jpg"),
    "adaptable-shoes.jpg",
  ],
  [
    path.join(
      EXPORT,
      "project_06_shellular-funicular-structures",
      "images",
      "shellular_zoom_1_photoshop_edited.jpg"
    ),
    "shellular-structures.jpg",
  ],
  [path.join(EXPORT, "project_07_terrene", "images", "PSL-Website-Images_Page_8.jpg"), "terrene.jpg"],
  [path.join(EXPORT, "project_08_self-folding-origami", "images", "teaser.jpg"), "fabrication-origami.jpg"],
  [path.join(EXPORT, "project_10_saltature", "images", "saltatur_01_edited.jpg"), "saltature.jpg"],
  [
    path.join(EXPORT, "project_11_performance-machine", "images", "1-2_edited.jpg"),
    "performance-machine.jpg",
  ],
  [
    path.join(
      EXPORT,
      "project_12_p2p-siteless-house",
      "images",
      "4249cf_f92aa4e261744785a0d8101c986d0036~mv2.gif"
    ),
    "p2p.gif",
  ],
  [
    path.join(
      EXPORT,
      "project_13_robotic-clay-printing",
      "images",
      "4249cf_64150f6691dd445da9f31cea72ad5fc2~mv2.gif"
    ),
    "clay-printing.gif",
  ],
  [
    path.join(
      EXPORT,
      "project_14_hystrics",
      "images",
      "4249cf_ac2da7d2930f4797b507387a8b0584e3f000.jpg"
    ),
    "hystrics.jpg",
  ],
  [path.join(EXPORT, "project_15_random-symbiosis", "images", "r12.jpg"), "random-symbiosis.jpg"],
  [path.join(EXPORT, "project_16_craft", "images", "0.jpg"), "craft.jpg"],
];

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const out = fs.createWriteStream(dest);
    https
      .get(url, { headers: { "user-agent": "Mozilla/5.0" } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          out.close();
          fs.unlinkSync(dest);
          return download(res.headers.location, dest).then(resolve, reject);
        }
        if (res.statusCode !== 200) {
          out.close();
          fs.unlinkSync(dest);
          return reject(new Error(`${res.statusCode} ${url}`));
        }
        res.pipe(out);
        out.on("finish", () => out.close(resolve));
      })
      .on("error", (err) => {
        out.close();
        try {
          fs.unlinkSync(dest);
        } catch (_) {}
        reject(err);
      });
  });
}

async function main() {
  fs.mkdirSync(DEST, { recursive: true });
  for (const [src, dest] of copies) {
    fs.copyFileSync(src, path.join(DEST, dest));
    console.log("copied", dest, fs.statSync(src).size);
  }
  const linework = path.join(DEST, "self-folding.jpg");
  await download(
    "https://static.wixstatic.com/media/4249cf_0aba6caedcf74608ae4ea08b38b8fdbb~mv2.jpg/v1/fill/w_996,h_920,al_c,q_85,usm_0.66_1.00_0.01/linework_with_image3%20copy.jpg",
    linework
  );
  console.log("downloaded self-folding.jpg", fs.statSync(linework).size);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
