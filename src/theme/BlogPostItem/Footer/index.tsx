import React, {useEffect, useMemo, useRef} from 'react';
import clsx from 'clsx';
import {useBlogPost} from '@docusaurus/plugin-content-blog/client';
import {ThemeClassNames} from '@docusaurus/theme-common';
import EditMetaRow from '@theme/EditMetaRow';
import TagsListInline from '@theme/TagsListInline';
import ReadMoreLink from '@theme/BlogPostItem/Footer/ReadMoreLink';
import styles from './styles.module.css';

const TWIKOO_ENV_ID = 'https://twikoo-chatblog.public.wzhecnu.cn/';
const TWIKOO_SCRIPT_ID = 'chatblog-twikoo-script';
const TWIKOO_SCRIPT_SRC = 'https://cdn.jsdelivr.net/npm/twikoo@1.7.15/dist/twikoo.all.min.js';
const TWIKOO_SCRIPT_INTEGRITY = 'sha384-XsVpk+eCJ/pm5ujR4PkgMBHUuN3VVwoJ4pbburK612ZTRGffVzipZPX0MNMDJn8V';
const TWIKOO_SCRIPT_TIMEOUT_MS = 15000;

let twikooScriptPromise: Promise<void> | undefined;

declare global {
  interface Window {
    twikoo?: {
      init: (options: {
        envId: string;
        el: string | HTMLElement;
        path?: string;
        lang?: string;
      }) => void | Promise<void>;
    };
  }
}

function loadTwikooScript(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.resolve();
  }
  if (window.twikoo) {
    return Promise.resolve();
  }
  if (twikooScriptPromise) {
    return twikooScriptPromise;
  }

  const existingScript = document.getElementById(TWIKOO_SCRIPT_ID) as HTMLScriptElement | null;
  if (existingScript && existingScript.dataset.loaded === 'true') {
    if (window.twikoo) {
      return Promise.resolve();
    }
    existingScript.remove();
  } else if (existingScript && existingScript.dataset.failed === 'true') {
    existingScript.remove();
  }

  twikooScriptPromise = new Promise((resolve, reject) => {
    const pendingScript = document.getElementById(TWIKOO_SCRIPT_ID) as HTMLScriptElement | null;
    const script = pendingScript ?? document.createElement('script');
    let settled = false;
    let timeoutId: ReturnType<typeof window.setTimeout> | undefined;

    const cleanup = () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
      script.removeEventListener('load', handleLoad);
      script.removeEventListener('error', handleError);
    };
    const fail = (error: Error) => {
      if (settled) {
        return;
      }
      settled = true;
      cleanup();
      script.dataset.failed = 'true';
      twikooScriptPromise = undefined;
      script.remove();
      reject(error);
    };
    const handleLoad = () => {
      if (settled) {
        return;
      }
      if (!window.twikoo) {
        fail(new Error('Twikoo script loaded without exposing window.twikoo'));
        return;
      }
      settled = true;
      cleanup();
      script.dataset.loaded = 'true';
      resolve();
    };
    const handleError = () => fail(new Error('Failed to load Twikoo script'));

    script.id = TWIKOO_SCRIPT_ID;
    script.src = TWIKOO_SCRIPT_SRC;
    script.async = true;
    script.integrity = TWIKOO_SCRIPT_INTEGRITY;
    script.crossOrigin = 'anonymous';
    script.addEventListener('load', handleLoad, {once: true});
    script.addEventListener('error', handleError, {once: true});
    timeoutId = window.setTimeout(() => fail(new Error('Timed out loading Twikoo script')), TWIKOO_SCRIPT_TIMEOUT_MS);

    if (!pendingScript) {
      document.head.appendChild(script);
    }
  });

  return twikooScriptPromise;
}

function BlogPostComments({path}: {path: string}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    const container = containerRef.current;

    const resetContainer = () => {
      if (container) {
        container.replaceChildren();
      }
    };

    resetContainer();

    loadTwikooScript()
      .then(() => {
        if (cancelled || !container || !window.twikoo) {
          return;
        }
        const mountNode = document.createElement('div');
        mountNode.className = 'twikoo';
        container.replaceChildren(mountNode);
        return window.twikoo.init({
          envId: TWIKOO_ENV_ID,
          el: mountNode,
          path,
          lang: 'zh-CN',
        });
      })
      .catch((error) => {
        if (!cancelled) {
          resetContainer();
          // Keep page rendering non-fatal if the comments script CDN is unavailable.
          console.warn(error);
        }
      });

    return () => {
      cancelled = true;
      resetContainer();
    };
  }, [path]);

  return (
    <section className={styles.commentsSection} aria-label="评论区">
      <h2 className={styles.commentsTitle}>评论</h2>
      <div ref={containerRef} />
    </section>
  );
}

export default function BlogPostItemFooter() {
  const {metadata, isBlogPostPage} = useBlogPost();
  const {
    tags,
    title,
    editUrl,
    hasTruncateMarker,
    lastUpdatedBy,
    lastUpdatedAt,
  } = metadata;
  const commentPath = useMemo(() => metadata.permalink, [metadata.permalink]);
  // A post is truncated if it's in the "list view" and it has a truncate marker
  const truncatedPost = !isBlogPostPage && hasTruncateMarker;
  const tagsExists = tags.length > 0;
  const renderFooter = tagsExists || truncatedPost || isBlogPostPage;
  if (!renderFooter) {
    return null;
  }
  // BlogPost footer - details view
  if (isBlogPostPage) {
    const canDisplayEditMetaRow = !!(editUrl || lastUpdatedAt || lastUpdatedBy);
    return (
      <footer className="docusaurus-mt-lg">
        {tagsExists && (
          <div
            className={clsx(
              'row',
              'margin-top--sm',
              ThemeClassNames.blog.blogFooterEditMetaRow,
            )}>
            <div className="col">
              <TagsListInline tags={tags} />
            </div>
          </div>
        )}
        {canDisplayEditMetaRow && (
          <EditMetaRow
            className={clsx(
              'margin-top--sm',
              ThemeClassNames.blog.blogFooterEditMetaRow,
            )}
            editUrl={editUrl}
            lastUpdatedAt={lastUpdatedAt}
            lastUpdatedBy={lastUpdatedBy}
          />
        )}
        <BlogPostComments path={commentPath} />
      </footer>
    );
  }
  // BlogPost footer - list view
  return (
    <footer className="row docusaurus-mt-lg">
      {tagsExists && (
        <div className={clsx('col', {'col--9': truncatedPost})}>
          <TagsListInline tags={tags} />
        </div>
      )}
      {truncatedPost && (
        <div
          className={clsx('col text--right', {
            'col--3': tagsExists,
          })}>
          <ReadMoreLink blogPostTitle={title} to={metadata.permalink} />
        </div>
      )}
    </footer>
  );
}
