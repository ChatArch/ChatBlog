import React from 'react';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {editorLoginUrl} from '../../scripts/editor-entry.cjs';
import styles from './login.module.css';

export default function LoginEntry(): React.ReactNode {
  const {siteConfig} = useDocusaurusContext();
  const loginUrl = editorLoginUrl(siteConfig.customFields?.editorOrigin);
  return (
    <Layout title="登录" description="ChatBlog 的授权编辑登录入口与服务接入状态。">
      <main className={styles.page}>
        <Heading as="h1">ChatBlog 登录</Heading>
        <p className={styles.lead}>公开文章无需登录。登录用于授权编辑者保存逐篇反馈、标签和精选选择，账号权限由独立编辑服务验证。</p>
        {loginUrl ? (
          <section className={styles.panel} aria-labelledby="login-state" data-editor-status="configured">
            <Heading as="h2" id="login-state">前往编辑服务登录</Heading>
            <p>本站已配置独立编辑入口。点击下方按钮，在编辑服务自己的登录页面完成验证；这个静态页面不接收密码，也不显示或保存你的会话。</p>
            <a className="button button--primary" href={loginUrl}>前往编辑服务登录</a>
          </section>
        ) : (
          <section className={`${styles.panel} ${styles.missing}`} aria-labelledby="login-state" data-editor-status="not-configured">
            <Heading as="h2" id="login-state">登录入口尚未配置</Heading>
            <p>当前站点还没有接入真实编辑后端，因此暂时不能进行账号登录。编辑服务需要部署并配置入口后，才能登录、保存反馈或调整精选。</p>
            <p>这里不提供默认账号、演示密码或仅在浏览器里假装成功的登录表单。</p>
            <Link className="button button--secondary" to="/blog">继续阅读公开文章</Link>
          </section>
        )}
        <p className={styles.note}>登录服务不提供公开注册。获得编辑账号后在服务端登录；保存的选择与公开博客的静态发布仍是两步。配置入口本身也不代表后端已经完成可用性验收。</p>
        <Link to="/blog/about-chatblog#site-settings">了解博客的阅读与编辑设定 →</Link>
      </main>
    </Layout>
  );
}
