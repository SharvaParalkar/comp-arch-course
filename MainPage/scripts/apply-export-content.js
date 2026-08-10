/**
 * Copy unique stills from the Mostafa export into static/uploads/media
 * and rewrite MainPage YAML to match export structure (new theme).
 */
const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

const ROOT = path.join(__dirname, "..");
const EXPORT = path.join(
  ROOT,
  "..",
  "mostafa-akbari-export",
  "mostafa-akbari-export"
);
const MEDIA = path.join(ROOT, "static", "uploads", "media");

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function copyTo(relFrom, relTo) {
  const src = path.join(EXPORT, relFrom);
  const dest = path.join(MEDIA, relTo);
  if (!fs.existsSync(src)) {
    console.warn("MISSING export file:", relFrom);
    return null;
  }
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
  return `/uploads/media/${relTo.replace(/\\/g, "/")}`;
}

function dump(file, data) {
  fs.writeFileSync(
    file,
    yaml.dump(data, {
      lineWidth: 100,
      noRefs: true,
      quotingType: '"',
      forceQuotes: false,
    })
  );
}

function loadYaml(file) {
  return yaml.load(fs.readFileSync(file, "utf8"));
}

function insertAfterHeadline(sections, extra) {
  const list = Array.isArray(sections) ? [...sections] : [];
  const idx = list.findIndex((s) => s && s.type === "headline");
  const at = idx >= 0 ? idx + 1 : 0;
  list.splice(at, 0, ...extra);
  return list;
}

ensureDir(MEDIA);

const media = {
  homeHero: copyTo(
    path.join("home", "images", "4249cf_d87f050148924ad99b685328873771a3~mv2.jpg"),
    "home-hero.jpg"
  ),
  aboutPortrait: copyTo(
    path.join("about", "images", "Mostafa_Akbari_bw2-1_edited.jpg"),
    "about-portrait.jpg"
  ),
  teachingStructures: copyTo(
    path.join("teaching", "images", "WhatsApp Image 2023-12-03 at 13_edited.jpg"),
    "teaching-structures.jpg"
  ),
  teachingComputational: copyTo(
    path.join("teaching", "images", "linework_with_image3 copy.jpg"),
    "teaching-computational.jpg"
  ),
  teachingDigiblast: copyTo(
    path.join("teaching", "images", "DigiblastPreview.jpg"),
    "teaching-digiblast.jpg"
  ),
  teachingMaterial: copyTo(
    path.join("teaching", "images", "Untitled-3 copy.jpg"),
    "teaching-material-formation.jpg"
  ),
  teachingAirport: copyTo(
    path.join("teaching", "images", "Untitled-2 copy.jpg"),
    "teaching-airport-terminals.jpg"
  ),
  p02Picture2: copyTo(
    path.join("projects", "project_02_electrochemical-healing", "images", "Picture2.jpg"),
    "projects/electrochemical-picture2.jpg"
  ),
  p04Adfm: copyTo(
    path.join("projects", "project_04_shellular-materials", "images", "ADFM-3214_OFC-1-438x576.jpg"),
    "projects/shellular-materials-adfm.jpg"
  ),
  p04Zoom: copyTo(
    path.join(
      "projects",
      "project_04_shellular-materials",
      "images",
      "shellular_zoom_1_photoshop_edited.jpg"
    ),
    "projects/shellular-zoom.jpg"
  ),
  p07Psl: copyTo(
    path.join("projects", "project_07_terrene", "images", "PSL-Website-Images_Page_8.jpg"),
    "projects/terrene-psl.jpg"
  ),
  p08Teaser: copyTo(
    path.join("projects", "project_08_self-folding-origami", "images", "teaser.jpg"),
    "projects/self-folding-teaser.jpg"
  ),
  p10Saltatur: copyTo(
    path.join("projects", "project_10_saltature", "images", "saltatur_01_edited.jpg"),
    "projects/saltatur-01.jpg"
  ),
  p10Edited: copyTo(
    path.join("projects", "project_10_saltature", "images", "1-2_edited.jpg"),
    "projects/saltatur-1-2.jpg"
  ),
  p14R12: copyTo(
    path.join("projects", "project_14_hystrics", "images", "r12.jpg"),
    "projects/hystrics-r12.jpg"
  ),
  p16Craft: copyTo(
    path.join("projects", "project_16_craft", "images", "0.jpg"),
    "projects/craft-0.jpg"
  ),
  pubBio: copyTo(
    path.join("publication", "images", "bio-based-composite-spatial-shell_cover-scaled.jpg"),
    "publications/bio-based-composite-spatial-shell_cover-scaled.jpg"
  ),
  pubContinuous: copyTo(
    path.join("publication", "images", "Akbari_2022_16by9_2.jpg"),
    "publications/Akbari_2022_16by9_2.jpg"
  ),
  pubAfm: copyTo(
    path.join("publication", "images", "AKBARI_AFM.jpg"),
    "publications/AKBARI_AFM.jpg"
  ),
  pubFolding: copyTo(
    path.join("publication", "images", "Shellular_tuck_folding_2_ma.jpg"),
    "publications/Shellular_tuck_folding_2_ma.jpg"
  ),
  pubSaltatur: copyTo(
    path.join("publication", "images", "saltatur_02.jpg"),
    "publications/saltatur_02.jpg"
  ),
  pubScf: copyTo(
    path.join("publication", "images", "AKBARI_2020_SCF.jpg"),
    "publications/AKBARI_2020_SCF.jpg"
  ),
  pubAnticlastic: copyTo(
    path.join("publication", "images", "3.jpg"),
    "publications/3.jpg"
  ),
  pubPedestrian: copyTo(
    path.join("publication", "images", "pedestrian.jpg"),
    "publications/pedestrian.jpg"
  ),
};

// Teaching filenames may be URL-encoded on disk
if (!media.teachingStructures) {
  media.teachingStructures = copyTo(
    path.join("teaching", "images", "WhatsApp%20Image%202023-12-03%20at%2013_edited.jpg"),
    "teaching-structures.jpg"
  );
}
if (!media.teachingComputational) {
  media.teachingComputational = copyTo(
    path.join("teaching", "images", "linework_with_image3%20copy.jpg"),
    "teaching-computational.jpg"
  );
}
if (!media.teachingMaterial) {
  media.teachingMaterial = copyTo(
    path.join("teaching", "images", "Untitled-3%20copy.jpg"),
    "teaching-material-formation.jpg"
  );
}
if (!media.teachingAirport) {
  media.teachingAirport = copyTo(
    path.join("teaching", "images", "Untitled-2%20copy.jpg"),
    "teaching-airport-terminals.jpg"
  );
}

const GIF = {
  knitting:
    "https://static.wixstatic.com/media/4249cf_66e6eba4f8a54856b5cb78e7a7ecd0fa~mv2.gif",
  performance:
    "https://static.wixstatic.com/media/4249cf_f92aa4e261744785a0d8101c986d0036~mv2.gif",
  clay: "https://static.wixstatic.com/media/4249cf_64150f6691dd445da9f31cea72ad5fc2~mv2.gif",
};

dump(path.join(ROOT, "content", "site.yml"), {
  site_name: "Mostafa Akbari",
  tagline: "Computational Designer | Architect | Architectural Technologist",
  copyright: "© Mostafa Akbari. All rights reserved.",
  navigation: [
    { label: "About", url: "about.html" },
    { label: "Projects", url: "projects.html" },
    { label: "Publications", url: "publications.html" },
    { label: "Teaching", url: "teaching.html" },
  ],
  social_links: [{ label: "LinkedIn", url: "https://www.linkedin.com/in/mostafaakbari/" }],
  footer_links: [],
  default_seo: {
    description:
      "Mostafa is a distinguished computational designer and researcher with a distinctive academic background encompassing architectural design and computational structures. He is currently an Assistant Professor of Architecture with expertise in Computational Structures and Advanced Manufacturing at Texas A&M University.",
    og_image: media.homeHero,
  },
});

dump(path.join(ROOT, "content", "pages", "home.yml"), {
  title: "Mostafa Akbari",
  permalink: "/index.html",
  body_class: "body is-black",
  seo: {
    description:
      "Mostafa Akbari — computational designer and architectural technologist specializing in shellular funicular structures, digital fabrication, and computational design.",
    og_title: "Mostafa Akbari | Architectural Technologist",
    og_image: media.homeHero,
  },
  body_mode: "sections",
  sections: [
    {
      type: "hero_image",
      image: media.homeHero,
      alt: "Mostafa Akbari",
      title: "Mostafa Akbari",
      subtitle: "Architectural Technologist | Designer",
      cta_label: "Learn more",
      cta_url: "about.html",
    },
  ],
});

dump(path.join(ROOT, "content", "pages", "about.yml"), {
  title: "About",
  permalink: "/about.html",
  body_class: "body",
  seo: {
    description:
      "Mostafa is a distinguished computational designer and researcher, Assistant Professor of Architecture at Texas A&M University specializing in computational structures and advanced manufacturing.",
    og_title: "About | Mostafa Akbari",
    og_image: media.aboutPortrait,
  },
  body_mode: "sections",
  sections: [
    { type: "headline", text: "Mostafa Akbari" },
    {
      type: "image_text",
      image: media.aboutPortrait,
      alt: "Mostafa Akbari",
      image_position: "right",
      body: `<p>Mostafa is a distinguished computational designer and researcher with a distinctive academic background encompassing architectural design and computational structures. He is currently an Assistant Professor of Architecture with expertise in Computational Structures and Advanced Manufacturing at Texas A&amp;M University. His academic journey includes a Ph.D. in Computational Design and a Master degree in Advanced Architectural Design from Upenn, a Master's degree in Architecture from the University of Shahid Beheshti, and a Bachelor's degree in Architecture from the University of Tehran.</p>
<p>His scholarly interests gravitate toward the realm of structural form finding, particularly with an emphasis on using 3-dimensional Graphic Statics for the exploration of Shellular Funicular Structures. He has pioneered a technique, within the purview of 3D graphic statics, for the design of Shell-based cellular (Shellular) Funicular Structures. This methodological breakthrough has initiated a paradigm shift in the domains of Architecture, Structural Design, Material Design, and their interrelated fields. Beyond this, he has exhibited profound involvement and a multitude of years dedicated to research in Digital Fabrication, computational design, and human-computer interaction. His endeavors are geared towards unearthing the nascent prospects in contemporary architecture, allowing for a reevaluation of tectonics and material systems in the face of synergistic advancements in architecture, structural design, robotic fabrication, computation, and material science.</p>
<p>Mostafa's collaborative endeavors span across prestigious international establishments, including his role as a designer and researcher with Gensler. Moreover, he has garnered valuable experience in architectural design and construction as an independent architect.</p>
<p><a href="https://www.linkedin.com/in/mostafaakbari/" target="_blank" rel="noopener">LinkedIn</a></p>`,
    },
  ],
});

dump(path.join(ROOT, "content", "pages", "projects.yml"), {
  title: "Projects",
  permalink: "/projects.html",
  body_class: "body",
  seo: {
    description: "Research and design projects by Mostafa Akbari",
    og_title: "Projects | Mostafa Akbari",
  },
  body_mode: "sections",
  show_projects_grid: true,
  sections: [{ type: "headline", text: "Projects" }],
});

dump(path.join(ROOT, "content", "pages", "publications.yml"), {
  title: "Publications",
  permalink: "/publications.html",
  body_class: "body",
  seo: {
    description: "Selected publications by Mostafa Akbari",
    og_title: "Publications | Mostafa Akbari",
  },
  body_mode: "sections",
  show_publications_list: true,
  sections: [{ type: "headline", text: "Publications" }],
});

dump(path.join(ROOT, "content", "pages", "teaching.yml"), {
  title: "Teaching",
  permalink: "/teaching.html",
  body_class: "body",
  seo: {
    description: "Teaching — seminars, studios, and workshops",
    og_title: "Teaching | Mostafa Akbari",
  },
  body_mode: "sections",
  show_teaching_grid: true,
  sections: [{ type: "headline", text: "Teaching" }],
});

const teachingDir = path.join(ROOT, "content", "teaching");
ensureDir(teachingDir);

dump(path.join(teachingDir, "structures-seminar.yml"), {
  title: "Structures Seminar",
  permalink: "/teaching/structures-seminar.html",
  body_class: "body",
  cover_image: media.teachingStructures,
  card_title: "Structures",
  year: "2023",
  category: "Seminar",
  sort_order: 1,
  summary:
    "Study of static and hyperstatic systems and design of their elements, including flexural theory, graphic statics, and a weekly laboratory.",
  seo: { og_title: "Structures Seminar | Mostafa Akbari" },
  body_mode: "sections",
  sections: [
    { type: "headline", text: "Structures | Seminar" },
    { type: "rich_text", body: "<p><strong>2023</strong></p>" },
    {
      type: "image",
      image: media.teachingStructures,
      alt: "Structures seminar",
    },
    {
      type: "rich_text",
      body: `<p><em>Instructors: Richard Farley, Masoud Akbarzadeh, Mostafa Akbari (TA)</em></p>
<p>This seminar covers the study of static and hyperstatic systems and design of their elements. Flexural theory, elastic and plastic. Design for combined stresses; prestressing. The study of graphic statics and the design of trusses. The course comprises both lectures and a weekly laboratory in which various structural elements, systems, materials and technical principles are explored.</p>`,
    },
  ],
});

dump(path.join(teachingDir, "computational-design.yml"), {
  title: "Developing Computational Solutions for Design Problems",
  permalink: "/teaching/computational-design.html",
  body_class: "body",
  cover_image: media.teachingComputational,
  card_title: "Computational Design",
  year: "2023",
  category: "Seminar",
  sort_order: 2,
  summary:
    "Seminar on identifying, formulating, and resolving design problems in architecture and structural design using advanced computational techniques.",
  seo: { og_title: "Computational Design Seminar | Mostafa Akbari" },
  body_mode: "sections",
  sections: [
    {
      type: "headline",
      text: "Developing Computational Solutions for Design Problems | Seminar",
    },
    { type: "rich_text", body: "<p><strong>2023</strong></p>" },
    {
      type: "image",
      image: media.teachingComputational,
      alt: "Computational design seminar",
    },
    {
      type: "rich_text",
      body: `<p><em>Instructors: Mostafa Akbari, Yao Lu</em></p>
<p>This seminar aimed at students who seek to identify, investigate, formulate, and resolve design problems in Architecture and Structural Design using advanced computational techniques. This course goes through the critical knowledge and technical foundations that current computational design and Computational Structures are built upon.</p>`,
    },
  ],
});

dump(path.join(teachingDir, "digiblast-workshop.yml"), {
  title: "Digiblast",
  permalink: "/teaching/digiblast-workshop.html",
  body_class: "body",
  cover_image: media.teachingDigiblast,
  card_title: "Digiblast",
  year: "2018-2019",
  category: "Summer workshop",
  sort_order: 3,
  summary:
    "Intensive workshop introducing digital modeling, representation, and fabrication for incoming Master of Architecture students.",
  seo: { og_title: "Digiblast | Mostafa Akbari" },
  body_mode: "sections",
  sections: [
    { type: "headline", text: "Digiblast | Summer workshop" },
    { type: "rich_text", body: "<p><strong>2018–2019</strong></p>" },
    { type: "image", image: media.teachingDigiblast, alt: "Digiblast workshop" },
    {
      type: "rich_text",
      body: `<p><em>Instructors: Danielle Willems, Ezio Blasetti, Mostafa Akbari (TA)</em></p>
<p>Digiblast is an intensive workshop that outlines digital modeling, representation and fabrication for incoming Master of Architecture students. The workshop operates as an introduction to contemporary computational geometries and digital workflows.</p>
<p><a href="https://www.design.upenn.edu/architecture/graduate/post/digiblast-2020-online-galleries" target="_blank" rel="noopener">Penn Design gallery</a></p>`,
    },
  ],
});

dump(path.join(teachingDir, "material-formation.yml"), {
  title: "Material Formation",
  permalink: "/teaching/material-formation.html",
  body_class: "body",
  cover_image: media.teachingMaterial,
  card_title: "Material Formation",
  year: "2019",
  category: "Seminar",
  sort_order: 4,
  summary:
    "Introduces generative design principles so architects can synthesize multiple performance criteria within material and organizational systems.",
  seo: { og_title: "Material Formation | Mostafa Akbari" },
  body_mode: "sections",
  sections: [
    { type: "headline", text: "Material Formation | Seminar" },
    { type: "rich_text", body: "<p><strong>2019</strong></p>" },
    {
      type: "image",
      image: media.teachingMaterial,
      alt: "Material Formation seminar",
    },
    {
      type: "rich_text",
      body: `<p><em>Instructors: Robert Stuart Smith, Mostafa Akbari (TA), Mariana Righi (TA), Yi Dazhong (TA)</em></p>
<p>Material Formations introduces principles of generative design into the discipline of architecture, providing opportunities for architects to synthesize multiple performance criteria within design that leverage organizational principles in order to negotiate relations between material, structure, and form.</p>
<p><a href="https://www.aml-penn.com/listteaching/2019/8/18/multifarious-matter-les-halles-2030-rrkg3-3e49m-gyp35" target="_blank" rel="noopener">AML Penn</a></p>`,
    },
  ],
});

dump(path.join(teachingDir, "next-gen-airport-terminals.yml"), {
  title: "Next Generation Airport Terminals",
  permalink: "/teaching/next-gen-airport-terminals.html",
  body_class: "body",
  cover_image: media.teachingAirport,
  card_title: "Airport Terminals",
  year: "2019",
  category: "Studio",
  sort_order: 5,
  summary:
    "Structural design research studio on efficient typologies for infrastructural design and material computing.",
  seo: { og_title: "Next Generation Airport Terminals | Mostafa Akbari" },
  body_mode: "sections",
  sections: [
    { type: "headline", text: "Next Generation Airport Terminals | Studio" },
    { type: "rich_text", body: "<p><strong>2019</strong></p>" },
    {
      type: "image",
      image: media.teachingAirport,
      alt: "Next Generation Airport Terminals studio",
    },
    {
      type: "rich_text",
      body: `<p><em>Instructors: Masoud Akbarzadeh, Mostafa Akbari (TA)</em></p>
<p>The main research objectives of the studio can be summarized as formal structural explorations of the efficient structural typologies suitable for infrastructural design; material computing research, including tectonic studies on the design of structural forms using various materials and fabrication methods.</p>
<p><a href="https://psl.design.upenn.edu/structural-design-research-studio-spring-2019/" target="_blank" rel="noopener">PSL Penn</a></p>`,
    },
  ],
});

const projectPatches = {
  "bio-based-composite-spatial-shell-structures.yml": {
    extra: [{ type: "image", image: GIF.knitting, alt: "Bio-based composite spatial shell" }],
  },
  "electrochemical-healing-of-fractured-metals.yml": {
    extra: media.p02Picture2
      ? [{ type: "image", image: media.p02Picture2, alt: "Electrochemical healing" }]
      : [],
  },
  "shellular-funicular-materials.yml": {
    extra: [
      media.p04Adfm && { type: "image", image: media.p04Adfm, alt: "Shellular funicular materials" },
      media.p04Zoom && { type: "image", image: media.p04Zoom, alt: "Shellular zoom" },
    ].filter(Boolean),
  },
  "structurally-adaptable-shoes.yml": {
    summary:
      'Insights from foot podometry inform a shellular midsole: unit cells of different stiffness are placed where flexibility or rigidity is needed.',
  },
  "terrene-composite-structure-with-pneumatic-formwork.yml": {
    cover: media.p07Psl,
    extra: media.p07Psl
      ? [{ type: "image", image: media.p07Psl, alt: "Terrene pneumatic formwork" }]
      : [],
  },
  "self-folding-origami-structures.yml": {
    extra: media.p08Teaser
      ? [{ type: "image", image: media.p08Teaser, alt: "Self-folding origami structures" }]
      : [],
  },
  "shellular-fabrication-via-origami.yml": {
    extra: [
      media.p08Teaser && { type: "image", image: media.p08Teaser, alt: "Shellular fabrication via origami" },
      media.p10Saltatur && { type: "image", image: media.p10Saltatur, alt: "Origami fabrication study" },
    ].filter(Boolean),
  },
  "saltatur-the-dancer.yml": {
    extra: [
      media.p10Edited && { type: "image", image: media.p10Edited, alt: "Saltatur" },
      media.p10Saltatur && { type: "image", image: media.p10Saltatur, alt: "Saltatur node assembly" },
    ].filter(Boolean),
  },
  "performance-machine.yml": {
    extra: [{ type: "image", image: GIF.performance, alt: "Performance Machine" }],
  },
  "p2p-site-less-house.yml": {
    extra: media.p08Teaser
      ? [{ type: "image", image: media.p08Teaser, alt: "P2P Site-less House" }]
      : [],
  },
  "material-formation-agent-based-design-robotic-clay-printing.yml": {
    extra: [{ type: "image", image: GIF.clay, alt: "Robotic clay printing" }],
  },
  "hystrics-interactive-agents.yml": {
    cover: media.p14R12,
    extra: media.p14R12
      ? [{ type: "image", image: media.p14R12, alt: "Hystrics interactive agents" }]
      : [],
  },
  "random-symbiosis.yml": {
    cover: media.p16Craft,
    extra: media.p16Craft
      ? [{ type: "image", image: media.p16Craft, alt: "Random Symbiosis" }]
      : [],
  },
  "craft.yml": {
    cover: media.p16Craft,
    extra: media.p16Craft
      ? [{ type: "image", image: media.p16Craft, alt: "CRAFT / Flexible Forming" }]
      : [],
  },
};

const projDir = path.join(ROOT, "content", "projects");
for (const [file, patch] of Object.entries(projectPatches)) {
  const full = path.join(projDir, file);
  if (!fs.existsSync(full)) {
    console.warn("Missing project YAML:", file);
    continue;
  }
  const data = loadYaml(full);
  if (patch.cover) data.cover_image = patch.cover;
  if (patch.summary) data.summary = patch.summary;
  if (patch.extra && patch.extra.length) {
    data.sections = insertAfterHeadline(data.sections, patch.extra);
  }
  dump(full, data);
}

const pubMap = {
  "bio-based-composite-spatial-shell-structures.yml": media.pubBio,
  "continuous-approximation-of-shellular-funicular-structures.yml": media.pubContinuous,
  "strut-based-cellular-to-shellular-funicular-polyhedral-materials.yml": media.pubAfm,
  "from-design-to-the-fabrication-of-shellular-funicular-structures.yml": media.pubFolding,
  "saltatur-node-based-assembly-of-funicular-spatial-concrete.yml": media.pubSaltatur,
  "geometry-based-structural-form-finding-to-design-architected-cellular-solids.yml": media.pubScf,
  "from-polyhedral-to-anticlastic-funicular-spatial-structures.yml": media.pubAnticlastic,
  "optimization-of-qualitative-and-motional-aspects-of-marine-passenger-terminal-ba.yml":
    media.pubPedestrian,
};

const pubDir = path.join(ROOT, "content", "publications");
for (const [file, image] of Object.entries(pubMap)) {
  if (!image) continue;
  const full = path.join(pubDir, file);
  if (!fs.existsSync(full)) continue;
  const data = loadYaml(full);
  data.image = image;
  dump(full, data);
}

fs.writeFileSync(
  path.join(ROOT, "scripts", "export-media-map.json"),
  JSON.stringify(
    {
      note: "Local copies of export stills. Cloudinary public IDs usually append _xxxxxx — match by stripping that suffix.",
      media,
      gifs_left_on_wix: GIF,
      unmatched_cloudinary: "Run with CLOUDINARY_URL / API secret to resolve _(code) public IDs.",
    },
    null,
    2
  )
);

console.log("Applied export content. Media map:", Object.keys(media).length, "keys");
for (const [k, v] of Object.entries(media)) {
  console.log(`  ${k}: ${v || "NOT FOUND"}`);
}
