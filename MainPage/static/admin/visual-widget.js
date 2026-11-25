/*
 * Decap CMS custom widget: "visual_page".
 *
 * The widget owns the authenticated CMS session. It opens the GrapeJS editor
 * in an iframe, hands it the current sections array, and writes the edited
 * array back through Decap's normal onChange path. GitHub auth, drafts, save,
 * and publish all stay inside Decap.
 */
(function () {
  "use strict";

  var h = window.h;
  var CMS = window.CMS;
  var createClass = window.createClass;

  if (!h || !CMS || !createClass) {
    console.warn("Visual editor widget could not load: Decap globals are missing.");
    return;
  }

  var CHANNEL = "cms-visual";
  var LABELS = {
    home_masthead: "Home hero",
    headline: "Headline",
    two_column: "Two columns",
    hero_video: "Video hero",
    hero_image: "Image hero",
    video: "Video",
    image: "Image",
    image_text: "Image + text",
    image_gallery: "Gallery",
    stat: "Statistic",
    rich_text: "Rich text",
    pdf: "PDF",
  };

  function toPlain(value) {
    if (value == null) return value;
    if (value.toJS) return value.toJS();
    if (typeof value === "object") {
      try {
        return JSON.parse(JSON.stringify(value));
      } catch (error) {
        return {};
      }
    }
    return value;
  }

  function toArray(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (value.toJS) {
      var plain = value.toJS();
      return Array.isArray(plain) ? plain : [];
    }
    if (typeof value === "object") return Object.keys(value).map(function (key) { return value[key]; });
    return [];
  }

  function visualObject(value) {
    var plain = toPlain(value);
    return plain && typeof plain === "object" && !Array.isArray(plain) ? plain : {};
  }

  function pick(visual, data, key, fallback) {
    if (visual && Object.prototype.hasOwnProperty.call(visual, key)) return visual[key];
    if (data && Object.prototype.hasOwnProperty.call(data, key)) return data[key];
    return fallback;
  }

  function contextFor(props) {
    var collection = collectionName(props);
    if (collection === "projects") return "project";
    if (collection === "teaching") return "teaching";
    if (collection === "publications") return "publication";
    return "page";
  }

  function pageDataFrom(props) {
    var data = entryData(props);
    var visual = visualObject(props.value);
    var context = contextFor(props);
    var base = {
      body_class: pick(visual, data, "body_class", "body"),
    };

    if (context === "project" || context === "teaching") {
      return Object.assign(base, {
        cover_image: pick(visual, data, "cover_image", ""),
        card_images: Array.isArray(pick(visual, data, "card_images", [])) ? pick(visual, data, "card_images", []) : [],
        card_title: pick(visual, data, "card_title", ""),
        category: pick(visual, data, "category", ""),
        instructors: pick(visual, data, "instructors", ""),
        summary: pick(visual, data, "summary", ""),
        quick_content: pick(visual, data, "quick_content", ""),
        card_image_scale: Number(pick(visual, data, "card_image_scale", 100)) || 100,
        card_image_position: pick(visual, data, "card_image_position", "center"),
      });
    }

    if (context === "publication") {
      return {
        authors: pick(visual, data, "authors", ""),
        venue: pick(visual, data, "venue", ""),
        image: pick(visual, data, "image", ""),
        pdf_url: pick(visual, data, "pdf_url", ""),
        bibtex_url: pick(visual, data, "bibtex_url", ""),
        article_url: pick(visual, data, "article_url", ""),
        bibtex: pick(visual, data, "bibtex", ""),
        image_scale: Number(pick(visual, data, "image_scale", 100)) || 100,
        image_position: pick(visual, data, "image_position", "center"),
      };
    }

    return Object.assign(base, {
      page_heading: pick(visual, data, "page_heading", ""),
      page_content: pick(visual, data, "page_content", ""),
      page_image: pick(visual, data, "page_image", ""),
      page_image_alt: pick(visual, data, "page_image_alt", ""),
      page_image_position: pick(visual, data, "page_image_position", "right"),
      page_image_width: Number(pick(visual, data, "page_image_width", 100)) || 100,
      page_image_align: pick(visual, data, "page_image_align", "center"),
      page_image_radius: pick(visual, data, "page_image_radius", ""),
      show_projects_grid: !!pick(visual, data, "show_projects_grid", false),
      show_publications_list: !!pick(visual, data, "show_publications_list", false),
      show_teaching_grid: !!pick(visual, data, "show_teaching_grid", false),
      show_team_grid: !!pick(visual, data, "show_team_grid", false),
      show_contact_form: !!pick(visual, data, "show_contact_form", false),
    });
  }

  function sectionsFrom(props) {
    var visual = visualObject(props.value);
    if (Array.isArray(visual.sections)) return visual.sections;
    var data = entryData(props);
    return Array.isArray(data.sections) ? data.sections : [];
  }

  function buildValue(page, sections) {
    var value = { version: 1 };
    Object.keys(page || {}).forEach(function (key) {
      if (key !== "version" && key !== "sections") value[key] = page[key];
    });
    value.sections = Array.isArray(sections) ? sections : [];
    return value;
  }

  function sectionArray(value) {
    return toArray(value).filter(function (section) {
      return section && typeof section === "object" && typeof section.type === "string";
    });
  }

  function labelFor(type) {
    return LABELS[type] || type;
  }

  function entryData(props) {
    var entry = null;
    try {
      entry = props.getEntry ? props.getEntry() : props.entry;
    } catch (error) {
      entry = props.entry;
    }
    if (!entry) return {};
    if (entry.get) {
      var data = entry.get("data");
      if (data && data.toJS) return data.toJS();
      if (data && typeof data === "object") {
        try {
          return JSON.parse(JSON.stringify(data));
        } catch (error) {
          return {};
        }
      }
      return {};
    }
    return entry.data || {};
  }

  function entrySlug(props) {
    try {
      var entry = props.getEntry ? props.getEntry() : props.entry;
      if (entry && entry.get) return entry.get("slug");
    } catch (error) {
      /* ignore */
    }
    return "";
  }

  function collectionName(props) {
    try {
      var collection = props.collection;
      if (collection && collection.get) return collection.get("name");
    } catch (error) {
      /* ignore */
    }
    return "";
  }

  function pageUrl(props, data) {
    var permalink = String(data.permalink || "").trim();
    if (permalink) return permalink.charAt(0) === "/" ? permalink : "/" + permalink;
    var collection = collectionName(props);
    var slug = entrySlug(props) || data.slug || "";
    if (collection === "projects" && slug) return "/projects/" + slug + ".html";
    if (collection === "teaching" && slug) return "/teaching/" + slug + ".html";
    if (collection === "publications") return "/publications.html";
    return "/index.html";
  }

  function sectionSummary(sections) {
    if (!sections.length) return "No sections yet";
    var counts = {};
    sections.forEach(function (section) {
      var label = labelFor(section.type);
      counts[label] = (counts[label] || 0) + 1;
    });
    return Object.keys(counts)
      .map(function (label) {
        return counts[label] > 1 ? label + " ×" + counts[label] : label;
      })
      .join(" · ");
  }

  var VisualPreview = createClass({
    render: function () {
      var sections = sectionsFrom(this.props);
      return h(
        "div",
        { className: "cms-visual-widget cms-visual-widget--preview" },
        h(
          "div",
          { className: "cms-visual-widget__head" },
          h("span", { className: "cms-visual-widget__mark", "aria-hidden": true }, "◈"),
          h(
            "div",
            null,
            h("strong", null, "Page body"),
            h("p", null, (pageDataFrom(this.props).page_heading || "Untitled page") + " · " + sections.length + (sections.length === 1 ? " section" : " sections") + " · " + sectionSummary(sections))
          )
        )
      );
    },
  });

  var VisualControl = createClass({
    getInitialState: function () {
      return {
        open: false,
        applied: false,
        frameReady: false,
        error: "",
      };
    },

    componentDidMount: function () {
      this._onMessage = this.onMessage.bind(this);
      window.addEventListener("message", this._onMessage);
    },

    componentWillUnmount: function () {
      window.removeEventListener("message", this._onMessage);
    },

    onMessage: function (event) {
      var data = event.data;
      if (!data || data.channel !== CHANNEL) return;
      var frame = this.frame;
      if (!frame || !frame.contentWindow || event.source !== frame.contentWindow) return;

      if (data.type === "ready") {
        this.sendInit();
      } else if (data.type === "apply") {
        var sections = Array.isArray(data.sections) ? data.sections : [];
        var page = data.page && typeof data.page === "object" ? data.page : pageDataFrom(this.props);
        try {
          this.props.onChange(buildValue(page, sections));
          this.setState({ applied: true, error: "" });
        } catch (error) {
          this.setState({ error: "Could not apply changes: " + error.message });
        }
      } else if (data.type === "close") {
        this.close();
      }
    },

    payload: function () {
      var data = entryData(this.props);
      var copy = {};
      Object.keys(data).forEach(function (key) {
        if (key !== "sections" && key !== "visual_page") copy[key] = data[key];
      });
      return {
        page: {
          title: data.title || "Untitled page",
          url: pageUrl(this.props, data),
          collection: collectionName(this.props),
          context: contextFor(this.props),
        },
        entry: copy,
        pageData: pageDataFrom(this.props),
        sections: sectionsFrom(this.props),
      };
    },

    sendInit: function () {
      if (!this.frame || !this.frame.contentWindow) return;
      try {
        this.frame.contentWindow.postMessage(
          { channel: CHANNEL, type: "init", payload: this.payload() },
          window.location.origin
        );
      } catch (error) {
        this.setState({ error: "Could not open the editor: " + error.message });
      }
    },

    open: function () {
      this.setState({ open: true, frameReady: false, error: "" });
    },

    close: function () {
      this.setState({ open: false, frameReady: false });
    },

    onFrameLoad: function () {
      this.setState({ frameReady: true });
      // The editor announces itself with a ready message; this is a fallback
      // for browsers that load the iframe before the message listener exists.
      var self = this;
      setTimeout(function () {
        if (self.state.open) self.sendInit();
      }, 1200);
    },

    applyJson: function () {
      var value = this.jsonRef ? this.jsonRef.value : "";
      try {
        var parsed = JSON.parse(value);
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
          throw new Error("The JSON must be an object with page fields and a sections list.");
        }
        var sections = Array.isArray(parsed.sections) ? parsed.sections : [];
        this.props.onChange(buildValue(parsed, sections));
        this.setState({ applied: true, error: "" });
      } catch (error) {
        this.setState({ error: "That JSON is not valid: " + error.message });
      }
    },

    renderCard: function () {
      var sections = sectionsFrom(this.props);
      var self = this;
      return h(
        "div",
        { className: "cms-visual-widget" },
        h(
          "div",
          { className: "cms-visual-widget__head" },
          h("span", { className: "cms-visual-widget__mark", "aria-hidden": true }, "◈"),
          h(
            "div",
            { className: "cms-visual-widget__copy" },
            h("strong", null, "Visual editor"),
            h(
              "p",
              null,
              "Drag, drop, and edit this entry like a design tool. Existing content and styling are preserved."
            )
          )
        ),
        h(
          "div",
          { className: "cms-visual-widget__summary" },
          h("span", { className: "cms-visual-widget__count" }, sections.length + (sections.length === 1 ? " section" : " sections")),
          h("span", { className: "cms-visual-widget__types" }, sectionSummary(sections))
        ),
        h(
          "div",
          { className: "cms-visual-widget__actions" },
          h(
            "button",
            { type: "button", className: "cms-visual-widget__open", onClick: this.open },
            "Open visual editor"
          ),
          h(
            "span",
            { className: "cms-visual-widget__hint" },
            "Locked to your GitHub sign-in. Apply here, then Publish."
          )
        ),
        this.state.applied
          ? h(
              "p",
              { className: "cms-visual-widget__ok" },
              "Changes applied to the form. Click Publish (top right) to make them live."
            )
          : null,
        this.state.error ? h("p", { className: "cms-visual-widget__error" }, this.state.error) : null,
        h(
          "details",
          { className: "cms-visual-widget__advanced" },
          h("summary", null, "Advanced: edit the page data as JSON"),
          h(
            "p",
            null,
            "Use this only if the visual editor cannot open. It edits the same page fields and sections."
          ),
          h("textarea", {
            ref: function (node) {
              self.jsonRef = node;
            },
            defaultValue: JSON.stringify(buildValue(pageDataFrom(this.props), sections), null, 2),
            spellCheck: false,
          }),
          h(
            "button",
            { type: "button", className: "cms-visual-widget__secondary", onClick: this.applyJson },
            "Apply JSON"
          )
        )
      );
    },

    render: function () {
      var self = this;
      var sections = sectionsFrom(this.props);
      return h(
        "div",
        { className: "cms-visual-widget-host" },
        this.renderCard(),
        this.state.open
          ? h(
              "div",
              { className: "cms-visual-overlay", role: "dialog", "aria-modal": "true", "aria-label": "Visual editor" },
              h("iframe", {
                ref: function (node) {
                  self.frame = node;
                },
                className: "cms-visual-frame",
                src: "/admin/visual/index.html",
                title: "Visual editor for this page",
                onLoad: this.onFrameLoad,
                allow: "clipboard-read; clipboard-write",
              }),
              !this.state.frameReady
                ? h(
                    "div",
                    { className: "cms-visual-boot" },
                    h("span", { className: "cms-visual-boot__spinner", "aria-hidden": "true" }),
                    h("p", null, "Opening the visual editor…")
                  )
                : null
            )
          : null
      );
    },
  });

  CMS.registerWidget("visual_page", VisualControl, VisualPreview);
  // Kept as an alias so older configurations keep working.
  CMS.registerWidget("visual_sections", VisualControl, VisualPreview);
})();
