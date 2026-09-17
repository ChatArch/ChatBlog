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
