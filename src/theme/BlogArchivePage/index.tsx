import React, {type ReactNode} from 'react';
import Link from '@docusaurus/Link';
import {PageMetadata} from '@docusaurus/theme-common';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type ArchivePost = {
  metadata: {
    date: string;
    title: string;
    permalink: string;
    description?: string;
    tags?: {label: string; permalink: string}[];
    readingTime?: number;
  };
};

type Props = {
  archive: {
    blogPosts: ArchivePost[];
  };
};

type YearGroup = {
  year: string;
  posts: ArchivePost[];
};

function isoDate(date: string): string {
  return date.slice(0, 10);
}

function groupByYear(posts: ArchivePost[]): YearGroup[] {
  const sortedPosts = [...posts].sort(
    (left, right) => Date.parse(right.metadata.date) - Date.parse(left.metadata.date),
  );

  const groups = new Map<string, ArchivePost[]>();
  for (const post of sortedPosts) {
    const year = isoDate(post.metadata.date).slice(0, 4);
    const yearPosts = groups.get(year) ?? [];
    yearPosts.push(post);
    groups.set(year, yearPosts);
  }

  return Array.from(groups, ([year, yearPosts]) => ({year, posts: yearPosts}));
}

function PostTags({post}: {post: ArchivePost}) {
  const tags = post.metadata.tags ?? [];
  if (tags.length === 0) {
    return null;
  }

  return (
    <div className={styles.tags}>
      {tags.map((tag) => (
        <Link to={tag.permalink} key={tag.permalink}>
          {tag.label}
        </Link>
      ))}
    </div>
  );
}

function TimelineItem({post}: {post: ArchivePost}) {
  return (
    <article className={styles.item}>
      <time className={styles.date} dateTime={isoDate(post.metadata.date)}>
        {isoDate(post.metadata.date)}
      </time>
      <div className={styles.content}>
        <Link className={styles.title} to={post.metadata.permalink}>
          {post.metadata.title}
        </Link>
        {post.metadata.description && <p>{post.metadata.description}</p>}
        <PostTags post={post} />
      </div>
    </article>
  );
}

function YearSection({year, posts}: YearGroup) {
  return (
    <section className={styles.yearSection} aria-labelledby={`archive-${year}`}>
      <Heading as="h2" id={`archive-${year}`} className={styles.year}>
        {year}
      </Heading>
      <div className={styles.timeline}>
        {posts.map((post) => (
          <TimelineItem post={post} key={post.metadata.permalink} />
        ))}
      </div>
    </section>
  );
}

export default function BlogArchive({archive}: Props): ReactNode {
  const groups = groupByYear(archive.blogPosts);
  const totalCount = archive.blogPosts.length;

  return (
    <>
      <PageMetadata title="时间轴" description="按时间轴浏览全部 ChatBlog 历史文章" />
      <Layout title="时间轴" description="按时间轴浏览全部 ChatBlog 历史文章">
        <header className={styles.hero}>
          <div className="container">
            <p className={styles.kicker}>Archive</p>
            <Heading as="h1">时间轴</Heading>
            <p className={styles.summary}>文章总览 - {totalCount}</p>
            <p className={styles.description}>
              按年份和发布日期浏览全部 ChatBlog 文章。日期单独成列，标题保持干净，适合快速回看完整历史。
            </p>
            <div className={styles.actions}>
              <Link className="button button--secondary" to="/blog">
                最新文章
              </Link>
              <Link className="button button--secondary" to="/blog/tags">
                标签
              </Link>
            </div>
          </div>
        </header>
        <main className={styles.main}>
          <div className="container">
            {groups.map((group) => (
              <YearSection key={group.year} {...group} />
            ))}
          </div>
        </main>
      </Layout>
    </>
  );
}
