/**
 * Express 5 の無効ルート（例: app.options('*')）が再導入されると、
 * path-to-regexp が import 時に同期例外を投げる。CI / ローカルで検知する。
 */
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const root = path.dirname(fileURLToPath(import.meta.url));
const distApi = path.join(root, "..", "dist", "api");

for (const rel of ["index.js", "link-preview.js"]) {
  const filePath = path.join(distApi, rel);
  try {
    await import(pathToFileURL(filePath).href);
    console.log(`check-api-import: OK ${rel}`);
  } catch (e) {
    console.error(`check-api-import: FAIL ${rel}`, e);
    process.exit(1);
  }
}
