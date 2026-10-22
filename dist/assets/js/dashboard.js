// public/assets/js/dashboard.js
// エリア相場ダッシュボード（実勢取引：KPI・推移グラフ・条件フィルタ・取引事例 ＆ 地価種別：路線価・公示価格・基準地価）
(function () {
    const DATA_YEAR = new Date().getFullYear();
    const TSUBO = 3.30578;
    const TYPE_LABEL = {
        mansion: '中古マンション',
        house: '戸建て',
        land: '土地',
        rosenka: '路線価',
        official: '公示価格',
        kouji: '公示価格',
        standard: '基準地価',
        kijun: '基準地価',
    };

    const normalizeType = (t) => {
        if (!t) return null;
        if (t === 'kouji') return 'official';
        if (t === 'kijun') return 'standard';
        return TYPE_LABEL[t] ? t : null;
    };

    const isLandPriceType = (t) => t === 'rosenka' || t === 'official' || t === 'standard';

    const fmtInt = (n) => (n == null || !isFinite(n) ? '—' : Math.round(n).toLocaleString('ja-JP'));
    const fmt1 = (n) => (n == null || !isFinite(n) ? '—' : n.toLocaleString('ja-JP', { minimumFractionDigits: 1, maximumFractionDigits: 1 }));
    const man = (yen) => (yen ? yen / 10000 : null);
    const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

    const AREA_BUCKETS = {
        mansion: [['', 'すべて'], ['s', '40㎡未満'], ['m', '40〜70㎡'], ['l', '70㎡以上']],
        other: [['', 'すべて'], ['s', '100㎡未満'], ['m', '100〜200㎡'], ['l', '200㎡以上']],
    };
    const inAreaBucket = (type, a, b) => {
        if (!b) return true;
        if (!a) return false;
        const [lo, hi] = type === 'mansion' ? [40, 70] : [100, 200];
        return b === 's' ? a < lo : b === 'm' ? a >= lo && a < hi : a >= hi;
    };
    const inAgeBucket = (by, b) => {
        if (!b) return true;
        if (!by) return false;
        const age = DATA_YEAR - by;
        return b === '10' ? age <= 10 : b === '20' ? age <= 20 : b === '30' ? age <= 30 : age > 30;
    };
    const inPlanBucket = (fp, b) => {
        if (!b) return true;
        if (!fp) return false;
        const n = parseInt(fp, 10);
        if (b === '1') return fp.includes('ワンルーム') || n === 1;
        if (b === '2') return n === 2;
        return n >= 3;
    };
    const inStructBucket = (st, b) => {
        if (!b) return true;
        if (!st) return false;
        if (b === 'rc') return /RC|SRC/.test(st);
        if (b === 'wood') return st.includes('木造');
        return !/RC|SRC/.test(st) && !st.includes('木造');
    };

    function init(root) {
        const scriptEl = root.querySelector('script[type="application/json"]');
        if (!scriptEl) return;
        const data = JSON.parse(scriptEl.textContent);
        const $ = (sel) => root.querySelector(sel);
        const $$ = (sel) => Array.from(root.querySelectorAll(sel));

        const initial = normalizeType(data.initialType) || 'mansion';
        const state = { type: initial, metric: 'price', age: '', plan: '', area: '', struct: '', shown: 20 };
        const qType = normalizeType(new URLSearchParams(location.search).get('type'));
        if (qType && data.types && data.types[qType]) state.type = qType;
        let chart = null;

        // ---------- KPI (実勢取引) ----------
        function renderKpi() {
            if (isLandPriceType(state.type)) return;
            const t = data.types[state.type];
            if (!t) return;
            $('[data-kpi="price"]').textContent = fmtInt(man(t.avgPrice));
            $('[data-kpi="tsubo"]').textContent = fmt1(t.avgSqm ? man(t.avgSqm * TSUBO) : null);
            $('[data-kpi="sqm"]').textContent = fmt1(man(t.avgSqm));
            $('[data-kpi="count"]').textContent = fmtInt(t.count);
            $('[data-kpi="avgArea"]').textContent = fmt1(t.avgArea);
            $$('[data-kpi-type]').forEach((el) => (el.textContent = TYPE_LABEL[state.type]));

            const f = data.fluctuation;
            const fEl = $('[data-kpi="fluc"]');
            const badge = $('[data-kpi="flucBadge"]');
            if (fEl && badge) {
                if (f == null) {
                    fEl.textContent = '—';
                    fEl.className = 'kpi-value delta flat';
                    badge.textContent = 'データなし';
                    badge.className = 'badge neutral';
                } else {
                    const up = f > 0, down = f < 0;
                    fEl.innerHTML = `${up ? '+' : ''}${f.toFixed(2)}<span class="kpi-unit">%</span>`;
                    fEl.className = `kpi-value delta ${up ? 'up' : down ? 'down' : 'flat'}`;
                    badge.textContent = up ? '▲ 上昇' : down ? '▼ 下落' : '横ばい';
                    badge.className = `badge ${up ? 'up' : down ? 'down' : 'neutral'}`;
                }
            }
        }

        // ---------- Chart (実勢取引) ----------
        function renderChart() {
            if (isLandPriceType(state.type)) return;
            const canvas = $('canvas');
            if (!canvas || !window.Chart) return;
            const t = data.types[state.type];
            if (!t) return;
            const q = t.quarters || [];
            const isPrice = state.metric === 'price';
            const values = q.map((r) => (isPrice ? man(r.avgPrice) : r.avgSqm ? man(r.avgSqm * TSUBO) : null));
            const unit = isPrice ? '万円' : '万円/坪';

            Chart.defaults.font.family = "'Inter','Noto Sans JP',sans-serif";
            Chart.defaults.color = '#64748B';
            if (chart) chart.destroy();
            chart = new Chart(canvas.getContext('2d'), {
                data: {
                    labels: q.map((r) => r.label),
                    datasets: [
                        {
                            type: 'line', label: isPrice ? '平均取引価格' : '平均坪単価', data: values, yAxisID: 'y',
                            borderColor: '#0284C7', backgroundColor: 'rgba(2,132,199,0.08)', fill: true, tension: 0.35,
                            borderWidth: 2.5, pointRadius: 4, pointHoverRadius: 6, pointBackgroundColor: '#fff', pointBorderWidth: 2, order: 1,
                        },
                        {
                            type: 'bar', label: '取引件数', data: q.map((r) => r.count), yAxisID: 'y1',
                            backgroundColor: '#CBD5E1', hoverBackgroundColor: '#94A3B8', borderRadius: 4, maxBarThickness: 42, order: 2,
                        },
                    ],
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    interaction: { mode: 'index', intersect: false },
                    plugins: {
                        legend: { position: 'top', align: 'end', labels: { boxWidth: 10, boxHeight: 10, usePointStyle: true, font: { size: 12 } } },
                        tooltip: {
                            backgroundColor: '#0F172A', padding: 12, cornerRadius: 8, titleFont: { weight: '600' },
                            bodyFont: { family: "'Inter','Noto Sans JP',sans-serif" },
                            callbacks: {
                                label: (ctx) => ctx.dataset.yAxisID === 'y1'
                                    ? ` 取引件数: ${fmtInt(ctx.parsed.y)} 件`
                                    : ` ${ctx.dataset.label}: ${isPrice ? fmtInt(ctx.parsed.y) : fmt1(ctx.parsed.y)} ${unit}`,
                            },
                        },
                    },
                    scales: {
                        x: { grid: { display: false }, border: { color: '#E2E8F0' } },
                        y: { position: 'left', grid: { color: '#F1F5F9' }, border: { display: false }, ticks: { callback: (v) => fmtInt(v) }, title: { display: true, text: unit } },
                        y1: { position: 'right', grid: { drawOnChartArea: false }, border: { display: false }, beginAtZero: true, ticks: { precision: 0 }, title: { display: true, text: '件' } },
                    },
                },
            });
        }

        // ---------- Filters ----------
        function renderFilterChips() {
            if (isLandPriceType(state.type)) return;
            const ageGroup = $('[data-filter-group="age"]');
            const planGroup = $('[data-filter-group="plan"]');
            const structGroup = $('[data-filter-group="struct"]');
            if (ageGroup) ageGroup.hidden = state.type === 'land';
            if (planGroup) planGroup.hidden = state.type !== 'mansion';
            if (structGroup) structGroup.hidden = state.type !== 'house';

            const areaChips = $('[data-filter-group="area"] .chips');
            if (areaChips) {
                const buckets = state.type === 'mansion' ? AREA_BUCKETS.mansion : AREA_BUCKETS.other;
                areaChips.innerHTML = buckets.map(([v, l]) => `<button type="button" class="chip" data-filter="area" data-value="${v}" aria-pressed="${state.area === v}">${l}</button>`).join('');
            }
            $$('.chip').forEach((c) => c.setAttribute('aria-pressed', String(state[c.dataset.filter] === c.dataset.value)));
        }

        function filteredRows() {
            if (isLandPriceType(state.type)) return [];
            const t = data.types[state.type];
            if (!t || !t.rows) return [];
            return t.rows.filter((r) =>
                inAreaBucket(state.type, r.a, state.area) &&
                (state.type === 'land' || inAgeBucket(r.by, state.age)) &&
                (state.type !== 'mansion' || inPlanBucket(r.fp, state.plan)) &&
                (state.type !== 'house' || inStructBucket(r.st, state.struct))
            );
        }

        // ---------- Table (実勢取引) ----------
        function renderTable() {
            if (isLandPriceType(state.type)) return;
            const t = data.types[state.type];
            if (!t) return;
            const rows = filteredRows();
            const total = t.rows.length;
            const priced = rows.filter((r) => r.pr > 0);
            const avg = priced.length ? priced.reduce((s, r) => s + r.pr, 0) / priced.length : null;
            const withArea = priced.filter((r) => r.a > 0);
            const avgT = withArea.length ? withArea.reduce((s, r) => s + r.pr / r.a, 0) / withArea.length * TSUBO : null;

            const resEl = $('[data-filter-result]');
            if (resEl) {
                resEl.innerHTML = rows.length
                    ? `該当 <b class="num">${fmtInt(rows.length)}</b> 件（直近 ${fmtInt(total)} 件中）／平均 <b class="num">${fmtInt(man(avg))}</b> 万円・坪単価 <b class="num">${fmt1(man(avgT))}</b> 万円`
                    : '条件に一致する取引事例がありません。条件を変更してください。';
            }

            const head = $('[data-view="tx"] thead tr');
            if (head) {
                const isMansion = state.type === 'mansion', isLand = state.type === 'land';
                const cols = [
                    ['取引時期', ''], ['所在地', ''], ['取引価格', 'r'], [isMansion ? '専有面積' : '土地面積', 'r'], ['坪単価', 'r'],
                    ...(isMansion ? [['間取り', '']] : isLand ? [] : [['延床面積', 'r']]),
                    ...(isLand ? [] : [['建築年', 'r'], ['構造', '']]),
                ];
                head.innerHTML = cols.map(([l, c]) => `<th class="${c}" scope="col">${l}</th>`).join('');
            }

            const body = $('[data-view="tx"] tbody');
            const empty = $('[data-table-empty]');
            const list = rows.slice(0, state.shown);
            if (empty) empty.hidden = list.length > 0;
            if (body) {
                const isMansion = state.type === 'mansion', isLand = state.type === 'land';
                body.innerHTML = list.map((r) => {
                    const tsubo = r.pr > 0 && r.a ? man(r.pr / r.a * TSUBO) : null;
                    const loc = data.showMunicipality ? `${esc(r.pf)} ${esc(r.mu)}` : '';
                    const district = r.d
                        ? (r.dc ? `<a href="/pref${r.mc.slice(0, 2)}/${r.mc}/${r.dc}/${encodeURIComponent(state.type)}">${esc(r.d)}</a>` : esc(r.d))
                        : '<span class="muted">—</span>';
                    const age = r.by ? `<span class="muted">（築${DATA_YEAR - r.by}年）</span>` : '';
                    return `<tr>
                        <td data-label="取引時期" class="num">${esc(r.p)}</td>
                        <td data-label="所在地" class="cell-wide">${loc ? `<span class="muted">${loc}</span> ` : ''}${district}</td>
                        <td data-label="取引価格" class="r strong num">${r.pr > 0 ? `${fmtInt(man(r.pr))} 万円` : '—'}</td>
                        <td data-label="${isMansion ? '専有面積' : '土地面積'}" class="r num">${r.a ? `${fmtInt(r.a)} ㎡` : '—'}</td>
                        <td data-label="坪単価" class="r num">${tsubo ? `${fmt1(tsubo)} 万円` : '—'}</td>
                        ${isMansion ? `<td data-label="間取り">${esc(r.fp) || '—'}</td>` : isLand ? '' : `<td data-label="延床面積" class="r num">${r.fa ? `${fmtInt(r.fa)} ㎡` : '—'}</td>`}
                        ${isLand ? '' : `<td data-label="建築年" class="r num">${r.by ? `${r.by}年${age}` : '—'}</td><td data-label="構造">${esc(r.st) || '—'}</td>`}
                    </tr>`;
                }).join('');
            }

            const more = $('[data-more]');
            if (more) more.hidden = rows.length <= state.shown;
            const countEl = $('[data-table-count]');
            if (countEl) countEl.textContent = `${fmtInt(Math.min(state.shown, rows.length))} / ${fmtInt(rows.length)} 件を表示`;
        }

        function syncAreaLinks() {
            // ディレクトリURL構造のためURLパラメータ付与は不要
        }

        function updateUrl(push) {
            // ディレクトリURL構造のためURLパラメータ更新は不要
        }

        function renderAll() {
            const isLp = isLandPriceType(state.type);
            document.querySelectorAll('[data-type-tab]').forEach((b) => {
                const t = normalizeType(b.dataset.typeTab);
                b.setAttribute('aria-selected', String(t === state.type));
            });

            const txView = $('[data-view="tx"]');
            const landView = $('[data-view="land"]');

            if (isLp) {
                if (txView) txView.hidden = true;
                if (landView) {
                    landView.hidden = false;
                    $$('[data-lp-type]').forEach((el) => {
                        el.hidden = el.dataset.lpType !== state.type;
                    });
                }
            } else {
                if (landView) landView.hidden = true;
                if (txView) {
                    txView.hidden = false;
                    renderKpi();
                    renderChart();
                    renderFilterChips();
                    renderTable();
                }
            }

            syncAreaLinks();
            window.dispatchEvent(new CustomEvent('dashboard:typechange', { detail: { type: state.type } }));
        }

        // ---------- Events ----------
        root.addEventListener('click', (e) => {
            const metric = e.target.closest('[data-metric]');
            if (metric) {
                state.metric = metric.dataset.metric;
                $$('[data-metric]').forEach((b) => b.setAttribute('aria-selected', String(b === metric)));
                renderChart();
                return;
            }
            const chip = e.target.closest('.chip');
            if (chip) {
                state[chip.dataset.filter] = chip.dataset.value;
                state.shown = 20;
                renderFilterChips();
                renderTable();
                return;
            }
            if (e.target.closest('[data-reset]')) {
                Object.assign(state, { age: '', plan: '', area: '', struct: '', shown: 20 });
                renderFilterChips();
                renderTable();
                return;
            }
            if (e.target.closest('[data-more]')) {
                state.shown += 20;
                renderTable();
            }
        });

        window.addEventListener('popstate', () => {
            const pType = normalizeType(new URLSearchParams(location.search).get('type'));
            const nextType = pType || normalizeType(data.initialType) || 'mansion';
            if (nextType !== state.type) {
                Object.assign(state, { type: nextType, age: '', plan: '', area: '', struct: '', shown: 20 });
                renderAll();
            }
        });

        renderAll();
    }

    const boot = () => document.querySelectorAll('[data-dashboard]').forEach(init);
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
})();
