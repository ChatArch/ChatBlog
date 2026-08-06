import Heading from '@theme/Heading';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import styles from '../styles.module.css';

export default function AgentCommunitySlidesPage(): JSX.Element {
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
            <p className={styles.talkMeta}>2026-08-06 · Agent Community · Web Slides</p>

            <section className={styles.materials} aria-labelledby="materials-heading">
              <Heading as="h2" id="materials-heading">Materials</Heading>
              <p>
                这是一个纯静态 quick start demo，用 Patrick-style 的材料页 + 嵌套 slides artifact 结构承载。
                真实 deck 是单个 HTML 静态文件，可以直接打开、演示，也可以通过 URL 固定到具体 scene / beat。
              </p>
              <div className={styles.materialActions}>
                <form action="./agent-community/deck/" method="get">
                  <button className="button button--primary button--lg" type="submit">
                    Open slides
                  </button>
                </form>
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
                <li>First slice：先跑通 Detect → Judge → Action → Readback。</li>
              </ul>
            </section>
          </article>
        </div>
      </main>
    </Layout>
  );
}
