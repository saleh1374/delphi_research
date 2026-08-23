let activitiesData = [];
let selectedActivityIds = new Set();

async function loadActivities() {
    try {
        activitiesData = await api.get('/activities');
        renderActivities();
    } catch (e) {
        showToast(e.message, 'error');
    }
}

function renderActivities() {
    const container = document.getElementById('section-activities');
    const hasSelection = selectedActivityIds.size > 0;
    container.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3>&#8987; فعالیت‌ها و پیگیری‌ها (${activitiesData.length})</h3>
                <div style="display: flex; gap: 8px; align-items: center;">
                    ${hasSelection ? `
                        <span class="bulk-count">${selectedActivityIds.size} مورد انتخاب شده</span>
                        <button class="btn btn-danger btn-sm" onclick="bulkDeleteActivities()">&#10005; حذف انتخاب‌شده</button>
                        <button class="btn btn-outline btn-sm" onclick="clearActivitySelection()">انصراف</button>
                    ` : ''}
                    <button class="btn btn-primary" onclick="showActivityForm()">+ فعالیت جدید</button>
                </div>
            </div>
            <div class="card-body">
                ${activitiesData.length === 0 ? `
                    <div class="empty-state">
                        <div class="empty-icon">&#8987;</div>
                        <h4>هنوز فعالیتی ثبت نشده</h4>
                        <p>اولین فعالیت پیگیری خود را ثبت کنید</p>
                    </div>
                ` : `
                    <div class="table-wrapper">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th style="width: 40px;"><input type="checkbox" onchange="toggleAllActivities(this.checked)" ${selectedActivityIds.size === activitiesData.length ? 'checked' : ''}></th>
                                    <th>#</th>
                                    <th>نام نخبه</th>
                                    <th>نوع فعالیت</th>
                                    <th>وضعیت</th>
                                    <th>تاریخ پیگیری</th>
                                    <th>یادداشت</th>
                                    <th>تاریخ ایجاد</th>
                                    <th>عملیات</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${activitiesData.map((a, i) => `
                                    <tr class="${selectedActivityIds.has(a.activity_id) ? 'row-selected' : ''}">
                                        <td><input type="checkbox" ${selectedActivityIds.has(a.activity_id) ? 'checked' : ''} onchange="toggleActivitySelection(${a.activity_id}, this.checked)"></td>
                                        <td>${i + 1}</td>
                                        <td><strong>${getExpertName(a.expert_id)}</strong></td>
                                        <td>${a.activity_type}</td>
                                        <td><span class="badge ${getStatusBadge(a.activity_status)}">${a.activity_status}</span></td>
                                        <td>${a.follow_up_date || '-'}</td>
                                        <td style="max-width: 200px; font-size: 13px;">${a.activity_note ? a.activity_note.substring(0, 80) + (a.activity_note.length > 80 ? '...' : '') : '-'}</td>
                                        <td style="font-size: 12px;">${formatDate(a.created_at)}</td>
                                        <td>
                                            <div style="display: flex; gap: 6px;">
                                                <button class="btn btn-sm btn-outline" onclick="showActivityForm(${a.activity_id})">&#9998;</button>
                                                <button class="btn btn-sm btn-danger" onclick="confirmDeleteActivity(${a.activity_id})">&#10005;</button>
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

function getStatusBadge(status) {
    const map = {
        'تکمیل‌شده': 'badge-success',
        'در انتظار': 'badge-warning',
        'لغوشده': 'badge-danger',
        'در حال انجام': 'badge-info'
    };
    return map[status] || 'badge-primary';
}

function getExpertName(id) {
    const names = JSON.parse(localStorage.getItem('expertNames') || '{}');
    return names[id] || `نخبه #${id}`;
}

async function loadExpertNames() {
    try {
        const experts = await api.get('/experts');
        const names = {};
        experts.forEach(e => { names[e.expert_id] = e.full_name; });
        localStorage.setItem('expertNames', JSON.stringify(names));
    } catch (e) { }
}

function showActivityForm(id = null) {
    const activity = id ? activitiesData.find(a => a.activity_id === id) : null;
    const title = activity ? 'ویرایش فعالیت' : 'ثبت فعالیت جدید';

    showModal(title, `
        <form id="activityForm" onsubmit="saveActivity(event, ${id})">
            <div class="form-group">
                <label class="form-label"><span class="required">*</span> نخبه</label>
                <select class="form-select" name="expert_id" required>
                    <option value="">انتخاب نخبه</option>
                    ${(delphiExperts || []).map(e => `
                        <option value="${e.expert_id}" ${activity?.expert_id === e.expert_id ? 'selected' : ''}>${e.full_name} - ${e.organization}</option>
                    `).join('')}
                </select>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label"><span class="required">*</span> نوع فعالیت</label>
                    <select class="form-select" name="activity_type" required>
                        <option value="">انتخاب کنید</option>
                        ${['تماس تلفنی', 'ارسال ایمیل', 'جلسه حضوری', 'ارسال پرسشنامه', 'یادآوری', 'دریافت پاسخ', 'سایر'].map(t =>
                            `<option value="${t}" ${activity?.activity_type === t ? 'selected' : ''}>${t}</option>`
                        ).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">وضعیت</label>
                    <select class="form-select" name="activity_status">
                        ${['در انتظار', 'در حال انجام', 'تکمیل‌شده', 'لغوشده'].map(s =>
                            `<option value="${s}" ${(activity?.activity_status || 'در انتظار') === s ? 'selected' : ''}>${s}</option>`
                        ).join('')}
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">تاریخ پیگیری بعدی</label>
                <input class="form-input" type="date" name="follow_up_date" value="${activity?.follow_up_date || ''}">
            </div>
            <div class="form-group">
                <label class="form-label">یادداشت</label>
                <textarea class="form-textarea" name="activity_note" rows="4" placeholder="جزئیات فعالیت...">${activity?.activity_note || ''}</textarea>
            </div>
        </form>
    `, `
        <button class="btn btn-primary" onclick="document.getElementById('activityForm').requestSubmit()">${activity ? 'ذخیره تغییرات' : 'ثبت فعالیت'}</button>
        <button class="btn btn-outline" onclick="closeModal()">انصراف</button>
    `);
}

async function saveActivity(e, id) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    try {
        if (id) {
            await api.put(`/activities/${id}`, data);
            showToast('فعالیت با موفقیت بروزرسانی شد');
        } else {
            await api.post('/activities', data);
            showToast('فعالیت با موفقیت ثبت شد');
        }
        closeModal();
        loadActivities();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

function confirmDeleteActivity(id) {
    showConfirm('آیا از حذف این فعالیت اطمینان دارید؟', async () => {
        try {
            await api.del(`/activities/${id}`);
            showToast('فعالیت با موفقیت حذف شد');
            loadActivities();
        } catch (err) {
            showToast(err.message, 'error');
        }
    });
}

function toggleAllActivities(checked) {
    if (checked) {
        activitiesData.forEach(a => selectedActivityIds.add(a.activity_id));
    } else {
        selectedActivityIds.clear();
    }
    renderActivities();
}

function toggleActivitySelection(id, checked) {
    if (checked) {
        selectedActivityIds.add(id);
    } else {
        selectedActivityIds.delete(id);
    }
    renderActivities();
}

function clearActivitySelection() {
    selectedActivityIds.clear();
    renderActivities();
}

function bulkDeleteActivities() {
    const count = selectedActivityIds.size;
    showConfirm(`آیا از حذف ${count} فعالیت انتخاب‌شده اطمینان دارید؟`, async () => {
        try {
            await api.post('/activities/delete-bulk', { ids: [...selectedActivityIds] });
            showToast(`${count} فعالیت با موفقیت حذف شد`);
            selectedActivityIds.clear();
            loadActivities();
        } catch (err) {
            showToast(err.message, 'error');
        }
    });
}

document.addEventListener('DOMContentLoaded', loadExpertNames);
