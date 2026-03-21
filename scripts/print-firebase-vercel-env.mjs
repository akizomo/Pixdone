#!/usr/bin/env node
/**
 * Firebase からダウンロードしたサービスアカウント JSON を、
 * Vercel の環境変数に貼る用の1行に変換する（ローカルで実行するだけ）。
 *
 * 使い方:
 *   node scripts/print-firebase-vercel-env.mjs ~/Downloads/xxx-firebase-adminsdk-xxxxx.json
 *
 * 長すぎてコピペしづらいとき（Mac）:
 *   node scripts/print-firebase-vercel-env.mjs ~/path/to.json --copy
 *   → FIREBASE_SERVICE_ACCOUNT_JSON 用の文字列がクリップボードに入る（手で選ばなくてよい）
 *
 *   node scripts/print-firebase-vercel-env.mjs ~/path/to.json --copy-b64
 *   → FIREBASE_SERVICE_ACCOUNT_BASE64 用
 *
 * 注意: 表示・クリップボードの値は秘密。チャットや Git に貼らないこと。
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const argv = process.argv.slice(2);
const copyJson = argv.includes("--copy") || argv.includes("--copy-json");
const copyB64 = argv.includes("--copy-b64");
const filePath = argv.find((a) => !a.startsWith("--"));

if (!filePath) {
  console.error(`
使い方:
  node scripts/print-firebase-vercel-env.mjs <サービスアカウントJSONのパス> [--copy]

  --copy      (Mac) 値をクリップボードへ。Vercel の Name に FIREBASE_SERVICE_ACCOUNT_JSON
  --copy-b64  (Mac) Base64 版をクリップボードへ。Name に FIREBASE_SERVICE_ACCOUNT_BASE64

例:
  node scripts/print-firebase-vercel-env.mjs ~/Downloads/project-firebase-adminsdk-xxxxx.json
  node scripts/print-firebase-vercel-env.mjs ~/Downloads/key.json --copy
`);
  process.exit(1);
}

const resolved = path.resolve(filePath.replace(/^~/, process.env.HOME || ""));
if (!fs.existsSync(resolved)) {
  console.error("ファイルが見つかりません:", resolved);
  process.exit(1);
}

const raw = fs.readFileSync(resolved, "utf8");
let parsed;
try {
  parsed = JSON.parse(raw);
} catch {
  console.error("JSON の解析に失敗しました。Firebase から落としたそのままのファイルか確認してください。");
  process.exit(1);
}

if (parsed.type !== "service_account" || !parsed.private_key || !parsed.client_email) {
  console.error("サービスアカウント JSON ではなさそうです（type / private_key / client_email を確認）。");
  process.exit(1);
}

const oneLine = JSON.stringify(parsed);
const base64 = Buffer.from(raw, "utf8").toString("base64");

function preview(s, head = 72, tail = 72) {
  if (s.length <= head + tail + 3) return s;
  return `${s.slice(0, head)} ... ${s.slice(-tail)}`;
}

function copyMac(text, label) {
  if (process.platform !== "darwin") {
    console.error(
      "クリップボードへのコピーは今のところ macOS のみです。表示された1行を手動でコピーしてください。",
    );
    return false;
  }
  const r = spawnSync("pbcopy", { input: text, encoding: "utf8" });
  if (r.status !== 0) {
    console.error("pbcopy に失敗しました");
    return false;
  }
  console.log(`\n✅ クリップボードにコピーしました（${label}）\n`);
  return true;
}

if (copyJson) {
  copyMac(oneLine, "FIREBASE_SERVICE_ACCOUNT_JSON の Value 用");
} else if (copyB64) {
  copyMac(base64, "FIREBASE_SERVICE_ACCOUNT_BASE64 の Value 用");
}

console.log(`
=== Vercel で入れる名前（Key）と値（Value）===

  おすすめ:
    Key（名前）  : FIREBASE_SERVICE_ACCOUNT_JSON
    Value（値）: 下の「A」のブロック全体 — たった 1 行だけ（途中で改行しない）

  うまくいかないとき:
    Key（名前）  : FIREBASE_SERVICE_ACCOUNT_BASE64
    Value（値）: 下の「B」のブロック全体 — たった 1 行だけ

--- コピー範囲の目安（A）---
  先頭は必ず { の直後に " が続く（1行の先頭）
  末尾は必ず } で終わる（1行の末尾）
  プレビュー（真ん中は省略）:
`);
console.log("  ", preview(oneLine));
console.log(`\n  文字数: ${oneLine.length}（全部でこの1行）\n`);

console.log(`--- A（おすすめ）そのまま Value に貼る ---`);
console.log(oneLine);

console.log(`
--- B（Base64）そのまま Value に貼る ---`);
console.log(base64);

console.log(`
--- よくあるミス ---
  × Value の前後に " を付ける（" { ... } " になっている）
  × 途中で改行が入る（必ず1行）
  × Key に JSON の長い文字列を入れる（Key は FIREBASE_SERVICE_ACCOUNT_JSON だけ）
  ○ Mac なら: npm run vercel:firebase-env -- <jsonパス> --copy でクリップボードへ

※ この出力は秘密。Slack/チャット/issue に貼らない
`);
