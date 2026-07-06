// @ts-check
import {themes as prismThemes} from 'prism-react-renderer';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Cellular Architectures Laboratory',
  tagline: 'Computational Architecture · Texas A&M University',
  favicon: 'img/favicon.ico',
  url: 'https://calab.net/',
  baseUrl: '/structure/',
  organizationName: 'SharvaParalkar',
  projectName: 'comp-arch-course',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

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
        blog: false,
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
            sidebarId: 'lecturesSidebar',
            position: 'left',
            label: 'Lectures',
          },
          {
            type: 'docSidebar',
            sidebarId: 'assignmentsSidebar',
            position: 'left',
            label: 'Assignments',
          },
          {
            type: 'docSidebar',
            sidebarId: 'courseNotesSidebar',
            position: 'left',
            label: 'Course Notes',
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
        style: 'light',
        links: [
          {
            title: 'Course',
            items: [
              { label: 'Lectures', to: '/docs/lectures' },
              { label: 'Assignments', to: '/docs/assignments' },
              { label: 'Course Notes', to: '/docs/course-notes' },
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
              { label: 'Polyframe 2', href: 'https://www.food4rhino.com/en/app/polyframe-2' },
            ],
          },
        ],
        copyright: `© ${new Date().getFullYear()} Cellular Architectures Laboratory · Dr. Mostafa Akbari · Texas A&M University`,
      },
      prism: {
        theme: prismThemes.oneLight,
        additionalLanguages: ['python', 'csharp', 'bash'],
      },
      colorMode: {
        defaultMode: 'light',
        disableSwitch: true,
        respectPrefersColorScheme: false,
      },
    }),
};

export default config;