/* 生成扩展图标（纯 Node，无依赖）：蓝色圆底 + 白色笔迹 */
'use strict';
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

// ---- 最小 PNG 编码器 (RGBA) ----
function crc32(buf) {
  let table = crc32.table;
  if (!table) {
    table = crc32.table = [];
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c >>> 0;
    }
  }
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
function encodePNG(w, h, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6; // 8bit RGBA
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0; // filter none
    rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  }
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

// ---- 绘制：抗锯齿圆底 + 白色斜笔画 + 笔尖点 ----
function drawIcon(size) {
  const px = Buffer.alloc(size * size * 4);
  const cx = size / 2, cy = size / 2, R = size / 2 - size * 0.02;
  // 笔画：从左下到右上的一条粗线（模拟笔迹）
  const x1 = size * 0.30, y1 = size * 0.70, x2 = size * 0.70, y2 = size * 0.30;
  const lw = size * 0.13;
  function distToSeg(px_, py_) {
    const dx = x2 - x1, dy = y2 - y1;
    const t = Math.max(0, Math.min(1, ((px_ - x1) * dx + (py_ - y1) * dy) / (dx * dx + dy * dy)));
    const nx = x1 + t * dx, ny = y1 + t * dy;
    return Math.hypot(px_ - nx, py_ - ny);
  }
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
      const circleA = Math.max(0, Math.min(1, R - d + 0.5)); // 边缘抗锯齿
      if (circleA <= 0) continue;
      // 底色：蓝 → 紫 渐变
      const t = (x + y) / (2 * size);
      let r = Math.round(0x00 + (0x8e - 0x00) * t);
      let g = Math.round(0x91 + (0x4e - 0x91) * t);
      let b = Math.round(0xff + (0xc6 - 0xff) * t);
      // 白色笔迹
      const sd = distToSeg(x + 0.5, y + 0.5);
      const strokeA = Math.max(0, Math.min(1, lw / 2 - sd + 0.5));
      if (strokeA > 0) {
        r = Math.round(r + (255 - r) * strokeA);
        g = Math.round(g + (255 - g) * strokeA);
        b = Math.round(b + (255 - b) * strokeA);
      }
      px[i] = r; px[i + 1] = g; px[i + 2] = b; px[i + 3] = Math.round(255 * circleA);
    }
  }
  return encodePNG(size, size, px);
}

const outDir = path.join(__dirname, '..', 'extension', 'icons');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
[16, 32, 48, 128].forEach(function (s) {
  fs.writeFileSync(path.join(outDir, 'icon' + s + '.png'), drawIcon(s));
  console.log('icon' + s + '.png ok');
});
