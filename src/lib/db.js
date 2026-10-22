// src/lib/db.js
// Cloudflare D1 (env.DB) / ローカルMySQL / 外部クラウドMySQL / 内蔵エッジスナップショットのハイブリッドDBアダプター
// 優先順位:
//   1. Cloudflare D1 バインディング (env.DB) が存在する場合は D1 (SQLite) から1〜2行の主キー読込で超高速応答
//   2. ローカル開発環境 (MySQL) または 外部DB_HOST設定時は MySQL プールを使用
//   3. いずれも未接続の場合は内蔵エッジスナップショット (ssrCoreData.json) へ自動フォールバック

let poolPromise = null;
let dbUnavailable = false;

function getCloudflareD1Binding() {
    // prepareCloudflarePages.js が リクエストごとに globalThis.__CF_ENV__ = env をセットする
    if (typeof globalThis !== 'undefined' && globalThis.__CF_ENV__?.DB) {
        return globalThis.__CF_ENV__.DB;
    }
    return null;
}

function isCloudflareWorkerWithoutRemoteDb() {
    const env = typeof process !== 'undefined' && process.env ? process.env : {};
    const hasRemoteHost = Boolean(env.DB_HOST && env.DB_HOST !== 'localhost' && env.DB_HOST !== '127.0.0.1');
    const isWorkerd = typeof navigator !== 'undefined' && navigator.userAgent === 'Cloudflare-Workers';
    if (isWorkerd && !hasRemoteHost) {
        return true;
    }
    return false;
}

async function getMysqlPool() {
    if (getCloudflareD1Binding() || dbUnavailable || isCloudflareWorkerWithoutRemoteDb()) {
        return null;
    }
    if (!poolPromise) {
        poolPromise = (async () => {
            try {
                const env = typeof process !== 'undefined' && process.env ? process.env : {};
                const host = env.DB_HOST || 'localhost';
                const port = Number(env.DB_PORT || 3306);
                const user = env.DB_USER || 'root';
                const password = env.DB_PASSWORD || '';
                const database = env.DB_NAME || 'realestate_db';
                const useSsl =
                    env.DB_SSL === 'true' ||
                    host.endsWith('.tidbcloud.com') ||
                    host.endsWith('.psdb.cloud') ||
                    host.endsWith('.aivencloud.com');

                // Vite/Rollup が Cloudflare Worker バンドルに Node.js TCP モジュール(net/tls)を強制同梱しないよう動的インポート
                const pkgName = 'mysql2/' + 'promise';
                const mysql = await import(/* @vite-ignore */ pkgName);
                const createPool = mysql.default?.createPool || mysql.createPool;

                const pool = createPool({
                    host,
                    port,
                    user,
                    password,
                    database,
                    waitForConnections: true,
                    connectionLimit: 10,
                    queueLimit: 0,
                    connectTimeout: 3000,
                    ...(useSsl ? { ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true } } : {}),
                });
                return pool;
            } catch (err) {
                dbUnavailable = true;
                return null;
            }
        })();
    }
    return poolPromise;
}

export function getDb() {
    return {
        /** Cloudflare D1 バインディングが存在するかどうか */
        get d1() {
            return getCloudflareD1Binding();
        },
        /** D1 も MySQL も使えず内蔵スナップショットのみで応答するモードかどうか */
        get isEdgeSnapshot() {
            if (getCloudflareD1Binding()) return false;
            return dbUnavailable || isCloudflareWorkerWithoutRemoteDb();
        },
        /** Cloudflare D1 から単一行を主キー等で取得 (1 row read) */
        async d1First(sql, params = []) {
            const d1 = getCloudflareD1Binding();
            if (!d1) return null;
            try {
                return await d1.prepare(sql).bind(...params).first();
            } catch (err) {
                console.error('[D1 First Error]', err);
                return null;
            }
        },
        /** Cloudflare D1 から複数行を取得 */
        async d1All(sql, params = []) {
            const d1 = getCloudflareD1Binding();
            if (!d1) return [];
            try {
                const res = await d1.prepare(sql).bind(...params).all();
                return res?.results || [];
            } catch (err) {
                console.error('[D1 All Error]', err);
                return [];
            }
        },
        /** MySQL 互換クエリ */
        async query(sql, params = []) {
            const pool = await getMysqlPool();
            if (!pool) {
                return [[], []];
            }
            try {
                return await pool.query(sql, params);
            } catch (err) {
                if (
                    err?.code === 'ECONNREFUSED' ||
                    err?.code === 'ENOTFOUND' ||
                    err?.code === 'ETIMEDOUT' ||
                    err?.code === 'PROTOCOL_CONNECTION_LOST'
                ) {
                    dbUnavailable = true;
                    return [[], []];
                }
                throw err;
            }
        },
    };
}
