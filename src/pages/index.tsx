import clsx from 'clsx';
import Heading from '@theme/Heading';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import styles from './index.module.css';

const entries = [
  {
    title: '博客',
    description: '最新的技术文章、项目调研和实践笔记。',
    to: '/blog',
    action: '阅读文章',
  },
  {
    title: '标签',
    description: '按主题浏览相关内容。',
    to: '/blog/tags',
    action: '浏览标签',
  },
  {
    title: '源码',
    description: '所有公开内容都在 GitHub 中维护。',
    to: 'https://github.com/ChatArch/ChatBlog',
    action: '查看仓库',
  },
];

function HomepageHeader() {
  return (
    <header className={styles.hero}>
      <div className="container">
        <p className={styles.eyebrow}>ChatArch Notes</p>
        <Heading as="h1" className={styles.title}>ChatBlog</Heading>
        <p className={styles.subtitle}>
          ChatArch 的公开技术笔记、项目调研和实践文章。这里保留可以公开阅读、引用和复盘的内容。
        </p>
        <div className={styles.actions}>
          <Link className="button button--primary button--lg" to="/blog">
            阅读博客
          </Link>
          <Link className="button button--secondary button--lg" to="https://github.com/ChatArch/ChatBlog">
            GitHub
          </Link>
        </div>
      </div>
    </header>
  );
}

function EntrySection() {
  return (
    <section className={styles.entries}>
      <div className="container">
        <div className={styles.sectionHeader}>
          <Heading as="h2">内容入口</Heading>
          <p>从文章、主题标签或源码进入。</p>
        </div>
        <div className="row">
          {entries.map((entry) => (
            <div className={clsx('col col--4', styles.cardCol)} key={entry.title}>
              <article className={styles.card}>
                <Heading as="h3">{entry.title}</Heading>
                <p>{entry.description}</p>
                <Link to={entry.to}>{entry.action}</Link>
              </article>
            </div>
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
        <EntrySection />
      </main>
    </Layout>
  );
}
