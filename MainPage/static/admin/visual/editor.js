/*
 * GrapeJS-powered visual editor for the site's structured page sections.
 *
 * The editor is intentionally embed-only: the Decap CMS widget opens it in an
 * iframe and owns GitHub authentication, saving, and publishing. The editor
 * sends a structured `sections` array back with postMessage and never writes
 * to the repository itself.
 */
(function () {
  "use strict";

  var CHANNEL = "cms-visual";
  var R = window.VCMSRenderer;
  var $ = function (selector) {
    return document.querySelector(selector);
  };

  var state = {
    editor: null,
    main: null,
    payload: null,
    entry: {},
    page: {},
    pageData: {},
    initialSections: [],
    selected: null,
    pageComponent: null,
    rightTab: "page",
    dirty: false,
    booting: true,
    replacing: false,
    ready: false,
    parentOrigin: null,
    pending: new Map(),
    outlineTimer: null,
    toastTimer: null,
    helpSeen: false,
    assets: null,
  };

  /* --------------------------------------------------------------- helpers */

  function clone(value) {
    if (value == null) return value;
    return JSON.parse(JSON.stringify(value));
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }

  function attrSelector(path) {
    return '[data-cms-field="' + String(path).replace(/"/g, '\\"') + '"]';
  }

  function setPath(object, path, value) {
    var parts = String(path).split(".");
    var cursor = object;
    for (var i = 0; i < parts.length - 1; i += 1) {
      var key = parts[i];
      var nextIsIndex = /^\d+$/.test(parts[i + 1]);
      if (nextIsIndex) {
        if (!Array.isArray(cursor[key])) cursor[key] = [];
      } else if (!cursor[key] || typeof cursor[key] !== "object") {
        cursor[key] = {};
      }
      cursor = cursor[key];
    }
    cursor[parts[parts.length - 1]] = value;
  }

  function getPath(object, path) {
    var parts = String(path).split(".");
    var cursor = object;
    for (var i = 0; i < parts.length; i += 1) {
      if (cursor == null) return undefined;
      cursor = cursor[parts[i]];
    }
    return cursor;
  }

  function debounce(fn, wait) {
    var timer = null;
    return function () {
      var args = arguments;
      clearTimeout(timer);
      timer = setTimeout(function () {
        fn.apply(null, args);
      }, wait);
    };
  }

  function post(type, data) {
    if (window.parent === window) return;
    var message = Object.assign({ channel: CHANNEL, type: type }, data || {});
    try {
      window.parent.postMessage(message, state.parentOrigin || "*");
    } catch (error) {
      window.parent.postMessage(message, "*");
    }
  }

  function toast(message, isError) {
    var el = $("#ve-toast");
    if (!el) return;
    el.textContent = message;
    el.classList.toggle("is-error", !!isError);
    el.classList.add("is-visible");
    clearTimeout(state.toastTimer);
    state.toastTimer = setTimeout(function () {
      el.classList.remove("is-visible");
    }, isError ? 5200 : 3600);
  }

  function setStatus(text, dirty) {
    var status = $("#ve-status-text");
    var dot = $("#ve-dirty-dot");
    if (status) status.textContent = text;
    if (dot) dot.classList.toggle("is-dirty", !!dirty);
  }

  function markDirty() {
    if (state.booting) return;
    state.dirty = true;
    setStatus("Unsaved changes — click Apply changes", true);
  }

  function clearDirty(message) {
    state.dirty = false;
    setStatus(message || "All changes saved to the CMS form", false);
  }

  /* -------------------------------------------------------------- messaging */

  function showLock(message) {
    $("#ve-loading").hidden = true;
    $("#ve-app").hidden = true;
    var lock = $("#ve-lock");
    if (!lock) return;
    if (message) {
      var paragraph = lock.querySelector("h1");
      if (paragraph) paragraph.textContent = message;
    }
    lock.hidden = false;
  }

  window.addEventListener("message", function (event) {
    var data = event.data;
    if (!data || data.channel !== CHANNEL) return;
    if (window.parent !== window && event.source !== window.parent) return;
    if (event.origin && event.origin !== "null" && event.origin !== window.location.origin) return;
    if (data.type === "init" && !state.ready) {
      state.parentOrigin = event.origin && event.origin !== "null" ? event.origin : null;
      init(data.payload || {});
    }
  });

  if (window.parent === window) {
    showLock();
    return;
  }

  post("ready");

  // If the CMS never answers, explain how to open the editor properly.
  setTimeout(function () {
    if (!state.ready) {
      $("#ve-loading-text").textContent = "Waiting for the Content Manager…";
      showLock("Open the visual editor from the Content Manager");
    }
  }, 12000);

  /* -------------------------------------------------------------- init */

  function normalizePageData(input, entry) {
    var data = input && typeof input === "object" ? input : {};
    var legacy = entry || {};
    var pick = function (key, fallback) {
      if (Object.prototype.hasOwnProperty.call(data, key)) return data[key];
      if (legacy && Object.prototype.hasOwnProperty.call(legacy, key)) return legacy[key];
      return fallback;
    };
    return {
      page_heading: String(pick("page_heading", "") || ""),
      page_content: String(pick("page_content", "") || ""),
      page_image: String(pick("page_image", "") || ""),
      page_image_alt: String(pick("page_image_alt", "") || ""),
      page_image_position: pick("page_image_position", "right") === "left" ? "left" : "right",
      body_class: String(pick("body_class", "body") || "body"),
      show_projects_grid: !!pick("show_projects_grid", false),
      show_publications_list: !!pick("show_publications_list", false),
      show_teaching_grid: !!pick("show_teaching_grid", false),
      show_team_grid: !!pick("show_team_grid", false),
      show_contact_form: !!pick("show_contact_form", false),
    };
  }

  function normalizeSections(input) {
    if (!Array.isArray(input)) return [];
    return input
      .filter(function (section) {
        return section && typeof section === "object" && typeof section.type === "string";
      })
      .map(function (section) {
        var copy = clone(section);
        if (copy.type === "image_gallery" && !Array.isArray(copy.images)) copy.images = [];
        return copy;
      });
  }

  function init(payload) {
    if (state.ready) return;
    state.payload = payload;
    state.entry = payload.entry && typeof payload.entry === "object" ? payload.entry : {};
    state.page = payload.page && typeof payload.page === "object" ? payload.page : {};
    state.pageData = normalizePageData(payload.pageData, state.entry);
    state.initialSections = normalizeSections(payload.sections);
    state.helpSeen = localStorage.getItem("calab-visual-help-seen-v1") === "1";
    $("#ve-lock").hidden = true;

    var pageTitle = state.page.title || state.entry.title || "Untitled page";
    $("#ve-page-title").textContent = pageTitle;
    $("#ve-page-url").textContent = state.page.url || state.entry.permalink || "/";
    var liveLink = $("#ve-live-link");
    if (liveLink) liveLink.href = state.page.url || state.entry.permalink || "/";
    document.title = pageTitle + " · Visual editor";

    collectAssets(state.page.url)
      .then(function (assets) {
        state.assets = assets;
        createEditor(assets);
      })
      .catch(function (error) {
        console.error(error);
        showLock("The visual editor could not start");
        toast("The editor could not load: " + error.message, true);
      });
  }

  function absoluteUrl(value) {
    try {
      return new URL(value, window.location.origin).href;
    } catch (error) {
      return value;
    }
  }

  function unique(list) {
    var seen = {};
    return list.filter(function (item) {
      if (!item || seen[item]) return false;
      seen[item] = true;
      return true;
    });
  }

  function collectAssets(pageUrl) {
    var fallbackStyles = [
      "https://cdn.prod.website-files.com/690e0b6e2e2a0cbc45ab116e/css/oxman25.webflow.shared.810108e95.css",
      "/css/site.css",
    ];
    var result = {
      styles: [],
      scripts: [],
      inlineStyles: "",
      bodyClass: state.entry.body_class || "body",
    };

    var target = pageUrl ? absoluteUrl(pageUrl) : "";
    var request = target
      ? fetch(target, { cache: "no-store" })
          .then(function (response) {
            if (!response.ok) throw new Error("Page not built yet");
            return response.text();
          })
          .then(function (html) {
            var doc = new DOMParser().parseFromString(html, "text/html");
            doc.querySelectorAll('link[rel="stylesheet"][href]').forEach(function (link) {
              result.styles.push(absoluteUrl(link.getAttribute("href")));
            });
            if (doc.body && doc.body.className) result.bodyClass = doc.body.className;
            doc.querySelectorAll("style").forEach(function (style) {
              if (style.textContent) result.inlineStyles += style.textContent + "\n";
            });
            doc.querySelectorAll("script[src]").forEach(function (script) {
              var src = script.getAttribute("src") || "";
              if (/use\.typekit\.net/i.test(src)) result.scripts.push(absoluteUrl(src));
            });
          })
          .catch(function () {
            /* A brand-new page has no built HTML yet; use the site defaults. */
          })
      : Promise.resolve();

    return request.then(function () {
      result.styles = unique(result.styles.concat(fallbackStyles, ["/admin/visual/canvas.css"]).map(absoluteUrl));
      result.scripts = unique(result.scripts);
      return result;
    });
  }

  /* -------------------------------------------------------------- editor */

  function buildBlocks() {
    return R.blocks.map(function (block) {
      return {
        id: "cms-block-" + block.type,
        label: block.label,
        category: block.category,
        media:
          '<span class="ve-block-glyph" aria-hidden="true" style="font-size:13px;font-weight:700;line-height:1">' +
          escapeHtml(block.icon) +
          "</span>",
        attributes: {
          "data-description": block.description,
          title: block.description,
        },
        content: function () {
          var section = R.defaults(block.type);
          return renderGlassSection(section);
        },
      };
    });
  }

  function createEditor(assets) {
    var styleHost = document.createElement("div");
    styleHost.id = "ve-style-host";
    styleHost.style.display = "none";
    document.body.appendChild(styleHost);

    var editor = grapesjs.init({
      container: "#gjs",
      height: "100%",
      width: "100%",
      storageManager: false,
      fromElement: false,
      noticeOnUnload: false,
      showOffsets: true,
      allowScripts: true,
      panels: { defaults: [] },
      blockManager: {
        appendTo: "#ve-blocks",
        blocks: buildBlocks(),
        appendOnClick: function (block) {
          var type = String(block.get("id") || "").replace(/^cms-block-/, "");
          if (type) addSection(type, { select: true });
        },
      },
      canvas: {
        styles: assets.styles,
        scripts: assets.scripts,
        frameStyle: "html,body{margin:0;padding:0;}body{min-height:100vh;}",
        allowExternalDrop: false,
        customSpots: true,
      },
      deviceManager: {
        devices: [
          { id: "desktop", name: "Desktop", width: "" },
          { id: "tablet", name: "Tablet", width: "768px" },
          { id: "mobile", name: "Mobile", width: "390px" },
        ],
      },
      selectorManager: { componentFirst: true },
      styleManager: { appendTo: styleHost },
      assetManager: { assets: [], upload: false, custom: true },
      undoManager: { trackSelection: false, maximumStackLength: 100 },
    });

    state.editor = editor;
    // Small, read-only handle for diagnostics and automated checks. It exposes
    // no credentials and only lives inside the authenticated CMS iframe.
    window.__calabVisual = {
      editor: editor,
      serialize: function () {
        return serialize();
      },
    };

    editor.on("load", function () {
      setupCanvas(assets);
    });

    editor.on("block:drag:stop", function (component) {
      if (!component) return;
      setTimeout(function () {
        decorateLooseRoots();
        updateOutline();
      }, 0);
    });

    editor.on("component:add", function (component) {
      onComponentAdd(component);
    });

    editor.on("component:clone", function (component) {
      if (component && component.get && component.get("cmsSection")) {
        component.set("cmsSection", clone(component.get("cmsSection")));
      }
    });

    editor.on("component:remove", function (component) {
      if (!state.main || state.booting) return;
      if (component && component.get && component.get("cmsSection")) {
        if (state.selected === component) {
          state.selected = null;
          renderRightPanel();
        }
        markDirty();
        scheduleOutline();
      }
    });

    editor.on("component:selected", function (component) {
      onComponentSelected(component);
    });

    editor.on("component:deselected", function () {
      clearActive();
      state.selected = null;
      renderRightPanel();
      updateOutline();
    });

    editor.on("component:update", function (component) {
      if (state.booting) return;
      if (component && component.get && component.get("cmsSection")) {
        markDirty();
        scheduleOutline();
      }
    });

    editor.on("update", function () {
      if (state.booting) return;
      updateUndoButtons();
    });

    editor.on("component:drag:end", function () {
      if (state.booting) return;
      ensurePageBasicsFirst();
      markDirty();
      scheduleOutline();
    });

    editor.on("undo", function () {
      updateUndoButtons();
      if (!state.booting) markDirty();
    });

    editor.on("redo", function () {
      updateUndoButtons();
      if (!state.booting) markDirty();
    });

    bindShell();
  }

  function setupCanvas(assets) {
    var editor = state.editor;
    var doc;
    try {
      doc = editor.Canvas.getDocument();
    } catch (error) {
      doc = null;
    }
    if (!doc || !doc.body) {
      setTimeout(function () {
        setupCanvas(assets);
      }, 120);
      return;
    }

    doc.body.className = assets.bodyClass || "body";
    if (assets.inlineStyles) {
      var style = doc.createElement("style");
      style.textContent = assets.inlineStyles;
      doc.head.appendChild(style);
    }
    // The site loads Typekit through a script + inline call. Reproduce it so
    // the canvas uses the same fonts as the published page.
    if (assets.scripts.length) {
      assets.scripts.forEach(function (src) {
        var script = doc.createElement("script");
        script.src = src;
        doc.head.appendChild(script);
      });
      var initFonts = doc.createElement("script");
      initFonts.textContent = "try{Typekit.load();}catch(e){}";
      doc.head.appendChild(initFonts);
    }

    doc.addEventListener(
      "click",
      function (event) {
        var anchor = event.target && event.target.closest ? event.target.closest("a") : null;
        if (anchor) event.preventDefault();
      },
      true
    );
    doc.addEventListener(
      "submit",
      function (event) {
        event.preventDefault();
      },
      true
    );
    doc.addEventListener(
      "dblclick",
      function (event) {
        var media = event.target && event.target.closest ? event.target.closest("[data-cms-media]") : null;
        if (!media) return;
        event.preventDefault();
        var sectionComp = findSectionComponent(editor.getSelected());
        if (!sectionComp) return;
        var path = media.getAttribute("data-cms-media");
        var section = sectionComp.get("cmsSection");
        var kind = section.type === "video" || section.type === "hero_video" || section.type === "home_masthead" ? "video" : section.type === "pdf" ? "pdf" : "image";
        window.VCMSMedia.open({
          kind: kind,
          multiple: false,
          onSelect: function (urls) {
            updateField(path, urls[0], true);
          },
        });
      },
      true
    );

    var wrapper = editor.getWrapper();
    wrapper.set({ droppable: false });
    var main = wrapper.append('<main class="main" aria-label="Page content"></main>')[0];
    main.set({
      name: "Page content",
      droppable: true,
      draggable: false,
      removable: false,
      copyable: false,
      selectable: false,
      hoverable: false,
    });
    state.main = main;

    renderPageBasicsComponents();

    state.initialSections.forEach(function (section) {
      var added = main.append(renderGlassSection(section));
      var comp = pickSectionRoot(added);
      if (comp) {
        comp.set("cmsSection", section);
        decorateSection(comp, section);
      }
    });

    renderExtrasComponents();
    ensurePageBasicsFirst();

    var editorBody = editor.Canvas.getBody();
    if (editorBody && window.IntersectionObserver) {
      // Keep the iframe's body class from being wiped by frame resets.
      editorBody.className = assets.bodyClass || "body";
    }

    state.booting = false;
    state.ready = true;
    if (editor.UndoManager && editor.UndoManager.clear) editor.UndoManager.clear();
    $("#ve-app").hidden = false;
    $("#ve-loading").hidden = true;
    updateUndoButtons();
    updateOutline();
    updateEmptyState();
    renderRightPanel();
    clearDirty("All changes saved to the CMS form");
    setDevice("desktop");

    if (!state.helpSeen) {
      setTimeout(openHelp, 600);
    }
  }

  function renderGlassSection(section) {
    // Render through the shared renderer, then attach a one-time token so the
    // component:add handler can pair the DOM nodes with the structured object.
    var token = "sec-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 9);
    state.pending.set(token, section);
    var html = R.renderSection(section, { entry: state.entry, page: state.page });
    if (!html) {
      html =
        '<section class="section cms-vis-unknown" data-cms-section-type="' +
        escapeHtml(section.type) +
        '"><div class="container"><div class="cms-vis-locked-card"><span class="cms-vis-lock">Unknown</span><strong>' +
        escapeHtml(section.type) +
        "</strong><p>This section type is not supported by the visual editor. It is kept unchanged when you apply.</p></div></div></section>";
    }
    return html.replace(
      'data-cms-section-type="' + escapeHtml(section.type) + '"',
      'data-cms-section-type="' + escapeHtml(section.type) + '" data-cms-token="' + token + '"'
    );
  }

  function pickSectionRoot(components) {
    var list = Array.isArray(components) ? components : [components];
    for (var i = 0; i < list.length; i += 1) {
      var comp = list[i];
      var el = comp && comp.getEl ? comp.getEl() : null;
      if (el && el.hasAttribute && el.hasAttribute("data-cms-section-type")) return comp;
    }
    return null;
  }

  function isSectionRoot(component) {
    var el = component && component.getEl ? component.getEl() : null;
    return !!(el && el.hasAttribute && el.hasAttribute("data-cms-section-type"));
  }

  function findSectionComponent(component) {
    var current = component;
    while (current) {
      if (current.get && current.get("cmsSection")) return current;
      current = current.parent ? current.parent() : null;
    }
    return null;
  }

  function sectionComponents() {
    if (!state.main) return [];
    return state.main
      .components()
      .filter(function (comp) {
        return comp.get && comp.get("cmsSection");
      })
      .map(function (comp) {
        return comp;
      });
  }

  function pageComponents() {
    if (!state.main) return [];
    return state.main.components().filter(function (comp) {
      return comp.get && comp.get("cmsPage");
    });
  }

  function findPageComponent(component) {
    var current = component;
    while (current) {
      if (current.get && current.get("cmsPage")) return current;
      current = current.parent ? current.parent() : null;
    }
    return null;
  }

  function renderPageBasicsComponents() {
    if (!state.main) return;
    pageComponents().forEach(function (comp) {
      comp.remove();
    });
    var html = R.renderPageBasics(state.pageData);
    if (!html) {
      state.pageComponent = null;
      return;
    }
    var added = state.main.append(html, { at: 0 });
    added.forEach(function (comp) {
      comp.set({
        cmsPage: true,
        droppable: false,
        draggable: false,
        removable: false,
        copyable: false,
        selectable: true,
        hoverable: true,
        name: "Page basics",
      });
      lockChildren(comp);
    });
    state.pageComponent = added[0] || null;
    updateEmptyState();
  }

  function renderExtrasComponents() {
    if (!state.main) return;
    state.main
      .components()
      .slice()
      .forEach(function (comp) {
        if (comp.get && comp.get("cmsLocked")) comp.remove();
      });
    var extras = R.renderExtras(Object.assign({}, state.entry, state.pageData));
    if (!extras) return;
    state.main.append(extras).forEach(function (comp) {
      lockComponent(comp);
    });
  }

  function ensurePageBasicsFirst() {
    if (!state.main) return;
    var basics = pageComponents();
    for (var i = 0; i < basics.length; i += 1) {
      if (basics[i].index() !== i) state.main.append(basics[i], { at: i });
    }
    var locked = state.main.components().filter(function (comp) {
      return comp.get && comp.get("cmsLocked");
    });
    if (locked.length) {
      locked.forEach(function (comp) {
        state.main.append(comp);
      });
    }
  }

  function decorateSection(component, section) {
    component.set({
      cmsSection: section,
      droppable: false,
      draggable: true,
      removable: true,
      copyable: true,
      selectable: true,
      hoverable: true,
      name: R.labelForType(section.type),
    });
    var el = component.getEl ? component.getEl() : null;
    if (el && el.removeAttribute) {
      el.removeAttribute("data-cms-token");
    }
    lockChildren(component);
  }

  function lockChildren(component) {
    if (!component || !component.components) return;
    component.components().forEach(function (child) {
      child.set({
        draggable: false,
        removable: false,
        copyable: false,
        droppable: false,
      });
      lockChildren(child);
    });
  }

  function lockComponent(component) {
    if (!component) return;
    component.set({
      cmsLocked: true,
      draggable: false,
      removable: false,
      copyable: false,
      selectable: false,
      hoverable: false,
    });
    lockChildren(component);
  }

  function onComponentAdd(component) {
    if (!state.main || state.booting || state.replacing) return;
    if (!component || !component.getEl) return;
    var el = component.getEl();
    if (!el || !el.hasAttribute) return;

    // Blocks dropped on the canvas can land on the wrapper. Keep the page
    // structure under <main> so the published markup stays identical.
    if (component.parent() === state.editor.getWrapper() && el.hasAttribute("data-cms-section-type")) {
      state.main.append(component);
      return;
    }

    if (!el.hasAttribute("data-cms-section-type")) return;

    var existing = component.get("cmsSection");
    if (existing) {
      var copy = clone(existing);
      component.set("cmsSection", copy);
      decorateSection(component, copy);
      markDirty();
      scheduleOutline();
      return;
    }

    var token = el.getAttribute("data-cms-token");
    var section = token ? state.pending.get(token) : null;
    if (token) state.pending.delete(token);
    if (!section) {
      var type = el.getAttribute("data-cms-section-type");
      section = R.defaults(type);
    }
    component.set("cmsSection", section);
    decorateSection(component, section);
    markDirty();
    scheduleOutline();
  }

  function decorateLooseRoots() {
    if (!state.main) return;
    state.main.components().forEach(function (comp) {
      if (isSectionRoot(comp) && !comp.get("cmsSection")) {
        var section = R.defaults(comp.getEl().getAttribute("data-cms-section-type"));
        comp.set("cmsSection", section);
        decorateSection(comp, section);
      }
    });
    updateEmptyState();
  }

  /* ------------------------------------------------------------- selection */

  function clearActive() {
    if (!state.editor) return;
    document.querySelectorAll("[data-cms-section-type], [data-cms-page-basics]").forEach(function (el) {
      el.classList.remove("cms-vis-active");
    });
    var frameDoc = null;
    try {
      frameDoc = state.editor.Canvas.getDocument();
    } catch (error) {
      frameDoc = null;
    }
    if (frameDoc) {
      frameDoc.querySelectorAll("[data-cms-section-type], [data-cms-page-basics]").forEach(function (el) {
        el.classList.remove("cms-vis-active");
      });
    }
  }

  function markActive(component) {
    clearActive();
    var el = component && component.getEl ? component.getEl() : null;
    if (el && el.classList) el.classList.add("cms-vis-active");
  }

  function onComponentSelected(component) {
    var pageComp = findPageComponent(component);
    if (pageComp) {
      state.selected = null;
      state.pageComponent = pageComp;
      setRightTab("page", false);
      markActivePage(pageComp);
      updateOutline();
      return;
    }

    var sectionComp = findSectionComponent(component);
    if (!sectionComp) {
      var el = component && component.getEl ? component.getEl() : null;
      if (el && el.closest && el.closest("[data-cms-locked]")) {
        state.editor.select(undefined);
      }
      state.selected = null;
      updateOutline();
      return;
    }
    state.selected = sectionComp;
    markActive(sectionComp);
    setRightTab("section", false);
    renderSectionInspector(sectionComp.get("cmsSection"), sectionComp);
    updateOutline();
  }

  function markActivePage(component) {
    clearActive();
    var el = component && component.getEl ? component.getEl() : null;
    if (el && el.classList) el.classList.add("cms-vis-active");
  }

  function selectSection(component, scroll) {
    if (!component) return;
    state.selected = component;
    state.editor.select(component);
    markActive(component);
    setRightTab("section", false);
    renderSectionInspector(component.get("cmsSection"), component);
    updateOutline();
    if (scroll) {
      var el = component.getEl();
      if (el && el.scrollIntoView) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  /* --------------------------------------------------------------- outline */

  function scheduleOutline() {
    clearTimeout(state.outlineTimer);
    state.outlineTimer = setTimeout(function () {
      updateOutline();
      updateEmptyState();
    }, 120);
  }

  function updateEmptyState() {
    var empty = $("#ve-empty");
    if (!empty) return;
    empty.hidden = sectionComponents().length > 0 || pageComponents().length > 0;
  }

  var CHEVRON_UP =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 14 6-6 6 6"/></svg>';
  var CHEVRON_DOWN =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 10 6 6 6-6"/></svg>';
  var COPY_ICON =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="11" height="11" rx="1.5"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg>';
  var TRASH_ICON =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13"/></svg>';

  function updateOutline() {
    var outline = $("#ve-outline");
    if (!outline) return;
    var components = sectionComponents();
    if (!components.length) {
      outline.innerHTML =
        '<div class="ve-outline-empty">No sections yet. Add your first section from the <strong>Add</strong> tab.</div>';
      return;
    }
    outline.innerHTML = components
      .map(function (comp, index) {
        var section = comp.get("cmsSection") || {};
        var block = R.blockForType(section.type);
        var label = block ? block.label : section.type;
        var summary = R.summary(section) || "Empty section";
        return (
          '<div class="ve-outline-item' +
          (state.selected === comp ? " is-selected" : "") +
          '" data-outline-index="' +
          index +
          '">' +
          '<span class="ve-outline-item__icon" aria-hidden="true">' +
          escapeHtml(block ? block.icon : "?") +
          "</span>" +
          '<span class="ve-outline-item__text"><strong>' +
          escapeHtml(label) +
          "</strong><span>" +
          escapeHtml(summary) +
          "</span></span>" +
          '<span class="ve-outline-item__actions">' +
          '<button type="button" class="ve-mini-button" data-outline-action="up" title="Move up" aria-label="Move up" ' +
          (index === 0 ? "disabled" : "") +
          ">" +
          CHEVRON_UP +
          "</button>" +
          '<button type="button" class="ve-mini-button" data-outline-action="down" title="Move down" aria-label="Move down" ' +
          (index === components.length - 1 ? "disabled" : "") +
          ">" +
          CHEVRON_DOWN +
          "</button>" +
          '<button type="button" class="ve-mini-button" data-outline-action="duplicate" title="Duplicate" aria-label="Duplicate">' +
          COPY_ICON +
          "</button>" +
          '<button type="button" class="ve-mini-button" data-outline-action="delete" title="Delete" aria-label="Delete">' +
          TRASH_ICON +
          "</button>" +
          "</span></div>"
        );
      })
      .join("");
  }

  $("#ve-outline").addEventListener("click", function (event) {
    var item = event.target.closest(".ve-outline-item");
    if (!item) return;
    var index = Number(item.getAttribute("data-outline-index"));
    var comp = sectionComponents()[index];
    if (!comp) return;
    var actionButton = event.target.closest("[data-outline-action]");
    if (actionButton) {
      event.stopPropagation();
      var action = actionButton.getAttribute("data-outline-action");
      if (action === "up") moveSection(comp, -1);
      else if (action === "down") moveSection(comp, 1);
      else if (action === "duplicate") duplicateSection(comp);
      else if (action === "delete") removeSection(comp);
      return;
    }
    selectSection(comp, true);
  });

  /* -------------------------------------------------------------- sections */

  function insertionIndex() {
    var components = state.main.components();
    var index = components.length;
    for (var i = 0; i < components.length; i += 1) {
      if (components.at(i).get("cmsLocked")) {
        index = i;
        break;
      }
    }
    return index;
  }

  function addSection(type, options) {
    options = options || {};
    var section = R.defaults(type);
    if (!section || !section.type) {
      toast("That section type is not available.", true);
      return null;
    }
    var html = renderGlassSection(section);
    var at = options.at != null ? options.at : insertionIndex();
    var added = state.main.append(html, { at: at });
    var comp = pickSectionRoot(added);
    if (!comp) {
      toast("The section could not be added. Try again.", true);
      return null;
    }
    comp.set("cmsSection", section);
    decorateSection(comp, section);
    if (options.select !== false) selectSection(comp, true);
    ensurePageBasicsFirst();
    markDirty();
    updateOutline();
    updateEmptyState();
    return comp;
  }

  function moveSection(component, direction) {
    var parent = component.parent();
    if (!parent) return;
    var index = component.index();
    var target = index + direction;
    var components = parent.components();
    var minimum = pageComponents().length;
    if (target < minimum || target >= components.length) return;
    var neighbour = components.at(target);
    if (neighbour && neighbour.get("cmsLocked")) return;
    parent.append(component, { at: target });
    ensurePageBasicsFirst();
    markDirty();
    scheduleOutline();
    selectSection(component, true);
  }

  function duplicateSection(component) {
    var section = clone(component.get("cmsSection") || {});
    syncSectionFromDom(component, section);
    var copy = clone(section);
    var html = renderGlassSection(copy);
    var parent = component.parent();
    var added = parent.append(html, { at: component.index() + 1 });
    var comp = pickSectionRoot(added);
    if (!comp) return;
    comp.set("cmsSection", copy);
    decorateSection(comp, copy);
    selectSection(comp, true);
    markDirty();
    updateOutline();
    toast("Section duplicated.");
  }

  function removeSection(component) {
    var section = component.get("cmsSection") || {};
    var label = R.labelForType(section.type);
    if (!window.confirm('Remove the "' + label + '" section?')) return;
    component.remove();
    if (state.selected === component) state.selected = null;
    renderRightPanel();
    markDirty();
    scheduleOutline();
    updateEmptyState();
  }

  function replaceSection(component, section, options) {
    options = options || {};
    if (!component || !component.parent()) return null;
    var parent = component.parent();
    var index = component.index();
    state.replacing = true;
    var added;
    try {
      added = component.replaceWith(R.renderSection(section, { entry: state.entry, page: state.page }));
    } finally {
      state.replacing = false;
    }
    var next = pickSectionRoot(added);
    if (!next) return null;
    next.set("cmsSection", section);
    decorateSection(next, section);
    if (state.selected === component) state.selected = next;
    if (options.select !== false) {
      state.editor.select(next);
      markActive(next);
    }
    markDirty();
    updateOutline();
    if (options.rerenderInspector) renderSectionInspector(section, next);
    return next;
  }

  /* ------------------------------------------------------------ serialization */

  function cleanHtml(html) {
    var host = document.createElement("div");
    host.innerHTML = String(html == null ? "" : html);
    host.querySelectorAll("*").forEach(function (el) {
      Array.prototype.slice.call(el.attributes).forEach(function (attribute) {
        var name = attribute.name;
        if (/^data-gjs-/i.test(name) || /^data-cms-/i.test(name)) {
          el.removeAttribute(name);
        } else if (name === "contenteditable" || name === "draggable" || name === "spellcheck") {
          el.removeAttribute(name);
        } else if (name === "id") {
          // GrapeJS ids are generated for every parsed element and are not
          // part of the page's content model.
          el.removeAttribute(name);
        } else if (name === "class") {
          var classes = Array.prototype.slice.call(el.classList).filter(function (cls) {
            return cls.indexOf("gjs-") !== 0 && cls.indexOf("cms-vis-") !== 0;
          });
          if (classes.length) el.setAttribute("class", classes.join(" "));
          else el.removeAttribute("class");
        } else if (name === "id" && /^gjs-|^cms-vis-/.test(attribute.value)) {
          el.removeAttribute("id");
        }
      });
    });
    return host.innerHTML;
  }

  function syncSectionFromDom(component, section) {
    var el = component && component.getEl ? component.getEl() : null;
    if (!el || !el.querySelectorAll) return section;

    el.querySelectorAll("[data-cms-field]").forEach(function (node) {
      var path = node.getAttribute("data-cms-field");
      if (!path) return;
      var value = node.hasAttribute("data-cms-html") ? cleanHtml(node.innerHTML) : String(node.textContent || "").trim();
      setPath(section, path, value);
    });

    el.querySelectorAll("[data-cms-media]").forEach(function (node) {
      var path = node.getAttribute("data-cms-media");
      if (!path) return;
      var tag = node.tagName;
      if (tag !== "IMG" && tag !== "VIDEO") return;
      var src = node.getAttribute("src");
      if (src) setPath(section, path, R.mediaUrl(src));
    });

    if (section.type === "image_gallery" && Array.isArray(section.images)) {
      section.images = section.images.filter(function (item) {
        return item && (item.image || item.alt || item.caption);
      });
      if (!section.images.length) {
        // Keep at least one empty slot out of the stored YAML. An empty gallery
        // is valid and renders its own editor placeholder only.
        section.images = [];
      }
    }
    return section;
  }

  function serialize() {
    return sectionComponents().map(function (component) {
      var section = clone(component.get("cmsSection") || {});
      syncSectionFromDom(component, section);
      return section;
    });
  }

  function serializePage() {
    syncPageFromDom();
    return clone(state.pageData);
  }

  /* ---------------------------------------------------------------- inspector */

  function pageCardHtml() {
    var title = state.page.title || state.entry.title || "Untitled page";
    var url = state.page.url || state.entry.permalink || "/";
    return (
      '<div class="ve-page-card">' +
      "<strong>" +
      escapeHtml(title) +
      "</strong>" +
      "<div>" +
      escapeHtml(url) +
      "</div>" +
      "<p>Page title, web address, home hero text, team members, and SEO are in the form beside this editor.</p>" +
      '<a class="ve-link-button" href="' +
      escapeHtml(url) +
      '" target="_blank" rel="noopener">Open live page ↗</a>' +
      "</div>"
    );
  }

  function renderSectionInspector(section, component) {
    var host = $("#ve-inspector");
    if (!host) return;
    if (!section) {
      host.innerHTML =
        '<div class="ve-inspector-empty"><div class="ve-inspector-empty__mark" aria-hidden="true">◈</div>' +
        "<h2>Select a section</h2><p>Click any section on the page to edit its text, images, and settings. Drag sections to reorder them.</p></div>" +
        pageCardHtml();
      return;
    }

    var block = R.blockForType(section.type);
    var label = block ? block.label : section.type;
    var summary = R.summary(section) || "Section";
    var fields = R.fieldsForType(section.type);

    var html =
      '<div class="ve-inspector-head"><div><h2>' +
      escapeHtml(label) +
      "</h2><p>" +
      escapeHtml(summary) +
      "</p></div><span class=\"ve-inspector-head__icon\" aria-hidden=\"true\">" +
      escapeHtml(block ? block.icon : "?") +
      "</span></div>";

    if (section.type === "home_masthead" && state.entry.home_hero_text && state.entry.home_hero_text.hero_logo_src) {
      html +=
        '<p class="ve-section-note">The live home page currently uses the logo and text from <strong>Page basics → Home Page Hero Text</strong>. The title fields below are only a fallback.</p>';
    }

    fields.forEach(function (field) {
      html += renderField(field, section, component);
    });

    html +=
      '<div class="ve-inspector-actions">' +
      '<button type="button" class="ve-button ve-button--small" data-action="move-up">Move up</button>' +
      '<button type="button" class="ve-button ve-button--small" data-action="move-down">Move down</button>' +
      '<button type="button" class="ve-button ve-button--small" data-action="duplicate">Duplicate</button>' +
      '<button type="button" class="ve-button ve-button--small" data-action="delete">Delete</button>' +
      "</div>" +
      pageCardHtml();

    host.innerHTML = html;
  }

  function setRightTab(tab, render) {
    state.rightTab = tab;
    document.querySelectorAll("[data-right-tab]").forEach(function (button) {
      button.classList.toggle("is-active", button.getAttribute("data-right-tab") === tab);
    });
    if (render !== false) renderRightPanel();
  }

  function renderRightPanel() {
    if (state.rightTab === "section") {
      var section = state.selected ? state.selected.get("cmsSection") : null;
      renderSectionInspector(section, state.selected);
      return;
    }
    renderPageSettings();
  }

  function syncPageFromDom() {
    if (!state.main) return;
    pageComponents().forEach(function (comp) {
      var el = comp.getEl ? comp.getEl() : null;
      if (!el || !el.querySelectorAll) return;
      el.querySelectorAll("[data-cms-page-field]").forEach(function (node) {
        var path = node.getAttribute("data-cms-page-field");
        if (!path) return;
        var value = node.hasAttribute("data-cms-html")
          ? cleanHtml(node.innerHTML)
          : String(node.textContent || "").trim();
        setPath(state.pageData, path, value);
      });
      el.querySelectorAll("[data-cms-page-media]").forEach(function (node) {
        var path = node.getAttribute("data-cms-page-media");
        if (!path) return;
        var src = node.getAttribute("src");
        if (src) setPath(state.pageData, path, R.mediaUrl(src));
      });
    });
  }

  function updatePageField(path, value, structural) {
    syncPageFromDom();
    setPath(state.pageData, path, value);

    if (structural) {
      renderPageBasicsComponents();
      ensurePageBasicsFirst();
      renderPageSettings();
      markDirty();
      return;
    }

    var node = null;
    pageComponents().forEach(function (comp) {
      var el = comp.getEl ? comp.getEl() : null;
      if (el && el.querySelector) {
        var found = el.querySelector('[data-cms-page-field="' + String(path).replace(/"/g, '\\"') + '"]');
        if (found) node = found;
      }
    });
    if (path === "page_image_alt") {
      pageComponents().forEach(function (comp) {
        var el = comp.getEl ? comp.getEl() : null;
        var image = el && el.querySelector ? el.querySelector('[data-cms-page-media="page_image"]') : null;
        if (image) image.setAttribute("alt", value);
      });
    }
    if (node) {
      if (node.hasAttribute && node.hasAttribute("data-cms-html")) node.innerHTML = value;
      else if (node.tagName === "IMG") node.setAttribute("alt", value);
      else node.textContent = value;
    } else if (path === "page_heading" || path === "page_content") {
      renderPageBasicsComponents();
      ensurePageBasicsFirst();
    }
    markDirty();
  }

  function pageMediaThumb(src) {
    return src
      ? '<img src="' + escapeHtml(src) + '" alt="">'
      : '<span class="ve-file-label">No image</span>';
  }

  function renderPageSettings() {
    var host = $("#ve-inspector");
    if (!host) return;
    syncPageFromDom();
    var page = state.pageData;

    var html =
      '<div class="ve-page-settings-head"><h2>Page basics</h2><p>These appear above the page sections. Changes preview on the canvas.</p></div>';

    html +=
      '<div class="ve-field"><div class="ve-field__label"><label for="vp-heading">Page heading</label></div>' +
      '<input id="vp-heading" class="ve-input" type="text" value="' +
      escapeHtml(page.page_heading || "") +
      '" placeholder="e.g. Team" data-page-input data-page-path="page_heading">' +
      '<p class="ve-field__help">The large title at the top of the page. Leave blank if the page starts with a section.</p></div>';

    html +=
      '<div class="ve-field"><div class="ve-field__label"><label for="vp-content">Introduction text</label></div>' +
      '<textarea id="vp-content" class="ve-textarea" rows="5" data-page-input data-page-path="page_content" data-page-rich="1" data-page-structural="1">' +
      escapeHtml(page.page_content || "") +
      "</textarea>" +
      '<div class="ve-rich-actions"><button type="button" class="ve-link-button" data-page-action="focus-content">Click the text on the page to edit it visually</button></div>' +
      '<p class="ve-field__help">This box contains formatted HTML (or Markdown on older pages). Click the text on the page for the easier editor.</p></div>';

    html +=
      '<div class="ve-field"><div class="ve-field__label"><label>Introduction image</label></div>' +
      '<div class="ve-image-field"><div class="ve-image-thumb">' +
      pageMediaThumb(page.page_image) +
      "</div><div>" +
      '<input class="ve-input" type="text" value="' +
      escapeHtml(page.page_image || "") +
      '" placeholder="/uploads/… or https://…" data-page-input data-page-path="page_image" data-page-structural="1">' +
      '<div class="ve-image-actions" style="margin-top:5px">' +
      '<button type="button" class="ve-button ve-button--small" data-page-action="choose-image">Choose image</button>' +
      (page.page_image
        ? '<button type="button" class="ve-button ve-button--small" data-page-action="clear-image">Remove</button>'
        : "") +
      "</div></div></div></div>";

    if (page.page_image) {
      html +=
        '<div class="ve-field"><div class="ve-field__label"><label for="vp-alt">Image description (alt text)</label></div>' +
        '<input id="vp-alt" class="ve-input" type="text" value="' +
        escapeHtml(page.page_image_alt || "") +
        '" data-page-input data-page-path="page_image_alt">' +
        '<p class="ve-field__help">Describe the image for screen readers and search engines.</p></div>' +
        '<div class="ve-field"><div class="ve-field__label"><label for="vp-pos">Image position</label></div>' +
        '<select id="vp-pos" class="ve-select" data-page-input data-page-path="page_image_position" data-page-structural="1">' +
        '<option value="right"' +
        (page.page_image_position === "right" ? " selected" : "") +
        ">Image on the right</option>" +
        '<option value="left"' +
        (page.page_image_position === "left" ? " selected" : "") +
        ">Image on the left</option>" +
        "</select></div>";
    }

    html +=
      '<div class="ve-page-settings-head" style="margin-top:16px"><h2>Automatic sections</h2><p>These are generated from other collections. Turn them on or off here.</p></div>' +
      '<div class="ve-toggle-list">' +
      toggleHtml("show_projects_grid", "Projects grid", "Every entry in Projects, as a card grid.", page.show_projects_grid) +
      toggleHtml("show_publications_list", "Publications list", "Every entry in Publications, with links.", page.show_publications_list) +
      toggleHtml("show_teaching_grid", "Teaching grid", "Every entry in Teaching.", page.show_teaching_grid) +
      toggleHtml("show_team_grid", "Team grid", "Team members and groups from this page.", page.show_team_grid) +
      toggleHtml("show_contact_form", "Contact form", "The email form and its security check.", page.show_contact_form) +
      "</div>" +
      '<p class="ve-settings-note">Page title, web address, home hero logo, team members, and SEO are in the CMS form beside this editor. They are intentionally not duplicated here.</p>' +
      pageCardHtml();

    host.innerHTML = html;
  }

  function toggleHtml(key, label, description, checked) {
    return (
      '<label class="ve-toggle"><input type="checkbox" data-page-toggle="' +
      escapeHtml(key) +
      '"' +
      (checked ? " checked" : "") +
      "><span><strong>" +
      escapeHtml(label) +
      "</strong><span>" +
      escapeHtml(description) +
      "</span></span></label>"
    );
  }

  function renderField(field, section, component) {
    var value = getPath(section, field.path);
    var id = "vf-" + field.path.replace(/[^a-z0-9_-]+/gi, "-");
    var label =
      '<div class="ve-field__label"><label for="' +
      id +
      '">' +
      escapeHtml(field.label) +
      "</label></div>";
    var help = field.help ? '<p class="ve-field__help">' + escapeHtml(field.help) + "</p>" : "";

    if (field.type === "text") {
      if (field.multiline) {
        return (
          '<div class="ve-field">' +
          label +
          '<textarea id="' +
          id +
          '" class="ve-textarea" data-field-input data-path="' +
          escapeHtml(field.path) +
          '">' +
          escapeHtml(value || "") +
          "</textarea>" +
          help +
          "</div>"
        );
      }
      return (
        '<div class="ve-field">' +
        label +
        '<input id="' +
        id +
        '" class="ve-input" type="text" value="' +
        escapeHtml(value || "") +
        '" data-field-input data-path="' +
        escapeHtml(field.path) +
        '">' +
        help +
        "</div>"
      );
    }

    if (field.type === "rich") {
      return (
        '<div class="ve-field">' +
        label +
        '<textarea id="' +
        id +
        '" class="ve-textarea" data-field-input data-path="' +
        escapeHtml(field.path) +
        '" data-rich="1" rows="5">' +
        escapeHtml(value || "") +
        "</textarea>" +
        '<div class="ve-rich-actions"><button type="button" class="ve-link-button" data-action="focus-canvas" data-path="' +
        escapeHtml(field.path) +
        '">Click the text on the page to edit it visually</button></div>' +
        '<p class="ve-field__help">The box above contains formatted HTML. Edit it only if you are comfortable with tags; otherwise click the text on the page.</p>' +
        "</div>"
      );
    }

    if (field.type === "select") {
      var options = (field.options || [])
        .map(function (option) {
          return (
            '<option value="' +
            escapeHtml(option.value) +
            '"' +
            (String(value) === String(option.value) ? " selected" : "") +
            ">" +
            escapeHtml(option.label) +
            "</option>"
          );
        })
        .join("");
      return (
        '<div class="ve-field">' +
        label +
        '<select id="' +
        id +
        '" class="ve-select" data-field-input data-path="' +
        escapeHtml(field.path) +
        '" data-structural="1">' +
        options +
        "</select>" +
        help +
        "</div>"
      );
    }

    if (field.type === "image" || field.type === "media") {
      var mediaKind = field.type === "image" ? "image" : field.media || "image";
      var src = String(value || "");
      var thumb = src
        ? mediaKind === "image"
          ? '<img src="' + escapeHtml(src) + '" alt="">'
          : '<span class="ve-file-label">' + (mediaKind === "pdf" ? "PDF" : "Video") + "</span>"
        : '<span class="ve-file-label">No file</span>';
      return (
        '<div class="ve-field">' +
        label +
        '<div class="ve-image-field"><div class="ve-image-thumb">' +
        thumb +
        "</div><div>" +
        '<input class="ve-input" type="text" value="' +
        escapeHtml(src) +
        '" placeholder="/uploads/… or https://…" data-field-input data-path="' +
        escapeHtml(field.path) +
        '" data-structural="1">' +
        '<div class="ve-image-actions" style="margin-top:5px">' +
        '<button type="button" class="ve-button ve-button--small" data-action="choose-media" data-path="' +
        escapeHtml(field.path) +
        '" data-kind="' +
        escapeHtml(mediaKind) +
        '">Choose file</button>' +
        (src
          ? '<button type="button" class="ve-button ve-button--small" data-action="clear-media" data-path="' +
            escapeHtml(field.path) +
            '">Remove</button>'
          : "") +
        "</div></div></div>" +
        help +
        "</div>"
      );
    }

    if (field.type === "gallery") {
      var items = Array.isArray(value) ? value : [];
      var rows = items
        .map(function (item, index) {
          var image = item && item.image ? item.image : "";
          var itemLabel = "Image " + (index + 1);
          return (
            '<div class="ve-gallery-item">' +
            '<div class="ve-image-thumb">' +
            (image ? '<img src="' + escapeHtml(image) + '" alt="">' : '<span class="ve-file-label">Empty</span>') +
            "</div>" +
            '<div class="ve-gallery-item__body">' +
            '<input class="ve-input" type="text" value="' +
            escapeHtml(image) +
            '" placeholder="/uploads/…" data-gallery-path="' +
            escapeHtml(field.path) +
            "." +
            index +
            '.image" data-gallery-input="1">' +
            '<input class="ve-input" type="text" value="' +
            escapeHtml(item && item.alt ? item.alt : "") +
            '" placeholder="Description (alt text)" data-gallery-path="' +
            escapeHtml(field.path) +
            "." +
            index +
            '.alt" data-gallery-input="1">' +
            '<input class="ve-input" type="text" value="' +
            escapeHtml(item && item.caption ? item.caption : "") +
            '" placeholder="Caption (optional)" data-gallery-path="' +
            escapeHtml(field.path) +
            "." +
            index +
            '.caption" data-gallery-input="1">' +
            '<button type="button" class="ve-link-button" data-action="choose-gallery-item" data-path="' +
            escapeHtml(field.path) +
            "." +
            index +
            '.image">Choose image</button>' +
            "</div>" +
            '<button type="button" class="ve-mini-button ve-gallery-item__remove" data-action="remove-gallery-item" data-index="' +
            index +
            '" title="Remove image" aria-label="Remove image">' +
            TRASH_ICON +
            "</button>" +
            "</div>"
          );
        })
        .join("");
      return (
        '<div class="ve-field">' +
        label +
        '<div class="ve-gallery">' +
        (rows || '<p class="ve-field__help">No images yet.</p>') +
        "</div>" +
        '<button type="button" class="ve-button ve-button--small" style="margin-top:7px" data-action="add-gallery-images" data-path="' +
        escapeHtml(field.path) +
        '">Add images</button>' +
        help +
        "</div>"
      );
    }

    return "";
  }

  function updateField(path, value, structural) {
    if (!state.selected) return;
    var comp = state.selected;
    var section = comp.get("cmsSection") || {};
    syncSectionFromDom(comp, section);
    setPath(section, path, value);
    comp.set("cmsSection", section);
    if (structural) {
      var next = replaceSection(comp, section, { select: true, rerenderInspector: true });
      if (next) state.selected = next;
    } else {
      var el = comp.getEl ? comp.getEl() : null;
      var node = el && el.querySelector ? el.querySelector(attrSelector(path)) : null;
      if (node) {
        if (node.hasAttribute && node.hasAttribute("data-cms-html")) node.innerHTML = value;
        else node.textContent = value;
      }
    }
    markDirty();
    scheduleOutline();
  }

  function updateFieldFromInput(input, commit) {
    var path = input.getAttribute("data-path");
    if (!path) return;
    var structural = input.getAttribute("data-structural") === "1";
    var rich = input.getAttribute("data-rich") === "1";
    // Text inputs preview live; selects/media and rich HTML commit on change.
    if (commit) {
      updateField(path, input.value, structural || rich);
    } else if (!structural && !rich) {
      var comp = state.selected;
      if (!comp) return;
      var section = comp.get("cmsSection") || {};
      setPath(section, path, input.value);
      comp.set("cmsSection", section);
      var el = comp.getEl ? comp.getEl() : null;
      var node = el && el.querySelector ? el.querySelector(attrSelector(path)) : null;
      if (node) node.textContent = input.value;
      markDirty();
    }
  }

  function updateGalleryInput(input, commit) {
    if (!state.selected) return;
    var path = input.getAttribute("data-gallery-path");
    if (!path) return;
    var comp = state.selected;
    var section = comp.get("cmsSection") || {};
    syncSectionFromDom(comp, section);
    setPath(section, path, input.value);
    comp.set("cmsSection", section);
    if (commit) {
      var next = replaceSection(comp, section, { select: true, rerenderInspector: false });
      if (next) state.selected = next;
    } else {
      markDirty();
    }
  }

  function onInspectorInput(event) {
    var target = event.target;
    if (target.matches("[data-page-input]")) {
      var pagePath = target.getAttribute("data-page-path");
      var pageRich = target.getAttribute("data-page-rich") === "1";
      if (pageRich) {
        setPath(state.pageData, pagePath, target.value);
        markDirty();
      } else {
        updatePageField(pagePath, target.value, false);
      }
      return;
    }
    if (target.matches("[data-gallery-input]")) {
      updateGalleryInput(target, false);
      return;
    }
    if (target.matches("[data-field-input]")) {
      updateFieldFromInput(target, false);
    }
  }

  function onInspectorChange(event) {
    var target = event.target;
    if (target.matches("[data-page-toggle]")) {
      var key = target.getAttribute("data-page-toggle");
      state.pageData[key] = target.checked;
      renderExtrasComponents();
      markDirty();
      return;
    }
    if (target.matches("[data-page-input]")) {
      var pagePath = target.getAttribute("data-page-path");
      var pageStructural = target.getAttribute("data-page-structural") === "1";
      var pageRich = target.getAttribute("data-page-rich") === "1";
      updatePageField(pagePath, target.value, pageStructural || pageRich);
      return;
    }
    if (target.matches("[data-gallery-input]")) {
      updateGalleryInput(target, true);
      return;
    }
    if (!target.matches("[data-field-input]")) return;
    var structural = target.getAttribute("data-structural") === "1";
    var rich = target.getAttribute("data-rich") === "1";
    if (structural || rich) {
      updateFieldFromInput(target, true);
    }
  }

  function onInspectorClick(event) {
    var pageButton = event.target.closest("[data-page-action]");
    if (pageButton) {
      var pageAction = pageButton.getAttribute("data-page-action");
      if (pageAction === "choose-image") {
        window.VCMSMedia.open({
          kind: "image",
          multiple: false,
          onSelect: function (urls) {
            state.pageData.page_image = urls[0];
            renderPageBasicsComponents();
            ensurePageBasicsFirst();
            renderPageSettings();
            markDirty();
          },
        });
      } else if (pageAction === "clear-image") {
        state.pageData.page_image = "";
        renderPageBasicsComponents();
        ensurePageBasicsFirst();
        renderPageSettings();
        markDirty();
      } else if (pageAction === "focus-content") {
        toast("Click the introduction text directly on the page to edit it.");
      }
      return;
    }

    var button = event.target.closest("[data-action]");
    if (!button) return;
    var action = button.getAttribute("data-action");
    var path = button.getAttribute("data-path");
    var comp = state.selected;
    if (!comp && ["move-up", "move-down", "duplicate", "delete"].indexOf(action) >= 0) return;

    if (action === "move-up") moveSection(comp, -1);
    else if (action === "move-down") moveSection(comp, 1);
    else if (action === "duplicate") duplicateSection(comp);
    else if (action === "delete") removeSection(comp);
    else if (action === "choose-media") {
      var kind = button.getAttribute("data-kind") || "image";
      window.VCMSMedia.open({
        kind: kind,
        multiple: false,
        onSelect: function (urls) {
          updateField(path, urls[0], true);
        },
      });
    } else if (action === "clear-media") {
      updateField(path, "", true);
    } else if (action === "choose-gallery-item") {
      window.VCMSMedia.open({
        kind: "image",
        multiple: false,
        onSelect: function (urls) {
          updateField(path, urls[0], true);
        },
      });
    } else if (action === "add-gallery-images") {
      window.VCMSMedia.open({
        kind: "image",
        multiple: true,
        onSelect: function (urls) {
          if (!state.selected) return;
          var section = state.selected.get("cmsSection") || {};
          syncSectionFromDom(state.selected, section);
          if (!Array.isArray(section.images)) section.images = [];
          urls.forEach(function (url) {
            section.images.push({ image: url, alt: "", caption: "", fit_mode: "fit" });
          });
          state.selected.set("cmsSection", section);
          replaceSection(state.selected, section, { select: true, rerenderInspector: true });
          toast(urls.length + (urls.length === 1 ? " image added." : " images added."));
        },
      });
    } else if (action === "remove-gallery-item") {
      var index = Number(button.getAttribute("data-index"));
      var section = comp.get("cmsSection") || {};
      syncSectionFromDom(comp, section);
      if (Array.isArray(section.images)) section.images.splice(index, 1);
      comp.set("cmsSection", section);
      replaceSection(comp, section, { select: true, rerenderInspector: true });
    } else if (action === "focus-canvas") {
      toast("Click the text directly on the page to edit it.");
    }
  }

  $("#ve-inspector").addEventListener("input", onInspectorInput);
  $("#ve-inspector").addEventListener("change", onInspectorChange);
  $("#ve-inspector").addEventListener("click", onInspectorClick);

  /* --------------------------------------------------------------- shell */

  function bindShell() {
    $("#ve-apply").addEventListener("click", apply);
    $("#ve-cancel").addEventListener("click", cancel);
    $("#ve-help").addEventListener("click", openHelp);
    $("#ve-undo").addEventListener("click", function () {
      state.editor.UndoManager.undo();
      updateUndoButtons();
    });
    $("#ve-redo").addEventListener("click", function () {
      state.editor.UndoManager.redo();
      updateUndoButtons();
    });

    document.querySelectorAll("[data-device]").forEach(function (button) {
      button.addEventListener("click", function () {
        setDevice(button.getAttribute("data-device"));
      });
    });

    document.querySelectorAll("[data-right-tab]").forEach(function (button) {
      button.addEventListener("click", function () {
        setRightTab(button.getAttribute("data-right-tab"));
      });
    });

    document.querySelectorAll("[data-left-tab]").forEach(function (tab) {
      tab.addEventListener("click", function () {
        document.querySelectorAll("[data-left-tab]").forEach(function (item) {
          item.classList.toggle("is-active", item === tab);
        });
        document.querySelectorAll("[data-left-pane]").forEach(function (pane) {
          pane.classList.toggle("is-active", pane.getAttribute("data-left-pane") === tab.getAttribute("data-left-tab"));
        });
      });
    });

    document.addEventListener("keydown", function (event) {
      var modifier = event.metaKey || event.ctrlKey;
      if (modifier && (event.key === "s" || event.key === "S")) {
        event.preventDefault();
        apply();
      }
      if (event.key === "Escape") {
        var overlay = document.querySelector(".vmedia-overlay, .ve-help-overlay");
        if (!overlay) {
          /* Let the browser keep Escape for its own UI. */
        }
      }
    });

    window.addEventListener("beforeunload", function (event) {
      if (!state.dirty) return;
      event.preventDefault();
      event.returnValue = "You have unsaved visual editor changes.";
      return event.returnValue;
    });
  }

  function updateUndoButtons() {
    var undo = $("#ve-undo");
    var redo = $("#ve-redo");
    if (!state.editor || !state.editor.UndoManager) return;
    if (undo) undo.disabled = !state.editor.UndoManager.hasUndo();
    if (redo) redo.disabled = !state.editor.UndoManager.hasRedo();
  }

  function setDevice(id) {
    if (!state.editor) return;
    state.editor.setDevice(id);
    document.querySelectorAll("[data-device]").forEach(function (button) {
      button.classList.toggle("is-active", button.getAttribute("data-device") === id);
    });
    setTimeout(function () {
      var shell = document.querySelector(".ve-canvas-shell");
      if (shell) shell.scrollTop = 0;
    }, 120);
  }

  function findEmptyRequired(sections) {
    for (var i = 0; i < sections.length; i += 1) {
      var section = sections[i];
      if (!section) continue;
      var message = "";
      if (section.type === "image" && !section.image) message = "Add an image to the Image section.";
      else if (section.type === "hero_image" && !section.image) message = "Add an image to the Image hero section.";
      else if ((section.type === "video" || section.type === "hero_video") && !section.video_url) message = "Add a video URL to the " + R.labelForType(section.type) + " section.";
      else if (section.type === "pdf" && !section.file) message = "Choose a PDF for the PDF document section.";
      else if (section.type === "image_gallery" && !(section.images || []).some(function (item) { return item && item.image; })) message = "Add at least one image to the Image gallery.";
      if (message) return { index: i, message: message };
    }
    return null;
  }

  function apply() {
    if (!state.editor) return;
    var sections = serialize();
    var problem = findEmptyRequired(sections);
    if (problem) {
      var comp = sectionComponents()[problem.index];
      if (comp) selectSection(comp, true);
      toast(problem.message, true);
      return;
    }
    if (!sections.length && state.initialSections.length) {
      if (!window.confirm("Remove all sections from this page?")) return;
    }
    var page = serializePage();
    post("apply", { sections: sections, page: page });
    clearDirty("Applied to the CMS form — click Publish to go live");
    toast("Changes applied. Click Publish in the CMS to make them live.");
    setTimeout(function () {
      post("close");
    }, 900);
  }

  function cancel() {
    if (state.dirty) {
      if (!window.confirm("Discard your unsaved changes?")) return;
    }
    state.dirty = false;
    post("close");
  }

  function openHelp() {
    if (document.querySelector(".ve-help-overlay")) return;
    localStorage.setItem("calab-visual-help-seen-v1", "1");
    state.helpSeen = true;
    var overlay = document.createElement("div");
    overlay.className = "ve-help-overlay";
    overlay.innerHTML =
      '<div class="ve-help-dialog" role="dialog" aria-modal="true" aria-label="How to edit">' +
      '<header class="ve-help-header"><div><span class="ve-help-eyebrow">Visual editor</span><h2>How to edit this page</h2></div>' +
      '<button type="button" class="ve-help-close" aria-label="Close">&times;</button></header>' +
      '<ol class="ve-help-steps">' +
      "<li><strong>Click any text on the page</strong> to edit it in place. Use the toolbar that appears for bold, italic, and links.</li>" +
      "<li><strong>Click a section</strong> to change its image, layout, or settings in the right-hand panel.</li>" +
      "<li><strong>Drag a section</strong> to reorder it. Use the <em>Add</em> tab to insert a new section.</li>" +
      "<li><strong>Click Apply changes</strong> when you are done. This stages your edits in the CMS.</li>" +
      "<li><strong>Click Publish</strong> in the CMS to put the changes on the live site. Nothing goes live before that.</li>" +
      "</ol>" +
      '<div class="ve-help-note"><strong>Locked behind GitHub sign-in.</strong> The editor only opens from the Content Manager, and publishing uses your GitHub account.</div>' +
      '<footer class="ve-help-footer"><button type="button" class="ve-button ve-button--primary ve-help-start">Start editing</button></footer>' +
      "</div>";
    document.body.appendChild(overlay);
    var close = function () {
      overlay.remove();
      document.removeEventListener("keydown", onKey, true);
    };
    var onKey = function (event) {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      }
    };
    overlay.querySelector(".ve-help-close").addEventListener("click", close);
    overlay.querySelector(".ve-help-start").addEventListener("click", close);
    overlay.addEventListener("click", function (event) {
      if (event.target === overlay) close();
    });
    document.addEventListener("keydown", onKey, true);
  }
})();
