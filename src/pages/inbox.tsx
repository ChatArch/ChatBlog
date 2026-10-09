import React from 'react';
import Head from '@docusaurus/Head';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import EditorLink from '../components/EditorLink';
import manifest from '../data/article-status.json';
import {articleUrl, getCandidateArticles} from '../../scripts/article-status.cjs';
import styles from './ai-slop.module.css';

const articles = getCandidateArticles(manifest);

export default function CandidateInbox(): React.ReactNode {
  return (
    <Layout title="待精选 · 知识收件箱" description="临时探索与尚未进入正式推荐的文章。">
      <Head><meta name="robots" content="noindex, nofollow" /></Head>
      <main className={`container ${styles.page}`}>
        <header className={styles.header}>
          <Heading as="h1">待精选</Heading>
          <p>这里的文章已经过发布审查，但尚未由编辑者选入正式阅读区。待精选不等于低质量判定。</p>
          <p>页面展示上一次公开构建的状态；编辑台保存的新判断需要通过发布 PR 同步。</p>
          <EditorLink />
        </header>
        {articles.length === 0 ? <p>目前没有待精选文章。</p> : (
          <ul className={styles.list}>
            {articles.map((article) => (
              <li className={styles.item} key={article.slug}>
                <time className={styles.date} dateTime={article.date}>{article.date}</time>
                <div>
                  <Heading as="h2" className={styles.title}><Link to={articleUrl(article.slug)}>{article.title}</Link></Heading>
                  <p>{article.reason}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </Layout>
  );
}
