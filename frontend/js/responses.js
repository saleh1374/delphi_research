let delphiExperts = [];
let delphiExpert = null;
let delphiResponse = null;
let factorBankData = [];

async function loadDelphiSection() {
    try {
        delphiExperts = await api.get('/experts');
        factorBankData = await api.get('/factor-bank');
    } catch (e) {
        showToast(e.message, 'error');
    }
    renderDelphiSection();
}

function renderDelphiSection() {
    const container = document.getElementById('section-delphi');
    if (selectedExpertId) {
        delphiExpert = delphiExperts.find(e => e.expert_id === selectedExpertId);
        if (delphiExpert) loadExpertDelphi(delphiExpert.expert_id);
        return;
    }

    container.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3>&#128100; انتخاب نخبه برای ثبت پاسخ</h3>
            </div>
            <div class="card-body">
                ${delphiExperts.length === 0 ? `
                    <div class="empty-state">
                        <div class="empty-icon">&#128101;</div>
                        <h4>هنوز نخبه‌ای ثبت نشده</h4>
                        <p>ابتدا نخبگان را در بخش مدیریت نخبگان ثبت کنید</p>
                        <button class="btn btn-primary" style="margin-top: 16px;" onclick="showSection('experts')">رفتن به ثبت نخبگان</button>
                    </div>
                ` : `
                    <div class="search-box">
                        <input type="text" placeholder="جست‌وجوی نخبه..." oninput="filterDelphiExperts(this.value)" id="delphi-search">
                        <span class="search-icon">&#128269;</span>
                    </div>
                    <div class="table-wrapper">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>نام</th>
                                    <th>سازمان</th>
                                    <th>سمت</th>
                                    <th>عملیات</th>
                                </tr>
                            </thead>
                            <tbody id="delphi-experts-list">
                                ${delphiExperts.map((e, i) => `
                                    <tr data-search="${e.full_name} ${e.organization} ${e.position}">
                                        <td>${i + 1}</td>
                                        <td><strong>${e.full_name}</strong></td>
                                        <td>${e.organization}</td>
                                        <td>${e.position}</td>
                                        <td>
                                            <button class="btn btn-sm btn-primary" onclick="loadExpertDelphi(${e.expert_id})">&#10148; انتخاب و ثبت پاسخ</button>
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

function filterDelphiExperts(q) {
    const rows = document.querySelectorAll('#delphi-experts-list tr');
    rows.forEach(row => {
        const text = row.getAttribute('data-search') || '';
        row.style.display = text.includes(q) ? '' : 'none';
    });
}

async function loadExpertDelphi(expertId) {
    selectedExpertId = expertId;
    delphiExpert = delphiExperts.find(e => e.expert_id === expertId);
    try {
        delphiResponse = await api.get(`/responses/expert/${expertId}/latest`);
        if (!delphiResponse) {
            delphiResponse = { factors: [] };
        }
    } catch {
        delphiResponse = { factors: [] };
    }
    renderExpertDelphi();
}

function renderExpertDelphi() {
    const container = document.getElementById('section-delphi');
    const e = delphiExpert;
    const r = delphiResponse;
    const factors = r?.factors || [];

    container.innerHTML = `
        <div style="display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap;">
            <button class="btn btn-outline" onclick="selectedExpertId = null; delphiExpert = null; delphiResponse = null; renderDelphiSection();">&#8592; بازگشت به لیست</button>
        </div>

        <div class="card" style="margin-bottom: 20px;">
            <div class="card-header">
                <h3>&#128100; اطلاعات نخبه</h3>
                <span class="badge badge-primary">${r?.response_status || 'بدون پاسخ'}</span>
            </div>
            <div class="card-body">
                <div class="expert-profile">
                    <div class="expert-info-item">
                        <div class="info-icon">&#128100;</div>
                        <div class="info-text">
                            <div class="info-label">نام و نام خانوادگی</div>
                            <div class="info-value">${e.full_name}</div>
                        </div>
                    </div>
                    <div class="expert-info-item">
                        <div class="info-icon">&#127970;</div>
                        <div class="info-text">
                            <div class="info-label">سازمان</div>
                            <div class="info-value">${e.organization}</div>
                        </div>
                    </div>
                    <div class="expert-info-item">
                        <div class="info-icon">&#128188;</div>
                        <div class="info-text">
                            <div class="info-label">سمت</div>
                            <div class="info-value">${e.position}</div>
                        </div>
                    </div>
                    <div class="expert-info-item">
                        <div class="info-icon">&#127891;</div>
                        <div class="info-text">
                            <div class="info-label">رشته و مدرک</div>
                            <div class="info-value">${e.field_study} - ${e.degree}</div>
                        </div>
                    </div>
                    <div class="expert-info-item">
                        <div class="info-icon">&#9881;</div>
                        <div class="info-text">
                            <div class="info-label">سابقه انرژی</div>
                            <div class="info-value">${e.years_energy}</div>
                        </div>
                    </div>
                    <div class="expert-info-item">
                        <div class="info-icon">&#128231;</div>
                        <div class="info-text">
                            <div class="info-label">ایمیل</div>
                            <div class="info-value">${e.email || '-'}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="card" style="margin-bottom: 20px;">
            <div class="card-header">
                <h3>&#9998; فرم پاسخ راند اول دلفی</h3>
            </div>
            <div class="card-body">
                <div class="survey-question" style="margin-bottom: 24px;">
                    <h2>سؤال اصلی پژوهش</h2>
                    <p>از نظر شما چه عواملی بر توسعه صادرات برق ایران با تأکید بر نیروگاه‌های خورشیدی مؤثر است؟</p>
                </div>

                <form id="responseForm" onsubmit="saveResponse(event)">
                    <input type="hidden" name="expert_id" value="${e.expert_id}">
                    <div class="form-row" style="margin-bottom: 20px;">
                        <div class="form-group">
                            <label class="form-label">شماره راند</label>
                            <input class="form-input" type="number" name="round_no" value="${r?.round_no || 1}" min="1">
                        </div>
                        <div class="form-group">
                            <label class="form-label">وضعیت پاسخ</label>
                            <select class="form-select" name="response_status">
                                ${['ناتمام', 'تکمیل‌شده', 'در انتظار اصلاح'].map(s =>
                                    `<option value="${s}" ${(r?.response_status || 'ناتمام') === s ? 'selected' : ''}>${s}</option>`
                                ).join('')}
                            </select>
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">یادداشت پژوهشگر</label>
                        <textarea class="form-textarea" name="response_note" rows="3" placeholder="یادداشت‌های خود را اینجا بنویسید...">${r?.response_note || ''}</textarea>
                    </div>

                    <h3 style="margin: 24px 0 16px; font-size: 16px;">&#128203; فهرست عوامل (حداقل یک عامل الزامی است)</h3>
                    <div id="factors-container">
                        ${Array.from({length: 20}, (_, i) => {
                            const f = factors[i] || {};
                            return renderFactorRow(i + 1, f);
                        }).join('')}
                    </div>
                </form>
            </div>
        </div>

        <div class="card">
            <div class="card-header">
                <h3>&#9733; فهرست پیشنهادی عوامل مرجع</h3>
            </div>
            <div class="card-body">
                <div class="search-box">
                    <input type="text" placeholder="جست‌وجو در عوامل مرجع..." oninput="filterFactorBank(this.value)" id="factor-bank-search">
                    <span class="search-icon">&#128269;</span>
                </div>
                <div class="filter-chips" id="factor-category-filters">
                    <span class="filter-chip active" onclick="filterFactorByCategory('all', this)">همه</span>
                </div>
                <div id="factor-bank-list"></div>
            </div>
        </div>`;

    renderFactorCategories();
    renderFactorBankList();
}

function renderFactorRow(num, data = {}) {
    return `
        <div class="factor-row" id="factor-row-${num}">
            <div class="row-num">${num}</div>
            <div>
                <textarea class="form-textarea" name="factor_text_${num}" placeholder="عامل ${num} را وارد کنید..." rows="2" oninput="autoResize(this)">${data.factor_text || ''}</textarea>
                <input class="form-input" type="text" name="factor_note_${num}" placeholder="توضیح اضافی (اختیاری)" value="${data.factor_note || ''}" style="margin-top: 8px; font-size: 13px;">
                ${data.is_from_reference_list ? '<span class="badge badge-info" style="margin-top: 4px;">از فهرست مرجع</span>' : ''}
            </div>
            <div>
                <input class="form-input" type="text" name="factor_source_${num}" placeholder="منبع" value="${data.factor_source || ''}" style="font-size: 13px;">
                <select class="form-select" name="factor_category_${num}" style="margin-top: 8px; font-size: 13px;">
                    <option value="">دسته‌بندی</option>
                    ${['زیرساخت و شبکه', 'بازار و تنظیم‌گری', 'اقتصادی و مالی', 'فنی و فناوری', 'راهبردی و رقابتی', 'منطقه‌ای و ژئوپلیتیکی'].map(c =>
                        `<option value="${c}" ${data.factor_category === c ? 'selected' : ''}>${c}</option>`
                    ).join('')}
                </select>
                ${data.is_from_reference_list ? '<input type="hidden" name="factor_from_ref_' + num + '" value="true">' : ''}
            </div>
        </div>`;
}

function autoResize(el) {
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
}

async function saveResponse(e) {
    e.preventDefault();
    const form = e.target;
    const data = new FormData(form);

    const factors = [];
    for (let i = 1; i <= 20; i++) {
        const text = data.get(`factor_text_${i}`);
        if (text && text.trim()) {
            factors.push({
                row_no: i,
                factor_text: text.trim(),
                factor_note: data.get(`factor_note_${i}`) || null,
                factor_source: data.get(`factor_source_${i}`) || null,
                factor_category: data.get(`factor_category_${i}`) || null,
                is_from_reference_list: data.get(`factor_from_ref_${i}`) === 'true'
            });
        }
    }

    if (factors.length === 0) {
        showToast('حداقل یک عامل باید ثبت شود', 'error');
        return;
    }

    const payload = {
        expert_id: parseInt(data.get('expert_id')),
        round_no: parseInt(data.get('round_no')) || 1,
        response_status: data.get('response_status') || 'ناتمام',
        response_note: data.get('response_note') || null,
        factors
    };

    try {
        if (delphiResponse?.response_id) {
            await api.put(`/responses/${delphiResponse.response_id}`, payload);
            showToast('پاسخ با موفقیت بروزرسانی شد');
        } else {
            delphiResponse = await api.post('/responses', payload);
            showToast('پاسخ با موفقیت ثبت شد');
        }
    } catch (err) {
        showToast(err.message, 'error');
    }
}

function addFactorFromBank(title, note, source) {
    for (let i = 1; i <= 20; i++) {
        const field = document.querySelector(`[name="factor_text_${i}"]`);
        if (field && !field.value.trim()) {
            field.value = title;
            field.style.borderColor = 'var(--success)';
            const noteField = document.querySelector(`[name="factor_note_${i}"]`);
            if (noteField && note) noteField.value = note;
            const sourceField = document.querySelector(`[name="factor_source_${i}"]`);
            if (sourceField && source) sourceField.value = source;
            const row = document.getElementById(`factor-row-${i}`);
            if (row) row.scrollIntoView({ behavior: 'smooth', block: 'center' });
            showToast(`عامل «${title.substring(0, 30)}...» به ردیف ${i} اضافه شد`);
            return;
        }
    }
    showToast('تمام ردیف‌ها پر هستند', 'warning');
}
