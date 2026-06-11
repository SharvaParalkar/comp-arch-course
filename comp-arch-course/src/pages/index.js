import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import styles from './index.module.css';

const topics = [
  {
    title: '3D Graphic Statics',
    icon: '⬡',
    description: 'Exploring structural form-finding through polyhedral force diagrams and funicular geometries.',
    link: '/docs/intro',
  },
  {
    title: 'Shellular Optimization',
    icon: '◎',
    description: 'Shell-based cellular funicular structures — designing for structural efficiency at architectural scale.',
    link: '/docs/intro',
  },
  {
    title: 'Biological Growth',
    icon: '⟁',
    description: 'Directed rhizome growth simulations, auxin modeling, and nature-inspired structural morphologies.',
    link: '/docs/intro',
  },
  {
    title: 'Granular Jamming',
    icon: '⬤',
    description: 'Particle jamming mechanics applied to adaptive and reconfigurable architectural systems.',
    link: '/docs/intro',
  },
  {
    title: 'Digital Fabrication',
    icon: '▦',
    description: 'From computational geometry to physical form — fabrication workflows using Rhino, Grasshopper, and custom toolpaths.',
    link: '/docs/intro',
  },
  {
    title: 'Material Computation',
    icon: '◈',
    description: 'Integrating material behavior and computational design across micro to macro scales.',
    link: '/docs/intro',
  },
];

function Topic({title, icon, description, link}) {
  return (
    <div className={clsx('col col--4')}>
      <div className="card margin-bottom--lg padding--lg">
        <div style={{fontSize: '2rem', marginBottom: '0.5rem'}}>{icon}</div>
        <h3 style={{fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em'}}>
          {title}
        </h3>
        <p style={{color: 'var(--ifm-color-emphasis-700)', fontSize: '0.95rem'}}>
          {description}
        </p>
        <Link className="button button--sm button--primary" to={link}>
          Explore →
        </Link>
      </div>
    </div>
  );
}

export default function Home() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title="Cellular Architectures Laboratory"
      description="Computational Architecture course platform — Dr. Mostafa Akbari, Texas A&M University">
      
      {/* Hero */}
      <header className={clsx('hero hero--primary', styles.heroBanner)}>
        <div className="container">
          <div style={{marginBottom: '1rem', opacity: 0.7, fontFamily: 'Oswald, sans-serif', letterSpacing: '0.15em', fontSize: '0.85rem'}}>
            TEXAS A&M UNIVERSITY · COLLEGE OF ARCHITECTURE
          </div>
          <h1 className="hero__title">Cellular Architectures<br/>Laboratory</h1>
          <p className="hero__subtitle">
            Computational Design · Digital Fabrication · Structural Form-Finding
          </p>
          <div style={{marginTop: '0.5rem', marginBottom: '2rem', opacity: 0.6, fontFamily: 'Work Sans, sans-serif', fontSize: '0.9rem'}}>
            Dr. Mostafa Akbari · Assistant Professor of Architecture
          </div>
          <div className={styles.buttons}>
            <Link className="button button--secondary button--lg" to="/docs/intro">
              Course Notes
            </Link>
            <Link className="button button--primary button--lg margin-left--md" to="/docs/lectures">
              Lectures
            </Link>
          </div>
        </div>
      </header>

      {/* Topics Grid */}
      <main>
        <section style={{padding: '4rem 0', background: 'var(--ifm-background-color)'}}>
          <div className="container">
            <div style={{textAlign: 'center', marginBottom: '3rem'}}>
              <h2 style={{fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '2rem'}}>
                Research Areas
              </h2>
              <p style={{color: 'var(--ifm-color-emphasis-600)', maxWidth: '600px', margin: '0 auto'}}>
                This course bridges multiple disciplines — from structural geometry and material science to biological systems and computational fabrication.
              </p>
            </div>
            <div className="row">
              {topics.map((props, idx) => (
                <Topic key={idx} {...props} />
              ))}
            </div>
          </div>
        </section>

        {/* Quick Links */}
        <section style={{padding: '3rem 0', background: 'var(--aggie-maroon, #500000)', color: 'white'}}>
          <div className="container">
            <div className="row" style={{alignItems: 'center'}}>
              <div className="col col--8">
                <h2 style={{fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'white', margin: 0}}>
                  Ready to dive in?
                </h2>
                <p style={{opacity: 0.8, margin: '0.5rem 0 0 0'}}>
                  Access lecture notes, assignments, and course resources.
                </p>
              </div>
              <div className="col col--4" style={{textAlign: 'right'}}>
                <Link className="button button--secondary button--lg" to="/docs/assignments">
                  View Assignments →
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}