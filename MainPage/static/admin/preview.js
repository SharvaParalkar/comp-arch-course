/* Decap CMS visual previews — mirrors Eleventy section + project card layouts */
(function () {
  var h = window.h;
  var CMS = window.CMS;
  var createClass = window.createClass;

  function getData(entry) {
    return entry.get("data") ? entry.get("data").toJS() : {};
  }

  function getAsset(getAsset, path) {
    if (!path) return null;
    try {
      var asset = getAsset(path);
      return asset ? asset.toString() : path;
    } catch (e) {
      return path;
    }
  }

  function rich(html) {
    if (!html) return null;
    return h("div", {
      className: "txt-large w-richtext",
      dangerouslySetInnerHTML: { __html: html },
    });
  }

  function renderSection(section, getAssetFn) {
    if (!section || !section.type) return null;
    switch (section.type) {
      case "headline":
        return h("section", { className: "section" },
          h("div", { className: "h-x-large" }, section.text || "")
        );
      case "rich_text":
        return h("section", { className: "section" }, rich(section.body));
      case "two_column":
        return h("section", { className: "section" },
          section.heading ? h("h2", { className: "h-medium" }, section.heading) : null,
          h("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" } },
            rich(section.left),
            rich(section.right)
          )
        );
      case "hero_video":
        return h("section", { className: "section" },
          h("div", { className: "video-aspect-box" }, "Video: " + (section.video_url || "")),
          h("h1", { className: "display-h", style: { fontSize: "2rem" } }, section.title || "")
        );
      case "video":
        return h("section", { className: "full-media-section" },
          h("div", { className: "video-aspect-box" }, "Video: " + (section.video_url || "")),
          section.caption ? h("div", { className: "caption-div" }, section.caption) : null
        );
      case "image": {
        var src = getAsset(getAssetFn, section.image);
        return h("section", { className: "full-media-section" },
          src ? h("img", { className: "cms-preview__img", src: src, alt: section.alt || "" }) : null,
          section.caption ? h("div", { className: "caption-div" }, section.caption) : null
        );
      }
      case "image_gallery": {
        var images = section.images || [];
        return h("section", { className: "section" },
          h("div", { className: "image-gallery" },
            images.map(function (item, i) {
              var imgSrc = getAsset(getAssetFn, item.image);
              return h("figure", { key: i },
                imgSrc ? h("img", { className: "cms-preview__img", src: imgSrc, alt: item.alt || "" }) : null,
                item.caption ? h("figcaption", null, item.caption) : null
              );
            })
          )
        );
      }
      case "stat":
        return h("section", { className: "section" },
          h("div", { className: "h-x-small" }, section.label || ""),
          h("div", { className: "display-h", style: { fontSize: "2.5rem" } }, section.value || "")
        );
      default:
        return h("section", { className: "section" },
          h("pre", null, JSON.stringify(section, null, 2))
        );
    }
  }

  function renderSections(data, getAssetFn) {
    if (data.body_mode === "legacy") {
      return h("div", { dangerouslySetInnerHTML: { __html: data.main_html || "<p class='cms-preview__empty'>No legacy HTML yet.</p>" } });
    }
    var sections = data.sections || [];
    if (!sections.length) {
      return h("div", { className: "cms-preview__empty" }, "Add sections to see a live-style preview.");
    }
    return h("div", null, sections.map(function (section, i) {
      return h("div", { key: i }, renderSection(section, getAssetFn));
    }));
  }

  var PagePreview = createClass({
    render: function () {
      var data = getData(this.props.entry);
      return h("div", { className: "cms-preview" },
        h("div", { className: "cms-preview__meta" },
          h("span", null, data.title || "Untitled page"),
          data.permalink ? h("span", null, data.permalink) : null,
          data.show_projects_grid ? h("span", null, "Projects grid: on") : null
        ),
        renderSections(data, this.props.getAsset),
        data.show_projects_grid
          ? h("div", { className: "cms-preview__empty", style: { marginTop: "1.5rem" } },
              "Projects grid will render here on the live site from all entries in Projects."
            )
          : null
      );
    },
  });

  var ProjectPreview = createClass({
    render: function () {
      var data = getData(this.props.entry);
      var cover = getAsset(this.props.getAsset, data.cover_image);
      return h("div", { className: "cms-preview" },
        h("div", { className: "cms-preview__meta" },
          h("span", null, "Card preview (Projects grid)"),
          data.year ? h("span", null, data.year) : null,
          data.category ? h("span", null, data.category) : null
        ),
        h("div", { className: "projects-grid", style: { gridTemplateColumns: "minmax(0, 320px)" } },
          h("article", { className: "project-card" },
            h("div", { className: "project-card__media" },
              cover
                ? h("img", { className: "project-card__img", src: cover, alt: data.card_title || data.title || "" })
                : h("div", { className: "project-card__placeholder" }),
              (data.card_title || data.category)
                ? h("div", { className: "project-card__overlay" },
                    h("span", null, "| " + (data.card_title || data.title || "") + " | " + (data.category || "Research"))
                  )
                : null
            ),
            data.year ? h("div", { className: "project-card__year" }, data.year) : null,
            h("h3", { className: "project-card__title" }, data.title || "Untitled project"),
            data.summary ? h("p", { className: "project-card__summary" }, data.summary) : null
          )
        ),
        h("hr", { style: { margin: "2rem 0", border: 0, borderTop: "1px solid #ddd" } }),
        h("div", { className: "cms-preview__meta" }, h("span", null, "Detail page")),
        renderSections(data, this.props.getAsset)
      );
    },
  });

  var SettingsPreview = createClass({
    render: function () {
      var data = getData(this.props.entry);
      var nav = data.navigation || [];
      return h("div", { className: "cms-preview" },
        h("h1", null, data.site_name || "Site"),
        data.tagline ? h("p", null, data.tagline) : null,
        h("h2", { style: { fontSize: "1.1rem", marginTop: "1.5rem" } }, "Navigation"),
        h("ul", null, nav.map(function (item, i) {
          return h("li", { key: i }, (item.label || "") + " → " + (item.url || ""));
        })),
        data.copyright ? h("p", { style: { marginTop: "1.5rem", opacity: 0.7 } }, data.copyright) : null
      );
    },
  });

  CMS.registerPreviewStyle("preview.css");
  CMS.registerPreviewTemplate("pages", PagePreview);
  CMS.registerPreviewTemplate("projects", ProjectPreview);
  CMS.registerPreviewTemplate("site", SettingsPreview);
})();
