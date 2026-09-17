export type ArticleStatus = {
  file: string;
  title: string;
  slug: string;
  date: string;
  status: 'keep' | 'slop';
  reason: string;
};
export function articleUrl(slug: string): string;
export function validateArticleStatus(manifest: unknown, expectedFiles?: string[]): ArticleStatus[];
export function getSlopArticles(manifest: unknown): ArticleStatus[];
export function isSlopPath(pathname: string, manifest: unknown): boolean;
export function filterSidebarItems<T extends {permalink: string}>(items: readonly T[], manifest: unknown): T[];
