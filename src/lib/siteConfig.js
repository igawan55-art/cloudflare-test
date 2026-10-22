// src/lib/siteConfig.js
// サイト全体の共通設定（ドメイン変更・SEO・メタ情報の一括管理）
// ドメインを変更する場合は、下記の DEFAULT_SITE_URL（または環境変数 SITE_URL）を変更するだけで
// 全ページの canonical URL・JSON-LD構造化データ・Astro設定に一括反映されます。

const DEFAULT_SITE_URL = 'https://chikashiru.jp';

export const SITE_URL = (
    (typeof process !== 'undefined' && process.env?.SITE_URL) ||
    DEFAULT_SITE_URL
).replace(/\/+$/, '');

export const SITE_NAME = 'チカシル';

/**
 * 相対パスまたはURLから正規化された canonical URL を生成するヘルパー
 * @param {string} [pathOrUrl] - 例: '/pref13/13112/rosenka' または フルURL
 * @returns {string}
 */
export function buildCanonicalUrl(pathOrUrl = '/') {
    if (!pathOrUrl) return `${SITE_URL}/`;
    if (/^https?:\/\//i.test(pathOrUrl)) {
        return pathOrUrl;
    }
    const cleanPath = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
    return `${SITE_URL}${cleanPath}`;
}
