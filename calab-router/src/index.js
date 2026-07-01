/**
 * calab.net router
 *
 * /{course-slug}/*  →  https://course-{course-slug}.pages.dev/*
 * everything else   →  https://calab-main.pages.dev/*
 *
 * Rewrites relative redirect Location headers so /structure/admin on Pages
 * does not send the browser to calab.net/admin.
 */
export default {
  async fetch(request) {
    const url = new URL(request.url);
    const parts = url.pathname.split('/').filter(Boolean);

    if (parts.length > 0) {
      const slug = parts[0];
      const rest = pathnameAfterSlug(url.pathname, parts);
      const targetUrl = `https://course-${slug}.pages.dev${rest}${url.search}`;

      const resp = await fetch(targetUrl, request);
      if (resp.status === 404) {
        return resp;
      }

      return rewriteRedirectLocation(resp, slug);
    }

    return fetch(`https://calab-main.pages.dev${url.pathname}${url.search}`, request);
  },
};

/** Preserve trailing slash when proxying to Pages. */
function pathnameAfterSlug(pathname, parts) {
  const suffix = parts.slice(1).join('/');
  if (!suffix) {
    return pathname.endsWith('/') ? '/' : '';
  }
  const rest = `/${suffix}`;
  return pathname.endsWith('/') && !rest.endsWith('/') ? `${rest}/` : rest;
}

/** Prepend /{slug} to relative redirect targets from the course Pages origin. */
function rewriteRedirectLocation(response, slug) {
  if (response.status < 300 || response.status >= 400) {
    return response;
  }

  const location = response.headers.get('Location');
  if (!location || !location.startsWith('/') || location.startsWith(`//`)) {
    return response;
  }

  const prefix = `/${slug}`;
  if (location === prefix || location.startsWith(`${prefix}/`)) {
    return response;
  }

  const headers = new Headers(response.headers);
  headers.set('Location', `${prefix}${location}`);
  return new Response(response.body, { status: response.status, headers });
}
