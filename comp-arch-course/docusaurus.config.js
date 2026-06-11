// @ts-check
import {themes as prismThemes} from 'prism-react-renderer';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Cellular Architectures Laboratory',
  tagline: 'Computational Architecture · Texas A&M University',
  favicon: 'img/favicon.ico',
  url: 'https://comp-arch-course.pages.dev/',
  baseUrl: '/',
  organizationName: 'SharvaParalkar',
  projectName: 'comp-arch-course',
  onBrokenLinks: 'throw',
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: './sidebars.js',
          routeBasePath: 'docs',
        },
        blog: false, // disable blog
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      image: 'img/og-card.png',
      navbar: {
        title: 'CAL · Texas A&M',
        logo: {
          alt: 'Cellular Architectures Laboratory',
          src: 'img/logo.svg',
        },
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'tutorialSidebar',
            position: 'left',
            label: 'Course Notes',
          },
          {
            to: '/docs/lectures',
            label: 'Lectures',
            position: 'left',
          },
          {
            to: '/docs/assignments',
            label: 'Assignments',
            position: 'left',
          },
          {
            href: 'https://www.arch.tamu.edu/staff/mostafa-akbari/',
            label: 'Dr. Akbari',
            position: 'right',
          },
          {
            href: 'https://github.com/SharvaParalkar/comp-arch-course',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Course',
            items: [
              { label: 'Course Notes', to: '/docs/intro' },
              { label: 'Lectures', to: '/docs/lectures' },
              { label: 'Assignments', to: '/docs/assignments' },
            ],
          },
          {
            title: 'Lab',
            items: [
              {
                label: 'Cellular Architectures Laboratory',
                href: 'https://www.arch.tamu.edu/staff/mostafa-akbari/',
              },
              {
                label: 'Texas A&M College of Architecture',
                href: 'https://www.arch.tamu.edu/',
              },
            ],
          },
          {
            title: 'Tools',
            items: [
              { label: 'Rhino', href: 'https://www.rhino3d.com/' },
              { label: 'Grasshopper', href: 'https://www.grasshopper3d.com/' },
              { label: 'Polyframe', href: 'https://www.food4rhino.com/en/app/polyframe' },
            ],
          },
        ],
        copyright: `© ${new Date().getFullYear()} Cellular Architectures Laboratory · Dr. Mostafa Akbari · Texas A&M University`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
        additionalLanguages: ['python', 'csharp', 'bash'],
      },
      colorMode: {
        defaultMode: 'dark',
        disableSwitch: false,
        respectPrefersColorScheme: true,
      },
    }),
};

export default config;