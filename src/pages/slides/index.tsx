import Heading from '@theme/Heading';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import styles from './styles.module.css';

const slides = [
  {
    title: 'Agent Community Quick Start',
    subtitle: '从机器人群聊到可治理议事厅',
    description:
      '一个纯静态 Web Slides demo：用 scene / beat / URL state 把 Agent Discussion Community 的核心论点拆成可演示、可 review、可发布的切片。',
    href: '/slides/agent-community/',
    meta: 'Materials page · static deck · 9 scenes',
    status: 'quick start demo',
  },
];

function SlidesHero() {
  return (
    <header className={styles.hero}>
      <div className="container">
        <p className={styles.eyebrow}>ChatBlog Slides</p>
        <Heading as="h1" className={styles.title}>Slides</Heading>
        <p className={styles.subtitle}>
          把博客、调研和项目成果整理成可演示的 Web Slides。这里先承载 quick start demo，后续再沉淀为稳定的 slides infra。
        </p>
      </div>
    </header>
  );
}

function SlidesList() {
  return (
    <section className={styles.list}>
      <div className="container">
        <div className={styles.sectionHeader}>
          <Heading as="h2">已发布 Demo</Heading>
          <p>当前条目以纯静态 HTML 发布，不依赖后端服务；可以直接打开、演示和分享具体 scene / beat URL。</p>
        </div>
        <div className="row">
          {slides.map((slide) => (
            <div className="col col--6" key={slide.href}>
              <article className={styles.card}>
                <div className={styles.cardMeta}>{slide.meta}</div>
                <Heading as="h3">{slide.title}</Heading>
                <p className={styles.subtitleLine}>{slide.subtitle}</p>
                <p>{slide.description}</p>
                <div className={styles.cardFooter}>
                  <span>{slide.status}</span>
                  <Link className="button button--primary" to={slide.href}>
                    查看材料页
                  </Link>
                </div>
              </article>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function SlidesPage(): JSX.Element {
  return (
    <Layout title="Slides" description="ChatBlog Web Slides demos and presentation artifacts">
      <SlidesHero />
      <main>
        <SlidesList />
      </main>
    </Layout>
  );
}
