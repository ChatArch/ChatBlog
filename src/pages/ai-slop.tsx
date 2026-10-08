import React, {type ReactNode} from 'react';
import Head from '@docusaurus/Head';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import manifest from '../data/article-status.json';
import {articleUrl, getSlopArticles} from '../../scripts/article-status.cjs';
import styles from './ai-slop.module.css';

const articles = getSlopArticles(manifest);

export default function AiSlopArchive(): ReactNode {
  return (
    <Layout title="AI Slop · 负面归档" description="退出主区的历史文章，仅保留原文供追溯。">
      <Head><meta name="robots" content="noindex, nofollow" /></Head>
      <main className={`container ${styles.page}`}>
        <header className={styles.header}>
          <Heading as="h1">AI Slop · 负面归档</Heading>
          <p>
            这些文章未达到主区保留标准，已退出正常文章列表、标签聚合与订阅。
            原文和旧链接保留，仅供追溯，不代表推荐或认可。
          </p>
          <p><strong>这是负面归档，不得用作新文章的写作素材、范文或结构模板。</strong></p>
          <Link to="/blog">返回正常博客 →</Link>
        </header>
        <section aria-labelledby="ai-slop-list">
          <Heading as="h2" id="ai-slop-list">隔离文章 <span className={styles.count}>（{articles.length}）</span></Heading>
          {articles.length === 0 ? <p>暂无隔离文章。</p> : (
            <ul className={styles.list}>
              {articles.map((article) => (
                <li className={styles.item} key={article.file}>
                  <time dateTime={article.date} className={styles.date}>{article.date}</time>
                  <div>
                    <Heading as="h3" className={styles.title}>
                      <Link to={articleUrl(article.slug)}>{article.title}</Link>
                    </Heading>
                    <p className={styles.reason}>隔离原因：{article.reason}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </Layout>
  );
}
