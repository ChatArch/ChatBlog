import clsx from 'clsx';
import Heading from '@theme/Heading';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import styles from './index.module.css';

const cards = [
  {
    title: '公开技术博客',
    description: '用于发布阶段性总结、实现笔记、架构解释和可以公开的项目发现。',
    to: '/blog',
  },
  {
    title: '知识块',
    description: '用于沉淀比 Skill 更轻、更适合阅读和引用的结构化知识。',
    to: '/docs/blocks/hello-world',
  },
  {
    title: '源码优先',
    description: '每篇公开内容都对应仓库中的源码文件，便于审查、链接和长期维护。',
    to: 'https://github.com/ChatArch/ChatBlog',
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
          <Link className="button button--primary button--lg" to="/blog/hello-world-writing-public-notes-with-chatblog">
            阅读第一篇博客
          </Link>
          <Link className="button button--secondary button--lg" to="/docs/blocks/hello-world">
            查看第一个知识块
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home(): JSX.Element {
  return (
    <Layout title="ChatBlog" description="ChatArch 公开知识块与技术博客">
      <HomepageHeader />
      <main>
        <section className={styles.cards}>
          <div className="container">
            <div className="row">
              {cards.map((card) => (
                <div className={clsx('col col--4', styles.cardCol)} key={card.title}>
                  <article className={styles.card}>
                    <Heading as="h3">{card.title}</Heading>
                    <p>{card.description}</p>
                    <Link to={card.to}>打开</Link>
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
