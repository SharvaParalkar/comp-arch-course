import React from 'react';
import Link from '@docusaurus/Link';
import Content from '@theme-original/DocItem/Content';
import {
  useActiveVersion,
  useDoc,
  useDocsVersion,
} from '@docusaurus/plugin-content-docs/client';

function formatDate(dateStr) {
  if (!dateStr) return null;
  const date = dateStr instanceof Date ? dateStr : new Date(`${dateStr}T12:00:00`);
  if (Number.isNaN(date.getTime())) return String(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function fileUrl(file) {
  if (!file) return null;
  if (typeof file === 'string') return file;
  return file.url || file.secure_url || file.path || null;
}

function youtubeEmbedId(value) {
  if (!value) return null;
  const raw = String(value).trim();
  if (!raw.includes('/') && !raw.includes('?')) return raw;
  try {
    const url = new URL(raw);
    if (url.hostname.includes('youtu.be')) {
      return url.pathname.replace(/^\//, '') || null;
    }
    if (url.searchParams.get('v')) {
      return url.searchParams.get('v');
    }
    const embedMatch = url.pathname.match(/\/embed\/([^/]+)/);
    if (embedMatch) return embedMatch[1];
  } catch {
    // Fall through for plain IDs.
  }
  return raw;
}

function Downloads({downloads}) {
  const items = (downloads || [])
    .map((item) => ({
      label: item?.label || 'Download',
      href: fileUrl(item?.file),
    }))
    .filter((item) => item.href);

  if (items.length === 0) return null;

  return (
    <div className="doc-downloads">
      <p className="doc-downloads__label">Downloads</p>
      <ul className="doc-downloads__list">
        {items.map((item) => (
          <li key={`${item.label}-${item.href}`}>
            <a href={item.href} target="_blank" rel="noopener noreferrer" download>
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RelatedNotes({relatedDocs}) {
  const version = useDocsVersion();
  const activeVersion = useActiveVersion(undefined);
  const titles = (Array.isArray(relatedDocs)
    ? relatedDocs
    : relatedDocs
      ? [relatedDocs]
      : []
  )
    .map((title) => (typeof title === 'string' ? title.trim() : ''))
    .filter(Boolean);

  if (titles.length === 0) return null;

  const pathById = Object.fromEntries(
    (activeVersion?.docs || []).map((doc) => [doc.id, doc.path]),
  );

  const items = titles
    .map((title) => {
      const doc = Object.values(version.docs).find((entry) => entry.title === title);
      if (!doc) return null;
      const href = pathById[doc.id];
      if (!href) return null;
      return {title, href};
    })
    .filter(Boolean);

  if (items.length === 0) return null;

  return (
    <div className="doc-downloads">
      <p className="doc-downloads__label">Course Notes</p>
      <ul className="doc-downloads__list">
        {items.map((item) => (
          <li key={item.href}>
            <Link to={item.href}>{item.title}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function LectureMeta({frontMatter}) {
  const {youtube_id, date, slides_url, week, topic, downloads, related_docs} = frontMatter;
  const embedId = youtubeEmbedId(youtube_id);
  const hasRelated = Array.isArray(related_docs)
    ? related_docs.length > 0
    : Boolean(related_docs);
  if (!embedId && !date && !slides_url && !(downloads && downloads.length) && !hasRelated) {
    return null;
  }

  return (
    <div className="lecture-meta">
      {(date || week || topic) && (
        <div className="lecture-meta__details">
          {date && <span>{formatDate(date)}</span>}
          {week && <span>{week.replace('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</span>}
          {topic && (
            <span>{topic.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</span>
          )}
        </div>
      )}
      {embedId && (
        <div className="lecture-meta__video">
          <iframe
            src={`https://www.youtube.com/embed/${embedId}`}
            title="Lecture video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}
      {slides_url && (
        <p className="lecture-meta__slides">
          <a href={slides_url} target="_blank" rel="noopener noreferrer">
            View slides →
          </a>
        </p>
      )}
      <RelatedNotes relatedDocs={related_docs} />
      <Downloads downloads={downloads} />
    </div>
  );
}

export default function DocItemContent(props) {
  const {metadata, frontMatter} = useDoc();
  const isLecture =
    metadata.id.startsWith('lectures/') && metadata.id !== 'lectures/index';
  const isAssignment =
    metadata.id.startsWith('assignments/') && metadata.id !== 'assignments/index';

  return (
    <>
      {isLecture && <LectureMeta frontMatter={frontMatter} />}
      {isAssignment && <Downloads downloads={frontMatter.downloads} />}
      <Content {...props} />
    </>
  );
}
