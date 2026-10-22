globalThis.process ??= {};
globalThis.process.env ??= {};
import { C as unescapeHTML, E as createComponent, T as createAstro, a as renderComponent, f as renderTemplate, h as addAttribute, o as Fragment, p as maybeRenderHead } from "./compiler_BtRSHKO3.mjs";
import { l as generateAreaSummaryHtml } from "./areaSummary_Bqfz40N3.mjs";
//#region src/components/TaxSimulator.astro
createAstro("https://cloudflare-test.pages.dev");
var $$TaxSimulator = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$TaxSimulator;
	const { areaName, avgRosenkaPrice, points = [] } = Astro.props;
	const defaultRosenkaSqm = avgRosenkaPrice && avgRosenkaPrice > 0 ? Math.round(avgRosenkaPrice) : 1e5;
	const defaultRosenkaMan = Number((defaultRosenkaSqm / 1e4).toFixed(2));
	const defaultAreaSqm = 150;
	const defaultOtherAssetsMan = 3e3;
	function calcBracketTaxMan(statShareMan) {
		if (statShareMan <= 0) return 0;
		if (statShareMan <= 1e3) return statShareMan * .1;
		if (statShareMan <= 3e3) return statShareMan * .15 - 50;
		if (statShareMan <= 5e3) return statShareMan * .2 - 200;
		if (statShareMan <= 1e4) return statShareMan * .3 - 700;
		if (statShareMan <= 2e4) return statShareMan * .4 - 1700;
		if (statShareMan <= 3e4) return statShareMan * .45 - 2700;
		if (statShareMan <= 6e4) return statShareMan * .5 - 4200;
		return statShareMan * .55 - 7200;
	}
	function calcInheritanceTaxMan(netEstateMan, hasSpouse, childrenCount) {
		const heirsCount = (hasSpouse ? 1 : 0) + Math.max(0, childrenCount);
		if (heirsCount <= 0) return {
			basicDeductionMan: 3e3,
			taxableMan: 0,
			totalTaxMan: 0,
			afterSpouseTaxMan: 0
		};
		const basicDeductionMan = 3e3 + 600 * heirsCount;
		const taxableMan = Math.max(0, netEstateMan - basicDeductionMan);
		if (taxableMan <= 0) return {
			basicDeductionMan,
			taxableMan: 0,
			totalTaxMan: 0,
			afterSpouseTaxMan: 0
		};
		let totalTaxMan = 0;
		if (hasSpouse && childrenCount > 0) {
			const spouseShare = taxableMan * .5;
			const childShare = taxableMan * .5 / childrenCount;
			totalTaxMan = calcBracketTaxMan(spouseShare) + calcBracketTaxMan(childShare) * childrenCount;
		} else totalTaxMan = calcBracketTaxMan(taxableMan / heirsCount) * heirsCount;
		const afterSpouseTaxMan = hasSpouse ? childrenCount > 0 ? totalTaxMan * .5 : 0 : totalTaxMan;
		return {
			basicDeductionMan,
			taxableMan,
			totalTaxMan: Math.round(totalTaxMan * 10) / 10,
			afterSpouseTaxMan: Math.round(afterSpouseTaxMan * 10) / 10
		};
	}
	function calcGiftTaxMan(giftValueMan, isSpecialLineal = true) {
		const taxableMan = Math.max(0, giftValueMan - 110);
		if (taxableMan <= 0) return 0;
		if (isSpecialLineal) {
			if (taxableMan <= 200) return taxableMan * .1;
			if (taxableMan <= 400) return taxableMan * .15 - 10;
			if (taxableMan <= 600) return taxableMan * .2 - 30;
			if (taxableMan <= 1e3) return taxableMan * .3 - 90;
			if (taxableMan <= 1500) return taxableMan * .4 - 190;
			if (taxableMan <= 3e3) return taxableMan * .45 - 265;
			if (taxableMan <= 4500) return taxableMan * .5 - 415;
			return taxableMan * .55 - 640;
		} else {
			if (taxableMan <= 200) return taxableMan * .1;
			if (taxableMan <= 300) return taxableMan * .15 - 10;
			if (taxableMan <= 400) return taxableMan * .2 - 25;
			if (taxableMan <= 600) return taxableMan * .3 - 65;
			if (taxableMan <= 1e3) return taxableMan * .4 - 125;
			if (taxableMan <= 1500) return taxableMan * .45 - 175;
			if (taxableMan <= 3e3) return taxableMan * .5 - 250;
			return taxableMan * .55 - 400;
		}
	}
	const initLandEvalMan = defaultRosenkaSqm * defaultAreaSqm / 1e4;
	const initSmallLotEvalMan = initLandEvalMan * .2;
	const initMarketEstMan = initLandEvalMan / .8 * 1.15;
	const initInhNormal = calcInheritanceTaxMan(initLandEvalMan + defaultOtherAssetsMan, true, 2);
	const initInhSmallLot = calcInheritanceTaxMan(initSmallLotEvalMan + defaultOtherAssetsMan, true, 2);
	const initGiftSpecialMan = Math.round(calcGiftTaxMan(initLandEvalMan, true) * 10) / 10;
	const initGiftGeneralMan = Math.round(calcGiftTaxMan(initLandEvalMan, false) * 10) / 10;
	const initSettlementTaxMan = Math.round(Math.max(0, initLandEvalMan - 110 - 2500) * .2 * 10) / 10;
	const presetRows = [
		{
			label: "約30坪（100㎡）",
			area: 100,
			tsubo: 30.2
		},
		{
			label: "約45坪（150㎡）",
			area: 150,
			tsubo: 45.4
		},
		{
			label: "約60坪（200㎡）",
			area: 200,
			tsubo: 60.5
		},
		{
			label: "約100坪（330㎡）",
			area: 330,
			tsubo: 99.8
		}
	].map((s) => {
		const landEvalMan = defaultRosenkaSqm * s.area / 1e4;
		const smallLotEvalMan = landEvalMan * (s.area <= 330 ? .2 : 1 - .8 * (330 / s.area));
		const inhNoReduction = calcInheritanceTaxMan(landEvalMan + 3e3, false, 2);
		const inhWithReduction = calcInheritanceTaxMan(smallLotEvalMan + 3e3, false, 2);
		const giftSpecial = calcGiftTaxMan(landEvalMan, true);
		return {
			...s,
			landEvalMan: Math.round(landEvalMan),
			smallLotEvalMan: Math.round(smallLotEvalMan),
			inhTaxNormalMan: Math.round(inhNoReduction.totalTaxMan * 10) / 10,
			inhTaxReducedMan: Math.round(inhWithReduction.totalTaxMan * 10) / 10,
			giftTaxSpecialMan: Math.round(giftSpecial * 10) / 10
		};
	});
	const fmtMan = (v) => v.toLocaleString("ja-JP", { maximumFractionDigits: 1 });
	return renderTemplate`${maybeRenderHead($$result)}<section class="section" aria-labelledby="tax-sim-title" data-tax-simulator data-astro-cid-23f65cqb><div class="card card-lg" data-astro-cid-23f65cqb><div class="section-head" style="margin-bottom: 16px;" data-astro-cid-23f65cqb><div data-astro-cid-23f65cqb><h3 class="section-title" id="tax-sim-title" data-astro-cid-23f65cqb>${areaName}の路線価評価額・相続税・贈与税 シミュレーション</h3><p class="section-sub" data-astro-cid-23f65cqb>計算したい項目を選択すると、必要な入力項目と試算結果が表示されます（初期値：${areaName}の平均路線価 <b data-astro-cid-23f65cqb>${defaultRosenkaMan.toLocaleString("ja-JP")} 万円/㎡</b>）</p></div><span class="badge info" data-astro-cid-23f65cqb>国税庁 速算表準拠</span></div><!-- STEP 1: 計算モードの選択タブ --><div class="tax-mode-selector" role="tablist" aria-label="計算シミュレーションの種類を選択" data-astro-cid-23f65cqb><button type="button" class="tax-mode-btn is-active" role="tab" aria-selected="true" data-sim-mode-btn="eval" data-astro-cid-23f65cqb><span class="tax-mode-step" data-astro-cid-23f65cqb>1</span><span class="tax-mode-label" data-astro-cid-23f65cqb><b data-astro-cid-23f65cqb>路線価評価額の試算</b><small data-astro-cid-23f65cqb>面積・補正率・特例から土地評価額を計算</small></span></button><button type="button" class="tax-mode-btn" role="tab" aria-selected="false" data-sim-mode-btn="inheritance" data-astro-cid-23f65cqb><span class="tax-mode-step" data-astro-cid-23f65cqb>2</span><span class="tax-mode-label" data-astro-cid-23f65cqb><b data-astro-cid-23f65cqb>相続税の試算</b><small data-astro-cid-23f65cqb>法定相続人・その他遺産を含めた相続税額を計算</small></span></button><button type="button" class="tax-mode-btn" role="tab" aria-selected="false" data-sim-mode-btn="gift" data-astro-cid-23f65cqb><span class="tax-mode-step" data-astro-cid-23f65cqb>3</span><span class="tax-mode-label" data-astro-cid-23f65cqb><b data-astro-cid-23f65cqb>贈与税の試算</b><small data-astro-cid-23f65cqb>生前贈与時の暦年課税・精算課税の税額を計算</small></span></button></div><!-- STEP 2: 選択したモードに応じた入力フォーム & 計算結果 --><div class="tax-sim-grid" data-astro-cid-23f65cqb><!-- 左カラム：条件入力（選択モードに応じて必要な項目のみ表示） --><div class="tax-sim-inputs" data-astro-cid-23f65cqb><div class="tax-input-title" data-sim-input-heading data-astro-cid-23f65cqb>路線価評価額の計算条件を入力</div><!-- 共通入力：標準地選択 & 路線価 & 土地面積 -->${points.length > 0 && renderTemplate`<div class="field" data-astro-cid-23f65cqb><label for="sim-point-select" data-astro-cid-23f65cqb>エリア内の標準地から路線価を選択（任意）</label><select id="sim-point-select" class="select" data-sim-point data-astro-cid-23f65cqb><option${addAttribute(defaultRosenkaMan, "value")} data-astro-cid-23f65cqb>${areaName}の平均路線価（${defaultRosenkaMan.toLocaleString("ja-JP")} 万円/㎡）</option>${points.slice(0, 20).map((pt) => {
		const manVal = Number((pt.rosenkaPrice / 1e4).toFixed(2));
		return renderTemplate`<option${addAttribute(manVal, "value")} data-astro-cid-23f65cqb>${pt.address}（${pt.division}：${manVal.toLocaleString("ja-JP")} 万円/㎡）</option>`;
	})}</select></div>`}<div class="grid-2" data-astro-cid-23f65cqb><div class="field" data-astro-cid-23f65cqb><label for="sim-rosenka" data-astro-cid-23f65cqb>路線価（万円/㎡）</label><input id="sim-rosenka" type="number" class="select" step="0.1" min="0.1"${addAttribute(defaultRosenkaMan, "value")} data-sim-input="rosenka" data-astro-cid-23f65cqb></div><div class="field" data-astro-cid-23f65cqb><label for="sim-area" data-astro-cid-23f65cqb>土地面積（㎡）</label><input id="sim-area" type="number" class="select" step="5" min="10"${addAttribute(defaultAreaSqm, "value")} data-sim-input="area" data-astro-cid-23f65cqb></div></div><!-- ① 路線価評価額モード専用の追加入力：土地形状・利用区分補正 --><div class="mode-fields" data-mode-fields="eval" data-astro-cid-23f65cqb><div class="grid-2" data-astro-cid-23f65cqb><div class="field" data-astro-cid-23f65cqb><label for="sim-shape-rate" data-astro-cid-23f65cqb>奥行・形状等の補正率目安</label><select id="sim-shape-rate" class="select" data-sim-input="shapeRate" data-astro-cid-23f65cqb><option value="1.00" selected data-astro-cid-23f65cqb>標準的な整形地（補正率 1.00）</option><option value="1.03" data-astro-cid-23f65cqb>角地・二方路線影響加算（+3%目安：1.03）</option><option value="0.95" data-astro-cid-23f65cqb>やや細長い・間口狭小等（-5%目安：0.95）</option><option value="0.90" data-astro-cid-23f65cqb>不整形地・奥行長大等（-10%目安：0.90）</option></select></div><div class="field" data-astro-cid-23f65cqb><label for="sim-eval-reduction" data-astro-cid-23f65cqb>小規模宅地等の特例（参考試算）</label><select id="sim-eval-reduction" class="select" data-sim-input="evalReduction" data-astro-cid-23f65cqb><option value="residential" selected data-astro-cid-23f65cqb>特定居住用宅地等（330㎡まで80%減額）</option><option value="rental" data-astro-cid-23f65cqb>貸付事業用宅地等（200㎡まで50%減額）</option><option value="none" data-astro-cid-23f65cqb>特例適用なし（100%評価）</option></select></div></div></div><!-- ② 相続税モード専用の追加入力：特例・その他遺産・法定相続人 --><div class="mode-fields" data-mode-fields="inheritance" hidden data-astro-cid-23f65cqb><div class="grid-2" data-astro-cid-23f65cqb><div class="field" data-astro-cid-23f65cqb><label for="sim-reduction" data-astro-cid-23f65cqb>小規模宅地等の特例</label><select id="sim-reduction" class="select" data-sim-input="reduction" data-astro-cid-23f65cqb><option value="residential" selected data-astro-cid-23f65cqb>特定居住用宅地等（330㎡まで80%減額）</option><option value="rental" data-astro-cid-23f65cqb>貸付事業用宅地等（200㎡まで50%減額）</option><option value="none" data-astro-cid-23f65cqb>特例適用なし（更地・一般宅地 100%評価）</option></select></div><div class="field" data-astro-cid-23f65cqb><label for="sim-other-assets" data-astro-cid-23f65cqb>その他の遺産額（預貯金・建物等・万円）</label><input id="sim-other-assets" type="number" class="select" step="100" min="0"${addAttribute(defaultOtherAssetsMan, "value")} data-sim-input="otherAssets" data-astro-cid-23f65cqb></div></div><div class="grid-2" style="margin-top: 12px;" data-astro-cid-23f65cqb><div class="field" data-astro-cid-23f65cqb><label for="sim-spouse" data-astro-cid-23f65cqb>配偶者の有無</label><select id="sim-spouse" class="select" data-sim-input="spouse" data-astro-cid-23f65cqb><option value="yes" selected data-astro-cid-23f65cqb>配偶者あり（配偶者の税額軽減あり）</option><option value="no" data-astro-cid-23f65cqb>配偶者なし（二次相続など）</option></select></div><div class="field" data-astro-cid-23f65cqb><label for="sim-children" data-astro-cid-23f65cqb>子ども（他の法定相続人）の人数</label><select id="sim-children" class="select" data-sim-input="children" data-astro-cid-23f65cqb><option value="1" data-astro-cid-23f65cqb>1人</option><option value="2" selected data-astro-cid-23f65cqb>2人</option><option value="3" data-astro-cid-23f65cqb>3人</option><option value="4" data-astro-cid-23f65cqb>4人</option></select></div></div></div><!-- ③ 贈与税モード専用の追加入力：贈与割合・贈与区分 --><div class="mode-fields" data-mode-fields="gift" hidden data-astro-cid-23f65cqb><div class="grid-2" data-astro-cid-23f65cqb><div class="field" data-astro-cid-23f65cqb><label for="sim-gift-share" data-astro-cid-23f65cqb>生前贈与する土地の持分割合</label><select id="sim-gift-share" class="select" data-sim-input="giftShare" data-astro-cid-23f65cqb><option value="1" selected data-astro-cid-23f65cqb>土地全体（100%）を一括贈与</option><option value="0.5" data-astro-cid-23f65cqb>土地の持分 1/2（50%）を贈与</option><option value="0.3333" data-astro-cid-23f65cqb>土地の持分 1/3（約33%）を贈与</option><option value="0.25" data-astro-cid-23f65cqb>土地の持分 1/4（25%）を贈与</option><option value="0.1" data-astro-cid-23f65cqb>土地の持分 1/10（10%）を贈与</option></select></div><div class="field" data-astro-cid-23f65cqb><label for="sim-gift-type" data-astro-cid-23f65cqb>贈与者と受贈者の関係（税率区分）</label><select id="sim-gift-type" class="select" data-sim-input="giftType" data-astro-cid-23f65cqb><option value="special" selected data-astro-cid-23f65cqb>特例贈与（親・祖父母 → 18歳以上の子・孫）</option><option value="general" data-astro-cid-23f65cqb>一般贈与（夫婦間・兄弟間・未成年者への贈与）</option></select></div></div></div></div><!-- 右カラム：選択したモードに対応する計算結果パネル --><div class="tax-sim-results" data-astro-cid-23f65cqb><!-- ① 路線価評価額の試算結果 --><div class="tax-result-box" data-mode-result="eval" data-astro-cid-23f65cqb><div class="tax-result-header" data-astro-cid-23f65cqb>路線価評価額の試算結果</div><div class="stat-row tax-highlight-row" data-astro-cid-23f65cqb><span class="k" data-astro-cid-23f65cqb><b data-astro-cid-23f65cqb>土地の路線価評価額（自用地評価）</b><br data-astro-cid-23f65cqb><small class="muted" data-astro-cid-23f65cqb>路線価 × 面積（約<span data-sim-out="evalTsubo" data-astro-cid-23f65cqb>45.4</span>坪）× 補正率</small></span><span class="v tax-highlight-val" data-astro-cid-23f65cqb><b class="num" data-sim-out="landEval" data-astro-cid-23f65cqb>${fmtMan(Math.round(initLandEvalMan))}</b> 万円</span></div><div class="stat-row" data-astro-cid-23f65cqb><span class="k" data-astro-cid-23f65cqb>小規模宅地等の特例 適用後の評価額</span><span class="v strong text-accent" data-astro-cid-23f65cqb><b class="num" data-sim-out="evalReduced" data-astro-cid-23f65cqb>${fmtMan(Math.round(initSmallLotEvalMan))}</b> 万円</span></div><div class="stat-row" data-astro-cid-23f65cqb><span class="k" data-astro-cid-23f65cqb>特例による評価減額（圧縮効果）</span><span class="v" data-astro-cid-23f65cqb><b class="num" data-sim-out="evalSaved" data-astro-cid-23f65cqb>-${fmtMan(Math.round(initLandEvalMan - initSmallLotEvalMan))}</b> 万円</span></div><div class="stat-row" data-astro-cid-23f65cqb><span class="k" data-astro-cid-23f65cqb>実勢売買相場の目安（路線価÷0.8×1.15換算）</span><span class="v muted" data-astro-cid-23f65cqb>約 <b class="num" data-sim-out="evalMarketEst" data-astro-cid-23f65cqb>${fmtMan(Math.round(initMarketEstMan))}</b> 万円</span></div></div><!-- ② 相続税の試算結果 --><div class="tax-result-box" data-mode-result="inheritance" hidden data-astro-cid-23f65cqb><div class="tax-result-header" data-astro-cid-23f65cqb>相続税の試算結果</div><div class="stat-row" data-astro-cid-23f65cqb><span class="k" data-astro-cid-23f65cqb>土地の評価額（基本 <span data-sim-out="inhLandBase" data-astro-cid-23f65cqb>${fmtMan(Math.round(initLandEvalMan))}</span>万円 → 特例後）</span><span class="v strong" data-astro-cid-23f65cqb><b class="num" data-sim-out="reducedEval" data-astro-cid-23f65cqb>${fmtMan(Math.round(initSmallLotEvalMan))}</b> 万円</span></div><div class="stat-row" data-astro-cid-23f65cqb><span class="k" data-astro-cid-23f65cqb>正味の遺産総額（特例後の土地＋その他遺産）</span><span class="v" data-astro-cid-23f65cqb><b class="num" data-sim-out="netEstate" data-astro-cid-23f65cqb>${fmtMan(Math.round(initSmallLotEvalMan + defaultOtherAssetsMan))}</b> 万円</span></div><div class="stat-row" data-astro-cid-23f65cqb><span class="k" data-astro-cid-23f65cqb>基礎控除額（3,000万円＋600万円×法定相続人<span data-sim-out="heirsCount" data-astro-cid-23f65cqb>3</span>人）</span><span class="v" data-astro-cid-23f65cqb><b class="num" data-sim-out="basicDeduction" data-astro-cid-23f65cqb>${fmtMan(initInhSmallLot.basicDeductionMan)}</b> 万円</span></div><div class="stat-row" data-astro-cid-23f65cqb><span class="k" data-astro-cid-23f65cqb>課税遺産総額（正味遺産 − 基礎控除）</span><span class="v" data-astro-cid-23f65cqb><b class="num" data-sim-out="taxableEstate" data-astro-cid-23f65cqb>${fmtMan(Math.round(initInhSmallLot.taxableMan))}</b> 万円</span></div><div class="stat-row tax-highlight-row" data-astro-cid-23f65cqb><span class="k" data-astro-cid-23f65cqb><b data-astro-cid-23f65cqb>相続税の納付税額目安</b><br data-astro-cid-23f65cqb><small class="muted" data-astro-cid-23f65cqb>（特例・配偶者軽減適用後の世帯合計）</small></span><span class="v tax-highlight-val" data-astro-cid-23f65cqb><b class="num" data-sim-out="inhTaxFinal" data-astro-cid-23f65cqb>${fmtMan(initInhSmallLot.afterSpouseTaxMan)}</b> 万円</span></div><div class="stat-row" data-astro-cid-23f65cqb><span class="k" data-astro-cid-23f65cqb><small class="muted" data-astro-cid-23f65cqb>※小規模宅地特例・配偶者軽減なしの場合の相続税総額</small></span><span class="v" data-astro-cid-23f65cqb><small class="muted" data-astro-cid-23f65cqb><b class="num" data-sim-out="inhTaxNoReduction" data-astro-cid-23f65cqb>${fmtMan(initInhNormal.totalTaxMan)}</b> 万円</small></span></div></div><!-- ③ 贈与税の試算結果 --><div class="tax-result-box" data-mode-result="gift" hidden data-astro-cid-23f65cqb><div class="tax-result-header" data-astro-cid-23f65cqb>贈与税の試算結果（土地を生前贈与した場合）</div><div class="stat-row" data-astro-cid-23f65cqb><span class="k" data-astro-cid-23f65cqb>贈与対象の土地評価額（持分反映後）</span><span class="v strong" data-astro-cid-23f65cqb><b class="num" data-sim-out="giftEval" data-astro-cid-23f65cqb>${fmtMan(Math.round(initLandEvalMan))}</b> 万円</span></div><div class="stat-row" data-astro-cid-23f65cqb><span class="k" data-astro-cid-23f65cqb>暦年課税 基礎控除後の課税価格（−110万円）</span><span class="v" data-astro-cid-23f65cqb><b class="num" data-sim-out="giftTaxable" data-astro-cid-23f65cqb>${fmtMan(Math.max(0, Math.round(initLandEvalMan) - 110))}</b> 万円</span></div><div class="stat-row tax-highlight-row" data-astro-cid-23f65cqb><span class="k" data-astro-cid-23f65cqb><b data-sim-out="giftSelectedLabel" data-astro-cid-23f65cqb>暦年課税の贈与税額目安（特例贈与）</b><br data-astro-cid-23f65cqb><small class="muted" data-astro-cid-23f65cqb>実効負担率：約 <span data-sim-out="giftEffRate" data-astro-cid-23f65cqb>${initLandEvalMan > 0 ? (initGiftSpecialMan / initLandEvalMan * 100).toFixed(1) : "0.0"}</span>%</small></span><span class="v tax-highlight-val" data-astro-cid-23f65cqb><b class="num" data-sim-out="giftSelectedTax" data-astro-cid-23f65cqb>${fmtMan(initGiftSpecialMan)}</b> 万円</span></div><div class="stat-row" data-astro-cid-23f65cqb><span class="k" data-astro-cid-23f65cqb>比較：特例贈与（親・祖父母→成人の子・孫）の税額</span><span class="v" data-astro-cid-23f65cqb><b class="num" data-sim-out="giftSpecial" data-astro-cid-23f65cqb>${fmtMan(initGiftSpecialMan)}</b> 万円</span></div><div class="stat-row" data-astro-cid-23f65cqb><span class="k" data-astro-cid-23f65cqb>比較：一般贈与（夫婦・兄弟・未成年へ）の税額</span><span class="v" data-astro-cid-23f65cqb><b class="num" data-sim-out="giftGeneral" data-astro-cid-23f65cqb>${fmtMan(initGiftGeneralMan)}</b> 万円</span></div><div class="stat-row" data-astro-cid-23f65cqb><span class="k" data-astro-cid-23f65cqb>相続時精算課税制度を選択した場合の税額<br data-astro-cid-23f65cqb><small class="muted" data-astro-cid-23f65cqb>（基礎控除110万円＋特別控除2,500万円・超過分一律20%）</small></span><span class="v strong text-accent" data-astro-cid-23f65cqb><b class="num" data-sim-out="giftSettlement" data-astro-cid-23f65cqb>${fmtMan(initSettlementTaxMan)}</b> 万円</span></div></div></div></div><!-- 敷地規模別の相続税・贈与税 試算早見表（SSR） --><div style="margin-top: 28px;" data-astro-cid-23f65cqb><h4 class="card-title" style="font-size: 1rem; margin-bottom: 8px;" data-astro-cid-23f65cqb>${areaName}の敷地規模別 路線価評価額・相続税・贈与税の早見表</h4><p class="card-sub" style="margin-bottom: 14px;" data-astro-cid-23f65cqb>平均路線価（${defaultRosenkaMan.toLocaleString("ja-JP")} 万円/㎡）で算出した面積別の比較（※相続税は「その他の遺産3,000万円・法定相続人2人（子2人）」のモデルケース）</p><div class="table-wrap" data-astro-cid-23f65cqb><table class="data-table" data-astro-cid-23f65cqb><thead data-astro-cid-23f65cqb><tr data-astro-cid-23f65cqb><th data-astro-cid-23f65cqb>敷地規模（面積）</th><th class="r" data-astro-cid-23f65cqb>路線価評価額</th><th class="r" data-astro-cid-23f65cqb>小規模宅地特例後（80%減）</th><th class="r" data-astro-cid-23f65cqb>相続税目安（特例なし）</th><th class="r" data-astro-cid-23f65cqb>相続税目安（特例あり）</th><th class="r" data-astro-cid-23f65cqb>贈与税目安（特例贈与）</th></tr></thead><tbody data-astro-cid-23f65cqb>${presetRows.map((row) => renderTemplate`<tr data-astro-cid-23f65cqb><td class="strong" data-astro-cid-23f65cqb>${row.label}</td><td class="r num strong" data-astro-cid-23f65cqb>${row.landEvalMan.toLocaleString("ja-JP")} 万円</td><td class="r num" data-astro-cid-23f65cqb>${row.smallLotEvalMan.toLocaleString("ja-JP")} 万円</td><td class="r num" data-astro-cid-23f65cqb>${fmtMan(row.inhTaxNormalMan)} 万円</td><td class="r num strong text-accent" data-astro-cid-23f65cqb>${fmtMan(row.inhTaxReducedMan)} 万円</td><td class="r num" data-astro-cid-23f65cqb>${fmtMan(row.giftTaxSpecialMan)} 万円</td></tr>`)}</tbody></table></div><p class="kpi-note" style="margin-top: 10px;" data-astro-cid-23f65cqb>※生前贈与で土地を移転する場合は、贈与税のほか不動産取得税および登録免許税（2.0%）が別途かかります（相続による取得は不動産取得税非課税、登録免許税0.4%）。</p></div></div></section><script>
(function () {
    const TSUBO = 3.30578;
    const MODE_TITLES = {
        eval: '路線価評価額の計算条件を入力',
        inheritance: '相続税の計算条件を入力',
        gift: '贈与税の計算条件を入力',
    };

    const roots = document.querySelectorAll('[data-tax-simulator]');
    roots.forEach((root) => {
        if (root.dataset.simBound) return;
        root.dataset.simBound = '1';

        const modeBtns = root.querySelectorAll('[data-sim-mode-btn]');
        const modeFields = root.querySelectorAll('[data-mode-fields]');
        const modeResults = root.querySelectorAll('[data-mode-result]');
        const inputHeading = root.querySelector('[data-sim-input-heading]');

        const pointSelect = root.querySelector('[data-sim-point]');
        const rosenkaInput = root.querySelector('[data-sim-input="rosenka"]');
        const areaInput = root.querySelector('[data-sim-input="area"]');
        const shapeRateSelect = root.querySelector('[data-sim-input="shapeRate"]');
        const evalReductionSelect = root.querySelector('[data-sim-input="evalReduction"]');
        const reductionSelect = root.querySelector('[data-sim-input="reduction"]');
        const otherAssetsInput = root.querySelector('[data-sim-input="otherAssets"]');
        const spouseSelect = root.querySelector('[data-sim-input="spouse"]');
        const childrenSelect = root.querySelector('[data-sim-input="children"]');
        const giftShareSelect = root.querySelector('[data-sim-input="giftShare"]');
        const giftTypeSelect = root.querySelector('[data-sim-input="giftType"]');

        // モード切替
        const switchMode = (targetMode) => {
            modeBtns.forEach((btn) => {
                const active = btn.getAttribute('data-sim-mode-btn') === targetMode;
                btn.classList.toggle('is-active', active);
                btn.setAttribute('aria-selected', active ? 'true' : 'false');
            });
            modeFields.forEach((f) => {
                f.hidden = f.getAttribute('data-mode-fields') !== targetMode;
            });
            modeResults.forEach((r) => {
                r.hidden = r.getAttribute('data-mode-result') !== targetMode;
            });
            if (inputHeading && MODE_TITLES[targetMode]) {
                inputHeading.textContent = MODE_TITLES[targetMode];
            }
        };

        modeBtns.forEach((btn) => {
            btn.addEventListener('click', () => {
                const mode = btn.getAttribute('data-sim-mode-btn');
                if (mode) switchMode(mode);
            });
        });

        const setOut = (key, val) => {
            const el = root.querySelector(\`[data-sim-out="\${key}"]\`);
            if (el) el.textContent = val;
        };

        const fmtMan = (n) => {
            const v = Math.round(n * 10) / 10;
            return v.toLocaleString('ja-JP', { maximumFractionDigits: 1 });
        };

        const fmtInt = (n) => Math.round(n).toLocaleString('ja-JP');

        const calcBracket = (share) => {
            if (share <= 0) return 0;
            if (share <= 1000) return share * 0.10;
            if (share <= 3000) return share * 0.15 - 50;
            if (share <= 5000) return share * 0.20 - 200;
            if (share <= 10000) return share * 0.30 - 700;
            if (share <= 20000) return share * 0.40 - 1700;
            if (share <= 30000) return share * 0.45 - 2700;
            if (share <= 60000) return share * 0.50 - 4200;
            return share * 0.55 - 7200;
        };

        const calcInh = (netEstateMan, hasSpouse, childrenCount) => {
            const heirsCount = (hasSpouse ? 1 : 0) + Math.max(0, childrenCount);
            const basicDeductionMan = 3000 + 600 * heirsCount;
            const taxableMan = Math.max(0, netEstateMan - basicDeductionMan);
            if (taxableMan <= 0 || heirsCount <= 0) {
                return { heirsCount, basicDeductionMan, taxableMan: 0, totalTaxMan: 0, afterSpouseTaxMan: 0 };
            }
            let totalTaxMan = 0;
            if (hasSpouse && childrenCount > 0) {
                const sp = taxableMan * 0.5;
                const ch = (taxableMan * 0.5) / childrenCount;
                totalTaxMan = calcBracket(sp) + calcBracket(ch) * childrenCount;
            } else {
                const each = taxableMan / heirsCount;
                totalTaxMan = calcBracket(each) * heirsCount;
            }
            const afterSpouseTaxMan = hasSpouse ? (childrenCount > 0 ? totalTaxMan * 0.5 : 0) : totalTaxMan;
            return { heirsCount, basicDeductionMan, taxableMan, totalTaxMan, afterSpouseTaxMan };
        };

        const calcGift = (giftMan, isSpecial) => {
            const taxable = Math.max(0, giftMan - 110);
            if (taxable <= 0) return 0;
            if (isSpecial) {
                if (taxable <= 200) return taxable * 0.10;
                if (taxable <= 400) return taxable * 0.15 - 10;
                if (taxable <= 600) return taxable * 0.20 - 30;
                if (taxable <= 1000) return taxable * 0.30 - 90;
                if (taxable <= 1500) return taxable * 0.40 - 190;
                if (taxable <= 3000) return taxable * 0.45 - 265;
                if (taxable <= 4500) return taxable * 0.50 - 415;
                return taxable * 0.55 - 640;
            } else {
                if (taxable <= 200) return taxable * 0.10;
                if (taxable <= 300) return taxable * 0.15 - 10;
                if (taxable <= 400) return taxable * 0.20 - 25;
                if (taxable <= 600) return taxable * 0.30 - 65;
                if (taxable <= 1000) return taxable * 0.40 - 125;
                if (taxable <= 1500) return taxable * 0.45 - 175;
                if (taxable <= 3000) return taxable * 0.50 - 250;
                return taxable * 0.55 - 400;
            }
        };

        const calcReducedEval = (baseEvalMan, areaSqm, type) => {
            if (areaSqm <= 0) return 0;
            if (type === 'residential') {
                const ratio = areaSqm <= 330 ? 0.2 : 1 - 0.8 * (330 / areaSqm);
                return baseEvalMan * ratio;
            }
            if (type === 'rental') {
                const ratio = areaSqm <= 200 ? 0.5 : 1 - 0.5 * (200 / areaSqm);
                return baseEvalMan * ratio;
            }
            return baseEvalMan;
        };

        const recalc = () => {
            const rosenkaMan = Math.max(0, parseFloat(rosenkaInput?.value) || 0);
            const areaSqm = Math.max(0, parseFloat(areaInput?.value) || 0);
            const shapeRate = parseFloat(shapeRateSelect?.value || '1.00') || 1.0;
            const evalReductionType = evalReductionSelect?.value || 'residential';
            const reductionType = reductionSelect?.value || 'residential';
            const otherAssetsMan = Math.max(0, parseFloat(otherAssetsInput?.value) || 0);
            const hasSpouse = (spouseSelect?.value || 'yes') === 'yes';
            const childrenCount = Math.max(0, parseInt(childrenSelect?.value || '2', 10));
            const giftShare = Math.max(0.01, parseFloat(giftShareSelect?.value || '1'));
            const giftType = giftTypeSelect?.value || 'special';

            // 1. 路線価評価額モード計算
            const evalBaseMan = rosenkaMan * areaSqm * shapeRate;
            const evalReducedMan = calcReducedEval(evalBaseMan, areaSqm, evalReductionType);
            const evalSavedMan = Math.max(0, evalBaseMan - evalReducedMan);
            const evalMarketEstMan = (evalBaseMan / 0.8) * 1.15;

            setOut('evalTsubo', (areaSqm / TSUBO).toFixed(1));
            setOut('landEval', fmtInt(evalBaseMan));
            setOut('evalReduced', fmtInt(evalReducedMan));
            setOut('evalSaved', evalSavedMan > 0 ? \`-\${fmtInt(evalSavedMan)}\` : '0');
            setOut('evalMarketEst', fmtInt(evalMarketEstMan));

            // 2. 相続税モード計算
            const inhBaseLandMan = rosenkaMan * areaSqm;
            const inhReducedLandMan = calcReducedEval(inhBaseLandMan, areaSqm, reductionType);
            const inhReduced = calcInh(inhReducedLandMan + otherAssetsMan, hasSpouse, childrenCount);
            const inhNormal = calcInh(inhBaseLandMan + otherAssetsMan, hasSpouse, childrenCount);

            setOut('inhLandBase', fmtInt(inhBaseLandMan));
            setOut('reducedEval', fmtInt(inhReducedLandMan));
            setOut('netEstate', fmtInt(inhReducedLandMan + otherAssetsMan));
            setOut('heirsCount', String(inhReduced.heirsCount));
            setOut('basicDeduction', fmtInt(inhReduced.basicDeductionMan));
            setOut('taxableEstate', fmtInt(inhReduced.taxableMan));
            setOut('inhTaxFinal', fmtMan(inhReduced.afterSpouseTaxMan));
            setOut('inhTaxNoReduction', fmtMan(inhNormal.totalTaxMan));

            // 3. 贈与税モード計算
            const giftEvalMan = rosenkaMan * areaSqm * giftShare;
            const giftTaxableMan = Math.max(0, giftEvalMan - 110);
            const giftSpecialMan = calcGift(giftEvalMan, true);
            const giftGeneralMan = calcGift(giftEvalMan, false);
            const selectedGiftTaxMan = giftType === 'special' ? giftSpecialMan : giftGeneralMan;
            const effRate = giftEvalMan > 0 ? ((selectedGiftTaxMan / giftEvalMan) * 100).toFixed(1) : '0.0';
            const giftSettlementMan = Math.max(0, giftEvalMan - 110 - 2500) * 0.20;

            setOut('giftEval', fmtInt(giftEvalMan));
            setOut('giftTaxable', fmtInt(giftTaxableMan));
            setOut(
                'giftSelectedLabel',
                giftType === 'special'
                    ? '暦年課税の贈与税額目安（特例贈与）'
                    : '暦年課税の贈与税額目安（一般贈与）'
            );
            setOut('giftSelectedTax', fmtMan(selectedGiftTaxMan));
            setOut('giftEffRate', effRate);
            setOut('giftSpecial', fmtMan(giftSpecialMan));
            setOut('giftGeneral', fmtMan(giftGeneralMan));
            setOut('giftSettlement', fmtMan(giftSettlementMan));
        };

        if (pointSelect && rosenkaInput) {
            pointSelect.addEventListener('change', () => {
                rosenkaInput.value = pointSelect.value;
                recalc();
            });
        }

        // 2つの小規模宅地特例プルダウンを相互同期
        if (evalReductionSelect && reductionSelect) {
            evalReductionSelect.addEventListener('change', () => {
                reductionSelect.value = evalReductionSelect.value;
                recalc();
            });
            reductionSelect.addEventListener('change', () => {
                evalReductionSelect.value = reductionSelect.value;
                recalc();
            });
        }

        [
            rosenkaInput,
            areaInput,
            shapeRateSelect,
            evalReductionSelect,
            reductionSelect,
            otherAssetsInput,
            spouseSelect,
            childrenSelect,
            giftShareSelect,
            giftTypeSelect,
        ].forEach((el) => {
            if (!el) return;
            el.addEventListener('input', recalc);
            el.addEventListener('change', recalc);
        });
    });
})();
<\/script>`;
}, "D:/xampp/htdocs/root/realestate-astro/src/components/TaxSimulator.astro", void 0);
//#endregion
//#region src/components/AreaDashboard.astro
createAstro("https://cloudflare-test.pages.dev");
var $$AreaDashboard = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$AreaDashboard;
	const { areaName, prefName = "", cityName = "", districtName = "", stats, fluctuation, showMunicipality = false, initialType = "mansion", landPrices = null } = Astro.props;
	const isLandPriceInitial = initialType === "rosenka" || initialType === "official" || initialType === "standard";
	const currentTypeLabel = {
		mansion: "中古マンション",
		house: "戸建て",
		land: "土地",
		rosenka: "路線価",
		official: "公示価格",
		standard: "基準地価"
	}[initialType] || "中古マンション";
	const txTypesPayload = showMunicipality ? stats.types : { [initialType]: stats?.types?.[initialType] || {
		count: 0,
		avgPrice: null,
		avgSqm: null,
		avgArea: null,
		quarters: [],
		rows: []
	} };
	const payload = !isLandPriceInitial ? JSON.stringify({
		types: txTypesPayload,
		fluctuation,
		showMunicipality,
		initialType
	}).replace(/</g, "\\u003c") : "";
	const chip = (filter, value, label) => ({
		filter,
		value,
		label
	});
	const ageChips = [
		chip("age", "", "すべて"),
		chip("age", "10", "築10年以内"),
		chip("age", "20", "築20年以内"),
		chip("age", "30", "築30年以内"),
		chip("age", "old", "築30年超")
	];
	const planChips = [
		chip("plan", "", "すべて"),
		chip("plan", "1", "1R〜1LDK"),
		chip("plan", "2", "2K〜2LDK"),
		chip("plan", "3", "3K以上")
	];
	const structChips = [
		chip("struct", "", "すべて"),
		chip("struct", "rc", "RC・SRC"),
		chip("struct", "wood", "木造"),
		chip("struct", "other", "その他")
	];
	const areaChips = initialType === "mansion" ? [
		chip("area", "", "すべて"),
		chip("area", "s", "40㎡未満"),
		chip("area", "m", "40〜70㎡"),
		chip("area", "l", "70㎡以上")
	] : [
		chip("area", "", "すべて"),
		chip("area", "s", "100㎡未満"),
		chip("area", "m", "100〜200㎡"),
		chip("area", "l", "200㎡以上")
	];
	const lp = landPrices || {
		official: {},
		standard: {},
		rosenka: {},
		points: []
	};
	const off = lp.official || {};
	const std = lp.standard || {};
	const ros = lp.rosenka || {};
	const points = lp.points || [];
	const TSUBO = 3.30578;
	const DATA_YEAR = (/* @__PURE__ */ new Date()).getFullYear();
	const fmt1 = (n) => n == null || !isFinite(n) ? "—" : n.toLocaleString("ja-JP", {
		minimumFractionDigits: 1,
		maximumFractionDigits: 1
	});
	const fmtInt = (n) => n == null || !isFinite(n) ? "—" : Math.round(n).toLocaleString("ja-JP");
	const man1 = (yen) => yen == null || !isFinite(yen) ? "—" : (yen / 1e4).toLocaleString("ja-JP", {
		minimumFractionDigits: 1,
		maximumFractionDigits: 1
	});
	const manInt = (yen) => yen == null || !isFinite(yen) ? "—" : Math.round(yen / 1e4).toLocaleString("ja-JP");
	const pct = (v) => v == null || !isFinite(v) ? "—" : `${v > 0 ? "+" : ""}${Number(v).toFixed(2)}%`;
	const dcls = (v) => v == null ? "flat" : v > 0 ? "up" : v < 0 ? "down" : "flat";
	const currentTx = !isLandPriceInitial ? stats?.types?.[initialType] || {
		count: 0,
		avgPrice: null,
		avgSqm: null,
		avgArea: null,
		quarters: [],
		rows: []
	} : null;
	const initialRows = currentTx?.rows ? currentTx.rows.slice(0, 20) : [];
	const isMansion = initialType === "mansion";
	const isLand = initialType === "land";
	const summaryHtml = !showMunicipality ? generateAreaSummaryHtml({
		pref: prefName,
		city: cityName || areaName,
		district: districtName,
		currentType: initialType,
		stats,
		landPrices,
		fluctuation
	}) : "";
	return renderTemplate`${maybeRenderHead($$result)}<div data-dashboard>${summaryHtml && renderTemplate`<p class="area-summary-text">${unescapeHTML(summaryHtml)}</p>`}${!isLandPriceInitial && renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": ($$result) => renderTemplate`<script type="application/json">${unescapeHTML(payload)}<\/script><!-- ==================== 1. 実勢取引ビュー (中古マンション / 戸建て / 土地) ==================== --><div data-view="tx"><!-- エリア相場サマリー --><section class="section" aria-labelledby="kpi-title"><div class="section-head"><div><h2 class="section-title" id="kpi-title">${areaName}の${currentTypeLabel}相場サマリー</h2><p class="section-sub">取引実績（<span data-kpi-type>${currentTypeLabel}</span>）に基づく集計値</p></div></div><div class="kpi-grid"><div class="card kpi"><div class="kpi-label"><span class="kpi-icon" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg></span>平均取引価格</div><div class="kpi-value"><span data-kpi="price">${manInt(currentTx?.avgPrice)}</span><span class="kpi-unit">万円</span></div><div class="kpi-note">平均面積 <b class="num"><span data-kpi="avgArea">${fmt1(currentTx?.avgArea)}</span> ㎡</b></div></div><div class="card kpi"><div class="kpi-label"><span class="kpi-icon" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"></rect><path d="M3 9h18M9 21V9"></path></svg></span>平均坪単価</div><div class="kpi-value"><span data-kpi="tsubo">${currentTx?.avgSqm ? man1(currentTx.avgSqm * TSUBO) : "—"}</span><span class="kpi-unit">万円/坪</span></div><div class="kpi-note">㎡単価 <b class="num"><span data-kpi="sqm">${man1(currentTx?.avgSqm)}</span> 万円/㎡</b></div></div><div class="card kpi"><div class="kpi-label"><span class="kpi-icon" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 7-8.5 8.5-5-5L2 17"></path><path d="M16 7h6v6"></path></svg></span>前年比騰落率</div><div${addAttribute(`kpi-value delta ${dcls(fluctuation)}`, "class")} data-kpi="fluc">${fluctuation != null ? renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": ($$result) => renderTemplate`${fluctuation > 0 ? "+" : ""}${fluctuation.toFixed(2)}<span class="kpi-unit">%</span>` })}` : "—"}</div><div class="kpi-note"><span${addAttribute(`badge ${fluctuation != null ? fluctuation > 0 ? "up" : fluctuation < 0 ? "down" : "neutral" : "neutral"}`, "class")} data-kpi="flucBadge">${fluctuation != null ? fluctuation > 0 ? "▲ 上昇" : fluctuation < 0 ? "▼ 下落" : "横ばい" : "データなし"}</span>&nbsp;地価公示ベース</div></div><div class="card kpi"><div class="kpi-label"><span class="kpi-icon" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg></span>直近の取引件数</div><div class="kpi-value"><span data-kpi="count">${fmtInt(currentTx?.count)}</span><span class="kpi-unit">件</span></div><div class="kpi-note">集計期間 <b>2022年〜最新</b></div></div></div></section><!-- 価格推移グラフ & 条件フィルタ --><section class="section" aria-labelledby="trend-title"><div class="grid-chart"><div class="card"><div class="section-head" style="margin-bottom:0;"><div><h2 class="card-title" id="trend-title">価格推移と取引件数（四半期別）</h2><p class="card-sub">折れ線：平均値 ／ 棒：取引件数。グラフにカーソルを合わせると詳細を表示します。</p></div><div class="seg" role="tablist" aria-label="表示指標"><button type="button" class="seg-btn" role="tab" data-metric="price" aria-selected="true">平均価格</button><button type="button" class="seg-btn" role="tab" data-metric="tsubo" aria-selected="false">坪単価</button></div></div><div class="chart-box"><canvas aria-label="価格推移グラフ" role="img"></canvas></div></div><aside class="card" aria-labelledby="filter-title"><div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px;"><h2 class="card-title" id="filter-title" style="margin:0;">条件で絞り込む</h2><button type="button" class="chip" data-reset style="font-size:0.78rem;">リセット</button></div><div class="filters">${(initialType !== "land" || showMunicipality) && renderTemplate`<div data-filter-group="age"${addAttribute(initialType === "land" ? true : void 0, "hidden")}><div class="filter-group-label">築年数</div><div class="chips">${ageChips.map((c) => renderTemplate`<button type="button" class="chip"${addAttribute(c.filter, "data-filter")}${addAttribute(c.value, "data-value")}${addAttribute(String(c.value === ""), "aria-pressed")}>${c.label}</button>`)}</div></div>`}${(initialType === "mansion" || showMunicipality) && renderTemplate`<div data-filter-group="plan"${addAttribute(initialType !== "mansion" ? true : void 0, "hidden")}><div class="filter-group-label">間取り</div><div class="chips">${planChips.map((c) => renderTemplate`<button type="button" class="chip"${addAttribute(c.filter, "data-filter")}${addAttribute(c.value, "data-value")}${addAttribute(String(c.value === ""), "aria-pressed")}>${c.label}</button>`)}</div></div>`}<div data-filter-group="area"><div class="filter-group-label">面積</div><div class="chips">${areaChips.map((c) => renderTemplate`<button type="button" class="chip"${addAttribute(c.filter, "data-filter")}${addAttribute(c.value, "data-value")}${addAttribute(String(c.value === ""), "aria-pressed")}>${c.label}</button>`)}</div></div>${(initialType === "house" || showMunicipality) && renderTemplate`<div data-filter-group="struct"${addAttribute(initialType !== "house" ? true : void 0, "hidden")}><div class="filter-group-label">構造</div><div class="chips">${structChips.map((c) => renderTemplate`<button type="button" class="chip"${addAttribute(c.filter, "data-filter")}${addAttribute(c.value, "data-value")}${addAttribute(String(c.value === ""), "aria-pressed")}>${c.label}</button>`)}</div></div>`}<div class="filter-result" data-filter-result aria-live="polite">該当 <b class="num">${fmtInt(currentTx?.rows?.length || 0)}</b> 件（直近 ${fmtInt(currentTx?.rows?.length || 0)} 件中）</div></div></aside></div></section><!-- 直近の取引事例一覧 --><section class="section" aria-labelledby="tx-title"><div class="card"><div class="section-head"><div><h2 class="card-title" id="tx-title">直近の取引事例一覧（${currentTypeLabel}）</h2><p class="card-sub">上の絞り込み条件が反映されます。地区名をクリックすると地区別の詳細ページへ移動します。</p></div><span class="badge info">国土交通省 不動産情報ライブラリ</span></div><div class="table-wrap"><table class="data-table responsive"><thead><tr><th scope="col">取引時期</th><th scope="col">所在地</th><th class="r" scope="col">取引価格</th><th class="r" scope="col">${isMansion ? "専有面積" : "土地面積"}</th><th class="r" scope="col">坪単価</th>${isMansion ? renderTemplate`<th scope="col">間取り</th>` : !isLand ? renderTemplate`<th class="r" scope="col">延床面積</th>` : null}${!isLand && renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": ($$result) => renderTemplate`<th class="r" scope="col">建築年</th><th scope="col">構造</th>` })}`}</tr></thead><tbody>${initialRows.map((r) => {
		const tsubo = r.pr > 0 && r.a ? r.pr / r.a * TSUBO : null;
		const loc = showMunicipality ? `${r.pf || ""} ${r.mu || ""}`.trim() : "";
		const age = r.by ? `（築${DATA_YEAR - r.by}年）` : "";
		return renderTemplate`<tr><td data-label="取引時期" class="num">${r.p}</td><td data-label="所在地" class="cell-wide">${loc && renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": ($$result) => renderTemplate`<span class="muted">${loc}</span> ` })}`}${r.d ? r.dc ? renderTemplate`<a${addAttribute(`/pref${String(r.mc).slice(0, 2)}/${r.mc}/${r.dc}/${initialType}`, "href")}>${r.d}</a>` : r.d : renderTemplate`<span class="muted">—</span>`}</td><td data-label="取引価格" class="r strong num">${r.pr > 0 ? `${manInt(r.pr)} 万円` : "—"}</td><td${addAttribute(isMansion ? "専有面積" : "土地面積", "data-label")} class="r num">${r.a ? `${fmtInt(r.a)} ㎡` : "—"}</td><td data-label="坪単価" class="r num">${tsubo ? `${man1(tsubo)} 万円` : "—"}</td>${isMansion ? renderTemplate`<td data-label="間取り">${r.fp || "—"}</td>` : !isLand ? renderTemplate`<td data-label="延床面積" class="r num">${r.fa ? `${fmtInt(r.fa)} ㎡` : "—"}</td>` : null}${!isLand && renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": ($$result) => renderTemplate`<td data-label="建築年" class="r num">${r.by ? renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": ($$result) => renderTemplate`${r.by}年<span class="muted">${age}</span>` })}` : "—"}</td><td data-label="構造">${r.st || "—"}</td>` })}`}</tr>`;
	})}</tbody></table><div class="table-empty" data-table-empty${addAttribute(initialRows.length > 0 ? true : void 0, "hidden")}>条件に一致する取引事例がありません。</div></div><div class="table-foot"><span data-table-count class="num">${fmtInt(initialRows.length)} / ${fmtInt(currentTx?.rows?.length || 0)} 件を表示</span><button type="button" class="btn btn-ghost" data-more style="height:38px;"${addAttribute((currentTx?.rows?.length || 0) <= 20 ? true : void 0, "hidden")}>さらに20件表示</button></div></div></section></div>` })}`}<!-- ==================== 2. 地価種別ビュー (路線価 / 公示価格 / 基準地価) ==================== -->${isLandPriceInitial && renderTemplate`<div data-view="land"><!-- -------------------- 2-A. 路線価ビュー (/rosenka) -------------------- -->${initialType === "rosenka" && renderTemplate`<div data-lp-type="rosenka"><section class="section" aria-labelledby="rosenka-title"><div class="section-head"><div><h2 class="section-title" id="rosenka-title">${areaName}の路線価（相続税路線価）相場</h2><p class="section-sub">国税庁が公表する道路（路線）に面する宅地の価格基準（毎年1月1日時点・地価公示の約80%水準）</p></div><span class="badge info">国税庁 財産評価基準</span></div><div class="kpi-grid"><div class="card kpi"><div class="kpi-label"><span class="kpi-icon" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg></span>平均路線価（推計）</div><div class="kpi-value">${man1(ros.avgPrice)}<span class="kpi-unit">万円/㎡</span></div><div class="kpi-note">公示価格 × 80% で推計</div></div><div class="card kpi"><div class="kpi-label"><span class="kpi-icon" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"></rect><path d="M3 9h18M9 21V9"></path></svg></span>平均坪単価（推計）</div><div class="kpi-value">${man1(ros.avgTsubo)}<span class="kpi-unit">万円/坪</span></div><div class="kpi-note">1坪 = 3.30578 ㎡</div></div><div class="card kpi"><div class="kpi-label"><span class="kpi-icon" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg></span>実勢相場目安（坪単価）</div><div class="kpi-value">${man1(ros.realMarketEstimateTsubo)}<span class="kpi-unit">万円/坪</span></div><div class="kpi-note">路線価 ÷ 0.8 × 1.15 倍換算</div></div><div class="card kpi"><div class="kpi-label"><span class="kpi-icon" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg></span>評価水準</div><div class="kpi-value">約 80<span class="kpi-unit">%</span></div><div class="kpi-note">地価公示（100%）に対する割合</div></div></div></section><!-- 用途区分別の路線価相場 -->${ros.divisions && ros.divisions.length > 0 && renderTemplate`<section class="section" aria-labelledby="rosenka-division-title"><div class="card"><div class="section-head" style="margin-bottom:14px;"><div><h3 class="card-title" id="rosenka-division-title">${areaName}の用途区分別 路線価相場</h3><p class="card-sub">住宅地・商業地・工業地などの用途区分ごとの平均路線価（㎡単価・坪単価）および調査地点数</p></div><span class="badge info">${ros.year}年 公示地価×80%推計</span></div><div class="table-wrap"><table class="data-table"><thead><tr><th>用途区分</th><th class="r">平均路線価（㎡）</th><th class="r">平均坪単価</th><th class="r">実勢相場目安（坪）</th><th class="r">元公示地価（㎡）</th><th class="r">前年比変動率</th><th class="r">調査地点数</th></tr></thead><tbody>${ros.divisions.map((d) => renderTemplate`<tr><td class="strong"><span class="badge neutral" style="font-size:0.8rem; font-weight:700;">${d.name}</span></td><td class="r strong text-accent">${man1(d.avgPrice)} 万円</td><td class="r num strong">${man1(d.avgTsubo)} 万円</td><td class="r num">${man1(d.realMarketEstimateTsubo)} 万円</td><td class="r num text-muted">${man1(d.officialPrice)} 万円</td><td${addAttribute(`r delta ${dcls(d.fluctuationRate)}`, "class")}>${pct(d.fluctuationRate)}</td><td class="r num">${d.count.toLocaleString()} 地点</td></tr>`)}</tbody></table></div></div></section>`}<!-- 路線価シミュレーション & 4大公的価格比較 --><section class="section"><div class="grid-2"><div class="card"><h3 class="card-title" style="margin-bottom:12px;">敷地面積別の相続税評価額の目安</h3><p class="card-sub" style="margin-bottom:16px;">前面道路が平均路線価（${man1(ros.avgPrice)} 万円/㎡）の場合の評価額試算（補正率1.0）</p><div class="table-wrap"><table class="data-table"><thead><tr><th>敷地規模</th><th class="r">面積</th><th class="r">相続税評価額の目安</th></tr></thead><tbody>${(ros.simulations || []).map((sim) => renderTemplate`<tr><td class="strong">${sim.label}</td><td class="r">${sim.area} ㎡（約${sim.tsubo}坪）</td><td class="r strong text-accent">${manInt(sim.price)} 万円</td></tr>`)}</tbody></table></div><p class="kpi-note" style="margin-top:12px;">※奥行価格補正や不整形地補正、小規模宅地等の特例（最大80%減額）は加味していません。</p></div><div class="card"><h3 class="card-title" style="margin-bottom:12px;">不動産の主要4価格（一物四価）と目安比率</h3><p class="card-sub" style="margin-bottom:16px;">実勢価格・公示価格・路線価・固定資産税評価額の関係</p><div class="price-ratios"><div class="stat-row"><span class="k"><b>実勢価格（時価）</b><br><small class="muted">実際の市場売買価格</small></span><span class="v"><b>約 110〜120%</b><br><small class="muted">（平均約 ${man1(ros.realMarketEstimateTsubo)} 万円/坪）</small></span></div><div class="stat-row"><span class="k"><b>公示地価（基準価格）</b><br><small class="muted">国交省公表の適正価格</small></span><span class="v"><b>100%（基準）</b><br><small class="muted">（平均 ${man1(off.avgTsubo)} 万円/坪）</small></span></div><div class="stat-row" style="background:var(--accent-50); padding:8px 10px; border-radius:6px;"><span class="k"><b>相続税路線価</b><br><small class="muted">国税庁の相続・贈与税基準</small></span><span class="v"><b>約 80%</b><br><small class="muted">（平均 ${man1(ros.avgTsubo)} 万円/坪）</small></span></div><div class="stat-row"><span class="k"><b>固定資産税評価額</b><br><small class="muted">固定資産税・都市計画税基準</small></span><span class="v"><b>約 70%</b><br><small class="muted">（3年に1度見直し）</small></span></div></div></div></div></section><!-- 相続税・贈与税の税額計算シミュレーション -->${renderComponent($$result, "TaxSimulator", $$TaxSimulator, {
		"areaName": areaName,
		"avgRosenkaPrice": ros.avgPrice,
		"points": points
	})}<!-- 主要地点の路線価一覧 -->${points.length > 0 && renderTemplate`<section class="section" aria-labelledby="rosenka-table-title"><div class="card"><div class="section-head"><div><h3 class="card-title" id="rosenka-table-title">${areaName}の主要標準地における路線価目安一覧</h3><p class="card-sub">国土交通省 標準地データから算出した推定路線価（公示価格 × 80%）</p></div></div><div class="table-wrap"><table class="data-table"><thead><tr><th class="r">順位</th><th>所在地</th><th>用途区分</th><th class="r">推定路線価（㎡）</th><th class="r">推定坪単価</th><th class="r">元公示地価</th><th class="r">借地権割合目安</th></tr></thead><tbody>${points.slice(0, 25).map((pt) => renderTemplate`<tr><td class="r muted">${pt.rank}</td><td class="strong">${pt.address}</td><td><span${addAttribute(`badge ${pt.division === "商業地" ? "info" : "neutral"}`, "class")}>${pt.division}</span></td><td class="r strong">${man1(pt.rosenkaPrice)} 万円</td><td class="r">${man1(pt.rosenkaTsubo)} 万円</td><td class="r muted">${man1(pt.officialPrice)} 万円</td><td class="r">${pt.division === "商業地" ? "70% (C)" : "60% (D)"}</td></tr>`)}</tbody></table></div></div></section>`}<!-- 路線価の解説コラム --><section class="section"><article class="card card-lg"><h3 class="card-title" style="font-size:1.15rem; margin-bottom:14px;">路線価（相続税路線価）とは？特徴と計算方法</h3><div class="prose"><p><b>路線価（相続税路線価）</b>は、国税庁が毎年7月上旬に公表する、道路（路線）に面する標準的な宅地1㎡あたりの価格です。 毎年1月1日時点を評価基準日としており、相続税や贈与税を算出する際の土地評価額の基礎として広く用いられています。</p><p>路線価は国土交通省が発表する<b>地価公示価格の約80%</b>を目安に設定されています。 そのため、路線価を 0.8 で割り戻すことで公示地価水準を推定でき、さらに市場流通性（1.1〜1.2倍）を加味することで、 実際の<b>売買実勢価格の目安</b>を把握することができます。</p><p>※正確な路線価図記号（千円単位の数字と借地権割合記号A〜G）や個別の補正計算については、国税庁の「財産評価基準書 路線価図・評価倍率表」をご参照ください。</p></div></article></section></div>`}<!-- -------------------- 2-B. 公示価格ビュー (/official) -------------------- -->${initialType === "official" && renderTemplate`<div data-lp-type="official"><section class="section" aria-labelledby="official-title"><div class="section-head"><div><h2 class="section-title" id="official-title">${areaName}の地価公示（公示価格）相場</h2><p class="section-sub">国土交通省 土地鑑定委員会が判定・公表する標準地の価格指標（毎年1月1日時点・3月下旬公表）</p></div><span class="badge info">国土交通省 地価公示</span></div><div class="kpi-grid"><div class="card kpi"><div class="kpi-label"><span class="kpi-icon" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg></span>平均公示価格（全用途）</div><div class="kpi-value">${man1(off.avgPrice)}<span class="kpi-unit">万円/㎡</span></div><div class="kpi-note">1㎡あたりの平均正常価格</div></div><div class="card kpi"><div class="kpi-label"><span class="kpi-icon" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"></rect><path d="M3 9h18M9 21V9"></path></svg></span>平均坪単価</div><div class="kpi-value">${man1(off.avgTsubo)}<span class="kpi-unit">万円/坪</span></div><div class="kpi-note">1坪 = 3.30578 ㎡</div></div><div class="card kpi"><div class="kpi-label"><span class="kpi-icon" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m22 7-8.5 8.5-5-5L2 17"></path><path d="M16 7h6v6"></path></svg></span>前年比変動率</div><div${addAttribute(`kpi-value delta ${dcls(off.avgFluctuation)}`, "class")}>${pct(off.avgFluctuation)}</div><div class="kpi-note"><span${addAttribute(`badge ${off.avgFluctuation > 0 ? "up" : off.avgFluctuation < 0 ? "down" : "neutral"}`, "class")}>${off.avgFluctuation > 0 ? "▲ 上昇" : off.avgFluctuation < 0 ? "▼ 下落" : "横ばい"}</span></div></div><div class="card kpi"><div class="kpi-label"><span class="kpi-icon" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg></span>調査地点数</div><div class="kpi-value">${off.count ? off.count.toLocaleString() : "—"}<span class="kpi-unit">地点</span></div><div class="kpi-note">標準地・基準地（全用途）合計</div></div></div></section><!-- 用途区分別 & 実勢乖離 --><section class="section"><div class="grid-3"><div class="card"><div class="kpi-label">住宅地 平均</div>${off.res ? renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": ($$result) => renderTemplate`<div class="kpi-value">${man1(off.res.avgPrice)}<span class="kpi-unit">万円/㎡</span></div><div class="kpi-note">坪単価 <b class="num">${man1(off.res.avgTsubo)} 万円</b>　<span${addAttribute(`delta ${dcls(off.res.avgFluctuation)}`, "class")}>${pct(off.res.avgFluctuation)}</span></div>` })}` : renderTemplate`<p class="kpi-note" style="margin-top:12px;">データなし</p>`}</div><div class="card"><div class="kpi-label">商業地 平均</div>${off.com ? renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": ($$result) => renderTemplate`<div class="kpi-value">${man1(off.com.avgPrice)}<span class="kpi-unit">万円/㎡</span></div><div class="kpi-note">坪単価 <b class="num">${man1(off.com.avgTsubo)} 万円</b>　<span${addAttribute(`delta ${dcls(off.com.avgFluctuation)}`, "class")}>${pct(off.com.avgFluctuation)}</span></div>` })}` : renderTemplate`<p class="kpi-note" style="margin-top:12px;">データなし</p>`}</div><div class="card" style="background:var(--accent-50); border-color:#BAE6FD;"><div class="kpi-label">実勢土地価格 vs 地価公示</div>${off.divergence != null ? renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": ($$result) => renderTemplate`<div${addAttribute(`kpi-value delta ${dcls(off.divergence)}`, "class")}>${pct(off.divergence)}</div><div class="kpi-note">実勢取引平均単価が地価公示より${off.divergence >= 0 ? "高い" : "低い"}水準</div>` })}` : renderTemplate`<p class="kpi-note" style="margin-top:12px;">取引データと比較可能になり次第表示</p>`}</div></div>${off.maxPoint && off.minPoint && renderTemplate`<div class="callout" style="margin-top:16px;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 21s-6-5.5-6-11a6 6 0 1 1 12 0c0 5.5-6 11-6 11z"></path><circle cx="12" cy="10" r="2"></circle></svg><div><b>最高価格標準地：</b>${off.maxPoint.address}（<span class="num">${man1(off.maxPoint.price)}</span> 万円/㎡・坪単価 <span class="num">${man1(off.maxPoint.tsubo)}</span> 万円）<br><b>最低価格標準地：</b>${off.minPoint.address}（<span class="num">${man1(off.minPoint.price)}</span> 万円/㎡・坪単価 <span class="num">${man1(off.minPoint.tsubo)}</span> 万円）</div></div>`}</section><!-- 地価公示 標準地ランキング一覧 -->${points.length > 0 && renderTemplate`<section class="section" aria-labelledby="official-table-title"><div class="card"><div class="section-head"><div><h3 class="card-title" id="official-table-title">${areaName}の地価公示 標準地点一覧（上位地点）</h3><p class="card-sub">国土交通省が公表する標準地価格と前年比変動率</p></div></div><div class="table-wrap"><table class="data-table"><thead><tr><th class="r">順位</th><th>所在地</th><th>用途区分</th><th class="r">公示価格（㎡）</th><th class="r">坪単価</th><th class="r">前年比変動</th><th class="r">地積</th><th class="r">建蔽率 / 容積率</th></tr></thead><tbody>${points.slice(0, 30).map((pt) => renderTemplate`<tr><td class="r muted">${pt.rank}</td><td class="strong">${pt.address}</td><td><span${addAttribute(`badge ${pt.division === "商業地" ? "info" : "neutral"}`, "class")}>${pt.division}</span></td><td class="r strong">${man1(pt.officialPrice)} 万円</td><td class="r">${man1(pt.officialTsubo)} 万円</td><td class="r"><span${addAttribute(`delta ${dcls(pt.fluctuationRate)}`, "class")}>${pct(pt.fluctuationRate)}</span></td><td class="r">${pt.area ? `${pt.area.toLocaleString()} ㎡` : "—"}</td><td class="r muted">${pt.bcr ?? "—"}% / ${pt.far ?? "—"}%</td></tr>`)}</tbody></table></div></div></section>`}<!-- 地価公示の解説コラム --><section class="section"><article class="card card-lg"><h3 class="card-title" style="font-size:1.15rem; margin-bottom:14px;">地価公示（公示地価）とは？公的指標の重要性</h3><div class="prose"><p><b>地価公示（公示地価）</b>は、地価公示法に基づき国土交通省の土地鑑定委員会が毎年1月1日時点の標準地を選定し、正常な価格を判定・公示する公的価格です（毎年3月下旬公表）。</p><p>一般の土地取引において価格決定の指標となるだけでなく、不動産鑑定士による鑑定評価の規準や、国や自治体による公共用地の取得価格算定、金融機関の担保評価など、不動産経済全般の物差しとして幅広く利用されています。</p></div></article></section></div>`}<!-- -------------------- 2-C. 基準地価ビュー (/standard) -------------------- -->${initialType === "standard" && renderTemplate`<div data-lp-type="standard"><section class="section" aria-labelledby="standard-title"><div class="section-head"><div><h2 class="section-title" id="standard-title">${areaName}の基準地価（都道府県地価調査）相場</h2><p class="section-sub">各都道府県が判定・公表する基準地の標準価格（毎年7月1日時点・9月下旬公表）</p></div><span class="badge info">都道府県地価調査</span></div><div class="kpi-grid"><div class="card kpi"><div class="kpi-label"><span class="kpi-icon" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg></span>平均基準地価（推計）</div><div class="kpi-value">${man1(std.avgPrice)}<span class="kpi-unit">万円/㎡</span></div><div class="kpi-note">7月1日時点の価格水準</div></div><div class="card kpi"><div class="kpi-label"><span class="kpi-icon" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"></rect><path d="M3 9h18M9 21V9"></path></svg></span>平均坪単価</div><div class="kpi-value">${man1(std.avgTsubo)}<span class="kpi-unit">万円/坪</span></div><div class="kpi-note">1坪 = 3.30578 ㎡</div></div><div class="card kpi"><div class="kpi-label"><span class="kpi-icon" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m22 7-8.5 8.5-5-5L2 17"></path><path d="M16 7h6v6"></path></svg></span>年間地価トレンド</div><div${addAttribute(`kpi-value delta ${dcls(std.trendRate)}`, "class")}>${pct(std.trendRate)}</div><div class="kpi-note"><span${addAttribute(`badge ${std.trendRate > 0 ? "up" : std.trendRate < 0 ? "down" : "neutral"}`, "class")}>${std.trendRate > 0 ? "▲ 上昇傾向" : std.trendRate < 0 ? "▼ 下落傾向" : "横ばい"}</span></div></div><div class="card kpi"><div class="kpi-label"><span class="kpi-icon" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1 2-2h11"></path></svg></span>調査主体</div><div class="kpi-value" style="font-size:1.4rem;">各都道府県</div><div class="kpi-note">地価公示を補完する半年時点の調査</div></div></div></section><!-- 用途区分別動向 & 地価公示との関係 --><section class="section"><div class="grid-2"><div class="card"><h3 class="card-title" style="margin-bottom:12px;">用途区分別の基準地価水準</h3><p class="card-sub" style="margin-bottom:16px;">住宅地および商業地の推計水準</p><div class="stat-row"><span class="k"><b>住宅地 平均</b></span><span class="v"><b>${man1(std.res ? std.res.avgPrice : null)} 万円/㎡</b>（坪単価 ${man1(std.res ? std.res.avgTsubo : null)} 万円）</span></div><div class="stat-row"><span class="k"><b>商業地 平均</b></span><span class="v"><b>${man1(std.com ? std.com.avgPrice : null)} 万円/㎡</b>（坪単価 ${man1(std.com ? std.com.avgTsubo : null)} 万円）</span></div></div><div class="card"><h3 class="card-title" style="margin-bottom:12px;">地価公示（1/1）と基準地価（7/1）の違い</h3><p class="card-sub" style="margin-bottom:16px;">年2回の公的調査による地価動向の把握</p><div class="stat-row"><span class="k"><b>調査時点</b></span><span class="v">地価公示：1月1日 ／ 基準地価：<b>7月1日</b></span></div><div class="stat-row"><span class="k"><b>調査主体</b></span><span class="v">地価公示：国交省 ／ 基準地価：<b>都道府県</b></span></div><div class="stat-row"><span class="k"><b>調査区域</b></span><span class="v">都市計画区域外の林地・山林等も広く網羅</span></div></div></div></section><!-- 基準地一覧テーブル -->${points.length > 0 && renderTemplate`<section class="section" aria-labelledby="standard-table-title"><div class="card"><div class="section-head"><div><h3 class="card-title" id="standard-table-title">${areaName}の基準地点一覧</h3><p class="card-sub">公的鑑定基準地における推計価格一覧</p></div></div><div class="table-wrap"><table class="data-table"><thead><tr><th class="r">順位</th><th>所在地</th><th>用途区分</th><th class="r">推計基準地価（㎡）</th><th class="r">推計坪単価</th><th class="r">変動トレンド</th><th class="r">地積</th></tr></thead><tbody>${points.slice(0, 25).map((pt) => renderTemplate`<tr><td class="r muted">${pt.rank}</td><td class="strong">${pt.address}</td><td><span${addAttribute(`badge ${pt.division === "商業地" ? "info" : "neutral"}`, "class")}>${pt.division}</span></td><td class="r strong">${man1(pt.standardPrice)} 万円</td><td class="r">${man1(pt.standardTsubo)} 万円</td><td class="r"><span${addAttribute(`delta ${dcls(pt.fluctuationRate)}`, "class")}>${pct(pt.fluctuationRate)}</span></td><td class="r">${pt.area ? `${pt.area.toLocaleString()} ㎡` : "—"}</td></tr>`)}</tbody></table></div></div></section>`}<!-- 基準地価の解説コラム --><section class="section"><article class="card card-lg"><h3 class="card-title" style="font-size:1.15rem; margin-bottom:14px;">基準地価（都道府県地価調査）とは？</h3><div class="prose"><p><b>都道府県地価調査（基準地価）</b>は、国土利用計画法に基づき各都道府県が主体となって毎年7月1日時点の基準地価格を判定する調査です（毎年9月下旬公表）。</p><p>国が実施する1月1日時点の「地価公示」とあわせて年2回実施されることで、半年ごとの地価変動の動向をタイムリーに捉えることができます。 また、地価公示が主に都市計画区域内を対象とするのに対し、都道府県地価調査は都市計画区域外の住宅地や林地等も幅広く対象としているのが大きな特徴です。</p></div></article></section></div>`}</div>`}</div>${!isLandPriceInitial && renderTemplate`<script src="/assets/js/dashboard.js" defer><\/script>`}`;
}, "D:/xampp/htdocs/root/realestate-astro/src/components/AreaDashboard.astro", void 0);
//#endregion
export { $$AreaDashboard as t };

//# sourceMappingURL=AreaDashboard_BleeDO4s.mjs.map