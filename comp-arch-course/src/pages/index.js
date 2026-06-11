import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import styles from './index.module.css';

/* ── Geometric wire SVG — polyhedral / graphic-statics motif ───── */
function PolyhedralSVG() {
  return (
    <svg
      viewBox="0 0 480 480"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ width: '100%', maxWidth: 480, opacity: 0.18 }}
    >
      {/* Outer icosahedron projection */}
      <polygon points="240,28 420,148 380,348 100,348 60,148" stroke="#8b7355" strokeWidth="1" fill="none" />
      {/* Inner force diagram */}
      <polygon points="240,108 356,184 316,292 164,292 124,184" stroke="#8b7355" strokeWidth="0.75" fill="none" />
      {/* Core cell */}
      <polygon points="240,176 296,212 276,268 204,268 184,212" stroke="#8b7355" strokeWidth="0.5" fill="none" />
      {/* Radial lines — load paths */}
      <line x1="240" y1="28" x2="240" y2="176" stroke="#8b7355" strokeWidth="0.5" />
      <line x1="420" y1="148" x2="296" y2="212" stroke="#8b7355" strokeWidth="0.5" />
      <line x1="380" y1="348" x2="276" y2="268" stroke="#8b7355" strokeWidth="0.5" />
      <line x1="100" y1="348" x2="204" y2="268" stroke="#8b7355" strokeWidth="0.5" />
      <line x1="60" y1="148" x2="184" y2="212" stroke="#8b7355" strokeWidth="0.5" />
      {/* Cross-diagonals */}
      <line x1="240" y1="28" x2="380" y2="348" stroke="#8b7355" strokeWidth="0.35" strokeDasharray="4 6" />
      <line x1="420" y1="148" x2="100" y2="348" stroke="#8b7355" strokeWidth="0.35" strokeDasharray="4 6" />
      <line x1="60" y1="148" x2="380" y2="348" stroke="#8b7355" strokeWidth="0.35" strokeDasharray="4 6" />
      {/* Centroid */}
      <circle cx="240" cy="222" r="3" stroke="#8b7355" strokeWidth="1" fill="none" />
      <circle cx="240" cy="222" r="1.2" fill="#8b7355" />
      {/* Vertex dots — outer */}
      <circle cx="240" cy="28" r="2.5" fill="#8b7355" fillOpacity="0.6" />
      <circle cx="420" cy="148" r="2.5" fill="#8b7355" fillOpacity="0.6" />
      <circle cx="380" cy="348" r="2.5" fill="#8b7355" fillOpacity="0.6" />
      <circle cx="100" cy="348" r="2.5" fill="#8b7355" fillOpacity="0.6" />
      <circle cx="60" cy="148" r="2.5" fill="#8b7355" fillOpacity="0.6" />
    </svg>
  );
}

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
    <div className="col col--4">
      <div
        className="card margin-bottom--lg padding--lg"
        style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
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
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────────────── */
export default function Home() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      title="CAL · Cellular Architectures Laboratory"
      description="Computational Architecture — Dr. Mostafa Akbari, Texas A&M University"
    >
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <header className={clsx('hero', styles.heroBanner)}>
        <div className="container" style={{ padding: '0 2rem' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            alignItems: 'center',
            gap: '2rem',
            padding: '5rem 0 4.5rem',
          }}>
            {/* Left — text */}
            <div style={{ maxWidth: 580 }}>
              {/* Eyebrow */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '2rem',
              }}>
                <span style={{
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  letterSpacing: '0.12em',
                  color: 'var(--cal-ink-faint, #999990)',
                  fontFamily: 'Space Mono, monospace',
                  textTransform: 'uppercase',
                }}>
                  Texas A&M University · College of Architecture
                </span>
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
                Cellular<br />Architectures<br />Laboratory
              </h1>

              {/* Rule */}
              <div style={{
                width: 40,
                height: 1,
                background: 'var(--cal-clay, #8b7355)',
                margin: '1.75rem 0',
              }} />

              {/* Descriptor */}
              <p style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '0.9375rem',
                lineHeight: 1.7,
                color: 'var(--cal-ink-mid, #555550)',
                fontWeight: 300,
                marginBottom: '0.5rem',
                maxWidth: 460,
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
              <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}>
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

            {/* Right — polyhedral wire diagram */}
            <div style={{
              width: 'clamp(220px, 28vw, 380px)',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
              aria-hidden="true"
            >
              <PolyhedralSVG />
            </div>
          </div>
        </div>
      </header>

      {/* Rule */}
      <div style={{ height: '1px', background: 'var(--cal-rule, #d9d5cf)' }} />

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
              }}>
                Course Topics
              </span>
              <div style={{ flex: 1, height: '1px', background: 'var(--cal-rule, #d9d5cf)' }} />
            </div>
            <div className="row">
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
                  Texas A&M University
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