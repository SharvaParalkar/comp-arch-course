import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import styles from './index.module.css';

const topics = [
  {
    title: '3D Graphic Statics',
    tag: 'STRUCTURES',
    description: 'Polyhedral force diagrams, form/force duality, and funicular structural morphologies.',
    link: '/docs/intro',
  },
  {
    title: 'Shellular Optimization',
    tag: 'GEOMETRY',
    description: 'Shell-based cellular funicular structures optimized for structural efficiency at architectural scale.',
    link: '/docs/intro',
  },
  {
    title: 'Biological Growth',
    tag: 'COMPUTATION',
    description: 'Directed rhizome growth simulations, auxin modeling, and nature-inspired structural form-finding.',
    link: '/docs/intro',
  },
  {
    title: 'Granular Jamming',
    tag: 'MATERIALS',
    description: 'Particle jamming mechanics applied to adaptive and reconfigurable architectural systems.',
    link: '/docs/intro',
  },
  {
    title: 'Digital Fabrication',
    tag: 'FABRICATION',
    description: 'Computational geometry to physical form — fabrication workflows using Rhino and Grasshopper.',
    link: '/docs/intro',
  },
  {
    title: 'Material Computation',
    tag: 'RESEARCH',
    description: 'Integrating material behavior and computational design across micro to macro scales.',
    link: '/docs/intro',
  },
];

function Topic({title, tag, description, link}) {
  return (
    <div className="col col--4">
      <div className="card margin-bottom--lg padding--lg" style={{height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'}}>
        <div>
          <div style={{
            fontSize: '0.65rem',
            fontWeight: 600,
            letterSpacing: '0.12em',
            color: 'var(--cal-maroon, #500000)',
            marginBottom: '0.6rem',
            fontFamily: 'Inter, sans-serif'
          }}>
            {tag}
          </div>
          <h3 style={{
            fontFamily: 'Space Grotesk, sans-serif',
            fontSize: '1.1rem',
            fontWeight: 600,
            letterSpacing: '-0.02em',
            marginBottom: '0.75rem'
          }}>
            {title}
          </h3>
          <p style={{
            fontSize: '0.875rem',
            lineHeight: 1.6,
            color: 'var(--ifm-color-emphasis-600)',
            marginBottom: '1.25rem'
          }}>
            {description}
          </p>
        </div>
        <Link
          style={{
            fontSize: '0.8rem',
            fontWeight: 500,
            color: 'var(--cal-maroon, #500000)',
            textDecoration: 'none',
            letterSpacing: '0.02em'
          }}
          to={link}
        >
          View notes →
        </Link>
      </div>
    </div>
  );
}

export default function Home() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title="CAL · Cellular Architectures Laboratory"
      description="Computational Architecture — Dr. Mostafa Akbari, Texas A&M University">

      {/* Hero */}
      <header className={clsx('hero', styles.heroBanner)}>
        <div className="container">
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            maxWidth: '640px'
          }}>
            <div style={{
              fontSize: '0.7rem',
              fontWeight: 600,
              letterSpacing: '0.15em',
              color: 'rgba(255,255,255,0.35)',
              marginBottom: '1.5rem',
              fontFamily: 'Inter, sans-serif'
            }}>
              TEXAS A&M UNIVERSITY · COLLEGE OF ARCHITECTURE
            </div>
            <h1 className="hero__title">
              Cellular<br/>Architectures<br/>Laboratory
            </h1>
            <p className="hero__subtitle">
              Computational Design · Structural Form-Finding<br/>Digital Fabrication · Material Computation
            </p>
            <div style={{
              marginTop: '0.75rem',
              marginBottom: '2.5rem',
              fontSize: '0.8rem',
              color: 'rgba(255,255,255,0.3)',
              fontFamily: 'Inter, sans-serif',
              letterSpacing: '0.02em'
            }}>
              Dr. Mostafa Akbari · Assistant Professor of Architecture
            </div>
            <div style={{display: 'flex', gap: '0.75rem', flexWrap: 'wrap'}}>
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

      {/* Divider line */}
      <div style={{height: '1px', background: 'var(--cal-gray-200, #e8e8e8)'}} />

      {/* Research areas */}
      <main>
        <section style={{padding: '5rem 0'}}>
          <div className="container">
            <div style={{marginBottom: '3rem'}}>
              <div style={{
                fontSize: '0.65rem',
                fontWeight: 600,
                letterSpacing: '0.12em',
                color: 'var(--cal-gray-400, #999)',
                marginBottom: '0.5rem',
                fontFamily: 'Inter, sans-serif'
              }}>
                RESEARCH AREAS
              </div>
              <h2 style={{
                fontFamily: 'Space Grotesk, sans-serif',
                fontSize: '1.75rem',
                fontWeight: 600,
                letterSpacing: '-0.02em',
                margin: 0
              }}>
                Course Topics
              </h2>
            </div>
            <div className="row">
              {topics.map((props, idx) => (
                <Topic key={idx} {...props} />
              ))}
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section style={{
          padding: '4rem 0',
          borderTop: '1px solid var(--cal-gray-200, #e8e8e8)',
          background: 'var(--cal-gray-100, #f4f4f4)'
        }}>
          <div className="container">
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1.5rem'
            }}>
              <div>
                <div style={{
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  letterSpacing: '0.12em',
                  color: 'var(--cal-gray-400, #999)',
                  marginBottom: '0.4rem',
                  fontFamily: 'Inter, sans-serif'
                }}>
                  CELLULAR ARCHITECTURES LAB
                </div>
                <h3 style={{
                  fontFamily: 'Space Grotesk, sans-serif',
                  fontWeight: 600,
                  letterSpacing: '-0.02em',
                  margin: 0,
                  fontSize: '1.25rem'
                }}>
                  Texas A&M University
                </h3>
                <p style={{
                  fontSize: '0.875rem',
                  color: 'var(--cal-gray-600, #555)',
                  margin: '0.25rem 0 0 0'
                }}>
                  College of Architecture · Department of Architecture
                </p>
              </div>
              <div style={{display: 'flex', gap: '0.75rem', flexWrap: 'wrap'}}>
                <Link
                  className="button button--primary"
                  to="/docs/assignments"
                >
                  Assignments
                </Link>
                <Link
                  className="button button--secondary"
                  href="https://www.arch.tamu.edu/staff/mostafa-akbari/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{color: 'var(--cal-gray-800, #222)', borderColor: 'var(--cal-gray-200, #e8e8e8)'}}
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