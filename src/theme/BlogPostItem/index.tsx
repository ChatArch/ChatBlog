import React, {type ReactNode} from 'react';
import Head from '@docusaurus/Head';
import Link from '@docusaurus/Link';
import {useBlogPost} from '@docusaurus/plugin-content-blog/client';
import BlogPostItem from '@theme-original/BlogPostItem';
import type {Props} from '@theme/BlogPostItem';

export default function BlogPostItemWrapper(props: Props): ReactNode {
  const {metadata, isBlogPostPage} = useBlogPost();
  const frontMatter = metadata.frontMatter as {
    ai_slop?: boolean;
    ai_slop_reason?: string;
  };
  const quarantined = isBlogPostPage && frontMatter.ai_slop === true;

  return (
    <>
      {quarantined && (
        <>
          <Head><meta name="robots" content="noindex, nofollow" /></Head>
          <aside className="alert alert--warning margin-bottom--lg" role="note" aria-label="AI Slop 归档告警">
            <p><strong>AI Slop · 负面归档</strong></p>
            <p>{frontMatter.ai_slop_reason || '本文未达到主区保留标准，已隔离归档。'}</p>
            <p>原文仅供追溯，不代表推荐或认可；不得作为写作素材、范文或结构模板。</p>
            <Link to="/ai-slop">查看 AI Slop 归档</Link>
          </aside>
        </>
      )}
      <BlogPostItem {...props} />
    </>
  );
}
