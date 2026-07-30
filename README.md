# WebPaint.js — 网页绘画标注插件

轻量级、零依赖的网页绘画标注插件。在任意网页顶层铺设一张透明画布，支持自由绘制与标注，并可将标注后的页面导出为图片。

## 功能特性

| 功能 | 说明 |
|------|------|
| 🖊 画笔工具 | 自由绘制，贝塞尔平滑笔迹，可选颜色与粗细 |
| 🖍 荧光笔 | 半透明宽笔触（`multiply` 混合 + 35% 透明度），划重点不遮挡文字 |
| 🏷 标注元素 | 文字标注（所见即所得输入）、箭头、矩形框 |
| 🧽 橡皮擦 | 基于 `destination-out` 的真实擦除 |
| ↩ 撤销/重做 | 操作栈实现，支持 `Ctrl+Z` / `Ctrl+Y`（`Ctrl+Shift+Z`） |
| 🗑 清空画布 | 一键清空，且清空操作本身可撤销 |
| 💾 保存导出 | 整页截图 + 标注导出 PNG（html2canvas，按需加载），或仅导出透明标注层 |
| 📚 图层管理 | 画布浮于页面之上；退出标注模式后指针穿透，完全不影响原页面交互 |
| 📱 响应式 | 适配 DPR / 窗口缩放无损重绘；移动端工具栏自动切换为底部横排，支持触屏 |
| ✋ 可拖动工具栏 | 按住工具栏顶部 ⠿ 手柄可拖到任意位置，自动限制在视口内 |
| 🔘 可拖拽悬浮球 | 右下角蓝色悬浮球可按住拖动到任意位置，松开后保持停留 |
| ✖️ 可关闭悬浮球 | 悬停悬浮球出现 × 可将其隐藏，整页截图不再被遮挡；随时可重新显示 |
| ↔️ 工具栏方向切换 | 支持纵向（默认）或横向展开工具栏，一键切换排列方向 |

## 快速开始

```html
<script src="webpaint.js"></script>
<script>
  const wp = new WebPaint();
  wp.enable(); // 进入标注模式
</script>
```

也支持 CommonJS：`const WebPaint = require('./webpaint.js')`。

想快速体验效果？直接用浏览器打开 `demo/index.html` 即可试玩（已预设好工具栏与可标注示例）。

## 配置项

```js
const wp = new WebPaint({
  zIndex: 999990,        // 画布层级
  color: '#e5484d',      // 默认颜色
  size: 4,               // 默认线宽 (px)
  tool: 'pen',           // 默认工具 pen | highlighter | arrow | rect | text | eraser
  toolbar: true,         // 是否渲染内置工具栏 + 悬浮球（false 时可完全自建 UI）
  toolbarDirection: 'vertical', // 工具栏展开方向：'vertical' 纵向 | 'horizontal' 横向
  hotkeys: true,         // 是否启用 Ctrl+Z / Ctrl+Y
  presetColors: [...],   // 工具栏预设色板
  autoEnable: false,     // 初始化后立即进入标注模式
  html2canvasUrl: '...'  // 整页导出所用 html2canvas 的加载地址（可换内网地址）
});
```

## API

| 方法 | 说明 |
|------|------|
| `enable()` / `disable()` / `toggle()` | 进入 / 退出 / 切换标注模式。退出后画布 `pointer-events:none`，页面交互不受影响 |
| `setTool(tool)` | `pen` / `highlighter` / `arrow` / `rect` / `text` / `eraser` |
| `setColor(color)` | 设置颜色，任意 CSS 颜色值 |
| `setSize(size)` | 设置线宽（文字大小随线宽联动） |
| `setToolbarDirection(dir)` | 设置工具栏展开方向：`'vertical'` 纵向 / `'horizontal'` 横向 |
| `showFab()` / `hideFab()` / `setFabVisible(bool)` | 显示 / 隐藏悬浮球 / 按布尔值设置（隐藏后整页截图不再被遮挡，可随时重新显示） |
| `undo()` / `redo()` / `clear()` | 撤销 / 重做 / 清空 |
| `canUndo()` / `canRedo()` | 是否可撤销 / 重做 |
| `exportImage(opts)` | 导出图片，返回 `Promise<dataURL>`。`opts`：`mode: 'page'|'layer'`、`filename`、`download: false` 时仅返回不下载 |
| `getData()` / `loadData(data)` | 获取 / 载入标注矢量数据（JSON，可持久化） |
| `on(type, fn)` / `off(type, fn)` | 事件：`change` / `enable` / `disable` / `toolchange` / `toolbardirectionchange` / `fabvisibilitychange` |
| `destroy()` | 销毁实例，移除全部 DOM 与事件监听 |

## 自建 UI 示例

```js
const wp = new WebPaint({ toolbar: false });
wp.enable();
myPenBtn.onclick    = () => wp.setTool('pen');
myColorInput.oninput = e => wp.setColor(e.target.value);
myUndoBtn.onclick   = () => wp.undo();
mySaveBtn.onclick   = () => wp.exportImage({ filename: 'note.png' });
wp.on('change', () => myUndoBtn.disabled = !wp.canUndo());
```

## 设计说明

- **矢量对象模型**：所有绘制内容以对象（笔迹点集 / 图形端点 / 文字）存储，重绘无损，撤销重做即对象列表增删。
- **画布铺满文档**：画布 `position:absolute` 覆盖整个文档（非视口），页面滚动后标注仍与内容对齐；`ResizeObserver` 监听内容高度变化自动扩展。
- **高清适配**：按 `devicePixelRatio` 缩放画布像素，Retina 屏笔迹清晰。
- **导出降级**：整页导出依赖 html2canvas（CDN 按需加载），加载失败时自动降级为导出透明标注层 PNG。

## 浏览器兼容

Chrome / Edge / Firefox / Safari 现代版本（依赖 Pointer Events 与 Canvas 2D）。

## 项目结构

```
web-paint/
├── webpaint.js          # 插件核心（单文件零依赖，唯一来源）
├── demo/
│   └── index.html       # 可运行的演示页面
├── extension/           # Chrome / Edge 浏览器扩展（自包含）
│   ├── manifest.json
│   ├── background.js
│   ├── content.js
│   ├── webpaint.js      # 由根目录同步的副本（node tools/sync.js）
│   ├── README.md        # 扩展安装与使用说明
│   └── icons/           # 16 / 32 / 48 / 128 px 图标
├── tools/
│   ├── gen-icons.js     # 生成扩展图标（纯 Node，无依赖）
│   └── sync.js          # 同步根目录 webpaint.js → extension/
├── LICENSE              # MIT
└── CHANGELOG.md
```

- 插件核心的唯一来源是根目录 `webpaint.js`；扩展目录里的 `webpaint.js` 是其副本，修改核心后运行 `node tools/sync.js` 同步。
- 扩展图标由 `node tools/gen-icons.js` 生成。

## 浏览器扩展版（在任意网页上标注）

如果你希望**不改动目标网页源码**，就能在第三方网站（知乎、文档、博客、内网系统等）上绘画标注，请使用 `extension/` 目录下的浏览器扩展。它也是大多数用户最推荐的使用方式。

### 安装（Chrome / Edge 通用，约 30 秒）

1. 打开扩展管理页：Chrome 访问 `chrome://extensions/`，Edge 访问 `edge://extensions/`
2. 打开右上角的 **「开发者模式」** 开关
3. 点击 **「加载已解压的扩展程序」**，选择本项目里的 `extension/` 文件夹
4. 浏览器工具栏出现蓝紫笔刷图标 🖌，安装完成

> 不想从源码加载？在 GitHub Release 页面下载 `web-paint-extension-v1.0.0.zip`，解压后加载解压出来的 `extension/` 文件夹即可，效果完全一致。

### 使用

1. 打开任意你想标注的网页
2. 点击工具栏的 🖌 图标 → 页面右侧出现工具栏，进入**标注模式**
3. 直接在页面上按住拖动即可绘制；选「文字」工具后点击任意位置会弹出输入框，**回车落笔**，`Esc` 取消
4. 工具栏上的 💾 按钮：**一键截图保存**含标注的内容（浏览器原生截图，不联网）
5. **再点一次图标** → 回到浏览模式（标注仍然可见，页面交互恢复正常）
6. **再点一次** → 回到标注模式继续画

### 快捷键与技巧

- `Ctrl+Z` 撤销，`Ctrl+Y`（或 `Ctrl+Shift+Z`）重做
- 按住工具栏顶部的 ⠿ 手柄可把工具栏拖到屏幕任意位置（自动限制在当前视口内）
- 工具栏上的方向按钮可一键切换纵向 / 横向展开；也支持 API `wp.setToolbarDirection('horizontal')`
- 右下角蓝色悬浮球可按住拖动到任意位置，松开后保持停留；点击则进入标注模式
- 悬停悬浮球右上角出现的 × 可隐藏它，整页截图不再被遮挡；需要时调用 `wp.showFab()` 重新显示
- 移动端工具栏会自动切换为底部横排，支持触屏绘制

### 隐私与安全

- 完全本地运行，**标注内容不上传任何服务器**
- 使用浏览器原生 `captureVisibleTab` 截图，无需加载 html2canvas / CDN，不受目标页 CSP 限制，连内网/银行类禁 CDN 的页面也能截图
- Chrome 网上应用店、`chrome://` 等受保护页面会自动跳过，不会报错

### 二次开发

```bash
node tools/gen-icons.js   # 重新生成扩展图标（输出到 extension/icons/）
node tools/sync.js        # 修改根目录 webpaint.js 后，一键同步到 extension/
```

> 扩展的详细结构与安装说明另见 `extension/README.md`。

