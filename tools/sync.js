/* WebPaint 同步脚本（无依赖）
 * 作用：将根目录的 webpaint.js（唯一来源）同步到 extension/ 目录，
 *       保证浏览器扩展使用的副本与插件核心始终一致。
 * 用法：node tools/sync.js
 */
'use strict';
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const src = path.join(root, 'webpaint.js');
const dst = path.join(root, 'extension', 'webpaint.js');

if (!fs.existsSync(src)) {
  console.error('[sync] 未找到根目录 webpaint.js');
  process.exit(1);
}

fs.copyFileSync(src, dst);
console.log('[sync] 已同步 webpaint.js -> extension/webpaint.js (' + fs.statSync(dst).size + ' bytes)');
