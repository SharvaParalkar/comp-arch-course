const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

const dir = path.join(__dirname, "..", "content", "projects");
const wix = (id) => `https://static.wixstatic.com/media/${id}`;

const map = {
  "bio-based-composite-spatial-shell-structures.yml": {
    cover: wix("4249cf_40645735d09c4c6180433e54f1a8fb33~mv2.jpg"),
    alt: "Bio-based composite spatial shell",
  },
  "electrochemical-healing-of-fractured-metals.yml": {
    cover: wix("4249cf_c324045d338f4ada983925f2a565f128~mv2.jpg"),
    alt: "Electrochemical healing of fractured metals",
  },
  "soap-coating-cellular-structures.yml": {
    cover: "/uploads/media/projects/soap-coating.jpg",
    alt: "Soap-coated cellular lattice with graphene oxide film",
  },
  "shellular-funicular-materials.yml": {
    cover: wix("4249cf_e3008694dd6e48adadbdc536affc801b~mv2.jpg"),
    alt: "Shellular funicular materials",
  },
  "structurally-adaptable-shoes.yml": {
    cover: wix("4249cf_d504a5273eae48dd81d8646bd96739d8~mv2.jpg"),
    alt: "Structurally adaptable shoes",
  },
  "shellular-funicular-structures.yml": {
    cover: wix("4249cf_9fb4e24c47b448fc9ff6d230e96448af~mv2.jpg"),
    alt: "Shellular funicular structures",
  },
  "terrene-composite-structure-with-pneumatic-formwork.yml": {
    cover: wix("4249cf_3485488bd35d4f38a6dcc3ecdd766101~mv2.jpg"),
    alt: "Terrene pneumatic formwork",
  },
  "self-folding-origami-structures.yml": {
    cover: wix("4249cf_2101c2818aa64bf0b155beb8a3d4fd9a~mv2.jpg"),
    alt: "Self-folding origami structures",
  },
  "shellular-fabrication-via-origami.yml": {
    cover: wix("4249cf_127570e869c9434cbb8ae006565caf8e~mv2.jpg"),
    alt: "Shellular fabrication via origami",
  },
  "saltatur-the-dancer.yml": {
    cover: wix("4249cf_2b59de764ea9433c89a4c5a5dda4d5c2~mv2.jpg"),
    alt: "Saltatur the Dancer",
  },
  "performance-machine.yml": {
    cover: wix("4249cf_3268f9028b7d4a9c941d0fa05e58b93b~mv2.jpg"),
    alt: "Performance Machine",
  },
  "p2p-site-less-house.yml": {
    cover: wix("4249cf_51544306340c48fab2ef6b077bf915d8~mv2.jpg"),
    alt: "P2P Site-less House",
  },
  "material-formation-agent-based-design-robotic-clay-printing.yml": {
    cover: wix("4249cf_c9b5e8efee4a4598bf913bdfb31a56ac~mv2.jpg"),
    alt: "Robotic clay printing",
  },
  "hystrics-interactive-agents.yml": {
    cover: wix("4249cf_2ffc72efcc16439c943d0d275776725b~mv2.jpg"),
    alt: "Hystrics interactive agents",
  },
  "random-symbiosis.yml": {
    cover: wix("4249cf_657c8d3377d54ce18be92cd9e4e00b3e~mv2.jpg"),
    alt: "Random Symbiosis",
  },
  "craft.yml": {
    cover: wix("4249cf_13b049c9b78d437fafb241f44769d574~mv2.jpg"),
    alt: "CRAFT",
  },
};

for (const [file, info] of Object.entries(map)) {
  const full = path.join(dir, file);
  const data = yaml.load(fs.readFileSync(full, "utf8"));
  data.cover_image = info.cover;
  let sections = Array.isArray(data.sections) ? data.sections : [];
  const bleed = /\/uploads\/media\/projects\/(craft-0|hystrics-r12|saltatur-01|saltatur-1-2|self-folding-teaser|terrene-psl|shellular-zoom|shellular-materials-adfm|electrochemical-picture2)\.jpg/i;
  sections = sections.filter((s) => {
    if (!s || (s.type !== "image" && s.type !== "image_gallery")) return true;
    return !bleed.test(String(s.image || ""));
  });
  const img = sections.find((s) => s && s.type === "image");
  if (img) {
    img.image = info.cover;
    img.alt = info.alt;
  } else {
    const i = sections.findIndex((s) => s && s.type === "headline");
    sections.splice(i >= 0 ? i + 1 : 0, 0, {
      type: "image",
      image: info.cover,
      alt: info.alt,
    });
  }
  data.sections = sections;
  fs.writeFileSync(
    full,
    yaml.dump(data, { lineWidth: 100, noRefs: true, quotingType: '"', forceQuotes: false })
  );
  console.log("updated", file);
}
