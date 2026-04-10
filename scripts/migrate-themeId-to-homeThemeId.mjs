#!/usr/bin/env node
/**
 * Firestore マイグレーション: effects コレクションの themeId → homeThemeId
 *
 * 既存の `themeId` フィールドを `homeThemeId` にリネームし、旧フィールドを削除する。
 * フロントエンドのデプロイ後に一度だけ実行すること。
 *
 * 使い方:
 *   # GOOGLE_APPLICATION_CREDENTIALS または FIREBASE_SERVICE_ACCOUNT_JSON 環境変数を設定
 *   node scripts/migrate-themeId-to-homeThemeId.mjs
 *
 *   # ドライラン（変更を適用しない）
 *   node scripts/migrate-themeId-to-homeThemeId.mjs --dry-run
 */
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// ── Firebase 初期化 ──────────────────────────────────────────────────────────

function initFirebase() {
  const jsonEnv = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (jsonEnv) {
    const serviceAccount = JSON.parse(jsonEnv);
    return initializeApp({ credential: cert(serviceAccount) });
  }
  // Fallback: GOOGLE_APPLICATION_CREDENTIALS
  return initializeApp();
}

const app = initFirebase();
const db = getFirestore(app);

// ── マイグレーション ─────────────────────────────────────────────────────────

const dryRun = process.argv.includes('--dry-run');

async function migrateThemeIdToHomeThemeId() {
  const snapshot = await db.collection('effects').get();

  if (snapshot.empty) {
    console.log('effects コレクションにドキュメントがありません。');
    return;
  }

  let migratedCount = 0;
  let skippedCount = 0;

  // Firestore batch は最大 500 操作
  const BATCH_LIMIT = 500;
  let batch = db.batch();
  let batchCount = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();

    // 既にマイグレーション済み、またはthemeIdが存在しない場合はスキップ
    if (data.themeId === undefined || data.homeThemeId !== undefined) {
      skippedCount++;
      continue;
    }

    if (dryRun) {
      console.log(`[DRY RUN] ${doc.id}: themeId="${data.themeId}" → homeThemeId="${data.themeId}"`);
      migratedCount++;
      continue;
    }

    batch.update(doc.ref, {
      homeThemeId: data.themeId,
      themeId: FieldValue.delete(),
    });
    migratedCount++;
    batchCount++;

    if (batchCount >= BATCH_LIMIT) {
      await batch.commit();
      console.log(`Committed batch of ${batchCount} documents.`);
      batch = db.batch();
      batchCount = 0;
    }
  }

  if (!dryRun && batchCount > 0) {
    await batch.commit();
  }

  console.log(`\nマイグレーション完了:`);
  console.log(`  変換: ${migratedCount} ドキュメント`);
  console.log(`  スキップ: ${skippedCount} ドキュメント`);
  if (dryRun) {
    console.log('  (ドライランのため変更は適用されていません)');
  }
}

migrateThemeIdToHomeThemeId()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('マイグレーション失敗:', err);
    process.exit(1);
  });
