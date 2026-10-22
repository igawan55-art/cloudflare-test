// src/lib/db.js
// ローカルMySQL / 外部クラウドMySQL (TiDB Cloud無料枠等) / Cloudflare D1 / 内蔵エッジスナップショットのハイブリッドDBアダプター

let poolPromise = null;
let dbUnavailable = false;

function isCloudflareWorkerWithoutRemoteDb() {
    // Cloudflare Workers / Pages 環境で、外部 DB_HOST が設定されていない場合は内蔵スナップショットを使用
    const env = typeof process !== 'undefined' && process.env ? process.env : {};
    const hasRemoteHost = Boolean(env.DB_HOST && env.DB_HOST !== 'localhost' && env.DB_HOST !== '127.0.0.1');
    const isWorkerd = typeof navigator !== 'undefined' && navigator.userAgent === 'Cloudflare-Workers';
    if (isWorkerd && !hasRemoteHost) {
        return true;
    }
    return false;
}

async function getMysqlPool() {
    if (dbUnavailable || isCloudflareWorkerWithoutRemoteDb()) {
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
        get isEdgeSnapshot() {
            return dbUnavailable || isCloudflareWorkerWithoutRemoteDb();
        },
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
