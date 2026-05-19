// ========================================
// 信息公示平台 - 核心脚本
// ========================================

(function() {
    'use strict';

    // -------- 工具函数 --------
    const $ = (sel, ctx) => (ctx || document).querySelector(sel);
    const $$ = (sel, ctx) => [...(ctx || document).querySelectorAll(sel)];

    // 当前状态
    let currentCategory = '全部';
    let currentSearch = '';
    let currentPage = 1;
    const PER_PAGE = 10;

    // -------- 页面初始化 --------
    function init() {
        applySiteConfig();
        renderCategoryNav();
        bindSearch();
        bindCategoryClicks();
        renderNotices();
        bindPageNav();
    }

    // 应用网站配置
    function applySiteConfig() {
        document.title = SITE_CONFIG.siteName;
        const nameEl = $('.site-title');
        const descEl = $('.site-subtitle');
        const copyEl = $('.footer-copyright');
        const icpEl = $('.footer-icp');
        if (nameEl) nameEl.textContent = SITE_CONFIG.siteName;
        if (descEl) descEl.textContent = SITE_CONFIG.siteDesc;
        if (copyEl) copyEl.textContent = `© ${new Date().getFullYear()} ${SITE_CONFIG.copyright}`;
        if (icpEl) icpEl.textContent = SITE_CONFIG.icp || '';
    }

    // 渲染分类标签
    function renderCategoryNav() {
        const nav = $('.category-nav');
        if (!nav) return;
        const cats = SITE_CONFIG.categories || CATEGORIES;
        nav.innerHTML = cats.map(c =>
            `<span class="category-tag${c === currentCategory ? ' active' : ''}" data-category="${c}">${c}</span>`
        ).join('');
    }

    // 绑定搜索事件
    function bindSearch() {
        const input = $('.search-input');
        const btn = $('.search-btn');
        const clear = $('.search-clear');
        if (!input) return;

        input.addEventListener('input', () => {
            if (clear) clear.classList.toggle('visible', input.value.length > 0);
        });

        if (clear) {
            clear.addEventListener('click', () => {
                input.value = '';
                clear.classList.remove('visible');
                currentSearch = '';
                currentPage = 1;
                renderNotices();
                input.focus();
            });
        }

        if (btn) {
            btn.addEventListener('click', () => {
                currentSearch = input.value.trim();
                currentPage = 1;
                renderNotices();
            });
        }

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                currentSearch = input.value.trim();
                currentPage = 1;
                renderNotices();
            }
        });
    }

    // 绑定分类点击
    function bindCategoryClicks() {
        const nav = $('.category-nav');
        if (!nav) return;
        nav.addEventListener('click', (e) => {
            const tag = e.target.closest('.category-tag');
            if (!tag) return;
            currentCategory = tag.dataset.category;
            currentPage = 1;
            renderCategoryNav();
            renderNotices();
        });
    }

    // 绑定页面导航（首页/关于）
    function bindPageNav() {
        const navLinks = $$('.header-nav a');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                if (!href || href === '#') {
                    e.preventDefault();
                    showHome();
                } else if (href === '#about') {
                    e.preventDefault();
                    showAbout();
                } else if (href === 'index.html' || href === './' || href === '/') {
                    e.preventDefault();
                    showHome();
                }
            });
        });
    }

    // -------- 渲染公告列表 --------
    function renderNotices() {
        const container = $('.notice-container');
        const resultInfo = $('.result-info span');
        if (!container) return;

        // 过滤
        let filtered = [...NOTICES];
        if (currentCategory !== '全部') {
            filtered = filtered.filter(n => n.category === currentCategory);
        }
        if (currentSearch) {
            const kw = currentSearch.toLowerCase();
            filtered = filtered.filter(n =>
                n.title.toLowerCase().includes(kw) ||
                n.summary.toLowerCase().includes(kw) ||
                n.category.toLowerCase().includes(kw) ||
                (n.author && n.author.toLowerCase().includes(kw))
            );
        }

        // 排序：置顶优先，然后按日期倒序
        filtered.sort((a, b) => {
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            return b.date.localeCompare(a.date);
        });

        if (resultInfo) {
            resultInfo.textContent = `共找到 ${filtered.length} 条信息`;
        }

        // 分页
        const totalPages = Math.ceil(filtered.length / PER_PAGE) || 1;
        if (currentPage > totalPages) currentPage = totalPages;
        const start = (currentPage - 1) * PER_PAGE;
        const pageItems = filtered.slice(start, start + PER_PAGE);

        if (pageItems.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="background:#fff;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,.08);">
                    <div class="empty-state-icon">📭</div>
                    <div class="empty-state-text">没有找到相关信息</div>
                </div>`;
            renderPagination(0, 0);
            return;
        }

        container.innerHTML = `<div class="notice-list">${pageItems.map(item => renderNoticeItem(item)).join('')}</div>`;

        renderPagination(totalPages, filtered.length);

        // 绑定点击事件
        $$('.notice-item', container).forEach(el => {
            el.addEventListener('click', () => {
                const id = parseInt(el.dataset.id);
                showDetail(id);
            });
        });
    }

    function renderNoticeItem(item) {
        const dateParts = item.date.split('-');
        const monthDay = `${parseInt(dateParts[1])}月${parseInt(dateParts[2])}日`;
        return `
            <div class="notice-item${item.pinned ? ' pinned' : ''}" data-id="${item.id}">
                ${item.pinned ? '<span class="pin-badge">置顶</span>' : ''}
                <div class="notice-date-col">
                    <div class="notice-date-day">${dateParts[2]}</div>
                    <div class="notice-date-month">${dateParts[0]}/${dateParts[1]}</div>
                </div>
                <div class="notice-content-col">
                    <div class="notice-title">${escapeHtml(item.title)}</div>
                    <div class="notice-summary">${escapeHtml(item.summary)}</div>
                    <div class="notice-meta">
                        <span class="notice-category-tag">${escapeHtml(item.category)}</span>
                        <span>📅 ${item.date}</span>
                        <span>🏢 ${escapeHtml(item.author || '')}</span>
                    </div>
                </div>
            </div>`;
    }

    // -------- 分页 --------
    function renderPagination(totalPages, totalItems) {
        const paginationEl = $('.pagination');
        if (!paginationEl) return;
        if (totalPages <= 1) {
            paginationEl.innerHTML = '';
            return;
        }

        let html = '';
        html += `<button class="page-btn" ${currentPage <= 1 ? 'disabled' : ''} data-page="${currentPage - 1}">« 上一页</button>`;

        for (let i = 1; i <= totalPages; i++) {
            if (totalPages <= 7 || i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
                html += `<button class="page-btn${i === currentPage ? ' active' : ''}" data-page="${i}">${i}</button>`;
            } else if (i === currentPage - 2 || i === currentPage + 2) {
                html += `<span style="padding:8px 4px;color:#9ca3af;">...</span>`;
            }
        }

        html += `<button class="page-btn" ${currentPage >= totalPages ? 'disabled' : ''} data-page="${currentPage + 1}">下一页 »</button>`;

        paginationEl.innerHTML = html;

        // 绑定分页点击
        $$('.page-btn', paginationEl).forEach(btn => {
            btn.addEventListener('click', () => {
                if (btn.disabled) return;
                currentPage = parseInt(btn.dataset.page);
                renderNotices();
                $('.main-container').scrollIntoView({ behavior: 'smooth' });
            });
        });
    }

    // -------- 详情页 --------
    function showDetail(id) {
        const notice = NOTICES.find(n => n.id === id);
        if (!notice) return;

        const main = $('.main-container');

        // 附件 HTML
        const attachmentsHtml = notice.attachments && notice.attachments.length
            ? `<div class="detail-section">
                <h3>📎 附件下载</h3>
                <div class="attachment-list">
                    ${notice.attachments.map(a => `
                        <a class="attachment-item" href="${escapeHtml(a.url)}" target="_blank" download>
                            <span class="attachment-icon">${getFileIcon(a.name, a.type)}</span>
                            <span class="attachment-name">${escapeHtml(a.name)}</span>
                            <span class="attachment-action">下载</span>
                        </a>
                    `).join('')}
                </div>
            </div>` : '';

        // 相关链接 HTML
        const linksHtml = notice.links && notice.links.length
            ? `<div class="detail-section">
                <h3>🔗 相关链接</h3>
                <div class="link-list">
                    ${notice.links.map(l => `
                        <a class="link-item" href="${escapeHtml(l.url)}" target="_blank" rel="noopener">
                            <span>${escapeHtml(l.title)}</span>
                            <span class="link-arrow">↗</span>
                        </a>
                    `).join('')}
                </div>
            </div>` : '';

        // 上传文件 / 联系管理员
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const uploadHtml = isLocal ? `
            <div class="detail-section">
                <h3>📤 上传文件</h3>
                <div class="upload-area" id="uploadArea">
                    <div class="upload-dropzone">
                        <span class="upload-icon">📂</span>
                        <p>点击或拖拽文件到这里上传</p>
                        <p class="upload-hint">支持 Word、Excel、PDF、图片等格式</p>
                    </div>
                    <input type="file" id="uploadFileInput" multiple accept="*/*" style="display:none;">
                </div>
                <div class="upload-progress" id="uploadProgress" style="display:none;">
                    <span class="upload-progress-text"></span>
                    <div class="upload-progress-bar"><div class="upload-progress-fill"></div></div>
                </div>
            </div>` : `
            <div class="detail-section">
                <h3>📤 附件说明</h3>
                <div class="upload-dropzone" style="border-style:solid;">
                    <span class="upload-icon">📧</span>
                    <p>如需添加附件或文件，请联系管理员上传</p>
                </div>
            </div>`;

        main.innerHTML = `
            <div class="detail-page">
                <button class="detail-back" onclick="window.showHome()">← 返回列表</button>
                <div class="detail-header">
                    <h1 class="detail-title">${escapeHtml(notice.title)}</h1>
                    <div class="detail-meta">
                        <span>📅 发布日期：${notice.date}</span>
                        <span class="notice-category-tag">${escapeHtml(notice.category)}</span>
                        <span>🏢 ${escapeHtml(notice.author || '')}</span>
                    </div>
                </div>
                <div class="detail-content">
                    ${notice.content}
                </div>
                ${attachmentsHtml}
                ${linksHtml}
                ${uploadHtml}
            </div>`;

        // 绑定上传事件（仅本地环境）
        if (isLocal) bindUpload(notice.id);

        // 隐藏搜索和分类
        $('.search-bar').style.display = 'none';
        $('.category-nav').style.display = 'none';
        $('.result-info').style.display = 'none';
        $('.pagination').innerHTML = '';

        window.scrollTo({ top: 0, behavior: 'smooth' });

        // 暴露返回函数
        window.showHome = showHome;
    }

    function getFileIcon(filename, type) {
        const ext = (filename || '').split('.').pop().toLowerCase();
        const map = {
            pdf: '📄', doc: '📝', docx: '📝', xls: '📊', xlsx: '📊',
            ppt: '📽', pptx: '📽', jpg: '🖼', jpeg: '🖼', png: '🖼',
            gif: '🖼', webp: '🖼', zip: '📦', rar: '📦', '7z': '📦',
            txt: '📃', mp4: '🎬', mp3: '🎵'
        };
        return map[ext] || map[type] || '📎';
    }

    function bindUpload(noticeId) {
        const area = $('#uploadArea');
        const input = $('#uploadFileInput');
        const progress = $('#uploadProgress');

        if (!area || !input) return;

        // 点击上传区域
        area.addEventListener('click', () => input.click());

        // 选择文件
        input.addEventListener('change', () => {
            if (input.files.length) uploadFiles(input.files, progress);
        });

        // 拖拽上传
        area.addEventListener('dragover', (e) => { e.preventDefault(); area.classList.add('dragover'); });
        area.addEventListener('dragleave', () => area.classList.remove('dragover'));
        area.addEventListener('drop', (e) => {
            e.preventDefault();
            area.classList.remove('dragover');
            if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files, progress);
        });
    }

    async function uploadFiles(files, progressEl) {
        const formData = new FormData();
        for (const f of files) {
            formData.append('files', f);
        }

        progressEl.style.display = 'block';
        $('.upload-progress-text', progressEl).textContent = `正在上传 ${files.length} 个文件...`;

        try {
            const resp = await fetch('/api/upload', { method: 'POST', body: formData });
            const data = await resp.json();

            if (data.ok) {
                $('.upload-progress-text', progressEl).textContent = `✅ 上传成功！${data.files.length} 个文件`;
                setTimeout(() => { progressEl.style.display = 'none'; }, 3000);
            } else {
                $('.upload-progress-text', progressEl).textContent = `❌ 上传失败: ${data.error}`;
            }
        } catch (err) {
            $('.upload-progress-text', progressEl).textContent = `❌ 网络错误: ${err.message}`;
        }
    }

    function showHome() {
        const main = $('.main-container');
        main.innerHTML = `<div class="notice-container"></div>`;
        $('.search-bar').style.display = '';
        $('.category-nav').style.display = '';
        $('.result-info').style.display = '';
        $('.pagination').innerHTML = '';

        init();
    }

    window.showHome = showHome;

    // -------- 关于页面 --------
    function showAbout() {
        const main = $('.main-container');
        main.innerHTML = `
            <div class="about-page">
                <h2>关于我们</h2>
                <div class="about-card">
                    <h3>平台简介</h3>
                    <p>${SITE_CONFIG.siteName}是面向公众的官方信息发布平台，致力于推进信息公开工作，保障公众的知情权、参与权和监督权。</p>
                </div>
                <div class="about-card">
                    <h3>服务内容</h3>
                    <p>本平台主要发布以下类型信息：</p>
                    <p>1. 通知公告：重要事项的通知和公告信息；</p>
                    <p>2. 政策法规：相关的政策和法律法规信息；</p>
                    <p>3. 办事指南：各项业务的办理流程和指南；</p>
                    <p>4. 结果公示：各类审批、评选结果的公开公示。</p>
                </div>
                <div class="about-card">
                    <h3>联系我们</h3>
                    <p>如您对本平台有任何意见或建议，欢迎通过以下方式联系我们：</p>
                    <p>📧 电子邮箱：example@example.com</p>
                    <p>📞 联系电话：XXX-XXXXXXX</p>
                    <p>📍 地址：待补充</p>
                </div>
            </div>`;

        $('.search-bar').style.display = 'none';
        $('.category-nav').style.display = 'none';
        $('.result-info').style.display = 'none';
        $('.pagination').innerHTML = '';
    }

    window.showAbout = showAbout;

    // -------- 工具 --------
    function escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // 启动
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
