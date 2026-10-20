// src/lib/structuredData.js
// JSON-LD（Schema.org）構造化データ生成ヘルパー
import { SITE_URL, SITE_NAME } from './siteConfig.js';

/**
 * サイト全体の共通WebSite構造化データ
 * 検索アクション（SearchAction）付き
 */
export function buildWebSiteSchema() {
    return {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        'name': SITE_NAME,
        'url': `${SITE_URL}/`,
        'description': '全国の不動産取引価格、路線価、公示価格、地価を知る相場検索サイト',
        'inLanguage': 'ja',
        'potentialAction': {
            '@type': 'SearchAction',
            'target': {
                '@type': 'EntryPoint',
                'urlTemplate': `${SITE_URL}/areas?q={search_term_string}`
            },
            'query-input': 'required name=search_term_string'
        }
    };
}

/**
 * パンくずリスト構造化データ（BreadcrumbList）
 * @param {Array<{ name: string, url?: string }>} items
 */
export function buildBreadcrumbSchema(items = []) {
    if (!items || items.length === 0) return null;

    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        'itemListElement': items.map((item, index) => {
            const element = {
                '@type': 'ListItem',
                'position': index + 1,
                'name': item.name,
            };
            if (item.url) {
                element.item = item.url.startsWith('http') ? item.url : `${SITE_URL}${item.url.startsWith('/') ? '' : '/'}${item.url}`;
            }
            return element;
        })
    };
}

/**
 * 記事・コンテンツページ用 構造化データ（Article）
 * 都道府県・市区町村・地区などの相場情報・地価解説コンテンツに適合
 * @param {{
 *   title: string,
 *   description?: string,
 *   url: string,
 *   headline?: string,
 *   datePublished?: string,
 *   dateModified?: string,
 *   authorName?: string,
 *   image?: string
 * }} opts
 */
export function buildArticleSchema({
    title,
    description = '',
    url,
    headline = title,
    datePublished = '2024-01-01T00:00:00+09:00',
    dateModified = '2026-10-01T00:00:00+09:00',
    authorName = SITE_NAME,
    image = `${SITE_URL}/assets/images/logo.svg`
}) {
    const canonical = url.startsWith('http') ? url : `${SITE_URL}${url.startsWith('/') ? '' : '/'}${url}`;

    return {
        '@context': 'https://schema.org',
        '@type': 'Article',
        'mainEntityOfPage': {
            '@type': 'WebPage',
            '@id': canonical
        },
        'headline': headline || title,
        'name': title,
        'description': description,
        'url': canonical,
        'image': [image],
        'datePublished': datePublished,
        'dateModified': dateModified,
        'author': {
            '@type': 'Organization',
            'name': authorName,
            'url': `${SITE_URL}/`
        },
        'publisher': {
            '@type': 'Organization',
            'name': SITE_NAME,
            'url': `${SITE_URL}/`,
            'logo': {
                '@type': 'ImageObject',
                'url': `${SITE_URL}/assets/images/logo.svg`
            }
        },
        'inLanguage': 'ja'
    };
}

/**
 * FAQPage 構造化データ（Google検索のリッチリザルト用）
 * @param {Array<{ question: string, answer: string }>} faqs
 */
export function buildFaqSchema(faqs = []) {
    if (!faqs || faqs.length === 0) return null;
    return {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        'mainEntity': faqs.map((f) => ({
            '@type': 'Question',
            'name': f.question,
            'acceptedAnswer': {
                '@type': 'Answer',
                'text': f.answer,
            },
        })),
    };
}
