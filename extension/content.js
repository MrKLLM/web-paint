/* WebPaint 扩展 - 内容脚本
 * 首次点击图标：创建插件实例并进入标注模式（弹出导航栏）
 * 再次点击图标：直接重新开启标注模式（始终弹出导航栏，不再停留在悬浮球）
 * 退出标注请用导航栏上的「退出标注」按钮；悬浮球仅作为浏览模式下的快捷入口
 * 导出改用浏览器原生截图（captureVisibleTab），无需 CDN、不受页面 CSP 限制
 */
(function () {
  'use strict';

  // 已注入过 → 点击图标直接开启标注（弹出导航栏）
  if (window.__wpInstance) {
    // 点击图标 = 明确要再次使用插件：先重置悬浮球隐藏状态，
    // 这样退出标注回到浏览模式时悬浮球会重新出现（无需刷新浏览器）
    window.__wpInstance.showFab();
    window.__wpInstance.enable();
    return;
  }

  var wp = new WebPaint({
    toolbar: true,
    autoEnable: false
  });
  window.__wpInstance = wp;

  // 覆盖导出逻辑：隐藏工具栏 → 请求后台截图（含标注层）→ 恢复工具栏
  wp.exportImage = function () {
    var ui = document.querySelectorAll('.wp-toolbar, .wp-fab');
    ui.forEach(function (n) { n.style.visibility = 'hidden'; });
    return new Promise(function (resolve) {
      // 等一帧确保工具栏已从画面消失
      setTimeout(function () {
        try {
          chrome.runtime.sendMessage({ type: 'wp-capture' }, function (res) {
            ui.forEach(function (n) { n.style.visibility = ''; });
            if (res && res.ok) {
              wp._toast('已保存截图（含标注）✔', 1800);
            } else {
              wp._toast('截图失败：' + ((res && res.error) || '未知错误'), 2500);
            }
            resolve(res);
          });
        } catch (e) {
          ui.forEach(function (n) { n.style.visibility = ''; });
          wp._toast('截图失败，请重试', 2000);
          resolve(null);
        }
      }, 150);
    });
  };

  wp.enable();
  wp._toast('WebPaint 已开启，点导航栏「退出标注」可回到浏览模式', 2600);
})();
