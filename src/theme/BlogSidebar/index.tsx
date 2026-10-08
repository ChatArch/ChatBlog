import React, {type ReactNode} from 'react';
import OriginalBlogSidebar from '@theme-original/BlogSidebar';
import type {Props} from '@theme/BlogSidebar';
import manifest from '../../data/article-status.json';
import {filterSidebarItems} from '../../../scripts/article-status.cjs';

export default function BlogSidebar(props: Props): ReactNode {
  if (!props.sidebar) return <OriginalBlogSidebar {...props} />;
  return (
    <OriginalBlogSidebar
      {...props}
      sidebar={{...props.sidebar, items: filterSidebarItems(props.sidebar.items, manifest)}}
    />
  );
}
