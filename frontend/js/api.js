const API_BASE = '/api';

const api = {
    async request(url, options = {}) {
        const config = {
            headers: { 'Content-Type': 'application/json' },
            ...options
        };
        if (config.body && typeof config.body === 'object') {
            config.body = JSON.stringify(config.body);
        }
        const res = await fetch(`${API_BASE}${url}`, config);
        if (!res.ok) {
            const err = await res.json().catch(() => ({ detail: 'خطای سرور' }));
            throw new Error(err.detail || 'خطا در ارتباط با سرور');
        }
        if (res.headers.get('content-type')?.includes('text/csv') ||
            res.headers.get('content-type')?.includes('application/json')) {
            const disposition = res.headers.get('content-disposition');
            if (disposition) return res;
        }
        return res.json();
    },

    get(url) { return this.request(url); },
    post(url, data) { return this.request(url, { method: 'POST', body: data }); },
    put(url, data) { return this.request(url, { method: 'PUT', body: data }); },
    del(url) { return this.request(url, { method: 'DELETE' }); },

    async downloadFile(url, filename) {
        const res = await fetch(`${API_BASE}${url}`);
        const blob = await res.blob();
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        a.click();
        URL.revokeObjectURL(a.href);
    }
};

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const icons = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' };
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span>${icons[type]}</span> ${message}`;
    container.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 3500);
}

function showModal(title, content, footer = '') {
    const container = document.getElementById('modal-container');
    container.innerHTML = `
        <div class="modal-overlay" onclick="closeModal(event)">
            <div class="modal" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="modal-close" onclick="closeModal()">&#10005;</button>
                </div>
                <div class="modal-body">${content}</div>
                ${footer ? `<div class="modal-footer">${footer}</div>` : ''}
            </div>
        </div>`;
}

function closeModal(e) {
    if (e && e.target && !e.target.classList.contains('modal-overlay')) return;
    document.getElementById('modal-container').innerHTML = '';
}

function showConfirm(message, onConfirm) {
    showModal('تأیید حذف', `
        <div class="confirm-dialog">
            <div class="confirm-icon">⚠</div>
            <h4>آیا مطمئن هستید؟</h4>
            <p>${message}</p>
            <div class="confirm-actions">
                <button class="btn btn-danger" onclick="(${onConfirm})(); closeModal();">بله، حذف شود</button>
                <button class="btn btn-outline" onclick="closeModal()">انصراف</button>
            </div>
        </div>
    `);
}

function formatDate(dt) {
    if (!dt) return '-';
    const d = new Date(dt);
    return d.toLocaleDateString('fa-IR') + ' ' + d.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
}
