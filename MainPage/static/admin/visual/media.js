/*
 * Media chooser for the visual editor.
 *
 * Three ways to pick a file:
 *  - files already in the site's /uploads folder (index generated at build time)
 *  - Cloudinary's media library (same account the CMS already uses)
 *  - a direct URL
 */
(function (global) {
  "use strict";

  var CLOUDINARY = {
    cloudName: "dbf3aqsxu",
    apiKey: "251365553116344",
    script: "https://media-library.cloudinary.com/global/all.js",
  };

  var manifestPromise = null;
  var modal = null;
  var cloudinaryPromise = null;

  function loadManifest() {
    if (!manifestPromise) {
      manifestPromise = fetch("/admin/media-index.json", { cache: "no-store" })
        .then(function (response) {
          if (!response.ok) throw new Error("Media index not available");
          return response.json();
        })
        .catch(function () {
          return { images: [], videos: [], pdfs: [], generated: null };
        });
    }
    return manifestPromise;
  }

  function loadCloudinary() {
    if (global.cloudinary && global.cloudinary.openMediaLibrary) return Promise.resolve();
    if (cloudinaryPromise) return cloudinaryPromise;
    cloudinaryPromise = new Promise(function (resolve, reject) {
      var script = document.createElement("script");
      script.src = CLOUDINARY.script;
      script.async = true;
      script.onload = function () {
        if (global.cloudinary && global.cloudinary.openMediaLibrary) resolve();
        else reject(new Error("Cloudinary did not load"));
      };
      script.onerror = function () {
        reject(new Error("Cloudinary could not be loaded"));
      };
      document.head.appendChild(script);
    });
    return cloudinaryPromise;
  }

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }

  function fileList(manifest, kind) {
    if (kind === "image") return manifest.images || [];
    if (kind === "video") return manifest.videos || [];
    if (kind === "pdf") return manifest.pdfs || [];
    return [].concat(manifest.images || [], manifest.videos || [], manifest.pdfs || []);
  }

  function close() {
    if (!modal) return;
    var host = modal;
    modal = null;
    host.classList.add("is-closing");
    setTimeout(function () {
      if (host.parentNode) host.parentNode.removeChild(host);
    }, 160);
    document.removeEventListener("keydown", onKeydown, true);
  }

  function onKeydown(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
    }
  }

  function open(options) {
    options = options || {};
    var kind = options.kind || "image";
    var multiple = !!options.multiple;
    var title = options.title || (kind === "pdf" ? "Choose a PDF" : kind === "video" ? "Choose a video" : "Choose an image");
    var selected = [];

    close();

    modal = document.createElement("div");
    modal.className = "vmedia-overlay";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-label", title);
    modal.innerHTML =
      '<div class="vmedia-dialog">' +
      '<header class="vmedia-header"><div><h2>' +
      esc(title) +
      '</h2><p class="vmedia-subtitle">Pick a file already on the site, open Cloudinary, or paste a link.</p></div>' +
      '<button type="button" class="vmedia-close" aria-label="Close">&times;</button></header>' +
      '<div class="vmedia-tabs" role="tablist">' +
      '<button type="button" class="vmedia-tab is-active" data-tab="site" role="tab">Site files</button>' +
      '<button type="button" class="vmedia-tab" data-tab="cloudinary" role="tab">Cloudinary</button>' +
      '<button type="button" class="vmedia-tab" data-tab="url" role="tab">Paste a link</button>' +
      "</div>" +
      '<div class="vmedia-body">' +
      '<section class="vmedia-pane is-active" data-pane="site">' +
      '<div class="vmedia-search"><input type="search" placeholder="Search files…" aria-label="Search files"></div>' +
      '<div class="vmedia-grid" data-grid></div>' +
      '<p class="vmedia-empty" data-empty hidden>No files found. Paste a link or use Cloudinary.</p>' +
      "</section>" +
      '<section class="vmedia-pane" data-pane="cloudinary">' +
      '<div class="vmedia-cloud"><span class="vmedia-cloud__mark">☁</span><h3>Cloudinary media library</h3>' +
      "<p>Upload or pick from the same Cloudinary account the CMS uses. Files stay on Cloudinary and the public URL is saved.</p>" +
      '<button type="button" class="vmedia-button vmedia-button--primary" data-cloudinary>Open Cloudinary library</button>' +
      '<p class="vmedia-error" data-cloudinary-error hidden></p></div>' +
      "</section>" +
      '<section class="vmedia-pane" data-pane="url">' +
      '<label class="vmedia-url-label">File URL' +
      '<input type="url" data-url placeholder="/uploads/media/example.jpg or https://…">' +
      "</label>" +
      '<p class="vmedia-help">Use a path that starts with <code>/uploads/</code> for a file in this site, or a full <code>https://</code> URL for an external file.</p>' +
      '<div class="vmedia-url-preview" data-url-preview></div>' +
      "</section>" +
      "</div>" +
      '<footer class="vmedia-footer">' +
      '<span class="vmedia-count" data-count></span>' +
      '<div class="vmedia-actions">' +
      '<button type="button" class="vmedia-button" data-cancel>Cancel</button>' +
      '<button type="button" class="vmedia-button vmedia-button--primary" data-use disabled>Use selected file</button>' +
      "</div></footer>" +
      "</div>";

    document.body.appendChild(modal);
    document.addEventListener("keydown", onKeydown, true);

    var grid = modal.querySelector("[data-grid]");
    var empty = modal.querySelector("[data-empty]");
    var search = modal.querySelector(".vmedia-search input");
    var count = modal.querySelector("[data-count]");
    var useButton = modal.querySelector("[data-use]");
    var files = [];

    function updateFooter() {
      if (selected.length) {
        count.textContent = multiple ? selected.length + " selected" : "1 selected";
        useButton.disabled = false;
        useButton.textContent = multiple ? "Add " + selected.length + (selected.length === 1 ? " file" : " files") : "Use selected file";
      } else {
        count.textContent = multiple ? "Select one or more files" : "Select a file";
        useButton.disabled = true;
        useButton.textContent = multiple ? "Add files" : "Use selected file";
      }
    }

    function finish(urls) {
      if (!urls.length) return;
      close();
      if (options.onSelect) options.onSelect(urls);
    }

    function toggle(button, file) {
      var url = file.path;
      if (!multiple) {
        selected = [url];
        grid.querySelectorAll(".vmedia-item").forEach(function (item) {
          item.classList.toggle("is-selected", item === button);
        });
        updateFooter();
        return;
      }
      var index = selected.indexOf(url);
      if (index >= 0) selected.splice(index, 1);
      else selected.push(url);
      button.classList.toggle("is-selected", selected.indexOf(url) >= 0);
      updateFooter();
    }

    function renderFiles() {
      var query = (search.value || "").trim().toLowerCase();
      var list = files.filter(function (file) {
        return !query || (file.name + " " + (file.folder || "")).toLowerCase().indexOf(query) >= 0;
      });
      empty.hidden = list.length > 0;
      grid.innerHTML = list
        .map(function (file, index) {
          var isImage = /\.(jpe?g|png|gif|webp|avif|svg)$/i.test(file.path);
          var thumb = isImage
            ? '<img src="' + esc(file.path) + '" alt="" loading="lazy">'
            : '<span class="vmedia-file-icon">' + (kind === "pdf" || /\.pdf$/i.test(file.path) ? "▤" : "▶") + "</span>";
          return (
            '<button type="button" class="vmedia-item' +
            (selected.indexOf(file.path) >= 0 ? " is-selected" : "") +
            '" data-index="' +
            index +
            '" title="' +
            esc(file.path) +
            '">' +
            '<span class="vmedia-thumb">' +
            thumb +
            "</span>" +
            '<span class="vmedia-name">' +
            esc(file.name) +
            "</span>" +
            (file.folder ? '<span class="vmedia-folder">' + esc(file.folder) + "</span>" : "") +
            "</button>"
          );
        })
        .join("");
      grid.querySelectorAll(".vmedia-item").forEach(function (button) {
        button.addEventListener("click", function () {
          var file = list[Number(button.getAttribute("data-index"))];
          if (file) toggle(button, file);
        });
        button.addEventListener("dblclick", function () {
          var file = list[Number(button.getAttribute("data-index"))];
          if (file) finish([file.path]);
        });
      });
    }

    loadManifest().then(function (manifest) {
      files = fileList(manifest, kind);
      renderFiles();
      updateFooter();
    });

    search.addEventListener("input", renderFiles);

    modal.querySelectorAll("[data-tab]").forEach(function (tab) {
      tab.addEventListener("click", function () {
        modal.querySelectorAll("[data-tab]").forEach(function (item) {
          item.classList.toggle("is-active", item === tab);
        });
        modal.querySelectorAll("[data-pane]").forEach(function (pane) {
          pane.classList.toggle("is-active", pane.getAttribute("data-pane") === tab.getAttribute("data-tab"));
        });
      });
    });

    modal.querySelector(".vmedia-close").addEventListener("click", close);
    modal.querySelector("[data-cancel]").addEventListener("click", close);
    modal.addEventListener("click", function (event) {
      if (event.target === modal) close();
    });

    useButton.addEventListener("click", function () {
      if (selected.length) finish(selected.slice());
    });

    var urlInput = modal.querySelector("[data-url]");
    var urlPreview = modal.querySelector("[data-url-preview]");
    urlInput.addEventListener("input", function () {
      var value = urlInput.value.trim();
      urlPreview.innerHTML = "";
      if (!value) return;
      if (/\.(jpe?g|png|gif|webp|avif|svg)(\?|$)/i.test(value) || kind === "image") {
        var img = document.createElement("img");
        img.src = value;
        img.alt = "";
        img.onerror = function () {
          urlPreview.innerHTML = '<span class="vmedia-url-error">That image could not be loaded. Check the URL.</span>';
        };
        urlPreview.appendChild(img);
      } else {
        urlPreview.textContent = value;
      }
      selected = [value];
      updateFooter();
    });
    urlInput.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        event.preventDefault();
        if (urlInput.value.trim()) finish([urlInput.value.trim()]);
      }
    });

    modal.querySelector("[data-cloudinary]").addEventListener("click", function () {
      var error = modal.querySelector("[data-cloudinary-error]");
      error.hidden = true;
      loadCloudinary()
        .then(function () {
          global.cloudinary.openMediaLibrary(
            {
              cloud_name: CLOUDINARY.cloudName,
              api_key: CLOUDINARY.apiKey,
              multiple: multiple,
              insert_caption: false,
              max_files: multiple ? 30 : 1,
            },
            {
              insertHandler: function (data) {
                var urls = (data.assets || [])
                  .map(function (asset) {
                    return asset.secure_url || asset.url || "";
                  })
                  .filter(Boolean);
                finish(urls);
              },
            }
          );
        })
        .catch(function (err) {
          error.hidden = false;
          error.textContent = "Cloudinary could not be opened: " + err.message + ". You can still paste a link.";
        });
    });

    setTimeout(function () {
      search.focus();
    }, 50);
  }

  global.VCMSMedia = { open: open };
})(window);
