const status = document.querySelector('#offline-status');
const show = text => { if (status) status.textContent = text; };
if ('serviceWorker' in navigator) {
  try {
    await navigator.serviceWorker.register('./sw.js', { scope: './', updateViaCache: 'none' });
    await navigator.serviceWorker.ready;
    const update = () => show(navigator.onLine
      ? '已可離線練習。考選部原始試題連結仍需網路連線。'
      : '目前離線，仍可練習已下載的題庫。');
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
  } catch {
    show('目前無法準備離線題庫；保持網路連線仍可正常練習。');
  }
} else {
  show('請保持網路連線進行練習。');
}
