# WebPaint 浏览器扩展

把 WebPaint.js 包装成 Chrome / Edge 浏览器扩展，**在任意网页上点一下图标即可开始标注**。

## 功能

- 🖱 点击工具栏图标 → 在当前页面开启/切换标注模式
- 🖊 完整工具：画笔 / 箭头 / 矩形 / 文字 / 橡皮擦，撤销重做，清空
- 📸 「保存」按钮调用浏览器原生截图能力，整页（含标注）保存为 PNG，**不依赖任何 CDN**
- 🔒 不联网读取数据，不上传任何标注内容

## 安装步骤（开发者模式，30 秒）

### Chrome / Edge 通用

1. 打开扩展管理页：
   - Chrome：`chrome://extensions/`
   - Edge：`edge://extensions/`
2. 打开右上角 **"开发者模式"**（Developer mode）
3. 点击左上角 **"加载已解压的扩展程序"**（Load unpacked）
4. 选择本目录下的 **`extension`** 文件夹
5. 浏览器工具栏会出现一个蓝紫色笔刷图标 🖌，点击它即可在当前网页开启标注

> 后续如果改了 `webpaint.js`、`content.js` 等文件，回到扩展页点 **"重新加载"** 按钮即可生效。

## 使用流程

1. 访问任意网页（比如知乎、博客、PDF 之外的网页）
2. 点工具栏的 WebPaint 图标 → 页面右侧弹出工具栏，进入标注模式
3. 直接在页面内容上画
4. 点击工具栏里的 💾 按钮 → 自动下载当前可视区的整页截图（含你的标注）
5. **再次点扩展图标** → 回到浏览模式（标注仍可见，但页面交互恢复正常）
6. **第三次点扩展图标** → 回到标注模式继续画

## 文件结构

```
extension/
├── manifest.json      # MV3 清单
├── background.js      # Service Worker：处理点击 + 截图下载
├── content.js         # 内容脚本：注入插件 + 接管导出逻辑
├── webpaint.js        # 插件本体
├── icons/             # 自动生成的图标
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
├── README.md
└── icons/           # 16 / 32 / 48 / 128 px 图标（由 tools/gen-icons.js 生成）
```

## 重新生成图标

```bash
node ../tools/gen-icons.js
```

## 关于导出

扩展版不依赖 `html2canvas`，而是调用 `chrome.tabs.captureVisibleTab` 截取**当前可视区域**（含 Canvas 标注层）后下载：

- 优点：不联网、不被 CSP 拦截、速度极快
- 限制：只截可视区，超长页面需要先滚到对应位置

如果需要「整页滚动截图」功能，可以告诉我，我帮你升级成 `scripting.executeScript` 全页拼接方案～

## 注意事项

- 不支持 Chrome Web Store / Edge Add-ons 等受保护页面（这是浏览器安全限制）
- 不支持 `file://` 本地文件（除非在 `manifest.json` 增加 `file:///*` 的 host_permissions）
- 一个网页同一时间只能开一个 WebPaint 实例，再点图标会在标注/浏览之间切换