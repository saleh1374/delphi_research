let expertsData = [];
let expertSearchTerm = '';
let selectedExpertIds = new Set();

async function loadExperts() {
    try {
        const url = expertSearchTerm ? `/experts?search=${encodeURIComponent(expertSearchTerm)}` : '/experts';
        expertsData = await api.get(url);
        renderExperts();
        document.getElementById('nav-badge-experts').textContent = expertsData.length;
    } catch (e) {
        showToast(e.message, 'error');
    }
}

function renderExperts() {
    const container = document.getElementById('section-experts');
    const hasSelection = selectedExpertIds.size > 0;
    container.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3>&#9786; فهرست نخبگان (${expertsData.length})</h3>
                <div style="display: flex; gap: 8px; align-items: center;">
                    ${hasSelection ? `
                        <span class="bulk-count">${selectedExpertIds.size} مورد انتخاب شده</span>
                        <button class="btn btn-danger btn-sm" onclick="bulkDeleteExperts()">&#10005; حذف انتخاب‌شده</button>
                        <button class="btn btn-outline btn-sm" onclick="clearExpertSelection()">انصراف</button>
                    ` : ''}
                    <button class="btn btn-primary" onclick="showExpertForm()">+ نخبه جدید</button>
                </div>
            </div>
            <div class="card-body">
                <div class="search-box">
                    <input type="text" placeholder="جست‌وجو در نام، سازمان، سمت..." value="${expertSearchTerm}" oninput="expertSearch(this.value); debounceSearch()">
                    <span class="search-icon">&#128269;</span>
                </div>
                ${expertsData.length === 0 ? `
                    <div class="empty-state">
                        <div class="empty-icon">&#128101;</div>
                        <h4>هنوز نخبه‌ای ثبت نشده</h4>
                        <p>اولین نخبه خود را ثبت کنید</p>
                    </div>
                ` : `
                    <div class="table-wrapper">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th style="width: 40px;"><input type="checkbox" onchange="toggleAllExperts(this.checked)" ${selectedExpertIds.size === expertsData.length ? 'checked' : ''}></th>
                                    <th>#</th>
                                    <th>نام و نام خانوادگی</th>
                                    <th>سازمان</th>
                                    <th>سمت</th>
                                    <th>رشته</th>
                                    <th>مدرک</th>
                                    <th>سابقه</th>
                                    <th>روش شناسایی</th>
                                    <th>وضعیت</th>
                                    <th>عملیات</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${expertsData.map((e, i) => `
                                    <tr class="${selectedExpertIds.has(e.expert_id) ? 'row-selected' : ''}">
                                        <td><input type="checkbox" ${selectedExpertIds.has(e.expert_id) ? 'checked' : ''} onchange="toggleExpertSelection(${e.expert_id}, this.checked)"></td>
                                        <td>${i + 1}</td>
                                        <td><strong>${e.full_name}</strong></td>
                                        <td>${e.organization}</td>
                                        <td>${e.position}</td>
                                        <td>${e.field_study}</td>
                                        <td>${e.degree}</td>
                                        <td>${e.years_energy}</td>
                                        <td>${e.qualification_method || '-'}</td>
                                        <td><span class="badge ${e.is_active_delphi ? 'badge-success' : 'badge-danger'}">${e.is_active_delphi ? 'فعال' : 'غیرفعال'}</span></td>
                                        <td>
                                            <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                                                <button class="btn btn-sm btn-outline" onclick="showExpertForm(${e.expert_id})">&#9998;</button>
                                                <button class="btn btn-sm btn-danger" onclick="confirmDeleteExpert(${e.expert_id}, '${e.full_name.replace(/'/g, "\\'")}')">&#10005;</button>
                                                <button class="btn btn-sm btn-primary" onclick="selectExpertForDelphi(${e.expert_id})">&#10148;</button>
                                            </div>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `}
            </div>
        </div>`;
}

let searchTimeout;
function expertSearch(val) { expertSearchTerm = val; }
function debounceSearch() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(loadExperts, 400);
}

function showExpertForm(id = null) {
    const expert = id ? expertsData.find(e => e.expert_id === id) : null;
    const title = expert ? 'ویرایش اطلاعات نخبه' : 'ثبت نخبه جدید';

    showModal(title, `
        <form id="expertForm" onsubmit="saveExpert(event, ${id})">
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label"><span class="required">*</span> نام و نام خانوادگی</label>
                    <input class="form-input" name="full_name" value="${expert?.full_name || ''}" required>
                </div>
                <div class="form-group">
                    <label class="form-label"><span class="required">*</span> سازمان / نهاد</label>
                    <input class="form-input" name="organization" value="${expert?.organization || ''}" required>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label"><span class="required">*</span> سمت</label>
                    <input class="form-input" name="position" value="${expert?.position || ''}" required>
                </div>
                <div class="form-group">
                    <label class="form-label"><span class="required">*</span> رشته تحصیلی</label>
                    <input class="form-input" name="field_study" value="${expert?.field_study || ''}" required>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label"><span class="required">*</span> مدرک تحصیلی</label>
                    <select class="form-select" name="degree" required>
                        <option value="">انتخاب کنید</option>
                        ${['دکتری', 'کارشناسی ارشد', 'کارشناسی'].map(d =>
                            `<option value="${d}" ${expert?.degree === d ? 'selected' : ''}>${d}</option>`
                        ).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label"><span class="required">*</span> سابقه کار مرتبط با انرژی</label>
                    <input class="form-input" name="years_energy" value="${expert?.years_energy || ''}" placeholder="مثال: ۱۵ سال" required>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">تلفن</label>
                    <input class="form-input" name="phone" value="${expert?.phone || ''}" dir="ltr">
                </div>
                <div class="form-group">
                    <label class="form-label">ایمیل</label>
                    <input class="form-input" name="email" value="${expert?.email || ''}" dir="ltr">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">روش شناسایی نخبه</label>
                    <select class="form-select" name="qualification_method">
                        <option value="">انتخاب کنید</option>
                        ${['نمونه‌گیری هدفمند', 'نمونه‌گیری گلوله برفی', 'معرفی توسط نهاد', 'خودمعرف'].map(m =>
                            `<option value="${m}" ${expert?.qualification_method === m ? 'selected' : ''}>${m}</option>`
                        ).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">وضعیت مشارکت</label>
                    <select class="form-select" name="is_active_delphi">
                        <option value="true" ${expert?.is_active_delphi !== false ? 'selected' : ''}>فعال</option>
                        <option value="false" ${expert?.is_active_delphi === false ? 'selected' : ''}>غیرفعال</option>
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">توضیحات شناسایی</label>
                <textarea class="form-textarea" name="qualification_note" rows="2" placeholder="توضیحات درباره نحوه شناسایی و انتخاب نخبه...">${expert?.qualification_note || ''}</textarea>
            </div>
        </form>
    `, `
        <button class="btn btn-primary" onclick="document.getElementById('expertForm').requestSubmit()">${expert ? 'ذخیره تغییرات' : 'ثبت نخبه'}</button>
        <button class="btn btn-outline" onclick="closeModal()">انصراف</button>
    `);
}

async function saveExpert(e, id) {
    e.preventDefault();
    const form = e.target;
    const data = Object.fromEntries(new FormData(form));
    if (data.is_active_delphi) data.is_active_delphi = data.is_active_delphi === 'true';

    try {
        if (id) {
            await api.put(`/experts/${id}`, data);
            showToast('اطلاعات نخبه با موفقیت بروزرسانی شد');
        } else {
            await api.post('/experts', data);
            showToast('نخبه با موفقیت ثبت شد');
        }
        closeModal();
        loadExperts();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

function confirmDeleteExpert(id, name) {
    showConfirm(`آیا از حذف نخبه «${name}» اطمینان دارید؟ تمام پاسخ‌ها و پیگیری‌های مرتبط نیز حذف خواهند شد.`, async () => {
        try {
            await api.del(`/experts/${id}`);
            showToast('نخبه با موفقیت حذف شد');
            loadExperts();
        } catch (err) {
            showToast(err.message, 'error');
        }
    });
}

function selectExpertForDelphi(id) {
    selectedExpertId = id;
    showSection('delphi');
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelectorAll('.nav-item')[2].classList.add('active');
}

function toggleAllExperts(checked) {
    if (checked) {
        expertsData.forEach(e => selectedExpertIds.add(e.expert_id));
    } else {
        selectedExpertIds.clear();
    }
    renderExperts();
}

function toggleExpertSelection(id, checked) {
    if (checked) {
        selectedExpertIds.add(id);
    } else {
        selectedExpertIds.delete(id);
    }
    renderExperts();
}

function clearExpertSelection() {
    selectedExpertIds.clear();
    renderExperts();
}

function bulkDeleteExperts() {
    const count = selectedExpertIds.size;
    showConfirm(`آیا از حذف ${count} نخبه انتخاب‌شده اطمینان دارید؟ تمام پاسخ‌ها و پیگیری‌های مرتبط نیز حذف خواهند شد.`, async () => {
        try {
            await api.post('/experts/delete-bulk', { ids: [...selectedExpertIds] });
            showToast(`${count} نخبه با موفقیت حذف شد`);
            selectedExpertIds.clear();
            loadExperts();
        } catch (err) {
            showToast(err.message, 'error');
        }
    });
}
