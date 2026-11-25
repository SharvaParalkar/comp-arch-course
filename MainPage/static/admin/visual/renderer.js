/*
 * Visual editor section renderer.
 *
 * This mirrors src/_includes/sections/render.njk so the editor canvas uses the
 * same markup and classes as the published site. Content is never stored as
 * HTML: the editor reads and writes the structured `sections` array in YAML.
 */
(function (global) {
  "use strict";

  var ESCAPES = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };

  var markdown =
    global.markdownit &&
    global.markdownit({ html: true, linkify: true, typographer: true });

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (ch) {
      return ESCAPES[ch];
    });
  }

  function text(value) {
    return value == null ? "" : String(value);
  }

  function attr(name, value) {
    if (value == null || value === "") return "";
    return " " + name + '="' + escapeHtml(value) + '"';
  }

  function classes() {
    var out = [];
    for (var i = 0; i < arguments.length; i += 1) {
      var value = arguments[i];
      if (!value) continue;
      if (Array.isArray(value)) {
        out = out.concat(value.filter(Boolean));
      } else {
        out.push(String(value));
      }
    }
    return out.join(" ");
  }

  function field(path, extra) {
    return ' data-cms-field="' + escapeHtml(path) + '"' + (extra || "");
  }

  function htmlField(path, extra) {
    return field(path, ' data-cms-html="1"' + (extra || ""));
  }

  function sectionAttrs(type) {
    return ' data-cms-section-type="' + escapeHtml(type) + '"';
  }

  function plain(value) {
    return text(value)
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function renderMarkdown(value) {
    var source = text(value);
    if (!source.trim()) return "";
    if (markdown) return markdown.render(source);
    return "<p>" + escapeHtml(source).replace(/\n\n+/g, "</p><p>").replace(/\n/g, "<br>") + "</p>";
  }

  function renderPageBasics(page) {
    page = page || {};
    var heading = text(page.page_heading).trim();
    var content = text(page.page_content);
    var image = text(page.page_image).trim();
    var alt = text(page.page_image_alt);
    if (!heading && !content.trim() && !image) return "";

    var html = "";
    if (heading) {
      html +=
        '<section class="section page-heading-section" data-cms-page-basics="heading">' +
        '<div class="container"><h1 class="h-x-large" data-cms-page-field="page_heading">' +
        escapeHtml(heading) +
        "</h1></div></section>";
    }

    if (image) {
      html +=
        '<section class="section page-content-section" data-cms-page-basics="content">' +
        '<div class="container"><div class="image-text' +
        (page.page_image_position === "left" ? " is-image-left" : "") +
        '">' +
        '<div class="image-text__body txt-large w-richtext" data-cms-page-field="page_content" data-cms-html="1">' +
        renderMarkdown(content) +
        "</div>" +
        '<div class="image-text__media"' + styleAttr(frameStyle({ image_width: page.page_image_width, image_align: page.page_image_align, image_radius: page.page_image_radius })) + '>' +
        imgTag({
          src: image,
          alt: alt,
          path: "page_image",
          className: "image-text__img image-text__img--fit",
          emptyLabel: "Choose an image",
        }).replace('data-cms-media="page_image"', 'data-cms-page-media="page_image"') +
        "</div></div></div></section>";
    } else if (content.trim()) {
      html +=
        '<section class="section page-content-section" data-cms-page-basics="content">' +
        '<div class="container"><div class="d"><div class="txt-large w-richtext" data-cms-page-field="page_content" data-cms-html="1">' +
        renderMarkdown(content) +
        "</div></div></div></section>";
    }

    return html;
  }

  function mediaUrl(value) {
    var src = text(value).trim();
    if (!src) return "";
    // GrapeJS converts relative sources to absolute canvas URLs. Store the
    // site-relative form so YAML stays portable.
    try {
      if (typeof window !== "undefined" && window.location && window.location.origin) {
        var origin = window.location.origin;
        if (src.indexOf(origin + "/") === 0) return src.slice(origin.length);
      }
    } catch (e) {
      /* ignore */
    }
    return src;
  }

  function numberInRange(value, min, max, fallback) {
    var number = Number(value);
    if (!Number.isFinite(number)) return fallback;
    return Math.min(max, Math.max(min, number));
  }

  function frameStyle(item, fallback) {
    if (!item) return "";
    var base = fallback || {};
    var widthValue = item.image_width != null ? item.image_width : base.image_width;
    var alignValue = item.image_align != null ? item.image_align : base.image_align;
    var radiusValue = item.image_radius != null ? item.image_radius : base.image_radius;
    var hasWidth = widthValue !== undefined && widthValue !== null && widthValue !== "";
    var hasAlign = alignValue !== undefined && alignValue !== null && alignValue !== "";
    var hasRadius = radiusValue !== undefined && radiusValue !== null && radiusValue !== "";
    if (!hasWidth && !hasAlign && !hasRadius) return "";
    var width = hasWidth ? numberInRange(widthValue, 10, 100, 100) : 100;
    var align = ["left", "center", "right"].indexOf(alignValue) >= 0 ? alignValue : "center";
    var radius = radiusValue;
    if (width >= 100 && (!hasAlign || align === "center") && !radius) return "";
    var styles = [];
    if (width < 100) styles.push("width:" + width + "%", "max-width:" + width + "%");
    if (hasAlign || width < 100) {
      if (align === "center") styles.push("justify-self:center", "margin-left:auto", "margin-right:auto");
      else if (align === "right") styles.push("justify-self:end", "margin-left:auto", "margin-right:0");
      else styles.push("justify-self:start", "margin-left:0", "margin-right:auto");
    }
    if (radius === "rounded") styles.push("border-radius:12px", "overflow:hidden");
    else if (radius === "soft") styles.push("border-radius:4px", "overflow:hidden");
    return styles.join(";");
  }

  function cardStyle(entry, kind) {
    if (!entry) return "";
    var publication = kind === "publication";
    var scaleValue = publication ? entry.image_scale : entry.card_image_scale;
    var positionValue = publication ? entry.image_position : entry.card_image_position;
    var hasScale = scaleValue !== undefined && scaleValue !== null && scaleValue !== "";
    var hasPosition = positionValue !== undefined && positionValue !== null && positionValue !== "";
    if (!hasScale && !hasPosition) return "";
    var scale = numberInRange(scaleValue, 100, 180, 100);
    var position = String(positionValue || "center");
    if (["center", "top", "bottom", "left", "right"].indexOf(position) < 0) position = "center";
    if (scale === 100 && position === "center") return "";
    var styles = [];
    if (position !== "center" || scale !== 100) styles.push("object-position:" + position);
    if (scale !== 100) styles.push("transform:scale(" + (scale / 100).toFixed(3) + ")", "transform-origin:center");
    return styles.join(";");
  }

  function styleAttr(style) {
    return style ? ' style="' + escapeHtml(style) + '"' : "";
  }

  function imgTag(opts) {
    opts = opts || {};
    var src = text(opts.src).trim();
    var path = opts.path || "image";
    if (!src) {
      return (
        '<div class="cms-vis-media-empty ' +
        escapeHtml(opts.emptyClass || "") +
        '" data-cms-media="' +
        escapeHtml(path) +
        '"><span class="cms-vis-media-empty__icon" aria-hidden="true">+</span><span>' +
        escapeHtml(opts.emptyLabel || "Choose an image") +
        "</span></div>"
      );
    }
    return (
      '<img src="' +
      escapeHtml(src) +
      '" alt="' +
      escapeHtml(opts.alt || "") +
      '"' +
      attr("class", opts.className) +
      attr("loading", opts.loading || "lazy") +
      ' data-cms-media="' +
      escapeHtml(path) +
      '"' +
      (opts.width ? attr("width", opts.width) : "") +
      (opts.height ? attr("height", opts.height) : "") +
      ">"
    );
  }

  function anchorFor(src, path, label, inner, extraAttrs) {
    if (!src) return inner;
    return (
      '<a class="project-gallery__link" href="' +
      escapeHtml(src) +
      '" data-project-lightbox' +
      (extraAttrs || "") +
      ' aria-label="' +
      escapeHtml(label || "View image larger") +
      '">' +
      inner +
      "</a>"
    );
  }

  function videoTag(opts) {
    opts = opts || {};
    var src = text(opts.src).trim();
    if (!src) {
      return (
        '<div class="cms-vis-media-empty cms-vis-media-empty--video" data-cms-media="' +
        escapeHtml(opts.path || "video_url") +
        '"><span class="cms-vis-media-empty__icon" aria-hidden="true">▶</span><span>Choose a video</span></div>'
      );
    }
    return (
      '<video' +
      attr("class", opts.className) +
      ' src="' +
      escapeHtml(src) +
      '"' +
      (opts.attrs || "") +
      ' data-cms-media="' +
      escapeHtml(opts.path || "video_url") +
      '"></video>'
    );
  }

  function renderHomeMasthead(section, ctx) {
    var hero = (ctx && ctx.entry && ctx.entry.home_hero_text) || {};
    var logo = text(hero.hero_logo_src || "").trim();
    var line1 = text(hero.hero_title_line_1 || section.title_line_1 || "");
    var line2 = text(hero.hero_title_line_2 || section.title_line_2 || "");
    var subtitle = text(hero.hero_subtitle || section.subtitle || "");
    var hasVideo = !!(
      section.video_lq_url ||
      section.video_lq_mp4_url ||
      section.video_hq_url ||
      section.video_ultra_url
    );

    var media = "";
    if (hasVideo) {
      var lq = text(section.video_lq_mp4_url || section.video_lq_url || "").trim();
      media +=
        '<div class="home-masthead__media" aria-hidden="true">' +
        (lq
          ? videoTag({
              src: lq,
              className: "home-masthead__video home-masthead__video--lq",
              path: "video_lq_url",
              attrs: ' data-home-hero="lq" muted autoplay loop playsinline webkit-playsinline x5-playsinline preload="auto"',
            })
          : "") +
        (section.video_hq_url
          ? videoTag({
              src: section.video_hq_url,
              className: "home-masthead__video home-masthead__video--hq",
              path: "video_hq_url",
              attrs: ' data-home-hero="hq" muted loop playsinline webkit-playsinline x5-playsinline preload="none"',
            })
          : "") +
        (section.video_ultra_url
          ? videoTag({
              src: section.video_ultra_url,
              className: "home-masthead__video home-masthead__video--ultra",
              path: "video_ultra_url",
              attrs: ' data-home-hero="ultra" muted loop playsinline webkit-playsinline x5-playsinline preload="none"',
            })
          : "") +
        "</div>";
    } else {
      media =
        '<div class="home-masthead__media home-masthead__media--empty" aria-hidden="true">' +
        '<div class="cms-vis-media-empty cms-vis-media-empty--hero" data-cms-media="video_lq_url">' +
        '<span class="cms-vis-media-empty__icon" aria-hidden="true">▶</span><span>Add a background video in the settings panel</span>' +
        "</div></div>";
    }

    var title;
    if (logo) {
      title =
        '<img class="home-masthead__logo" src="' +
        escapeHtml(logo) +
        '" alt="Cellular Architectures Lab" width="1930" height="690" loading="eager" decoding="sync" fetchpriority="high">';
    } else {
      var titleText = line1 || line2 ? line1 : "Cellular Architectures Lab";
      title =
        '<span class="cms-vis-hero-title"' +
        (line1 || line2 ? ' data-cms-field="title_line_1"' : "") +
        ">" +
        escapeHtml(titleText) +
        "</span>" +
        (line2
          ? '<br><span class="cms-vis-hero-title" data-cms-field="title_line_2">' + escapeHtml(line2) + "</span>"
          : "");
    }

    return (
      "<header" +
      attr("class", "section home-masthead") +
      sectionAttrs("home_masthead") +
      (hasVideo ? " data-home-hero-video" : "") +
      ">" +
      media +
      '<div class="home-masthead__readable" aria-hidden="true"></div>' +
      '<div class="container"><div class="home-masthead__stack">' +
      '<h1 class="display-h home-masthead__title' +
      (logo ? " home-masthead__title--logo" : "") +
      '">' +
      title +
      "</h1>" +
      (subtitle
        ? '<div class="h-x-small home-masthead__tagline"' + field("subtitle") + ">" + escapeHtml(subtitle) + "</div>"
        : "") +
      "</div></div></header>"
    );
  }

  function renderSection(section, ctx) {
    if (!section || !section.type) return "";
    var type = section.type;

    if (type === "home_masthead") return renderHomeMasthead(section, ctx);

    if (type === "headline") {
      return (
        '<section class="section is-t-double"' +
        sectionAttrs("headline") +
        '><div class="container"><div class="d"><div class="h-x-large"' +
        field("text") +
        ">" +
        escapeHtml(section.text || "Add a headline") +
        "</div></div></div></section>"
      );
    }

    if (type === "two_column") {
      return (
        '<section class="section"' +
        sectionAttrs("two_column") +
        '><div class="container">' +
        (section.heading
          ? '<div class="d"><div class="h-medium-div"><h2 class="h-medium"' +
            field("heading") +
            ">" +
            escapeHtml(section.heading) +
            "</h2></div></div>"
          : "") +
        '<div class="d">' +
        '<div class="d is-tab-half"><div class="txt-large w-richtext"' +
        htmlField("left") +
        ">" +
        (section.left || "<p>Left column text</p>") +
        "</div></div>" +
        '<div class="d is-tab-half"><div class="txt-large w-richtext"' +
        htmlField("right") +
        ">" +
        (section.right || "<p>Right column text</p>") +
        "</div></div>" +
        "</div></div></section>"
      );
    }

    if (type === "hero_video") {
      return (
        '<header class="section is-hero"' +
        sectionAttrs("hero_video") +
        '><div class="bg-video-wrap"><div class="video-aspect-box">' +
        videoTag({
          src: section.video_url,
          className: "video-element",
          path: "video_url",
          attrs: ' loading="eager" preload="metadata" loop playsinline muted autoplay',
        }) +
        '</div></div><div class="container is-hero-100 is-exclusion"><div class="d"><h1 class="display-h"' +
        field("title") +
        ">" +
        escapeHtml(section.title || "Add a title") +
        "</h1></div></div></header>"
      );
    }

    if (type === "hero_image") {
      return (
        '<header class="section is-hero"' +
        sectionAttrs("hero_image") +
        '><div class="bg-video-wrap"><div class="video-aspect-box">' +
        imgTag({
          src: section.image,
          alt: section.alt || section.title || "",
          path: "image",
          className: "video-element hero-still",
          loading: "eager",
          emptyClass: "cms-vis-media-empty--hero",
          emptyLabel: "Choose a hero image",
        }) +
        '</div></div><div class="container is-hero-100 is-exclusion"><div class="d">' +
        (section.title
          ? '<h1 class="display-h"' + field("title") + ">" + escapeHtml(section.title) + "</h1>"
          : "") +
        (section.subtitle
          ? '<div class="h-x-small hero-still__subtitle"' + field("subtitle") + ">" + escapeHtml(section.subtitle) + "</div>"
          : "") +
        "</div></div></header>"
      );
    }

    if (type === "video") {
      return (
        '<section class="section page-media-section"' +
        sectionAttrs("video") +
        '><div class="container"><figure class="page-media">' +
        videoTag({
          src: section.video_url,
          className: "video-element",
          path: "video_url",
          attrs: ' loading="lazy" preload="metadata" loop playsinline muted autoplay controls',
        }) +
        (section.caption
          ? '<figcaption class="page-media__caption h-x-small"' + field("caption") + ">" + escapeHtml(section.caption) + "</figcaption>"
          : "") +
        "</figure></div></section>"
      );
    }

    if (type === "image") {
      var imageInner = imgTag({
        src: section.image,
        alt: section.alt || "",
        path: "image",
        emptyLabel: "Choose an image",
      });
      return (
        '<section class="section page-media-section"' +
        sectionAttrs("image") +
        '><div class="container"><figure class="page-media' +
        (section.fit_mode === "fill" ? " page-media--fill" : "") +
        '"' + styleAttr(frameStyle(section)) + '>' +
        anchorFor(section.image, "image", "View image larger: " + (section.alt || (ctx && ctx.entry && ctx.entry.title) || ""), imageInner) +
        (section.caption
          ? '<figcaption class="page-media__caption h-x-small"' + field("caption") + ">" + escapeHtml(section.caption) + "</figcaption>"
          : "") +
        "</figure></div></section>"
      );
    }

    if (type === "image_text") {
      return (
        '<section class="section"' +
        sectionAttrs("image_text") +
        '><div class="container"><div class="image-text' +
        (section.image_position === "left" ? " is-image-left" : "") +
        '">' +
        '<div class="image-text__body txt-large w-richtext"' +
        htmlField("body") +
        ">" +
        (section.body || "<p>Write something about this image.</p>") +
        "</div>" +
        (section.image
          ? '<div class="image-text__media"' + styleAttr(frameStyle(section)) + '>' +
            imgTag({
              src: section.image,
              alt: section.alt || "",
              path: "image",
              className: "image-text__img" + (section.fit_mode === "fit" ? " image-text__img--fit" : ""),
            }) +
            "</div>"
          : '<div class="image-text__media"><div class="cms-vis-media-empty" data-cms-media="image"><span class="cms-vis-media-empty__icon" aria-hidden="true">+</span><span>Choose an image</span></div></div>') +
        "</div></div></section>"
      );
    }

    if (type === "image_gallery") {
      var images = Array.isArray(section.images) ? section.images : [];
      var items = "";
      images.forEach(function (item, index) {
        if (!item) return;
        var src = text(item.image).trim();
        var inner = imgTag({
          src: src,
          alt: item.alt || "",
          path: "images." + index + ".image",
          className: "image-gallery__img" + (item.fit_mode === "fill" ? " image-gallery__img--fill" : ""),
          emptyLabel: "Choose an image",
        });
        items +=
          '<figure class="image-gallery__item"' + styleAttr(frameStyle(item, section)) + '>' +
          anchorFor(src, "images." + index + ".image", "View image larger: " + (item.alt || ""), inner) +
          (item.caption
            ? '<figcaption class="image-gallery__caption"' + field("images." + index + ".caption") + ">" + escapeHtml(item.caption) + "</figcaption>"
            : "") +
          "</figure>";
      });
      if (!items) {
        items =
          '<div class="cms-vis-media-empty cms-vis-media-empty--gallery" data-cms-gallery-empty="1">' +
          '<span class="cms-vis-media-empty__icon" aria-hidden="true">▦</span>' +
          "<span>No images yet. Add images in the settings panel</span></div>";
      }
      return (
        '<section class="section image-gallery-section"' +
        sectionAttrs("image_gallery") +
        '><div class="container"><div class="image-gallery">' +
        items +
        "</div></div></section>"
      );
    }

    if (type === "stat") {
      return (
        '<section class="section"' +
        sectionAttrs("stat") +
        '><div class="container"><div class="d"><div class="vert-div">' +
        '<div class="display-eyebrow-div"><div class="h-x-small"' +
        field("label") +
        ">" +
        escapeHtml(section.label || "Label") +
        "</div></div>" +
        '<div class="display-h is-data"' +
        field("value") +
        ">" +
        escapeHtml(section.value || "0") +
        "</div></div></div></div></section>"
      );
    }

    if (type === "rich_text") {
      return (
        '<section class="section"' +
        sectionAttrs("rich_text") +
        '><div class="container"><div class="d"><div class="txt-large w-richtext"' +
        htmlField("body") +
        ">" +
        (section.body || "<p>Write your text here.</p>") +
        "</div></div></div></section>"
      );
    }

    if (type === "pdf") {
      var file = text(section.file).trim();
      return (
        '<section class="section pdf-embed-section"' +
        sectionAttrs("pdf") +
        '><div class="container"><div class="pdf-embed">' +
        '<div class="pdf-embed__actions">' +
        '<a href="' +
        escapeHtml(file || "#") +
        '" download target="_blank" rel="noopener"' +
        field("download_label") +
        ">" +
        escapeHtml(section.download_label || "Download PDF") +
        "</a>" +
        '<a href="' +
        escapeHtml(file || "#") +
        '" target="_blank" rel="noopener">Open in new tab</a>' +
        "</div>" +
        '<div class="pdf-embed__frame cms-vis-pdf-placeholder">' +
        '<span class="cms-vis-media-empty__icon" aria-hidden="true">▤</span>' +
        "<span>" +
        (file ? "PDF preview appears on the live site" : "Choose a PDF in the settings panel") +
        "</span>" +
        "</div>" +
        '<p class="pdf-embed__fallback">Can’t view the PDF here? <a href="' +
        escapeHtml(file || "#") +
        '" target="_blank" rel="noopener">Open it in a new tab</a> or <a href="' +
        escapeHtml(file || "#") +
        '" download>download it</a>.</p>' +
        "</div></div></section>"
      );
    }

    return "";
  }

  var MEDIA_TYPES = ["image", "video", "hero_image", "hero_video", "image_gallery"];

  function isMediaType(type) {
    return MEDIA_TYPES.indexOf(type) >= 0;
  }

  function renderDetailGalleryGroup(section) {
    if (!section || !isMediaType(section.type)) return "";
    var figures = "";

    function figure(src, alt, path, style, kind) {
      var inner;
      if (!src) {
        inner =
          '<div class="cms-vis-media-empty" data-cms-media="' +
          escapeHtml(path) +
          '"><span class="cms-vis-media-empty__icon" aria-hidden="true">+</span><span>Choose a file</span></div>';
      } else if (kind === "video") {
        inner =
          '<video src="' +
          escapeHtml(src) +
          '" muted loop playsinline preload="metadata" data-cms-media="' +
          escapeHtml(path) +
          '"></video>';
      } else {
        inner =
          '<img src="' +
          escapeHtml(src) +
          '" alt="' +
          escapeHtml(alt || "") +
          '" loading="lazy" data-cms-media="' +
          escapeHtml(path) +
          '">';
      }
      return (
        '<figure class="fit-gallery__item" data-cms-media-frame="' +
        escapeHtml(path) +
        '"' +
        styleAttr(style) +
        ">" +
        (kind === "video" || !src
          ? inner
          : '<a class="project-gallery__link" href="' +
            escapeHtml(src) +
            '" data-project-lightbox aria-label="View image larger">' +
            inner +
            "</a>") +
        "</figure>"
      );
    }

    if (section.type === "image") {
      figures += figure(section.image, section.alt, "image", frameStyle(section), "image");
    } else if (section.type === "image_gallery") {
      (section.images || []).forEach(function (item, index) {
        if (!item) return;
        figures += figure(item.image, item.alt, "images." + index + ".image", frameStyle(item, section), "image");
      });
    } else if (section.type === "hero_image") {
      figures += figure(section.image, section.alt, "image", frameStyle(section), "image");
    } else if (section.type === "video" || section.type === "hero_video") {
      figures += figure(section.video_url, "", "video_url", frameStyle(section), "video");
    }

    return (
      '<div data-cms-section-type="' +
      escapeHtml(section.type) +
      '" data-cms-gallery-group="1" style="display:contents">' +
      figures +
      "</div>"
    );
  }

  function detailAuthors(sections) {
    for (var i = 0; i < (sections || []).length; i += 1) {
      var section = sections[i];
      if (!section || section.type !== "rich_text" || !section.body) continue;
      var match = String(section.body).match(/<em[^>]*>([\s\S]*?)<\/em>/i);
      if (match) {
        var value = plain(match[1]).replace(/^instructors?:\s*/i, "");
        if (value) return value;
      }
    }
    return "";
  }

  function renderDetailShell(entry, visual, copyHtml, mediaHtml, mediaCount, authors) {
    entry = entry || {};
    visual = visual || {};
    var category = visual.category || entry.category || "";
    var year = entry.year || "";
    var authors = authors || visual.instructors || entry.instructors || "";
    var meta = [year, category].filter(Boolean).join(" · ");
    return (
      '<section class="section detail-split" data-cms-detail-root="1">' +
      '<div class="container"><div class="detail-split__grid">' +
      '<div class="detail-split__copy" data-cms-column="copy">' +
      '<header class="detail-header">' +
      (meta ? '<div class="h-x-small detail-header__meta">' + escapeHtml(meta) + "</div>" : "") +
      '<h1 class="h-x-large detail-header__title">' +
      escapeHtml(entry.title || "Untitled") +
      "</h1>" +
      (authors ? '<p class="detail-header__authors">' + escapeHtml(authors) + "</p>" : "") +
      "</header>" +
      (copyHtml || '<p class="cms-detail-empty">Add text blocks from the left panel.</p>') +
      "</div>" +
      '<div class="detail-split__gallery" data-cms-column="media">' +
      '<div class="fit-gallery' +
      (mediaCount === 1 ? " is-single" : "") +
      '" data-cms-gallery>' +
      (mediaHtml || '<div class="cms-vis-media-empty cms-vis-media-empty--gallery">Add images, galleries, or videos from the left panel.</div>') +
      "</div></div></div></div></section>"
    );
  }

  function cardMedia(visual, entry, kind) {
    if (kind === "publication") {
      var image = visual.image || entry.image || "";
      return image
        ? '<img src="' +
            escapeHtml(image) +
            '" alt="' +
            escapeHtml(entry.title || "") +
            '" loading="lazy" class="publication-card__img is-active" data-cms-card-media="image"' +
            styleAttr(cardStyle(visual, "publication")) +
            ">"
        : '<div class="publication-card__placeholder" aria-hidden="true" data-cms-card-media="image"></div>';
    }
    var cover = visual.cover_image || entry.cover_image || "";
    if (!cover && Array.isArray(visual.card_images) && visual.card_images[0]) {
      cover = visual.card_images[0].image || "";
    }
    return cover
      ? '<img src="' +
          escapeHtml(cover) +
          '" alt="' +
          escapeHtml(entry.title || "") +
          '" loading="lazy" class="project-card__img is-active" data-cms-card-media="cover_image"' +
          styleAttr(cardStyle(visual, "card")) +
          ">"
      : '<div class="project-card__placeholder" aria-hidden="true" data-cms-card-media="cover_image"></div>';
  }

  function renderCardStage(context, visual, entry) {
    entry = entry || {};
    visual = visual || {};
    var isPublication = context === "publication";
    var isTeaching = context === "teaching";

    if (isPublication) {
      return (
        '<section class="section cms-card-stage" data-cms-card-root="1">' +
        '<div class="container">' +
        '<div class="cms-card-stage__head"><span class="cms-vis-lock">Listing card</span><strong>How this publication looks in the list</strong><p>Click authors or venue to edit. Use the Card tab for the image and links.</p></div>' +
        '<div class="publications-grid cms-card-stage__grid">' +
        '<article class="publication-card">' +
        '<div class="publication-card__media">' +
        (visual.image
          ? '<a class="project-gallery__link publication-card__carousel" href="' + escapeHtml(visual.image) + '" data-project-lightbox aria-label="View publication image larger">' + cardMedia(visual, entry, "publication") + "</a>"
          : cardMedia(visual, entry, "publication")) +
        "</div>" +
        '<div class="publication-card__body">' +
        '<h3 class="publication-card__title">' + escapeHtml(entry.title || "Untitled publication") + "</h3>" +
        '<p class="publication-card__authors" data-cms-card-field="authors">' + escapeHtml(visual.authors || "Add authors") + "</p>" +
        '<p class="publication-card__venue" data-cms-card-field="venue">' + escapeHtml(visual.venue || "Add venue") + "</p>" +
        '<div class="publication-card__links">' +
        (visual.pdf_url ? '<a href="' + escapeHtml(visual.pdf_url) + '" target="_blank" rel="noopener">PDF</a>' : "") +
        (visual.bibtex_url ? '<a href="' + escapeHtml(visual.bibtex_url) + '" target="_blank" rel="noopener">BibTeX</a>' : "") +
        (visual.article_url ? '<a href="' + escapeHtml(visual.article_url) + '" target="_blank" rel="noopener">Article</a>' : "") +
        "</div></div></article></div></div></section>"
      );
    }

    return (
      '<section class="section cms-card-stage" data-cms-card-root="1">' +
      '<div class="container">' +
      '<div class="cms-card-stage__head"><span class="cms-vis-lock">Listing card</span><strong>How this ' +
      (isTeaching ? "teaching page" : "project") +
      " looks in the list</strong><p>Click the summary" +
      (isTeaching ? " or instructors" : "") +
      " to edit. Use the Card tab for images and image design.</p></div>" +
      '<div class="projects-grid cms-card-stage__grid">' +
      '<article class="project-card">' +
      '<div class="project-card__media">' +
      (visual.cover_image || (visual.card_images && visual.card_images[0] && visual.card_images[0].image)
        ? '<a class="project-gallery__link project-card__carousel" href="#" aria-label="View card image">' + cardMedia(visual, entry, "card") + "</a>"
        : cardMedia(visual, entry, "card")) +
      "</div>" +
      (entry.year ? '<div class="project-card__year">' + escapeHtml(entry.year) + "</div>" : "") +
      '<h3 class="project-card__title"><a href="#">' + escapeHtml(entry.title || "Untitled") + "</a></h3>" +
      (isTeaching
        ? '<p class="project-card__instructors"><strong>Instructors:</strong> <span data-cms-card-field="instructors">' + escapeHtml(visual.instructors || "Add instructors") + "</span></p>"
        : "") +
      '<p class="project-card__summary" data-cms-card-field="summary">' + escapeHtml(visual.summary || "Add a short summary") + "</p>" +
      "</article></div></div></section>"
    );
  }

  function renderExtras(entry) {
    if (!entry) return "";
    var out = "";
    if (entry.show_projects_grid) {
      out += renderGridPlaceholder("projects", "Projects grid", "Generated automatically from every entry in the Projects collection.");
    }
    if (entry.show_publications_list) {
      out += renderGridPlaceholder("publications", "Publications list", "Generated automatically from every entry in the Publications collection.");
    }
    if (entry.show_teaching_grid) {
      out += renderGridPlaceholder("teaching", "Teaching grid", "Generated automatically from every entry in the Teaching collection.");
    }
    if (entry.show_team_grid) {
      out += renderGridPlaceholder("team", "Team grid", "Generated automatically from the groups in Page basics → Team.");
    }
    if (entry.show_contact_form) {
      out +=
        '<section class="section contact-section" data-cms-locked="contact">' +
        '<div class="container contact-section__inner">' +
        '<div class="contact-section__intro">' +
        '<p class="contact-section__eyebrow">Cellular Architectures Laboratory · Texas A&amp;M University</p>' +
        "<h2>Start a conversation</h2>" +
        "<p>The contact form appears here. It is switched on in Page basics.</p>" +
        "</div>" +
        '<div class="cms-vis-locked-card"><span class="cms-vis-lock">Locked</span><strong>Contact form</strong><p>Messages are emailed to the lab. The form itself is not edited visually.</p></div>' +
        "</div></section>";
    }
    return out;
  }

  function renderGridPlaceholder(kind, title, description) {
    var cards = "";
    for (var i = 0; i < 3; i += 1) {
      cards +=
        '<article class="project-card cms-vis-skeleton-card">' +
        '<div class="project-card__media"><div class="project-card__placeholder" aria-hidden="true"></div></div>' +
        '<div class="project-card__year">2024</div>' +
        '<h3 class="project-card__title">Example ' +
        (kind === "publications" ? "publication" : "project") +
        "</h3>" +
        '<p class="project-card__summary">Your published entries will appear here automatically.</p>' +
        "</article>";
    }
    return (
      '<section class="section projects-grid-section cms-vis-generated" data-cms-locked="' +
      escapeHtml(kind) +
      '"><div class="container">' +
      '<div class="cms-vis-generated__bar"><span class="cms-vis-lock">Locked</span><strong>' +
      escapeHtml(title) +
      "</strong><span>" +
      escapeHtml(description) +
      "</span></div>" +
      '<div class="projects-grid' +
      (kind === "publications" ? " publications-grid" : "") +
      '">' +
      cards +
      "</div></div></section>"
    );
  }

  function defaults(type) {
    var base = { type: type };
    switch (type) {
      case "home_masthead":
        return Object.assign(base, {
          title_line_1: "Cellular",
          title_line_2: "Architectures",
          subtitle: "",
          video_lq_url: "",
          video_lq_mp4_url: "",
          video_hq_url: "",
          video_ultra_url: "",
        });
      case "headline":
        return Object.assign(base, { text: "New headline" });
      case "two_column":
        return Object.assign(base, {
          heading: "",
          left: "<p>Left column text. Click here to edit it.</p>",
          right: "<p>Right column text. Click here to edit it.</p>",
        });
      case "hero_video":
        return Object.assign(base, { title: "New hero", video_url: "" });
      case "hero_image":
        return Object.assign(base, { image: "", title: "New hero", subtitle: "", alt: "" });
      case "video":
        return Object.assign(base, { video_url: "", caption: "" });
      case "image":
        return Object.assign(base, { image: "", alt: "", caption: "", fit_mode: "fit" });
      case "image_text":
        return Object.assign(base, {
          image: "",
          alt: "",
          image_position: "right",
          body: "<p>Write something about this image.</p>",
          fit_mode: "fill",
        });
      case "image_gallery":
        return Object.assign(base, { images: [{ image: "", alt: "", caption: "", fit_mode: "fit" }] });
      case "stat":
        return Object.assign(base, { label: "Label", value: "0" });
      case "rich_text":
        return Object.assign(base, { body: "<p>Write your text here. Click on the canvas to edit it.</p>" });
      case "pdf":
        return Object.assign(base, { file: "", title: "", download_label: "Download PDF" });
      default:
        return base;
    }
  }

  var BLOCKS = [
    {
      type: "headline",
      label: "Headline",
      category: "Text",
      description: "A large statement line.",
      icon: "H",
    },
    {
      type: "rich_text",
      label: "Text",
      category: "Text",
      description: "A block of formatted text.",
      icon: "¶",
    },
    {
      type: "two_column",
      label: "Two columns",
      category: "Text",
      description: "Two side-by-side text columns.",
      icon: "▥",
    },
    {
      type: "stat",
      label: "Statistic",
      category: "Text",
      description: "A label with a big number.",
      icon: "№",
    },
    {
      type: "image",
      label: "Image",
      category: "Media",
      description: "A full-width image with caption.",
      icon: "▣",
    },
    {
      type: "image_gallery",
      label: "Image gallery",
      category: "Media",
      description: "A grid of images.",
      icon: "▦",
    },
    {
      type: "image_text",
      label: "Image + text",
      category: "Media",
      description: "An image beside a paragraph.",
      icon: "◫",
    },
    {
      type: "video",
      label: "Video",
      category: "Media",
      description: "A full-width video with caption.",
      icon: "▶",
    },
    {
      type: "hero_image",
      label: "Image hero",
      category: "Heroes",
      description: "A large opening image with a title.",
      icon: "◨",
    },
    {
      type: "hero_video",
      label: "Video hero",
      category: "Heroes",
      description: "A large opening video with a title.",
      icon: "◩",
    },
    {
      type: "home_masthead",
      label: "Home hero video",
      category: "Heroes",
      description: "The full-screen home page video and logo.",
      icon: "⌂",
    },
    {
      type: "pdf",
      label: "PDF document",
      category: "Documents",
      description: "An embedded PDF with download links.",
      icon: "▤",
    },
  ];

  var BLOCK_BY_TYPE = {};
  BLOCKS.forEach(function (block) {
    BLOCK_BY_TYPE[block.type] = block;
  });

  var FIELDS = {
    home_masthead: [
      { path: "title_line_1", label: "Hero title: first line", type: "text", help: "Only used when no hero logo or title is set in Page basics." },
      { path: "title_line_2", label: "Hero title: second line", type: "text" },
      { path: "subtitle", label: "Hero subtitle", type: "text" },
      { path: "video_lq_url", label: "Fast-loading WebM", type: "media", media: "video", help: "A small video that appears instantly while the larger one loads." },
      { path: "video_lq_mp4_url", label: "Fast-loading MP4", type: "media", media: "video", help: "Safari fallback for the small video." },
      { path: "video_hq_url", label: "High-quality MP4", type: "media", media: "video", help: "Loads in the background and fades in." },
      { path: "video_ultra_url", label: "Ultra-quality MP4 (Cloudinary URL)", type: "media", media: "video", help: "Optional. Use a CDN URL for very large files." },
    ],
    headline: [{ path: "text", label: "Headline text", type: "text" }],
    two_column: [
      { path: "heading", label: "Heading (optional)", type: "text" },
      { path: "left", label: "Left column", type: "rich" },
      { path: "right", label: "Right column", type: "rich" },
    ],
    hero_video: [
      { path: "title", label: "Title", type: "text" },
      { path: "video_url", label: "Video URL", type: "media", media: "video" },
    ],
    hero_image: [
      { path: "image", label: "Image", type: "image" },
      { path: "alt", label: "Image description (alt text)", type: "text" },
      { path: "title", label: "Title", type: "text" },
      { path: "subtitle", label: "Subtitle", type: "text" },
    ],
    video: [
      { path: "video_url", label: "Video URL", type: "media", media: "video" },
      { path: "caption", label: "Caption", type: "text" },
    ],
    image: [
      { path: "image", label: "Image", type: "image" },
      { path: "alt", label: "Image description (alt text)", type: "text" },
      { path: "caption", label: "Caption", type: "text" },
      {
        path: "fit_mode",
        label: "Image frame",
        type: "select",
        options: [
          { value: "fit", label: "Fit: show the whole image" },
          { value: "fill", label: "Fill: crop to fill the frame" },
        ],
      },
    ],
    image_text: [
      { path: "image", label: "Image", type: "image" },
      { path: "alt", label: "Image description (alt text)", type: "text" },
      {
        path: "image_position",
        label: "Image position",
        type: "select",
        options: [
          { value: "right", label: "Image on the right" },
          { value: "left", label: "Image on the left" },
        ],
      },
      {
        path: "fit_mode",
        label: "Image frame",
        type: "select",
        options: [
          { value: "fill", label: "Fill: crop to fill the frame" },
          { value: "fit", label: "Fit: show the whole image" },
        ],
      },
      { path: "body", label: "Text", type: "rich" },
    ],
    image_gallery: [
      {
        path: "images",
        label: "Images",
        type: "gallery",
        itemFields: [
          { path: "image", label: "Image", type: "image" },
          { path: "alt", label: "Description", type: "text" },
          { path: "caption", label: "Caption", type: "text" },
        ],
      },
    ],
    stat: [
      { path: "label", label: "Label", type: "text" },
      { path: "value", label: "Value", type: "text" },
    ],
    rich_text: [{ path: "body", label: "Text", type: "rich" }],
    pdf: [
      { path: "file", label: "PDF file", type: "media", media: "pdf" },
      { path: "title", label: "Document title (for accessibility)", type: "text" },
      { path: "download_label", label: "Download link label", type: "text" },
    ],
  };

  function summary(section) {
    if (!section) return "";
    switch (section.type) {
      case "home_masthead":
        return [section.title_line_1, section.title_line_2].filter(Boolean).join(" ") || "Home hero";
      case "headline":
        return section.text || "Headline";
      case "two_column":
        return section.heading || plain(section.left) || "Two columns";
      case "hero_video":
        return section.title || "Video hero";
      case "hero_image":
        return section.title || "Image hero";
      case "video":
        return section.caption || "Video";
      case "image":
        return section.alt || section.caption || (section.image ? "Image" : "Image: no file chosen");
      case "image_text":
        return plain(section.body) || "Image + text";
      case "image_gallery": {
        var count = (section.images || []).filter(function (item) {
          return item && item.image;
        }).length;
        return count + (count === 1 ? " image" : " images");
      }
      case "stat":
        return (section.label || "Stat") + ": " + (section.value || "-");
      case "rich_text":
        return plain(section.body) || "Text";
      case "pdf":
        return section.title || section.download_label || "PDF document";
      default:
        return section.type;
    }
  }

  global.VCMSRenderer = {
    renderSection: renderSection,
    renderPageBasics: renderPageBasics,
    renderExtras: renderExtras,
    renderDetailGalleryGroup: renderDetailGalleryGroup,
    renderDetailShell: renderDetailShell,
    detailAuthors: detailAuthors,
    renderCardStage: renderCardStage,
    renderMarkdown: renderMarkdown,
    isMediaType: isMediaType,
    frameStyle: frameStyle,
    cardStyle: cardStyle,
    defaults: defaults,
    blocks: BLOCKS,
    blockForType: function (type) {
      return BLOCK_BY_TYPE[type];
    },
    fieldsForType: function (type) {
      return FIELDS[type] || [];
    },
    summary: summary,
    labelForType: function (type) {
      return (BLOCK_BY_TYPE[type] && BLOCK_BY_TYPE[type].label) || type;
    },
    escapeHtml: escapeHtml,
    plain: plain,
    mediaUrl: mediaUrl,
  };
})(window);
