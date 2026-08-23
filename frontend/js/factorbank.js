let currentFactorBank = [];
let selectedCategory = 'all';
let factorBankSearch = '';
let selectedFactorIds = new Set();

function renderFactorCategories() {
    const categories = [...new Set(factorBankData.map(f => f.category))];
    const container = document.getElementById('factor-category-filters');
    if (!container) return;
    container.innerHTML = `
        <span class="filter-chip ${selectedCategory === 'all' ? 'active' : ''}" onclick="filterFactorByCategory('all', this)">همه</span>
        ${categories.map(c => `
            <span class="filter-chip ${selectedCategory === c ? 'active' : ''}" onclick="filterFactorByCategory('${c}', this)">${c}</span>
        `).join('')}
    `;
}

function filterFactorByCategory(cat, el) {
    selectedCategory = cat;
    document.querySelectorAll('#factor-category-filters .filter-chip').forEach(c => c.classList.remove('active'));
    if (el) el.classList.add('active');
    renderFactorBankList();
}

function filterFactorBank(q) {
    factorBankSearch = q;
    renderFactorBankList();
}

function renderFactorBankList() {
    const container = document.getElementById('factor-bank-list');
    if (!container) return;

    let filtered = factorBankData;
    if (selectedCategory !== 'all') {
        filtered = filtered.filter(f => f.category === selectedCategory);
    }
    if (factorBankSearch) {
        const q = factorBankSearch.toLowerCase();
        filtered = filtered.filter(f =>
            f.title.toLowerCase().includes(q) ||
            f.short_description.toLowerCase().includes(q) ||
            (f.tags || '').toLowerCase().includes(q)
        );
    }

    currentFactorBank = filtered;

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">&#128269;</div>
                <h4>عاملی یافت نشد</h4>
            </div>`;
        return;
    }

    container.innerHTML = filtered.map(f => `
        <div class="factor-card">
            <div class="factor-card-header">
                <span class="factor-card-title">${f.title}</span>
                <span class="factor-card-category">${f.category}</span>
            </div>
            <div class="factor-card-desc">${f.short_description}</div>
            ${f.why_important ? `<div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 6px;"><strong>چرایی اهمیت:</strong> ${f.why_important}</div>` : ''}
            <div class="factor-card-source">&#128196; ${f.source_label || f.source_ref || ''}</div>
            <div class="factor-card-actions">
                <button class="btn btn-sm btn-primary" onclick="addFactorFromBank('${f.title.replace(/'/g, "\\'")}', '${(f.short_description || '').replace(/'/g, "\\'")}', '${(f.source_label || '').replace(/'/g, "\\'")}')">&#10010; افزودن به پاسخ</button>
                <button class="btn btn-sm btn-outline" onclick="copyFactorToField('${f.title.replace(/'/g, "\\'")}')">&#128203; کپی</button>
            </div>
        </div>
    `).join('');
}

function copyFactorToField(title) {
    navigator.clipboard.writeText(title).then(() => {
        showToast('عنوان عامل کپی شد');
    }).catch(() => {
        showToast('خطا در کپی', 'error');
    });
}

async function loadFactorBank() {
    try {
        factorBankData = await api.get('/factor-bank');
        renderFactorBankPage();
    } catch (e) {
        showToast(e.message, 'error');
    }
}

function renderFactorBankPage() {
    const categories = [...new Set(factorBankData.map(f => f.category))];
    const container = document.getElementById('section-factorbank');
    container.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3>&#9733; فهرست پیشنهادی عوامل مرجع (${factorBankData.length})</h3>
                <div style="display: flex; gap: 8px; align-items: center;">
                    ${selectedFactorIds.size > 0 ? `
                        <span class="bulk-count">${selectedFactorIds.size} مورد انتخاب شده</span>
                        <button class="btn btn-danger btn-sm" onclick="bulkDeleteFactors()">&#10005; حذف انتخاب‌شده</button>
                        <button class="btn btn-outline btn-sm" onclick="clearFactorSelection()">انصراف</button>
                    ` : ''}
                    <button class="btn btn-primary" onclick="showAddFactorForm()">+ عامل جدید</button>
                </div>
            </div>
            <div class="card-body">
                <div class="search-box">
                    <input type="text" placeholder="جست‌وجو در عوامل..." oninput="searchFactorBankPage(this.value)" id="factor-bank-page-search">
                    <span class="search-icon">&#128269;</span>
                </div>
                <div class="filter-chips" id="fb-page-filters">
                    <span class="filter-chip active" onclick="filterFBPage('all', this)">همه</span>
                    ${categories.map(c => `<span class="filter-chip" onclick="filterFBPage('${c}', this)">${c}</span>`).join('')}
                </div>
                <div id="fb-page-list"></div>
            </div>
        </div>`;

    renderFBPageList();
}

let fbPageCategory = 'all';
let fbPageSearch = '';

function filterFBPage(cat, el) {
    fbPageCategory = cat;
    document.querySelectorAll('#fb-page-filters .filter-chip').forEach(c => c.classList.remove('active'));
    if (el) el.classList.add('active');
    renderFBPageList();
}

function searchFactorBankPage(q) {
    fbPageSearch = q;
    renderFBPageList();
}

function renderFBPageList() {
    const container = document.getElementById('fb-page-list');
    let filtered = factorBankData;
    if (fbPageCategory !== 'all') filtered = filtered.filter(f => f.category === fbPageCategory);
    if (fbPageSearch) {
        const q = fbPageSearch.toLowerCase();
        filtered = filtered.filter(f => f.title.toLowerCase().includes(q) || f.short_description.toLowerCase().includes(q) || (f.tags || '').toLowerCase().includes(q));
    }

    container.innerHTML = `
        <div class="table-wrapper">
            <table class="data-table">
                <thead>
                    <tr>
                        <th style="width: 40px;"><input type="checkbox" onchange="toggleAllFactors(this.checked)" ${selectedFactorIds.size === filtered.length && filtered.length > 0 ? 'checked' : ''}></th>
                        <th>#</th>
                        <th>عنوان عامل</th>
                        <th>دسته</th>
                        <th>توضیح کوتاه</th>
                        <th>منبع</th>
                        <th>عملیات</th>
                    </tr>
                </thead>
                <tbody>
                    ${filtered.map((f, i) => `
                        <tr class="${selectedFactorIds.has(f.bank_factor_id) ? 'row-selected' : ''}">
                            <td><input type="checkbox" ${selectedFactorIds.has(f.bank_factor_id) ? 'checked' : ''} onchange="toggleFactorSelection(${f.bank_factor_id}, this.checked)"></td>
                            <td>${i + 1}</td>
                            <td><strong>${f.title}</strong></td>
                            <td><span class="badge badge-primary">${f.category}</span></td>
                            <td style="max-width: 300px; font-size: 13px;">${f.short_description.substring(0, 100)}${f.short_description.length > 100 ? '...' : ''}</td>
                            <td style="font-size: 12px; color: var(--text-muted);">${f.source_label || '-'}</td>
                            <td>
                                <div style="display: flex; gap: 6px;">
                                    <button class="btn btn-sm btn-outline" onclick="showAddFactorForm(${f.bank_factor_id})">&#9998;</button>
                                    <button class="btn btn-sm btn-danger" onclick="confirmDeleteFactor(${f.bank_factor_id})">&#10005;</button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>`;
}

function showAddFactorForm(id = null) {
    const factor = id ? factorBankData.find(f => f.bank_factor_id === id) : null;
    const title = factor ? 'ویرایش عامل مرجع' : 'افزودن عامل مرجع جدید';

    showModal(title, `
        <form id="factorForm" onsubmit="saveFactor(event, ${id})">
            <div class="form-group">
                <label class="form-label"><span class="required">*</span> عنوان عامل</label>
                <input class="form-input" name="title" value="${factor?.title || ''}" required>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label"><span class="required">*</span> دسته‌بندی</label>
                    <select class="form-select" name="category" required>
                        <option value="">انتخاب کنید</option>
                        ${['زیرساخت و شبکه', 'بازار و تنظیم‌گری', 'اقتصادی و مالی', 'فنی و فناوری', 'راهبردی و رقابتی', 'منطقه‌ای و ژئوپلیتیکی'].map(c =>
                            `<option value="${c}" ${factor?.category === c ? 'selected' : ''}>${c}</option>`
                        ).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">برچسب‌ها</label>
                    <input class="form-input" name="tags" value="${factor?.tags || ''}" placeholder="با کاما جدا کنید">
                </div>
            </div>
            <div class="form-group">
                <label class="form-label"><span class="required">*</span> توضیح کوتاه</label>
                <textarea class="form-textarea" name="short_description" rows="3" required>${factor?.short_description || ''}</textarea>
            </div>
            <div class="form-group">
                <label class="form-label">چرایی اهمیت</label>
                <textarea class="form-textarea" name="why_important" rows="3">${factor?.why_important || ''}</textarea>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">زمینه</label>
                    <input class="form-input" name="context_note" value="${factor?.context_note || ''}">
                </div>
                <div class="form-group">
                    <label class="form-label">منبع</label>
                    <input class="form-input" name="source_label" value="${factor?.source_label || ''}">
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">مرجع</label>
                <input class="form-input" name="source_ref" value="${factor?.source_ref || ''}">
            </div>
        </form>
    `, `
        <button class="btn btn-primary" onclick="document.getElementById('factorForm').requestSubmit()">${factor ? 'ذخیره تغییرات' : 'افزودن عامل'}</button>
        <button class="btn btn-outline" onclick="closeModal()">انصراف</button>
    `);
}

async function saveFactor(e, id) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    try {
        if (id) {
            await api.put(`/factor-bank/${id}`, data);
            showToast('عامل با موفقیت بروزرسانی شد');
        } else {
            await api.post('/factor-bank', data);
            showToast('عامل با موفقیت افزوده شد');
        }
        closeModal();
        loadFactorBank();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

function confirmDeleteFactor(id) {
    showConfirm('آیا از حذف این عامل اطمینان دارید؟', async () => {
        try {
            await api.del(`/factor-bank/${id}`);
            showToast('عامل با موفقیت حذف شد');
            loadFactorBank();
        } catch (err) {
            showToast(err.message, 'error');
        }
    });
}

function toggleAllFactors(checked) {
    let filtered = factorBankData;
    if (fbPageCategory !== 'all') filtered = filtered.filter(f => f.category === fbPageCategory);
    if (fbPageSearch) {
        const q = fbPageSearch.toLowerCase();
        filtered = filtered.filter(f => f.title.toLowerCase().includes(q) || f.short_description.toLowerCase().includes(q) || (f.tags || '').toLowerCase().includes(q));
    }
    if (checked) {
        filtered.forEach(f => selectedFactorIds.add(f.bank_factor_id));
    } else {
        selectedFactorIds.clear();
    }
    renderFBPageList();
    renderFactorBankPage();
}

function toggleFactorSelection(id, checked) {
    if (checked) {
        selectedFactorIds.add(id);
    } else {
        selectedFactorIds.delete(id);
    }
    renderFBPageList();
    renderFactorBankPage();
}

function clearFactorSelection() {
    selectedFactorIds.clear();
    renderFBPageList();
    renderFactorBankPage();
}

function bulkDeleteFactors() {
    const count = selectedFactorIds.size;
    showConfirm(`آیا از حذف ${count} عامل انتخاب‌شده اطمینان دارید؟`, async () => {
        try {
            await api.post('/factor-bank/delete-bulk', { ids: [...selectedFactorIds] });
            showToast(`${count} عامل با موفقیت حذف شد`);
            selectedFactorIds.clear();
            loadFactorBank();
        } catch (err) {
            showToast(err.message, 'error');
        }
    });
}
