import clsx from 'clsx';
import Heading from '@theme/Heading';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import styles from './index.module.css';
import EditorLink from '../components/EditorLink';

const entries = [
  {
    title: '博客',
    description: '经过筛选保留的技术文章与实践笔记。',
    to: '/blog',
    action: '阅读文章',
  },
  {
    title: 'Slides',
    description: '可演示、可 review、可发布的 Web Slides。',
    to: '/slides',
    action: '查看 Slides',
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
          快速整理、理解和展示有用的知识。首页只推荐经过初步精选的文章。
        </p>
        <aside className={styles.positioning}>
          <span>从这里开始 · 置顶</span>
          <Link to="/blog/about-chatblog">为什么做 ChatBlog，以及我们为什么重新开始 →</Link>
        </aside>
        <div className={styles.actions}>
          <Link className="button button--primary button--lg" to="/blog">
            阅读博客
          </Link>
          <Link className="button button--secondary button--lg" to="/inbox">
            待精选
          </Link>
          <EditorLink />
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
            <div className={clsx('col col--3', styles.cardCol)} key={entry.title}>
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
