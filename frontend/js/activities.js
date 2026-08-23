let activitiesData = [];
let allExpertsForActivities = [];
let activitiesFilter = { status: 'all', type: 'all', search: '' };
let selectedActivityIds = new Set();

async function loadActivities() {
    const el = document.getElementById('section-activities');
    el.innerHTML = '<div class="card"><div class="card-body" style="text-align:center;padding:40px;color:var(--text-muted);"><div class="spinner" style="margin:0 auto 16px;"></div>در حال بارگذاری...</div></div>';
    try {
        const [activities, experts] = await Promise.all([
            api.get('/activities'),
            api.get('/experts')
        ]);
        allExpertsForActivities = experts;
        activitiesData = activities;
        renderActivities();
    } catch (e) {
        showToast(e.message, 'error');
        el.innerHTML = `<div class="card"><div class="card-body" style="text-align:center;padding:40px;color:var(--danger);">خطا: ${e.message}</div></div>`;
    }
}

function getExpertNameForActivity(id) {
    const e = allExpertsForActivities.find(x => x.expert_id === id);
    return e ? e.full_name : `نخبه #${id}`;
}

function renderActivities() {
    let filtered = [...activitiesData];
    if (activitiesFilter.status !== 'all') filtered = filtered.filter(a => a.activity_status === activitiesFilter.status);
    if (activitiesFilter.type !== 'all') filtered = filtered.filter(a => a.activity_type === activitiesFilter.type);
    if (activitiesFilter.search) {
        const q = activitiesFilter.search.toLowerCase();
        filtered = filtered.filter(a => {
            const name = getExpertNameForActivity(a.expert_id).toLowerCase();
            return name.includes(q) || (a.activity_note || '').toLowerCase().includes(q) || a.activity_type.toLowerCase().includes(q);
        });
    }

    const allStatuses = [...new Set(activitiesData.map(a => a.activity_status))];
    const allTypes = [...new Set(activitiesData.map(a => a.activity_type))];
    const hasSelection = selectedActivityIds.size > 0;

    const completed = activitiesData.filter(a => a.activity_status === 'تکمیل‌شده').length;
    const pending = activitiesData.filter(a => a.activity_status === 'در انتظار').length;
    const inProgress = activitiesData.filter(a => a.activity_status === 'در حال انجام').length;

    const container = document.getElementById('section-activities');
    container.innerHTML = `
        <div class="stats-grid" style="grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); margin-bottom: 16px;">
            <div class="stat-card"><div class="stat-icon blue">&#8987;</div><div class="stat-info"><h4>${activitiesData.length}</h4><p>کل فعالیت‌ها</p></div></div>
            <div class="stat-card"><div class="stat-icon green">&#10003;</div><div class="stat-info"><h4>${completed}</h4><p>تکمیل‌شده</p></div></div>
            <div class="stat-card"><div class="stat-icon orange">&#9203;</div><div class="stat-info"><h4>${pending}</h4><p>در انتظار</p></div></div>
            <div class="stat-card"><div class="stat-icon purple">&#128260;</div><div class="stat-info"><h4>${inProgress}</h4><p>در حال انجام</p></div></div>
        </div>

        <div class="card">
            <div class="card-header">
                <h3>&#8987; فعالیت‌ها و پیگیری‌ها (${filtered.length} مورد)</h3>
                <div style="display: flex; gap: 8px; align-items: center;">
                    ${hasSelection ? `<span class="bulk-count">${selectedActivityIds.size} انتخاب</span>
                        <button class="btn btn-danger btn-sm" onclick="bulkDeleteActivities()">&#10005; حذف</button>
                        <button class="btn btn-outline btn-sm" onclick="clearActivitySelection()">انصراف</button>` : ''}
                    <button class="btn btn-primary btn-sm" onclick="showActivityForm()">+ فعالیت جدید</button>
                </div>
            </div>
            <div class="card-body">
                <div style="display: flex; gap: 12px; margin-bottom: 12px; flex-wrap: wrap;">
                    <div class="search-box" style="flex: 1; min-width: 180px; margin-bottom: 0;">
                        <input type="text" placeholder="جستجو..." value="${activitiesFilter.search}" oninput="activitiesFilter.search=this.value;renderActivities()">
                        <span class="search-icon">&#128269;</span>
                    </div>
                    <select class="form-select" style="max-width: 160px; font-size: 13px;" onchange="activitiesFilter.status=this.value;renderActivities()">
                        <option value="all" ${activitiesFilter.status === 'all' ? 'selected' : ''}>همه وضعیت‌ها</option>
                        ${allStatuses.map(s => `<option value="${s}" ${activitiesFilter.status === s ? 'selected' : ''}>${s}</option>`).join('')}
                    </select>
                    <select class="form-select" style="max-width: 180px; font-size: 13px;" onchange="activitiesFilter.type=this.value;renderActivities()">
                        <option value="all" ${activitiesFilter.type === 'all' ? 'selected' : ''}>همه نوع‌ها</option>
                        ${allTypes.map(t => `<option value="${t}" ${activitiesFilter.type === t ? 'selected' : ''}>${t}</option>`).join('')}
                    </select>
                </div>

                ${filtered.length === 0 ? `<div class="empty-state"><div class="empty-icon">&#8987;</div><h4>فعالیتی یافت نشد</h4><p>فعالیت جدید ثبت کنید یا فیلترها را تغییر دهید</p></div>` : `
                <div class="table-wrapper">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th style="width:40px;"><input type="checkbox" onchange="toggleAllActivities(this.checked)" ${selectedActivityIds.size === filtered.length && filtered.length > 0 ? 'checked' : ''}></th>
                                <th>#</th><th>نخبه</th><th>نوع</th><th>وضعیت</th><th>تاریخ پیگیری</th><th>یادداشت</th><th>تاریخ</th><th>عملیات</th>
                            </tr>
                        </thead>
                        <tbody>${filtered.map((a, i) => `
                            <tr class="${selectedActivityIds.has(a.activity_id) ? 'row-selected' : ''}">
                                <td><input type="checkbox" ${selectedActivityIds.has(a.activity_id) ? 'checked' : ''} onchange="toggleActivitySelection(${a.activity_id}, this.checked)"></td>
                                <td>${i + 1}</td>
                                <td><strong>${getExpertNameForActivity(a.expert_id)}</strong></td>
                                <td><span class="badge badge-info">${a.activity_type}</span></td>
                                <td><span class="badge ${getStatusBadge(a.activity_status)}">${a.activity_status}</span></td>
                                <td>${a.follow_up_date || '-'}</td>
                                <td style="max-width:200px;font-size:12px;">${a.activity_note ? a.activity_note.substring(0, 60) + (a.activity_note.length > 60 ? '...' : '') : '-'}</td>
                                <td style="font-size:11px;color:var(--text-muted);">${formatDate(a.created_at)}</td>
                                <td>
                                    <div style="display:flex;gap:4px;">
                                        <button class="btn btn-sm btn-outline" onclick="showActivityForm(${a.activity_id})" title="ویرایش">&#9998;</button>
                                        <button class="btn btn-sm btn-danger" onclick="confirmDeleteActivity(${a.activity_id})" title="حذف">&#10005;</button>
                                    </div>
                                </td>
                            </tr>`).join('')}
                        </tbody>
                    </table>
                </div>`}
            </div>
        </div>`;
}

function getStatusBadge(status) {
    const map = { 'تکمیل‌شده': 'badge-success', 'در انتظار': 'badge-warning', 'لغوشده': 'badge-danger', 'در حال انجام': 'badge-info' };
    return map[status] || 'badge-primary';
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
                    ${allExpertsForActivities.map(e => `<option value="${e.expert_id}" ${activity?.expert_id === e.expert_id ? 'selected' : ''}>${e.full_name} - ${e.organization}</option>`).join('')}
                </select>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label"><span class="required">*</span> نوع فعالیت</label>
                    <select class="form-select" name="activity_type" required>
                        <option value="">انتخاب کنید</option>
                        ${['تماس تلفنی', 'ارسال ایمیل', 'جلسه حضوری', 'ارسال پرسشنامه', 'یادآوری', 'دریافت پاسخ', 'سایر'].map(t => `<option value="${t}" ${activity?.activity_type === t ? 'selected' : ''}>${t}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">وضعیت</label>
                    <select class="form-select" name="activity_status">
                        ${['در انتظار', 'در حال انجام', 'تکمیل‌شده', 'لغوشده'].map(s => `<option value="${s}" ${(activity?.activity_status || 'در انتظار') === s ? 'selected' : ''}>${s}</option>`).join('')}
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
        if (id) { await api.put(`/activities/${id}`, data); showToast('بروزرسانی شد'); }
        else { await api.post('/activities', data); showToast('ثبت شد'); }
        closeModal();
        loadActivities();
    } catch (err) { showToast(err.message, 'error'); }
}

function confirmDeleteActivity(id) {
    showConfirm('آیا از حذف این فعالیت اطمینان دارید؟', async () => {
        try { await api.del(`/activities/${id}`); showToast('حذف شد'); loadActivities(); }
        catch (err) { showToast(err.message, 'error'); }
    });
}

function toggleAllActivities(checked) { if (checked) activitiesData.forEach(a => selectedActivityIds.add(a.activity_id)); else selectedActivityIds.clear(); renderActivities(); }
function toggleActivitySelection(id, checked) { if (checked) selectedActivityIds.add(id); else selectedActivityIds.delete(id); renderActivities(); }
function clearActivitySelection() { selectedActivityIds.clear(); renderActivities(); }
function bulkDeleteActivities() {
    const count = selectedActivityIds.size;
    showConfirm(`آیا از حذف ${count} فعالیت اطمینان دارید؟`, async () => {
        try { await api.post('/activities/delete-bulk', { ids: [...selectedActivityIds] }); showToast(`${count} مورد حذف شد`); selectedActivityIds.clear(); loadActivities(); }
        catch (err) { showToast(err.message, 'error'); }
    });
}