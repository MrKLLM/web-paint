/* WebPaint 扩展 - 内容脚本
 * 首次点击图标：创建插件实例并进入标注模式
 * 再次点击图标：在「标注 / 浏览」之间切换
 * 导出改用浏览器原生截图（captureVisibleTab），无需 CDN、不受页面 CSP 限制
 */
(function () {
  'use strict';

  // 已注入过 → 切换标注模式
  if (window.__wpInstance) {
    window.__wpInstance.toggle();
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
  wp._toast('WebPaint 已开启，再次点击扩展图标可切换标注/浏览', 2600);
})();
