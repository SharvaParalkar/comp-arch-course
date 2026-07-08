/**
 * calab.net router
 *
 * /{course-slug}/*  →  https://course-{course-slug}.pages.dev/*  (allowlisted slugs only)
 * everything else   →  https://calab-main.pages.dev/*
 *
 * Only paths whose first segment is a known course slug are routed to course Pages
 * projects. Main-site paths like /admin/, /about.html, /projects/ stay on calab-main.
 */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const parts = url.pathname.split('/').filter(Boolean);
    const courseSlugs = parseCourseSlugs(env.COURSE_SLUGS);

    if (parts.length > 0 && courseSlugs.has(parts[0])) {
      const slug = parts[0];
      const rest = pathnameAfterSlug(url.pathname, parts);
      const targetUrl = `https://course-${slug}.pages.dev${rest}${url.search}`;

      const resp = await proxyToPages(targetUrl, request);
      if (resp.status === 404) {
        return resp;
      }

      return rewriteRedirectLocation(resp, slug);
    }

    const targetUrl = `https://calab-main.pages.dev${url.pathname}${url.search}`;
    return proxyToPages(targetUrl, request);
  },
};

function parseCourseSlugs(raw) {
  const value = raw || 'structure';
  return new Set(
    value
      .split(',')
      .map((slug) => slug.trim())
      .filter(Boolean)
  );
}

/** Proxy to a *.pages.dev origin with the correct Host header. */
function proxyToPages(targetUrl, request) {
  const target = new URL(targetUrl);
  const headers = new Headers(request.headers);
  headers.set('Host', target.host);
  return fetch(target.toString(), {
    method: request.method,
    headers,
    body: request.body,
    redirect: 'manual',
  });
}

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
