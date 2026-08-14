const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

const dir = path.join(__dirname, "..", "content", "projects");

const map = {
  "bio-based-composite-spatial-shell-structures.yml": {
    cover: "/uploads/media/projects/covers/bio-based.gif",
    alt: "Bio-based composite spatial shell",
  },
  "electrochemical-healing-of-fractured-metals.yml": {
    cover: "/uploads/media/projects/covers/electrochemical.jpg",
    alt: "Electrochemical healing of fractured metals",
  },
  "soap-coating-cellular-structures.yml": {
    cover: "/uploads/media/projects/covers/soap-coating.jpg",
    alt: "Soap-coated cellular lattice with graphene oxide film",
  },
  "shellular-funicular-materials.yml": {
    cover: "/uploads/media/projects/covers/shellular-materials.jpg",
    alt: "Shellular funicular materials",
  },
  "structurally-adaptable-shoes.yml": {
    cover: "/uploads/media/projects/covers/adaptable-shoes.jpg",
    alt: "Structurally adaptable shoes",
  },
  "shellular-funicular-structures.yml": {
    cover: "/uploads/media/projects/covers/shellular-structures.jpg",
    alt: "Shellular funicular structures",
  },
  "terrene-composite-structure-with-pneumatic-formwork.yml": {
    cover: "/uploads/media/projects/covers/terrene.jpg",
    alt: "Terrene pneumatic formwork",
  },
  "self-folding-origami-structures.yml": {
    cover: "/uploads/media/projects/covers/self-folding.jpg",
    alt: "Self-folding origami structures",
  },
  "shellular-fabrication-via-origami.yml": {
    cover: "/uploads/media/projects/covers/fabrication-origami.jpg",
    alt: "Shellular fabrication via origami",
  },
  "saltatur-the-dancer.yml": {
    cover: "/uploads/media/projects/covers/saltature.jpg",
    alt: "Saltatur the Dancer",
  },
  "performance-machine.yml": {
    cover: "/uploads/media/projects/covers/performance-machine.jpg",
    alt: "Performance Machine",
  },
  "p2p-site-less-house.yml": {
    cover: "/uploads/media/projects/covers/p2p.gif",
    alt: "P2P Site-less House",
  },
  "material-formation-agent-based-design-robotic-clay-printing.yml": {
    cover: "/uploads/media/projects/covers/clay-printing.gif",
    alt: "Robotic clay printing",
  },
  "hystrics-interactive-agents.yml": {
    cover: "/uploads/media/projects/covers/hystrics.jpg",
    alt: "Hystrics interactive agents",
  },
  "random-symbiosis.yml": {
    cover: "/uploads/media/projects/covers/random-symbiosis.jpg",
    alt: "Random Symbiosis",
  },
  "craft.yml": {
    cover: "/uploads/media/projects/covers/craft.jpg",
    alt: "CRAFT",
  },
};

for (const [file, info] of Object.entries(map)) {
  const full = path.join(dir, file);
  const data = yaml.load(fs.readFileSync(full, "utf8"));
  data.cover_image = info.cover;
  fs.writeFileSync(
    full,
    yaml.dump(data, { lineWidth: 100, noRefs: true, quotingType: '"', forceQuotes: false })
  );
  console.log("updated", file);
}
