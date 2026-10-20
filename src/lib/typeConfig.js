// src/lib/typeConfig.js
// 物件種別・地価種別のマスター定義（スラッグ、ラベル、タイトル、見出し、メタ説明文）

export const VALID_TYPES = ['mansion', 'house', 'land', 'rosenka', 'official', 'standard'];

export const TYPE_CONFIG = {
    index: {
        key: 'index',
        label: '総合',
        titleSuffix: 'の不動産相場・地価まとめ【2026年最新】マンション・戸建て・土地・路線価',
        h1Suffix: 'の不動産相場・地価総合情報',
        subSuffix: '国土交通省の公的データに基づくマンション・戸建て・土地の取引相場と路線価・公示地価・基準地価の総合まとめ',
        metaTemplate: (name, pref) => `${pref}${name}の不動産相場・地価の総合まとめ（2026年最新）。中古マンション・一戸建て・土地の平均取引価格や坪単価、相続税路線価、公示価格、基準地価、最新取引事例を一覧で比較できます。`,
    },
    mansion: {
        key: 'mansion',
        label: '中古マンション',
        titleSuffix: 'の中古マンション相場',
        h1Suffix: 'の中古マンション相場',
        subSuffix: '国土交通省の取引実績に基づく中古マンションの相場情報・価格推移・直近事例',
        metaTemplate: (name, pref) => `${pref}${name}の中古マンション相場情報。平均取引価格や坪単価、四半期ごとの推移、直近の取引事例を掲載しています。`,
    },
    house: {
        key: 'house',
        label: '戸建て',
        titleSuffix: 'の戸建て相場',
        h1Suffix: 'の戸建て相場',
        subSuffix: '国土交通省の取引実績に基づく一戸建て（土地＋建物）の相場情報・延床面積・構造別事例',
        metaTemplate: (name, pref) => `${pref}${name}の戸建て相場情報。平均取引価格や延床面積・築年数別事例、四半期ごとの推移を掲載しています。`,
    },
    land: {
        key: 'land',
        label: '土地',
        titleSuffix: 'の土地価格・相場',
        h1Suffix: 'の土地価格・相場',
        subSuffix: '国土交通省の取引実績に基づく土地取引の平均坪単価・平米単価・直近事例',
        metaTemplate: (name, pref) => `${pref}${name}の土地取引価格・平均坪単価情報。四半期推移や直近取引事例を掲載しています。`,
    },
    rosenka: {
        key: 'rosenka',
        label: '路線価',
        titleSuffix: 'の路線価',
        h1Suffix: 'の路線価',
        subSuffix: '国税庁が公表する道路（路線）に面する宅地の価格基準（毎年1月1日時点・地価公示の約80%水準）',
        metaTemplate: (name, pref) => `${pref}${name}の相続税路線価情報。平均路線価・坪単価、敷地面積別の相続税評価額目安試算、主要地点一覧を掲載しています。`,
    },
    official: {
        key: 'official',
        label: '公示価格',
        titleSuffix: 'の公示価格',
        h1Suffix: 'の公示価格',
        subSuffix: '国土交通省 土地鑑定委員会が判定・公表する標準地の価格指標（毎年1月1日時点・3月下旬公表）',
        metaTemplate: (name, pref) => `${pref}${name}の地価公示（公示地価）情報。標準地の平均価格、坪単価、前年比変動率、住宅地・商業地別比較、標準地一覧を掲載しています。`,
    },
    standard: {
        key: 'standard',
        label: '基準地価',
        titleSuffix: 'の基準地価',
        h1Suffix: 'の基準地価',
        subSuffix: '各都道府県が判定・公表する基準地の標準価格（毎年7月1日時点・9月下旬公表）',
        metaTemplate: (name, pref) => `${pref}${name}の都道府県地価調査（基準地価）情報。7月1日時点の推計基準地価、坪単価、年間変動トレンド、基準地一覧を掲載しています。`,
    },
};

export const normalizeType = (t) => {
    if (!t) return 'mansion';
    if (t === 'index' || t === 'overview') return 'index';
    if (t === 'kouji') return 'official';
    if (t === 'kijun') return 'standard';
    return TYPE_CONFIG[t] ? t : 'mansion';
};
