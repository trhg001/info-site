// ========================================
// 智能问答机器人（直连版 - 适用于静态部署）
// ========================================
(function() {
    'use strict';

    let panelVisible = false;
    let isProcessing = false;
    // API Key 从 data.js 读取，如果未配置则提示用户
    const API_KEY = (typeof SITE_CONFIG !== 'undefined' && SITE_CONFIG.agent && SITE_CONFIG.agent.apiKey) || '';
    const API_URL = 'https://api.deepseek.com/v1/chat/completions';

    const SYSTEM_PROMPT = `你是信息公示平台的智能客服助手。你的职责是：
1. 回答用户关于信息公示平台的各类问题
2. 帮助用户查找和理解公示信息
3. 引导用户使用平台的功能（搜索、分类浏览等）
4. 态度友好、专业、准确

关于本平台：
- 这是一个信息公示平台，发布通知公告、政策法规、办事指南、结果公示等内容
- 用户可以通过分类筛选和关键词搜索查找信息
- 支持查看附件、相关链接等功能

如果用户问的问题你无法回答（超出平台范围），请礼貌地说明并建议用户联系相关部门。`;

    function init() {
        const toggle = document.getElementById('agentToggle');
        const panel = document.getElementById('agentPanel');
        const close = document.getElementById('agentClose');
        const minimize = document.getElementById('agentMinimize');
        const send = document.getElementById('agentSend');
        const input = document.getElementById('agentInput');

        if (!toggle || !panel) return;

        toggle.addEventListener('click', () => {
            panelVisible = !panelVisible;
            panel.classList.toggle('open', panelVisible);
            if (panelVisible) input.focus();
        });

        close.addEventListener('click', () => {
            panelVisible = false;
            panel.classList.remove('open');
        });

        minimize.addEventListener('click', () => {
            panelVisible = false;
            panel.classList.remove('open');
        });

        send.addEventListener('click', sendMessage);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });

        input.addEventListener('input', () => {
            input.style.height = 'auto';
            input.style.height = Math.min(input.scrollHeight, 120) + 'px';
        });
    }

    async function sendMessage() {
        const input = document.getElementById('agentInput');
        const text = input.value.trim();
        if (!text || isProcessing) return;

        if (!API_KEY) {
            addMessage('bot', '智能问答功能尚未配置 API Key。请在 data.js 中设置 SITE_CONFIG.agent.apiKey，或联系管理员。');
            return;
        }

        input.value = '';
        input.style.height = 'auto';
        isProcessing = true;

        addMessage('user', text);
        addTyping();

        try {
            const resp = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${API_KEY}`
                },
                body: JSON.stringify({
                    model: 'deepseek-chat',
                    messages: [
                        { role: 'system', content: SYSTEM_PROMPT },
                        { role: 'user', content: text }
                    ]
                })
            });

            removeTyping();
            const data = await resp.json();

            if (data.choices && data.choices[0]) {
                addMessage('bot', data.choices[0].message.content);
            } else if (data.error) {
                addMessage('bot', '抱歉，智能助手暂时无法响应（' + data.error.message + '）。请稍后再试。');
            } else {
                addMessage('bot', '抱歉，智能助手暂时无法响应，请稍后再试。');
            }
        } catch (err) {
            removeTyping();
            addMessage('bot', '抱歉，网络连接异常，请稍后再试或通过其他方式联系我们。');
        }

        isProcessing = false;
    }

    function addMessage(role, content) {
        const container = document.getElementById('agentMessages');
        if (!container) return;

        const div = document.createElement('div');
        div.className = `agent-msg ${role}`;
        div.innerHTML = `<div class="agent-msg-content">${formatContent(content)}</div>`;
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
    }

    function addTyping() {
        const container = document.getElementById('agentMessages');
        if (!container) return;
        const div = document.createElement('div');
        div.className = 'agent-msg bot typing';
        div.id = 'typingIndicator';
        div.innerHTML = '<div class="agent-msg-content"><span class="typing-dot">●</span><span class="typing-dot">●</span><span class="typing-dot">●</span></div>';
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
    }

    function removeTyping() {
        const el = document.getElementById('typingIndicator');
        if (el) el.remove();
    }

    function formatContent(text) {
        if (!text) return '';
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\n/g, '<br>')
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
