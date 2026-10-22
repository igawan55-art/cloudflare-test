-- scripts/d1_schema.sql
-- Cloudflare D1 (SQLite) 用の事前集計・高速検索スキーマ
-- 660万件の取引データと23万件の鑑定評価データを約14.3万行・約170MBに圧縮し、
-- 1ページ表示あたりの読取行数を 1〜2行（主キー検索）に最小化する設計

DROP TABLE IF EXISTS area_stats;
CREATE TABLE area_stats (
    area_key TEXT PRIMARY KEY,          -- 'all'(全国) / 5桁市区町村コード(例:'13224') / 9桁町字コード(例:'132240210')
    muni_code TEXT,                     -- 5桁市区町村コード
    pref_name TEXT,                     -- 都道府県名
    city_name TEXT,                     -- 市区町村名
    district_name TEXT,                 -- 町字名（市区町村・全国の場合は空文字）
    stats_json TEXT NOT NULL            -- { types: { mansion: { count, avgPrice, avgSqm, avgArea, quarters, rows }, house: {...}, land: {...} } }
);
CREATE INDEX idx_area_stats_muni ON area_stats(muni_code);

DROP TABLE IF EXISTS cities_master;
CREATE TABLE cities_master (
    muni_code TEXT PRIMARY KEY,         -- 5桁市区町村コード (例: '13224')
    pref_code TEXT NOT NULL,            -- 2桁都道府県コード (例: '13')
    pref_name TEXT NOT NULL,            -- 都道府県名
    city_name TEXT NOT NULL,            -- 市区町村名
    tx_count INTEGER DEFAULT 0,         -- 総取引件数
    mansion_avg INTEGER,                -- 中古マンション平均価格(円)
    house_avg INTEGER,                  -- 戸建て平均価格(円)
    land_sqm_avg INTEGER,               -- 土地平均㎡単価(円)
    districts_json TEXT NOT NULL        -- 配下の町字一覧JSON [{ code, name, count, mansion, house, landTsubo }]
);
CREATE INDEX idx_cities_pref ON cities_master(pref_code, tx_count DESC);

DROP TABLE IF EXISTS appraisals_latest;
CREATE TABLE appraisals_latest (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    muni_code TEXT NOT NULL,            -- 5桁市区町村コード
    pref_code TEXT NOT NULL,            -- 2桁都道府県コード
    year TEXT NOT NULL,                 -- 最新対象年 (例: '2026')
    address TEXT NOT NULL,              -- 標準地・基準地の所在地
    division TEXT,                      -- 用途区分 ('住宅地', '商業地' 等)
    official_price INTEGER,             -- 公示価格/㎡ (円)
    fluctuation_rate REAL,              -- 対前年変動率 (%)
    area REAL,                          -- 地積 (㎡)
    bcr REAL,                           -- 建蔽率 (%)
    far REAL,                           -- 容積率 (%)
    cap_rate REAL                       -- 期待還元利回り (%)
);
CREATE INDEX idx_appr_muni ON appraisals_latest(muni_code);
CREATE INDEX idx_appr_pref ON appraisals_latest(pref_code, official_price DESC);

DROP TABLE IF EXISTS area_descriptions;
CREATE TABLE area_descriptions (
    area_key TEXT PRIMARY KEY,          -- '都道府県|市区町村|町字' (例: '東京都|多摩市|連光寺')
    description TEXT NOT NULL,          -- 定性市場分析レポート本文
    char_count INTEGER DEFAULT 0        -- 文字数
);
