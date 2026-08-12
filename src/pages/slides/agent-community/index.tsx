import Heading from '@theme/Heading';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from '../styles.module.css';

export default function AgentCommunitySlidesPage(): JSX.Element {
  const deckUrl = useBaseUrl('/slides/agent-community/deck/');

  return (
    <Layout
      title="Agent Community Quick Start"
      description="Agent Community quick start Web Slides demo"
    >
      <main className={styles.talkPage}>
        <div className="container">
          <article className={styles.talkArticle}>
            <p className={styles.eyebrow}>SLIDES</p>
            <Heading as="h1" className={styles.talkTitle}>
              Agent Community Quick Start
            </Heading>
            <p className={styles.talkSubtitle}>从机器人群聊到可治理议事厅</p>
            <p className={styles.talkMeta}>2026-08-12 · Agent Community · frontend-slides remodel</p>

            <section className={styles.materials} aria-labelledby="materials-heading">
              <Heading as="h2" id="materials-heading">Materials</Heading>
              <p>
                这是一个用 frontend-slides 思路改造过的纯静态 Web Slides demo：固定 1920×1080 stage，
                浏览器只做整体缩放；真实 deck 是单个 HTML 静态文件，可以直接打开、演示，也可以通过 URL 固定到具体 scene / beat。
              </p>
              <div className={styles.materialActions}>
                <a className="button button--primary button--lg" href={deckUrl}>
                  Open slides
                </a>
                <a className="button button--secondary button--lg" href={`${deckUrl}?scene=8&beat=2`}>
                  frontend-slides scene
                </a>
                <Link className="button button--secondary button--lg" to="/slides">
                  All slides
                </Link>
              </div>
            </section>

            <section className={styles.summaryBlock} aria-labelledby="summary-heading">
              <Heading as="h2" id="summary-heading">Structure</Heading>
              <ul>
                <li>Thesis：不是机器人群聊，而是可治理议事厅。</li>
                <li>Failure：只做群聊会热闹但不可追踪。</li>
                <li>Model：Topic / Profile / Human Admin / Loop 分工。</li>
                <li>Skill：用 frontend-slides 把 ChatBlog 文章快速变成可看的 Web Deck 草稿。</li>
                <li>First slice：先跑通 Detect → Judge → Action → Readback。</li>
              </ul>
            </section>
          </article>
        </div>
      </main>
    </Layout>
  );
}
