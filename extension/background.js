/* WebPaint 扩展 - 后台脚本
 * 1. 点击工具栏图标：向当前页面注入插件并开启/切换标注模式
 * 2. 接收内容脚本的截图请求：captureVisibleTab 截取可视区域并下载
 */

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab || !tab.id) return;
  var url = tab.url || '';
  // 浏览器内部页面无法注入
  if (/^(chrome|edge|about|chrome-extension|edge-extension|devtools|view-source):/i.test(url) ||
      /chrome\.google\.com\/webstore|microsoftedge\.microsoft\.com\/addons/i.test(url)) {
    return;
  }
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['webpaint.js', 'content.js']
    });
  } catch (e) {
    console.warn('[WebPaint] 注入失败：', e);
  }
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === 'wp-capture' && sender.tab) {
    chrome.tabs.captureVisibleTab(sender.tab.windowId, { format: 'png' }, (dataUrl) => {
      if (chrome.runtime.lastError || !dataUrl) {
        sendResponse({ ok: false, error: chrome.runtime.lastError && chrome.runtime.lastError.message });
        return;
      }
      chrome.downloads.download({
        url: dataUrl,
        filename: 'webpaint-' + Date.now() + '.png',
        saveAs: false
      });
      sendResponse({ ok: true });
    });
    return true; // 异步 sendResponse
  }
});
