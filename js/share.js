// ========================================
// 分享功能 —— 二维码弹窗
// ========================================
(function() {
    'use strict';
    let qrGenerated = false;

    function initShare() {
        const fab = document.querySelector('.share-fab');
        const overlay = document.querySelector('.qr-overlay');
        const closeBtn = document.querySelector('.qr-close');
        const qrContainer = document.getElementById('qrcode');
        const qrUrl = document.getElementById('qrUrl');

        if (!fab || !overlay) return;

        fab.addEventListener('click', () => {
            overlay.classList.add('show');
            if (!qrGenerated) { generateQR(qrContainer, qrUrl); qrGenerated = true; }
        });

        closeBtn.addEventListener('click', () => overlay.classList.remove('show'));
        overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.classList.remove('show'); });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && overlay.classList.contains('show')) overlay.classList.remove('show');
        });
    }

    function generateQR(container, urlEl) {
        let url = window.location.origin + window.location.pathname;
        // 去掉 index.html
        url = url.replace(/\/index\.html$/, '/').replace(/\/$/, '') || url;
        // 如果是 localhost ，提示用局域网地址
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            url = 'http://192.168.1.254:' + (window.location.port || '80') + window.location.pathname;
        }

        if (urlEl) urlEl.textContent = url;

        if (typeof QRCode !== 'undefined') {
            new QRCode(container, {
                text: url, width: 200, height: 200,
                colorDark: '#1f2937', colorLight: '#ffffff',
                correctLevel: QRCode.CorrectLevel.M
            });
            const img = container.querySelector('img');
            if (img) img.removeAttribute('title');
        } else {
            container.innerHTML = `<div style="padding:20px;font-size:14px;">网站地址：<br><strong style="word-break:break-all;">${url}</strong></div>`;
        }
    }

    window.copyQrUrl = function() {
        let url = window.location.origin + window.location.pathname;
        url = url.replace(/\/index\.html$/, '/');
        const btn = document.querySelector('.qr-copy-btn');
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(url).then(() => showCopied(btn)).catch(() => fallbackCopy(url, btn));
        } else { fallbackCopy(url, btn); }
    };

    function fallbackCopy(text, btn) {
        const ta = document.createElement('textarea');
        ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); showCopied(btn); } catch (e) { alert('链接：' + text); }
        document.body.removeChild(ta);
    }

    function showCopied(btn) {
        if (!btn) return;
        const orig = btn.textContent; btn.textContent = '✅ 已复制'; btn.classList.add('copied');
        setTimeout(() => { btn.textContent = orig; btn.classList.remove('copied'); }, 2000);
    }

    if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', initShare); }
    else { initShare(); }
})();
