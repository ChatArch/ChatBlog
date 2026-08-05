import clsx from 'clsx';
import Heading from '@theme/Heading';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import styles from './index.module.css';

const cards = [
  {
    title: '时间轴归档',
    description: '像 wzhecnu.cn 的时间轴一样，按年份集中展示全部文章，每条文章独立显示日期和标题。',
    to: '/blog/archive',
    action: '查看时间轴',
  },
  {
    title: '最新博客',
    description: '按时间倒序阅读最近发布的公开技术文章；页面底部可以继续翻到更早的分页。',
    to: '/blog',
    action: '打开博客首页',
  },
  {
    title: '标签索引',
    description: '按主题标签回看文章，适合找同一方向的连续内容。',
    to: '/blog/tags',
    action: '按标签浏览',
  },
  {
    title: '源码优先',
    description: '每篇公开内容都对应仓库中的源码文件，便于审查、链接和长期维护。',
    to: 'https://github.com/ChatArch/ChatBlog',
    action: '查看源码',
  },
];

const browseLinks = [
  {
    label: '时间轴',
    to: '/blog/archive',
    description: '按年份分组浏览全部历史文章。',
  },
  {
    label: '最新文章',
    to: '/blog',
    description: '从最近更新开始阅读。',
  },
  {
    label: '标签',
    to: '/blog/tags',
    description: '按主题方向筛选文章。',
  },
];

function HomepageHeader() {
  return (
    <header className={styles.hero}>
      <div className="container">
        <p className={styles.eyebrow}>ChatArch 公开知识层</p>
        <Heading as="h1" className={styles.title}>ChatBlog</Heading>
        <p className={styles.subtitle}>
          把 ChatArch 工作中可公开的技术发现、设计解释和知识块，整理成可阅读、可引用、可维护的网站。
        </p>
        <div className={styles.actions}>
          <Link className="button button--primary button--lg" to="/blog/archive">
            查看时间轴归档
          </Link>
          <Link className="button button--secondary button--lg" to="/blog">
            阅读最新博客
          </Link>
          <Link className="button button--secondary button--lg" to="/blog/tags">
            按标签浏览
          </Link>
        </div>
      </div>
    </header>
  );
}

function BrowseSection() {
  return (
    <section className={styles.browse}>
      <div className="container">
        <div className={styles.sectionHeader}>
          <p className={styles.eyebrow}>Archive</p>
          <Heading as="h2">先从时间轴找历史文章</Heading>
          <p>
            完整归档现在是专门的时间轴页面：按年份分组，日期单独成列，不再把中文月份前缀塞进文章标题里。
          </p>
        </div>
        <div className={styles.browseGrid}>
          {browseLinks.map((link) => (
            <Link className={styles.browseItem} to={link.to} key={link.label}>
              <span>{link.label}</span>
              <small>{link.description}</small>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home(): JSX.Element {
  return (
    <Layout title="ChatBlog" description="ChatArch 公开知识块与技术博客">
      <HomepageHeader />
      <main>
        <BrowseSection />
        <section className={styles.cards}>
          <div className="container">
            <div className="row">
              {cards.map((card) => (
                <div className={clsx('col col--3', styles.cardCol)} key={card.title}>
                  <article className={styles.card}>
                    <Heading as="h3">{card.title}</Heading>
                    <p>{card.description}</p>
                    <Link to={card.to}>{card.action}</Link>
                  </article>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
