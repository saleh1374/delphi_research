let finalFactorsData = [];
let finalFactorsCategory = 'all';
let finalFactorsSearch = '';
let editingFactorId = null;

async function loadFinalFactors() {
    const el = document.getElementById('section-finalfactors');
    el.innerHTML = '<div class="card"><div class="card-body" style="text-align:center;padding:40px;color:var(--text-muted);">در حال بارگذاری عوامل...</div></div>';
    try {
        finalFactorsData = await api.get('/final-factors/');
        if (!Array.isArray(finalFactorsData)) {
            throw new Error('داده‌های دریافتی نامعتبر است');
        }
        renderFinalFactors();
    } catch (e) {
        el.innerHTML = `<div class="card"><div class="card-body" style="text-align:center;padding:40px;color:var(--danger);">خطا: ${e.message}</div></div>`;
    }
}

function renderFinalFactors() {
    let filtered = [...finalFactorsData];
    if (finalFactorsCategory !== 'all') {
        filtered = filtered.filter(f => f.category === finalFactorsCategory);
    }
    if (finalFactorsSearch) {
        const q = finalFactorsSearch.toLowerCase();
        filtered = filtered.filter(f => f.title.toLowerCase().includes(q));
    }

    const cats = [...new Set(finalFactorsData.map(f => f.category).filter(Boolean))];

    const el = document.getElementById('section-finalfactors');
    el.innerHTML = `
        <div class="card" style="margin-bottom: 16px;">
            <div class="card-header">
                <div>
                    <h3>&#128203; بانک عوامل نهایی (راند اول)</h3>
                    <p style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">
                        ${finalFactorsData.length} عامل یکتا از راند اول - می‌توانید ویرایش، حذف یا ادغام کنید
                    </p>
                </div>
                <button class="btn btn-primary btn-sm" onclick="showAddFactorModal()">+ افزودن عامل جدید</button>
            </div>
            <div class="card-body">
                <div style="display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap;">
                    <div class="search-box" style="flex: 1; min-width: 200px; margin-bottom: 0;">
                        <input type="text" placeholder="جست‌وجو..." value="${finalFactorsSearch}" oninput="finalFactorsSearch = this.value; renderFinalFactors()">
                        <span class="search-icon">&#128269;</span>
                    </div>
                </div>
                <div class="filter-chips">
                    <span class="filter-chip ${finalFactorsCategory === 'all' ? 'active' : ''}" onclick="finalFactorsCategory='all';renderFinalFactors()">همه (${filtered.length})</span>
                    ${cats.map(c => `<span class="filter-chip ${finalFactorsCategory === c ? 'active' : ''}" onclick="finalFactorsCategory='${c}';renderFinalFactors()">${c}</span>`).join('')}
                </div>
                ${filtered.length === 0 ? `
                    <div class="empty-state">
                        <div class="empty-icon">&#128203;</div>
                        <h4>عاملی یافت نشد</h4>
                        <p>ابتدا نخبگان باید در راند اول پاسخ دهند</p>
                    </div>
                ` : `
                    <div class="table-wrapper">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>عنوان عامل</th>
                                    <th>دسته</th>
                                    <th>تعداد تکرار</th>
                                    <th style="width: 180px;">عملیات</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${filtered.map((f, i) => `
                                    <tr id="ff-row-${i}">
                                        <td>${i + 1}</td>
                                        <td id="ff-title-${i}"><strong>${f.title}</strong></td>
                                        <td><span class="badge badge-primary">${f.category || 'نامشخص'}</span></td>
                                        <td><span class="badge badge-success">${f.count}</span></td>
                                        <td>
                                            <div style="display: flex; gap: 4px; flex-wrap: wrap;">
                                                <button class="btn btn-sm btn-outline" onclick="editFactorText('${f.title.replace(/'/g, "\\'")}', '${(f.category || '').replace(/'/g, "\\'")}', ${i})" title="ویرایش">&#9998;</button>
                                                <button class="btn btn-sm btn-outline" onclick="viewFactorDetail('${f.title.replace(/'/g, "\\'")}')" title="جزئیات">&#128065;</button>
                                                <button class="btn btn-sm btn-danger" onclick="confirmDeleteFactorText('${f.title.replace(/'/g, "\\'")}', ${f.count})" title="حذف">&#10005;</button>
                                            </div>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `}
            </div>
        </div>
        <div id="ff-detail-container"></div>`;
}

function editFactorText(oldTitle, oldCategory, rowIdx) {
    const row = document.getElementById(`ff-row-${rowIdx}`);
    const titleCell = document.getElementById(`ff-title-${rowIdx}`);
    if (!titleCell) return;

    titleCell.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 6px;">
            <input type="text" class="form-input" id="ff-edit-title-${rowIdx}" value="${oldTitle.replace(/"/g, '&quot;')}" style="font-size: 13px; padding: 6px 10px;">
            <select class="form-select" id="ff-edit-cat-${rowIdx}" style="font-size: 12px; padding: 6px 10px;">
                <option value="">دسته‌بندی</option>
                ${['زیرساخت و شبکه','بازار و تنظیم‌گری','اقتصادی و مالی','فنی و فناوری','راهبردی و رقابتی','منطقه‌ای و ژئوپلیتیکی'].map(c =>
                    `<option value="${c}" ${c === oldCategory ? 'selected' : ''}>${c}</option>`
                ).join('')}
            </select>
        </div>`;

    const actionsCell = row.querySelector('td:last-child');
    if (actionsCell) {
        actionsCell.innerHTML = `
            <div style="display: flex; gap: 4px;">
                <button class="btn btn-sm btn-primary" onclick="saveFactorRename('${oldTitle.replace(/'/g, "\\'")}', ${rowIdx})">&#10003; ذخیره</button>
                <button class="btn btn-sm btn-outline" onclick="renderFinalFactors()">انصراف</button>
            </div>`;
    }
}

async function saveFactorRename(oldTitle, rowIdx) {
    const newTitle = document.getElementById(`ff-edit-title-${rowIdx}`)?.value?.trim();
    const newCategory = document.getElementById(`ff-edit-cat-${rowIdx}`)?.value;

    if (!newTitle) {
        showToast('عنوان نمی‌تواند خالی باشد', 'error');
        return;
    }

    try {
        const data = await api.put('/final-factors/batch-rename', {
            old_text: oldTitle, new_text: newTitle, category: newCategory
        });
        showToast(data.message || 'ذخیره شد');
        loadFinalFactors();
    } catch (e) {
        showToast(e.message, 'error');
    }
}

async function viewFactorDetail(title) {
    try {
        const details = await api.get(`/final-factors/detail/${encodeURIComponent(title)}`);
        const container = document.getElementById('ff-detail-container');

        container.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h3>&#128065; جزئیات: ${title}</h3>
                    <button class="btn btn-outline btn-sm" onclick="document.getElementById('ff-detail-container').innerHTML=''">&#10005; بستن</button>
                </div>
                <div class="card-body">
                    <div class="table-wrapper">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>نخبه</th>
                                    <th>راند</th>
                                    <th>دسته</th>
                                    <th>یادداشت</th>
                                    <th>عملیات</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${details.map(d => `
                                    <tr>
                                        <td><strong>${d.expert_name}</strong></td>
                                        <td>${d.round_no}</td>
                                        <td><span class="badge badge-primary">${d.factor_category || 'نامشخص'}</span></td>
                                        <td style="font-size: 12px; max-width: 200px;">${d.factor_note || '-'}</td>
                                        <td>
                                            <button class="btn btn-sm btn-outline" onclick="editSingleFactor(${d.factor_id}, '${(d.factor_text || '').replace(/'/g, "\\'")}', '${(d.factor_category || '').replace(/'/g, "\\'")}')">&#9998;</button>
                                            <button class="btn btn-sm btn-danger" onclick="deleteSingleFactor(${d.factor_id}, '${(d.factor_text || '').replace(/'/g, "\\'")}')">&#10005;</button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>`;
    } catch (e) {
        showToast(e.message, 'error');
    }
}

async function editSingleFactor(factorId, currentText, currentCategory) {
    const newText = prompt('ویرایش متن عامل:', currentText);
    if (!newText || newText.trim() === '') return;

    try {
        if (newText.trim() !== currentText) {
            await api.put(`/final-factors/${factorId}`, { factor_text: newText.trim() });
        }
        const newCat = prompt('ویرایش دسته‌بندی (اختیاری):', currentCategory);
        if (newCat !== null && newCat !== currentCategory) {
            await api.put(`/final-factors/${factorId}`, { factor_category: newCat });
        }
        showToast('ذخیره شد');
        loadFinalFactors();
    } catch (e) {
        showToast(e.message, 'error');
    }
}

async function deleteSingleFactor(factorId, title) {
    showConfirm(`آیا از حذف عامل «${title.substring(0, 40)}» اطمینان دارید؟`, async () => {
        try {
            await api.del(`/final-factors/${factorId}`);
            showToast('حذف شد');
            loadFinalFactors();
        } catch (e) {
            showToast(e.message, 'error');
        }
    });
}

function confirmDeleteFactorText(title, count) {
    showConfirm(
        `آیا از حذف تمام ${count} مورد از عامل «${title.substring(0, 50)}» اطمینان دارید؟ این عمل تمام رخدادهای این عامل را از پاسخ نخبگان حذف می‌کند.`,
        async () => {
            try {
                const data = await api.post('/final-factors/batch-delete', { text: title });
                showToast(data.message || 'حذف شد');
                loadFinalFactors();
            } catch (e) {
                showToast(e.message, 'error');
            }
        }
    );
}

function showAddFactorModal() {
    showModal('افزودن عامل جدید به پاسخ نخبگان', `
        <form id="addFactorForm" onsubmit="saveNewFactor(event)">
            <div class="form-group">
                <label class="form-label">عنوان عامل *</label>
                <textarea class="form-textarea" name="factor_text" rows="3" required placeholder="متن عامل جدید را وارد کنید..."></textarea>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">دسته‌بندی</label>
                    <select class="form-select" name="factor_category">
                        <option value="">انتخاب کنید</option>
                        ${['زیرساخت و شبکه','بازار و تنظیم‌گری','اقتصادی و مالی','فنی و فناوری','راهبردی و رقابتی','منطقه‌ای و ژئوپلیتیکی'].map(c => `<option value="${c}">${c}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">نخبه (اختیاری)</label>
                    <select class="form-select" name="expert_id">
                        <option value="">بدون انتساب</option>
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">یادداشت</label>
                <input class="form-input" name="factor_note" placeholder="توضیح اضافی...">
            </div>
        </form>
    `, `
        <button class="btn btn-primary" onclick="document.getElementById('addFactorForm').requestSubmit()">افزودن عامل</button>
        <button class="btn btn-outline" onclick="closeModal()">انصراف</button>
    `);

    // Load experts for the select dropdown
    api.get('/experts?limit=200')
        .then(experts => {
            const select = document.querySelector('[name="expert_id"]');
            if (select && Array.isArray(experts)) {
                experts.forEach(e => {
                    const roleLabel = e.role === 'participant' ? ' (راند ۲)' : '';
                    select.innerHTML += `<option value="${e.expert_id}">${e.full_name}${roleLabel}</option>`;
                });
            }
        })
        .catch(() => {});
}

async function saveNewFactor(e) {
    e.preventDefault();
    const form = e.target;
    const text = form.factor_text.value.trim();
    if (!text) { showToast('عنوان الزامی است', 'error'); return; }

    const expertId = parseInt(form.expert_id.value) || null;

    try {
        if (expertId) {
            // Get or create a Round 1 response for this expert
            let response;
            try {
                response = await api.get(`/responses/expert/${expertId}/latest`);
            } catch (e) {
                response = null;
            }

            if (!response || !response.response_id) {
                await api.post('/responses', {
                    expert_id: expertId,
                    round_no: 1,
                    response_status: 'ناتمام',
                    factors: [{
                        row_no: 1,
                        factor_text: text,
                        factor_note: form.factor_note.value.trim() || null,
                        factor_category: form.factor_category.value || null
                    }]
                });
            } else {
                const currentFactors = response.factors || [];
                const newRowNo = currentFactors.length + 1;
                const updatedFactors = [
                    ...currentFactors.map(f => ({
                        row_no: f.row_no,
                        factor_text: f.factor_text,
                        factor_note: f.factor_note,
                        factor_source: f.factor_source,
                        factor_category: f.factor_category,
                        is_from_reference_list: f.is_from_reference_list,
                        rating: f.rating
                    })),
                    {
                        row_no: newRowNo,
                        factor_text: text,
                        factor_note: form.factor_note.value.trim() || null,
                        factor_category: form.factor_category.value || null
                    }
                ];
                await api.put(`/responses/${response.response_id}`, {
                    round_no: response.round_no,
                    response_status: response.response_status,
                    response_note: response.response_note,
                    factors: updatedFactors
                });
            }
        } else {
            // Create a new temporary expert and response
            const expert = await api.post('/experts', {
                full_name: 'افزودن دستی',
                organization: 'پنل مدیریت',
                position: '-',
                field_study: '-',
                degree: '-',
                years_energy: '-',
                qualification_method: 'افزودن دستی توسط مدیر',
                role: 'expert'
            });
            await api.post('/responses', {
                expert_id: expert.expert_id,
                round_no: 1,
                response_status: 'ناتمام',
                factors: [{
                    row_no: 1,
                    factor_text: text,
                    factor_note: form.factor_note.value.trim() || null,
                    factor_category: form.factor_category.value || null
                }]
            });
        }

        showToast('عامل با موفقیت اضافه شد');
        closeModal();
        loadFinalFactors();
    } catch (err) {
        showToast(err.message, 'error');
    }
}