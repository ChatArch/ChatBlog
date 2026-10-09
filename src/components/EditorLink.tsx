import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

export default function EditorLink({slug}: {slug?: string}): React.ReactNode {
  const {siteConfig} = useDocusaurusContext();
  const origin = siteConfig.customFields?.editorOrigin;
  if (typeof origin !== 'string' || !origin) return null;
  const link = new URL('/editor', origin);
  if (slug) link.searchParams.set('slug', slug);
  return <a href={link.toString()}>编辑判断</a>;
}
