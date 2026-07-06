import React from 'react';
import Content from '@theme-original/DocItem/Content';
import {useDoc} from '@docusaurus/plugin-content-docs/client';

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

function LectureMeta({frontMatter}) {
  const {youtube_id, date, slides_url, week, topic} = frontMatter;
  if (!youtube_id && !date && !slides_url) return null;

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
      {youtube_id && (
        <div className="lecture-meta__video">
          <iframe
            src={`https://www.youtube.com/embed/${youtube_id}`}
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
    </div>
  );
}

export default function DocItemContent(props) {
  const {metadata, frontMatter} = useDoc();
  const isLecture =
    metadata.id.startsWith('lectures/') && metadata.id !== 'lectures/index';

  return (
    <>
      {isLecture && <LectureMeta frontMatter={frontMatter} />}
      <Content {...props} />
    </>
  );
}
