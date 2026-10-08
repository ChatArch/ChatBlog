import React, {type ReactNode} from 'react';
import {useLocation} from '@docusaurus/router';
import {UnlistedMetadata} from '@docusaurus/theme-common';
import OriginalUnlisted from '@theme-original/ContentVisibility/Unlisted';
import type {Props} from '@theme/ContentVisibility/Unlisted';
import manifest from '../../../data/article-status.json';
import {isSlopPath} from '../../../../scripts/article-status.cjs';

export default function Unlisted(props: Props): ReactNode {
  const {pathname} = useLocation();
  // AI Slop provides its own explanation; retain the native noindex metadata.
  if (isSlopPath(pathname, manifest)) return <UnlistedMetadata />;
  return <OriginalUnlisted {...props} />;
}
