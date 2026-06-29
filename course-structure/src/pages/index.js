import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import styles from './index.module.css';

/* ── Topic cards ─────────────────────────────────────────────────── */
const topics = [
  {
    title: 'Parametric Modeling',
    tag: 'GRASSHOPPER',
    description: 'Node-based visual programming — building parametric relationships, data trees, and generative geometry.',
    link: '/docs/intro',
  },
  {
    title: 'Structural Form-Finding',
    tag: 'STRUCTURES',
    description: 'Computational approaches to efficient structural form — funicular geometries, load paths, and equilibrium.',
    link: '/docs/intro',
  },
  {
    title: 'Computational Geometry',
    tag: 'GEOMETRY',
    description: 'Surfaces, meshes, and polyhedral geometries as the basis for structural and architectural systems.',
    link: '/docs/intro',
  },
  {
    title: 'Structural Analysis',
    tag: 'ANALYSIS',
    description: 'Evaluating structural performance through simulation — stress, deformation, and optimization workflows.',
    link: '/docs/intro',
  },
  {
    title: 'Digital Fabrication',
    tag: 'FABRICATION',
    description: 'Translating computational models to physical artifacts — fabrication-aware design and toolpath generation.',
    link: '/docs/intro',
  },
  {
    title: 'Design Optimization',
    tag: 'OPTIMIZATION',
    description: 'Algorithmic and evolutionary methods for optimizing structural and spatial performance.',
    link: '/docs/intro',
  },
];

function Topic({ title, tag, description, link }) {
  return (
    <div
      className="card padding--lg"
      style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
    >
      <div>
        <div style={{
          fontSize: '0.65rem',
          fontWeight: 600,
          letterSpacing: '0.1em',
          color: 'var(--cal-clay, #8b7355)',
          marginBottom: '0.65rem',
          fontFamily: 'Space Mono, monospace',
        }}>
          {tag}
        </div>
        <h3 style={{
          fontFamily: 'Libre Baskerville, Georgia, serif',
          fontSize: '1rem',
          fontWeight: 700,
          letterSpacing: '-0.01em',
          marginBottom: '0.75rem',
          color: 'var(--cal-ink, #1a1a1a)',
        }}>
          {title}
        </h3>
        <p style={{
          fontSize: '0.8375rem',
          lineHeight: 1.65,
          color: 'var(--cal-ink-mid, #555550)',
          marginBottom: '1.25rem',
          fontFamily: 'Inter, sans-serif',
        }}>
          {description}
        </p>
      </div>
      <Link
        style={{
          fontSize: '0.78rem',
          fontWeight: 500,
          color: 'var(--cal-clay, #8b7355)',
          textDecoration: 'none',
          fontFamily: 'Inter, sans-serif',
          letterSpacing: '0.01em',
        }}
        to={link}
      >
        View notes →
      </Link>
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────────────── */
export default function Home() {
  const { siteConfig } = useDocusaurusContext();
  const shellularImage = useBaseUrl('/img/shellular-transition.jpg');

  return (
    <Layout
      title="CAL · Cellular Architectures Laboratory"
      description="Computational Architecture — Dr. Mostafa Akbari, Texas A&M University"
    >
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <header className={clsx('hero', styles.heroBanner)}>
        <div className="container">
          <div className={styles.heroInner}>
            {/* Eyebrow */}
            <div style={{
              fontSize: '0.65rem',
              fontWeight: 600,
              letterSpacing: '0.12em',
              color: 'var(--cal-ink-faint, #999990)',
              fontFamily: 'Space Mono, monospace',
              textTransform: 'uppercase',
              marginBottom: '2rem',
            }}>
              Texas A&amp;M University · College of Architecture
            </div>

            {/* Headline */}
            <h1 style={{
              fontFamily: 'Libre Baskerville, Georgia, serif',
              fontSize: 'clamp(2rem, 4vw, 3.25rem)',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
              color: 'var(--cal-ink, #1a1a1a)',
              margin: 0,
            }}>
              Computational<br />Structural Design & Analysis
            </h1>

            {/* Featured visualization */}
            <figure className={styles.heroFigure}>
              <img
                className={styles.heroImage}
                src={shellularImage}
                alt="Progression of shellular structures from lattice to optimized topology under applied loads"
                loading="eager"
              />
              <figcaption style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '0.8125rem',
                lineHeight: 1.6,
                color: 'var(--cal-ink-mid, #555550)',
                fontWeight: 300,
                fontStyle: 'italic',
                textAlign: 'center',
                marginTop: '0.75rem',
              }}>
                Supported by Open Educational Resources (OER) Grant, Texas A&amp;M University
              </figcaption>
            </figure>

            {/* Rule */}
            <div style={{
              width: 40,
              height: 1,
              background: 'var(--cal-clay, #8b7355)',
              margin: '1.75rem auto',
            }} />

            {/* Descriptor */}
            <p style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '0.9375rem',
              lineHeight: 1.7,
              color: 'var(--cal-ink-mid, #555550)',
              fontWeight: 300,
              marginBottom: '0.5rem',
            }}>
              Computational Design · Structural Form-Finding<br />
              Digital Fabrication · Material Computation
            </p>
            <p style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '0.8rem',
              color: 'var(--cal-ink-faint, #999990)',
              marginBottom: '2.5rem',
            }}>
              Dr. Mostafa Akbari · Assistant Professor of Architecture
            </p>

            {/* CTAs */}
            <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              <Link className="button button--primary" to="/docs/intro">
                Course Notes
              </Link>
              <Link className="button button--secondary" to="/docs/lectures">
                Lectures
              </Link>
              <Link className="button button--secondary" to="/docs/assignments">
                Assignments
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ── Topics ─────────────────────────────────────────────────── */}
      <main>
        <section style={{ padding: '5rem 0', background: 'var(--cal-white, #ffffff)' }}>
          <div className="container">
            {/* Section header */}
            <div style={{ marginBottom: '3rem', display: 'flex', alignItems: 'baseline', gap: '1.25rem' }}>
              <span style={{
                fontFamily: 'Space Mono, monospace',
                fontSize: '0.65rem',
                fontWeight: 600,
                letterSpacing: '0.1em',
                color: 'var(--cal-clay, #8b7355)',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
              }}>
                Course Topics
              </span>
              <div style={{ flex: 1, height: '1px', background: 'var(--cal-rule, #d9d5cf)' }} />
            </div>

            {/* Even card grid — no Docusaurus row/col to avoid uneven bottom margins */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '1rem',
            }}>
              {topics.map((props, idx) => (
                <Topic key={idx} {...props} />
              ))}
            </div>
          </div>
        </section>

        {/* ── Bottom CTA ─────────────────────────────────────────────── */}
        <section style={{
          padding: '4rem 0',
          background: 'var(--cal-off-white, #f7f7f5)',
          borderTop: '1px solid var(--cal-rule, #d9d5cf)',
        }}>
          <div className="container">
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1.5rem',
            }}>
              <div>
                <div style={{
                  fontFamily: 'Space Mono, monospace',
                  fontSize: '0.65rem',
                  letterSpacing: '0.1em',
                  color: 'var(--cal-ink-faint, #999990)',
                  textTransform: 'uppercase',
                  marginBottom: '0.4rem',
                }}>
                  Cellular Architectures Lab
                </div>
                <h3 style={{
                  fontFamily: 'Libre Baskerville, Georgia, serif',
                  fontWeight: 700,
                  letterSpacing: '-0.01em',
                  margin: 0,
                  fontSize: '1.2rem',
                  color: 'var(--cal-ink, #1a1a1a)',
                }}>
                  Texas A&amp;M University
                </h3>
                <p style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '0.8375rem',
                  color: 'var(--cal-ink-mid, #555550)',
                  margin: '0.25rem 0 0 0',
                }}>
                  College of Architecture · Department of Architecture
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}>
                <Link className="button button--primary" to="/docs/assignments">
                  Assignments
                </Link>
                <Link
                  className="button button--secondary"
                  href="https://www.arch.tamu.edu/staff/mostafa-akbari/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Faculty Profile ↗
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}