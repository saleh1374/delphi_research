let round2Responses = [];
let expertNamesMap = {};

async function loadRound2() {
    try {
        const [responses, experts] = await Promise.all([
            api.get('/responses?round_no=2'),
            api.get('/experts')
        ]);
        expertNamesMap = {};
        experts.forEach(e => { expertNamesMap[e.expert_id] = e.full_name; });
        round2Responses = responses;
        renderRound2();
    } catch (e) {
        showToast(e.message, 'error');
    }
}

function getExpertName(id) {
    return expertNamesMap[id] || `نخبه #${id}`;
}

function renderRound2() {
    const container = document.getElementById('section-round2');
    container.innerHTML = `
        <div class="card" style="margin-bottom: 20px;">
            <div class="card-header">
                <h3>&#9878; پاسخ‌های راند دوم (اولویت‌بندی)</h3>
                <div style="display: flex; gap: 8px;">
                    <a href="/survey2" target="_blank" class="btn btn-primary" style="font-size: 13px;">&#128279; لینک پرسشنامه راند ۲</a>
                </div>
            </div>
            <div class="card-body">
                <p style="font-size: 14px; color: var(--text-secondary); margin-bottom: 16px;">
                    پاسخ‌های دریافتی از شرکت‌کنندگان در راند دوم (اولویت‌بندی عوامل)
                </p>
                ${round2Responses.length === 0 ? `
                    <div class="empty-state">
                        <div class="empty-icon">&#9878;</div>
                        <h4>هنوز پاسخی دریافت نشده</h4>
                        <p>لینک پرسشنامه راند ۲ را برای شرکت‌کنندگان بفرستید</p>
                    </div>
                ` : `
                    <div class="table-wrapper">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>نام شرکت‌کننده</th>
                                    <th>تعداد عوامل</th>
                                    <th>وضعیت</th>
                                    <th>یادداشت</th>
                                    <th>تاریخ ثبت</th>
                                    <th>عملیات</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${round2Responses.map((r, i) => `
                                    <tr>
                                        <td>${i + 1}</td>
                                        <td><strong>${getExpertName(r.expert_id)}</strong></td>
                                        <td><span class="badge badge-primary">${r.factors?.length || 0} عامل</span></td>
                                        <td><span class="badge ${r.response_status === 'تکمیل‌شده' ? 'badge-success' : 'badge-warning'}">${r.response_status}</span></td>
                                        <td style="max-width: 200px; font-size: 13px;">${r.response_note ? r.response_note.substring(0, 80) + '...' : '-'}</td>
                                        <td style="font-size: 12px;">${formatDate(r.created_at)}</td>
                                        <td>
                                            <div style="display: flex; gap: 4px; flex-wrap: wrap;">
                                                <button class="btn btn-sm btn-outline" onclick="viewRound2Response(${r.response_id})">مشاهده</button>
                                                <button class="btn btn-sm btn-outline" onclick="editRound2Response(${r.response_id}, ${r.expert_id}, ${r.round_no}, '${r.response_status}', '${(r.response_note || '').replace(/'/g, "\\'").replace(/\n/g, ' ')}')">&#9998;</button>
                                                <button class="btn btn-sm btn-danger" onclick="confirmDeleteRound2Response(${r.response_id}, '${getExpertName(r.expert_id).replace(/'/g, "\\'")}')">&#10005;</button>
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
        <div id="round2-detail-container"></div>
        <div id="round2-analysis-container" style="margin-top: 20px;"></div>`;

    if (round2Responses.length > 0) {
        loadRound2Analysis();
    }
}

async function viewRound2Response(responseId) {
    try {
        const response = await api.get(`/responses/${responseId}`);
        const container = document.getElementById('round2-detail-container');

        const factorsWithRatings = response.factors.map(f => ({
            ...f,
            rating: f.rating || 5
        }));

        factorsWithRatings.sort((a, b) => b.rating - a.rating);

        container.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h3>&#128203; جزئیات پاسخ راند ۲ - ${getExpertName(response.expert_id)}</h3>
                </div>
                <div class="card-body">
                    <div class="table-wrapper">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>رتبه</th>
                                    <th>عامل</th>
                                    <th>دسته</th>
                                    <th>امتیاز</th>
                                    <th>نمودار</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${factorsWithRatings.map((f, i) => `
                                    <tr>
                                        <td><span class="badge ${i < 3 ? 'badge-success' : i < 6 ? 'badge-warning' : 'badge-info'}">${i + 1}</span></td>
                                        <td><strong>${f.factor_text}</strong></td>
                                        <td><span class="badge badge-primary">${f.factor_category || 'نامشخص'}</span></td>
                                        <td><strong style="color: var(--primary);">${f.rating}</strong></td>
                                        <td>
                                            <div style="background: var(--border-light); border-radius: 4px; height: 12px; width: 150px; overflow: hidden;">
                                                <div style="background: linear-gradient(90deg, var(--primary), var(--accent)); height: 100%; width: ${(f.rating / 9 * 100).toFixed(0)}%; border-radius: 4px;"></div>
                                            </div>
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

async function loadRound2Analysis() {
    try {
        const data = await api.get('/analysis/round2-ratings');
        const container = document.getElementById('round2-analysis-container');

        if (!data.factors || data.factors.length === 0) {
            container.innerHTML = `
                <div class="card">
                    <div class="card-header">
                        <h3>&#128202; تحلیل اولویت‌بندی راند دوم</h3>
                    </div>
                    <div class="card-body">
                        <div class="empty-state">
                            <div class="empty-icon">&#128202;</div>
                            <h4>هنوز داده‌ای برای تحلیل وجود ندارد</h4>
                            <p>منتظر دریافت پاسخ‌ها از شرکت‌کنندگان باشید</p>
                        </div>
                    </div>
                </div>`;
            return;
        }

        container.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h3>&#128202; تحلیل اولویت‌بندی راند دوم</h3>
                </div>
                <div class="card-body">
                    <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 12px;">
                        میانگین امتیازات ${data.total_respondents} شرکت‌کننده
                    </p>
                    <div class="table-wrapper">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>رتبه</th>
                                    <th>عامل</th>
                                    <th>دسته</th>
                                    <th>میانگین امتیاز</th>
                                    <th>حداکثر</th>
                                    <th>حداقل</th>
                                    <th>انحراف معیار</th>
                                    <th>تعداد رأی</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${data.factors.map((f, i) => `
                                    <tr>
                                        <td><span class="badge ${i < 3 ? 'badge-success' : i < 6 ? 'badge-warning' : 'badge-info'}">${i + 1}</span></td>
                                        <td><strong>${f.title}</strong></td>
                                        <td><span class="badge badge-primary">${f.category || 'نامشخص'}</span></td>
                                        <td><strong style="color: var(--primary);">${f.average_rating}</strong></td>
                                        <td>${f.max_rating}</td>
                                        <td>${f.min_rating}</td>
                                        <td>${f.std_dev}</td>
                                        <td>${f.rating_count}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>`;
    } catch (e) {
        console.error(e);
    }
}

function confirmDeleteRound2Response(responseId, expertName) {
    showConfirm(`آیا از حذف پاسخ راند دوم «${expertName}» اطمینان دارید؟`, async () => {
        try {
            await api.del(`/responses/${responseId}`);
            showToast('پاسخ با موفقیت حذف شد');
            loadRound2();
        } catch (err) {
            showToast(err.message, 'error');
        }
    });
}

async function editRound2Response(responseId, expertId, roundNo, status, note) {
    try {
        const response = await api.get(`/responses/${responseId}`);
        const factors = response.factors || [];

        let factorsHTML = factors.map((f, i) => `
            <div class="factor-row" style="margin-bottom: 8px;">
                <div class="row-num">${i + 1}</div>
                <div>
                    <textarea class="form-textarea" name="factor_text_${i}" rows="2">${(f.factor_text || '').replace(/"/g, '&quot;')}</textarea>
                    <input class="form-input" type="text" name="factor_note_${i}" placeholder="یادداشت" value="${(f.factor_note || '').replace(/"/g, '&quot;')}" style="margin-top: 4px; font-size: 12px;">
                </div>
                <div>
                    <select class="form-select" name="factor_category_${i}" style="font-size: 12px;">
                        <option value="">دسته‌بندی</option>
                        ${['زیرساخت و شبکه','بازار و تنظیم‌گری','اقتصادی و مالی','فنی و فناوری','راهبردی و رقابتی','منطقه‌ای و ژئوپلیتیکی'].map(c =>
                            `<option value="${c}" ${f.factor_category === c ? 'selected' : ''}>${c}</option>`
                        ).join('')}
                    </select>
                    <input type="number" class="form-input" name="rating_${i}" placeholder="امتیاز ۱-۹" min="1" max="9" value="${f.rating || 5}" style="margin-top: 4px; font-size: 12px;">
                </div>
            </div>
        `).join('');

        showModal(`ویرایش پاسخ راند ۲`, `
            <form id="editRound2Form" onsubmit="saveEditRound2(event, ${responseId}, ${factors.length})">
                <div class="form-row" style="margin-bottom: 16px;">
                    <div class="form-group">
                        <label class="form-label">وضعیت</label>
                        <select class="form-select" name="response_status">
                            ${['ناتمام','تکمیل‌شده'].map(s => `<option value="${s}" ${status === s ? 'selected' : ''}>${s}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">شماره راند</label>
                        <input class="form-input" type="number" name="round_no" value="${roundNo}" min="1">
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">یادداشت</label>
                    <textarea class="form-textarea" name="response_note" rows="2">${note.replace(/"/g, '&quot;')}</textarea>
                </div>
                <h3 style="margin: 16px 0 12px; font-size: 15px;">&#128203; عوامل</h3>
                ${factorsHTML}
            </form>
        `, `
            <button class="btn btn-primary" onclick="document.getElementById('editRound2Form').requestSubmit()">ذخیره تغییرات</button>
            <button class="btn btn-outline" onclick="closeModal()">انصراف</button>
        `);
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function saveEditRound2(e, responseId, factorCount) {
    e.preventDefault();
    const form = e.target;
    const factors = [];
    for (let i = 0; i < factorCount; i++) {
        const text = form[`factor_text_${i}`]?.value?.trim();
        if (!text) continue;
        factors.push({
            row_no: i + 1,
            factor_text: text,
            factor_note: form[`factor_note_${i}`]?.value?.trim() || null,
            factor_category: form[`factor_category_${i}`]?.value || null,
            rating: parseInt(form[`rating_${i}`]?.value) || null
        });
    }

    const payload = {
        round_no: parseInt(form.round_no.value) || 2,
        response_status: form.response_status.value,
        response_note: form.response_note.value.trim() || null,
        factors
    };

    try {
        await api.put(`/responses/${responseId}`, payload);
        showToast('پاسخ با موفقیت ویرایش شد');
        closeModal();
        loadRound2();
    } catch (err) {
        showToast(err.message, 'error');
    }
}
