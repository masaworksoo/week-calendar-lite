// ============================================================
// 週間カレンダー ウィジェット (Scriptable用・簡易版)
// バージョン: 1.0
//
// 【ライセンス】
// 本ファイルは MasaWorks が GitHub で無償公開する簡易版です。
// 個人利用は自由です。再販売はできません。
//
// 【このウィジェットの特徴】
// - 日付と曜日だけを表示する簡易版です
//   (予定・天気・祝日表示はありません)
// - 横長(ミディアム)サイズ / 月曜始まりの1週間を横並び表示
//   (日曜日は翌週を表示。過ぎた日は薄く表示)
// - デザイン: 単色背景(昼=白 / 夜=濃紺に自動切替)
//   今日の列はほんのりハイライト
//
// 【はじめに】
// 初期値のままでそのまま使えます。
// 昼夜の切り替え時刻を変えたい場合のみ、下の「設定」セクションを
// 書き換えてください。
// ============================================================

// ---- 設定 ----
// 【書き換え方のルール】
// ・書き換えるのは、各行の「=」の後ろにある数字(半角)だけです
// ・行頭の「const」や行末の「;」、行末のメモ書き(// 〜)は
//   そのまま残してください
// ・数字は必ず半角で入力してください(全角数字はエラーになります)

// ---- 1. 昼夜の切り替え時刻(初期値のままでも使えます) ----
const DAY_START_HOUR = 6;     // 「昼」の配色になる時刻 ※24時間表記(例: 6=朝6時)
const DAY_END_HOUR = 18;      // 「夜」の配色になる時刻 ※24時間表記(例: 18=夕方6時、20=夜8時)

// ---- 2. レイアウト調整用(通常は変更不要です) ----
const DAYS = 7;               // 表示する日数(月曜から7日分)
const COL_W = 44;             // 1日分の列の固定幅(pt) ※全日を均等にするための値です
const COL_GAP = 2;            // 列と列の間の固定幅(pt)

// ---- 配色(昼/夜) ----
function palette() {
  const h = new Date().getHours();
  const night = h < DAY_START_HOUR || h >= DAY_END_HOUR;
  if (night) {
    return {
      bg: new Color("#0d1522"),
      textMain: Color.white(),
      textSub: new Color("#aeb9cc"),
      textPast: new Color("#5b6a84"),
      todayBg: new Color("#1d2c47"),
      todayDate: new Color("#ffd166"),
      sun: new Color("#ffb3a3"),
      sat: new Color("#a9c2ff")
    };
  }
  return {
    bg: Color.white(),
    textMain: new Color("#14181f"),
    textSub: new Color("#5a6472"),
    textPast: new Color("#c3c9d2"),
    todayBg: new Color("#eef2f9"),
    todayDate: new Color("#d98a00"),
    sun: new Color("#d84f35"),
    sat: new Color("#2f5fd0")
  };
}

// ---- ユーティリティ ----
function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth() === b.getMonth() &&
         a.getDate() === b.getDate();
}
// その日を含む週の月曜日を返す
function mondayOfWeek(d) {
  const x = startOfDay(d);
  const diff = (x.getDay() + 6) % 7; // 月曜=0
  x.setDate(x.getDate() - diff);
  return x;
}
// 列の中でテキストを真ん中に置く(両側スペーサーで挟む方式が確実)
function addCenteredText(col, str, font, color) {
  const s = col.addStack();
  s.layoutHorizontally();
  s.addSpacer();
  const t = s.addText(str);
  t.font = font;
  t.textColor = color;
  t.centerAlignText();
  t.lineLimit = 1; // 折り返さず1行に収める
  t.minimumScaleFactor = 0.85;
  s.addSpacer();
  return t;
}

// ---- ウィジェット構築 ----
function createWidget() {
  const P = palette();
  const today = startOfDay(new Date());

  // 月曜始まりの週を決める(日曜日なら翌週を表示)
  let weekStart = mondayOfWeek(today);
  if (today.getDay() === 0) {
    weekStart.setDate(weekStart.getDate() + 7);
  }
  const days = [];
  for (let i = 0; i < DAYS; i++) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    days.push(d);
  }

  const w = new ListWidget();
  w.backgroundColor = P.bg; // 単色背景
  w.setPadding(10, 10, 10, 10);

  // ---- ヘッダー: 年と期間のみ(「11月」と期間の月が重複するので月表記は省く) ----
  const lastDay = days[days.length - 1];
  const monthLabel = weekStart.getFullYear() + "年  "
    + (weekStart.getMonth() + 1) + "/" + weekStart.getDate()
    + " – " + (lastDay.getMonth() + 1) + "/" + lastDay.getDate();

  const header = w.addStack();
  header.layoutHorizontally();
  header.addSpacer(); // 年月表示を上部の中央に配置
  const monthTxt = header.addText(monthLabel);
  monthTxt.font = Font.semiboldSystemFont(11);
  monthTxt.textColor = P.textMain;
  monthTxt.centerAlignText();
  header.addSpacer();

  w.addSpacer(6);

  // ---- 本体: 7日分の列(幅は全日均等) ----
  const weekChars = ["日", "月", "火", "水", "木", "金", "土"];

  const row = w.addStack();
  row.layoutHorizontally();
  row.addSpacer(); // 左端の柔軟スペーサー(中央寄せ用、両端の2つだけ)

  for (let i = 0; i < days.length; i++) {
    const day = days[i];
    const dayStart = startOfDay(day);

    const col = row.addStack();
    col.layoutVertically();
    col.size = new Size(COL_W, 0); // 列幅を固定して全日均等に
    col.centerAlignContent();      // 列内の要素を水平方向の中央に揃える

    const isToday = sameDay(day, today);
    const isPast = dayStart < today;
    const dow = day.getDay();

    // 今日の列だけ、ほんのりハイライト(角丸の薄い背景)
    if (isToday) {
      col.backgroundColor = P.todayBg;
      col.cornerRadius = 10;
      col.setPadding(4, 2, 4, 2);
    }

    // 色の決定(過ぎた日は全体を薄く)
    const dowColor = isPast ? P.textPast
                   : dow === 0 ? P.sun
                   : dow === 6 ? P.sat
                   : P.textSub;
    const dateColor = isPast ? P.textPast
                    : isToday ? P.todayDate
                    : dow === 0 ? P.sun
                    : P.textMain;

    // 曜日(小さく・中央配置)
    addCenteredText(col, weekChars[dow], Font.mediumSystemFont(9), dowColor);

    // 日付(大きく・細く・中央配置)
    addCenteredText(col, String(day.getDate()),
      Font.lightSystemFont(isToday ? 24 : 22), dateColor);

    // 列間は固定幅スペーサーにする(引数なしは最小幅を持ち、合計が溢れるため)
    if (i < days.length - 1) row.addSpacer(COL_GAP);
  }
  row.addSpacer(); // 右端の柔軟スペーサー(中央寄せ用)

  // 次回更新の目安(iOS側が最終判断します)
  w.refreshAfterDate = new Date(Date.now() + 30 * 60 * 1000);
  return w;
}

// ---- 実行 ----
const widget = createWidget();
if (config.runsInWidget) {
  Script.setWidget(widget);
} else {
  widget.presentMedium();
}
Script.complete();
