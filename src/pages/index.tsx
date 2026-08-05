import clsx from 'clsx';
import Heading from '@theme/Heading';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import styles from './index.module.css';

const cards = [
  {
    title: '最新博客',
    description: '按时间倒序阅读最近发布的公开技术文章；页面底部可以继续翻到更早的分页。',
    to: '/blog',
    action: '打开博客首页',
  },
  {
    title: '完整文章归档',
    description: '按年份和日期查看全部历史文章，不再只依赖最近博文侧栏。',
    to: '/blog/archive',
    action: '查看完整归档',
  },
  {
    title: '文档与知识块列表',
    description: '长期可复用的文档、知识块和站点说明统一从这里进入。',
    to: '/docs/intro',
    action: '查看文档列表',
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
    label: '完整文章历史',
    to: '/blog/archive',
    description: '一页看完全部博文，按日期浏览。',
  },
  {
    label: '博客分页浏览',
    to: '/blog/page/2',
    description: '从第 2 页继续翻旧文章。',
  },
  {
    label: '标签索引',
    to: '/blog/tags',
    description: '按主题标签回看文章。',
  },
  {
    label: '文档列表',
    to: '/docs/intro',
    description: '查看长期文档和知识块入口。',
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
            浏览完整文章历史
          </Link>
          <Link className="button button--secondary button--lg" to="/blog">
            阅读最新博客
          </Link>
          <Link className="button button--secondary button--lg" to="/docs/intro">
            查看文档列表
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
          <p className={styles.eyebrow}>Archive / Index</p>
          <Heading as="h2">从这里找历史文章和文档</Heading>
          <p>
            主页直接暴露完整归档、分页、标签和文档列表入口；想回看旧文章时，不需要只靠“最近博文”侧栏慢慢翻。
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
