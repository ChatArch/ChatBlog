// @ts-check

const config = {
  title: 'ChatBlog',
  tagline: 'ChatArch 公开知识块与技术笔记。',
  favicon: 'img/favicon.svg',
  url: 'https://chatarch.github.io',
  baseUrl: '/ChatBlog/',
  organizationName: 'ChatArch',
  projectName: 'ChatBlog',
  trailingSlash: false,

  onBrokenLinks: 'throw',
  markdown: {
    mermaid: true,
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },

  i18n: {
    defaultLocale: 'zh-Hans',
    locales: ['zh-Hans'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl: 'https://github.com/ChatArch/ChatBlog/tree/main/',
        },
        blog: {
          showReadingTime: true,
          blogTitle: 'ChatBlog 博客',
          blogDescription: '公开技术笔记、知识块与项目文章。',
          postsPerPage: 10,
          editUrl: 'https://github.com/ChatArch/ChatBlog/tree/main/',
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
  ],

  themes: ['@docusaurus/theme-mermaid'],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      image: 'img/social-card.svg',
      navbar: {
        title: 'ChatBlog',
        logo: {
          alt: 'ChatBlog logo',
          src: 'img/logo.svg',
        },
        items: [
          {to: '/blog', label: '博客', position: 'left'},
          {to: '/docs/blocks/hello-world', label: '知识块', position: 'left'},
          {href: 'https://github.com/ChatArch/ChatBlog', label: 'GitHub', position: 'right'},
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: '内容',
            items: [
              {label: '博客', to: '/blog'},
              {label: '知识块', to: '/docs/blocks/hello-world'},
            ],
          },
          {
            title: '源码',
            items: [
              {label: 'GitHub', href: 'https://github.com/ChatArch/ChatBlog'},
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} ChatArch. Built with Docusaurus.`,
      },
      prism: {
        theme: require('prism-react-renderer').themes.github,
        darkTheme: require('prism-react-renderer').themes.dracula,
      },
    }),
};

module.exports = config;
