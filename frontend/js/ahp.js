/* ============================================================
   ماژول «تحلیل سلسله‌مراتبی AHP» — پنل مدیریت
   سلسله‌مراتب سه‌سطحی، پرسشنامه ۷۹ مقایسه، نتایج و سازگاری
   ============================================================ */

let ahpHierarchy = null;
let ahpExperts = [];
let ahpQuestionnaire = null;
let ahpValues = {};                 // key → value
let ahpSelectedExpert = null;
let ahpDirty = [];
let ahpSaveTimer = null;
let ahpResults = null;
let ahpCharts = { dim: null, factor: null };

const AHP_DASH = '\u2013';

async function loadAHP() {
    const container = document.getElementById('section-ahp');
    container.innerHTML = '<div class="card"><div class="card-body"><p>در حال بارگذاری ماژول AHP…</p></div></div>';
    try {
        const [hierarchy, experts, results] = await Promise.all([
            api.get('/ahp/hierarchy'),
            api.get('/ahp/experts'),
            api.get('/ahp/results')
        ]);
        ahpHierarchy = hierarchy;
        ahpExperts = experts.experts || [];
        ahpResults = results;
        renderAHPSection();
    } catch (e) {
        container.innerHTML = `<div class="card"><div class="card-body"><p style="color:#ef4444;">خطا در بارگذاری ماژول AHP: ${e.message}</p></div></div>`;
        showToast(e.message, 'error');
    }
}

/* ───────────────────────── ساختار کلی ───────────────────────── */
function renderAHPSection() {
    const c = ahpHierarchy.counts;
    const container = document.getElementById('section-ahp');
    container.innerHTML = `
        <div class="card" style="margin-bottom:16px;">
            <div class="card-header">
                <div>
                    <h3>&#9878; سلسله‌مراتب سه‌سطحی پژوهش</h3>
                    <p style="font-size:12px;color:var(--text-muted);margin-top:4px;">ساخته‌شده از روی داده‌های موجود (عوامل امتیازخورده راند ۲ دلفی)</p>
                </div>
                <div style="display:flex;gap:8px;flex-wrap:wrap;">
                    <a href="/ahp-guide" target="_blank" class="btn btn-outline" style="font-size:12px;">&#128214; راهنمای یک‌صفحه‌ای خبره</a>
                    <a href="/ahp-survey" target="_blank" class="btn btn-outline" style="font-size:12px;">&#128279; پرسشنامه عمومی خبره</a>
                </div>
            </div>
            <div class="card-body">
                <div class="ahp-goal">
                    <div class="ahp-goal-label">سطح ۱ — هدف</div>
                    <div class="ahp-goal-text">${ahpHierarchy.goal}</div>
                </div>
                <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;margin-top:14px;">
                    ${ahpHierarchy.dimensions.map(d => `
                        <div class="ahp-dim-card">
                            <div class="ahp-dim-title">${d.title}</div>
                            <div class="ahp-dim-meta">${AHPCommon.faNum(d.factor_count)} عامل &middot; ${AHPCommon.faNum(d.comparison_count)} مقایسه</div>
                        </div>`).join('')}
                </div>
                <div style="margin-top:14px;font-size:13px;color:var(--text-secondary);line-height:2;">
                    <strong>تعداد مقایسه‌ها:</strong>
                    سطح ۲ (ابعاد): ${AHPCommon.faNum(c.level2_comparisons)} &nbsp;|&nbsp;
                    سطح ۳ (عوامل): ${AHPCommon.faNum(c.level3_comparisons)} &nbsp;|&nbsp;
                    <strong>جمع کل برای هر خبره: ${AHPCommon.faNum(c.total_comparisons)} مقایسه</strong>
                    &nbsp;|&nbsp; طیف: ساتی ۱ تا ۹ (مقایسه‌ها متقارن‌اند)
                </div>
            </div>
        </div>

        <div id="ahp-experts-container"></div>
        <div id="ahp-progress-container"></div>
        <div id="ahp-form-container"></div>
        <div id="ahp-results-container" style="margin-top:20px;"></div>`;

    renderAHPExperts();
    renderAHPResultsAll();
}

/* ───────────────────────── فهرست خبرگان ───────────────────────── */
function renderAHPExperts() {
    const el = document.getElementById('ahp-experts-container');
    const total = ahpHierarchy.counts.total_comparisons;
    el.innerHTML = `
        <div class="card" style="margin-bottom:16px;">
            <div class="card-header">
                <div>
                    <h3>&#128101; خبرگان شرکت‌کننده در AHP</h3>
                    <p style="font-size:12px;color:var(--text-muted);margin-top:4px;">
                        ${AHPCommon.faNum(ahpExperts.filter(e => e.completed).length)} تکمیل‌شده
                        &middot; ${AHPCommon.faNum(ahpExperts.filter(e => e.answered > 0 && !e.completed).length)} در حال پاسخ‌گویی
                        &middot; ${AHPCommon.faNum(ahpExperts.filter(e => e.answered === 0).length)} بدون پاسخ
                        &middot; ${AHPCommon.faNum(ahpExperts.filter(e => e.in_round1).length)} خبره راند اول دلفی
                    </p>
                </div>
            </div>
            <div class="card-body">
                <div class="table-wrapper">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>#</th><th>نخبه</th><th>سازمان</th><th>راند ۱</th><th>پیشرفت</th><th>درصد</th><th>وضعیت</th><th>عملیات</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${ahpExperts.map((e, i) => `
                                <tr>
                                    <td>${AHPCommon.faNum(i + 1)}</td>
                                    <td><strong>${e.name}</strong></td>
                                    <td style="font-size:12px;">${e.organization || AHP_DASH}</td>
                                    <td>${e.in_round1 ? '<span class="badge badge-success">شرکت‌کننده</span>' : '<span class="badge badge-info">جدید</span>'}</td>
                                    <td style="min-width:140px;">
                                        <div style="background:var(--border-light);border-radius:6px;height:8px;overflow:hidden;">
                                            <div style="background:${e.completed ? '#10b981' : 'var(--primary)'};height:100%;width:${e.percent}%;"></div>
                                        </div>
                                        <span style="font-size:11px;color:var(--text-muted);">${AHPCommon.faNum(e.answered)} / ${AHPCommon.faNum(total)}</span>
                                    </td>
                                    <td><strong>${AHPCommon.faPercent(e.percent)}</strong></td>
                                    <td>
                                        <span class="badge ${e.completed ? 'badge-success' : e.answered > 0 ? 'badge-warning' : 'badge-info'}">
                                            ${e.completed ? 'تکمیل‌شده' : e.answered > 0 ? 'در حال پاسخ‌گویی' : 'شروع‌نشده'}
                                        </span>
                                    </td>
                                    <td style="white-space:nowrap;">
                                        <button class="btn btn-outline btn-sm" style="font-size:11px;" onclick="selectAHPExpert(${e.expert_id})">
                                            ${e.answered > 0 ? 'ادامه' : 'شروع'}
                                        </button>
                                        <button class="btn btn-outline btn-sm" style="font-size:11px;" onclick="inviteAHPExpert(${e.expert_id}, '${(e.name || '').replace(/'/g, '')}')">&#9993; دعوت</button>
                                        <button class="btn btn-outline btn-sm" style="font-size:11px;" onclick="copyAHPLink(${e.expert_id})">&#128279; کپی لینک</button>
                                    </td>
                                </tr>`).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>`;
}

function ahpLink(expertId) {
    return `${location.origin}/ahp-survey?expert=${expertId}`;
}

function copyAHPLink(expertId) {
    const link = ahpLink(expertId);
    navigator.clipboard?.writeText(link).then(
        () => showToast('لینک پرسشنامه کپی شد'),
        () => showToast(link, 'info')
    );
}

async function inviteAHPExpert(expertId, name) {
    try {
        await api.post('/activities/', {
            expert_id: expertId,
            activity_type: 'دعوت ماژول AHP (مقایسه زوجی)',
            activity_status: 'در انتظار',
            activity_note: `لینک پرسشنامه AHP: ${ahpLink(expertId)}`
        });
        showToast(`دعوت «${name}» ثبت شد`);
    } catch (e) {
        showToast(e.message, 'error');
    }
}

/* ───────────────────────── انتخاب خبره + پرسشنامه ───────────────────────── */
async function selectAHPExpert(expertId) {
    ahpSelectedExpert = expertId;
    try {
        ahpQuestionnaire = await api.get(`/ahp/questionnaire?expert_id=${expertId}`);
    } catch (e) {
        showToast(e.message, 'error');
        return;
    }
    ahpValues = {};
    ahpQuestionnaire.questions.forEach(q => {
        if (q.value !== null && q.value !== undefined) ahpValues[AHPCommon.keyOf(q)] = q.value;
    });
    ahpDirty = [];
    renderAHPForm();
    document.getElementById('ahp-form-container').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderAHPForm() {
    const progressEl = document.getElementById('ahp-progress-container');
    const formEl = document.getElementById('ahp-form-container');
    const q = ahpQuestionnaire;
    if (!q) return;

    const expert = ahpExperts.find(e => e.expert_id === ahpSelectedExpert);
    AHPCommon.renderProgress(progressEl, q.answered, q.total,
        `<div class="ahp-progress-sub">نخبه: <strong>${expert ? expert.name : ''}</strong> &middot; ذخیره خودکار فعال است (قابل ادامه در مراجعه بعدی)</div>`);

    formEl.innerHTML = `
        <div class="card">
            <div class="card-header">
                <div>
                    <h3>&#9878; پرسشنامه مقایسه زوجی AHP</h3>
                    <p style="font-size:12px;color:var(--text-muted);margin-top:4px;">${q.goal}</p>
                </div>
                <div style="display:flex;gap:8px;">
                    <button type="button" class="btn btn-outline" style="font-size:12px;" onclick="saveAHPNow(false)">&#128190; ذخیره</button>
                    <button type="button" class="btn btn-outline" style="font-size:12px;" onclick="loadAHPResultsOnly()"> &#128200; محاسبه نتایج</button>
                </div>
            </div>
            <div class="card-body">
                <div class="ahp-scale-help">
                    <strong>طیف ساتی:</strong>
                    ${Object.entries(AHPCommon.SCALE).map(([k, v]) => `<span class="ahp-chip"><b>${AHPCommon.faNum(k)}</b> = ${v}</span>`).join('')}
                    <div style="margin-top:6px;font-size:12px;">اگر A نسبت به B امتیاز ۵ بگیرد، خانه B/A خودکار ۱/۵ می‌شود؛ خانه‌های قطری همیشه ۱ هستند.</div>
                </div>
                <div id="ahp-questions"></div>
            </div>
        </div>`;

    AHPCommon.renderForm(document.getElementById('ahp-questions'), ahpQuestionnaire.questions, {
        values: ahpValues,
        onChange: (item) => {
            const idx = ahpDirty.findIndex(d => d.level === item.level && d.parent === item.parent &&
                d.item_a === item.item_a && d.item_b === item.item_b);
            if (idx >= 0) ahpDirty[idx] = item; else ahpDirty.push(item);
            AHPCommon.updateProgress(countAnswered(), ahpQuestionnaire.total);
            scheduleAHPSave();
        }
    });
}

function countAnswered() {
    return Object.keys(ahpValues).length;
}

function scheduleAHPSave() {
    if (ahpSaveTimer) clearTimeout(ahpSaveTimer);
    ahpSaveTimer = setTimeout(() => saveAHPNow(true), 1200);
}

async function saveAHPNow(silent = false) {
    if (ahpSaveTimer) { clearTimeout(ahpSaveTimer); ahpSaveTimer = null; }
    if (!ahpSelectedExpert || ahpDirty.length === 0) {
        if (!silent) showToast('تغییری برای ذخیره نیست', 'info');
        return;
    }
    const items = ahpDirty.slice();
    ahpDirty = [];
    try {
        const res = await api.post('/ahp/comparisons', { expert_id: ahpSelectedExpert, items });
        AHPCommon.updateProgress(res.answered, res.total);
        if (!silent) showToast(`ذخیره شد (${AHPCommon.faNum(res.answered)} از ${AHPCommon.faNum(res.total)})`);
        if (res.completed) showToast('همه مقایسه‌ها تکمیل شد ✓', 'success');
        await loadAHPExpertsOnly();
        await loadAHPResultsOnly(silent);
    } catch (e) {
        ahpDirty = items.concat(ahpDirty);
        if (!silent) showToast(e.message, 'error');
    }
}

async function loadAHPExpertsOnly() {
    try {
        const data = await api.get('/ahp/experts');
        ahpExperts = data.experts || [];
        renderAHPExperts();
    } catch (e) { /* بی‌صدا */ }
}

function jumpToAHPMatrix(level, parent) {
    AHPCommon.jumpToMatrix(level, parent);
    document.getElementById('ahp-form-container').scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (level && !ahpQuestionnaire) showToast('ابتدا یک نخبه را برای ویرایش انتخاب کنید', 'info');
}

/* ───────────────────────── نتایج ───────────────────────── */
async function loadAHPResultsOnly(silent = false) {
    try {
        const params = ahpSelectedExpert ? `?expert_id=${ahpSelectedExpert}` : '';
        ahpResults = await api.get(`/ahp/results${params}`);
        renderAHPResultsAll();
        if (!silent) showToast('نتایج محاسبه شد', 'success');
    } catch (e) {
        showToast(e.message, 'error');
    }
}

function renderAHPResultsAll() {
    const el = document.getElementById('ahp-results-container');
    const r = ahpResults;
    if (!el) return;
    if (!r || r.experts_count === 0) {
        el.innerHTML = `
            <div class="card">
                <div class="card-header"><h3>&#128200; نتایج AHP</h3></div>
                <div class="card-body">
                    <div class="empty-state"><p>هنوز مقایسه‌ای ثبت نشده است؛ پس از ثبت اولین پاسخ‌ها، نتایج اینجا نمایش داده می‌شود.</p></div>
                </div>
            </div>`;
        return;
    }

    const dims = (r.dimensions || []).slice().sort((a, b) => a.rank - b.rank);
    const factors = (r.factors || []).slice().sort((a, b) => a.rank - b.rank);
    const cons = r.consistency || { group: [], experts: [], group_cr_max: 0 };

    el.innerHTML = `
        <div class="card" style="margin-bottom:16px;">
            <div class="card-header">
                <div>
                    <h3>&#128200; نتایج سطح ۲ — ابعاد اصلی</h3>
                    <p style="font-size:12px;color:var(--text-muted);margin-top:4px;">
                        تجمیع نظر ${AHPCommon.faNum(r.experts_count)} خبره با میانگین هندسی
                        &middot; CR ماتریس گروهی: <strong>${AHPCommon.faNum(cons.group_cr_max)}</strong>
                        <span class="badge ${cons.group_is_consistent ? 'badge-success' : 'badge-danger'}">${cons.group_is_consistent ? 'سازگار' : 'ناسازگار (CR ≥ ۰٫۱)'}</span>
                    </p>
                </div>
                <div style="display:flex;gap:8px;">
                    <button class="btn btn-outline" style="font-size:12px;" onclick="api.downloadFile('/ahp/export.json','ahp_results.json')">&#128196; JSON</button>
                    <button class="btn btn-outline" style="font-size:12px;" onclick="api.downloadFile('/ahp/export.csv','ahp_results.csv')">&#128202; Excel/CSV</button>
                </div>
            </div>
            <div class="card-body">
                <div class="table-wrapper">
                    <table class="data-table">
                        <thead><tr><th>بُعد</th><th>وزن</th><th>درصد</th><th>رتبه</th><th>تعداد عامل</th><th>تعداد مقایسه</th><th>CR گروهی</th></tr></thead>
                        <tbody>
                            ${dims.map(d => `
                                <tr>
                                    <td><strong>${d.title}</strong></td>
                                    <td><strong style="color:var(--primary);">${AHPCommon.faWeight(d.weight)}</strong></td>
                                    <td><strong>${AHPCommon.faPercent(d.percent)}</strong></td>
                                    <td><span class="badge badge-primary">${AHPCommon.faNum(d.rank)}</span></td>
                                    <td>${AHPCommon.faNum(d.factor_count)}</td>
                                    <td>${AHPCommon.faNum(d.comparison_count)}</td>
                                    <td>${AHPCommon.faNum(d.group_cr)}</td>
                                </tr>`).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <div class="card" style="margin-bottom:16px;">
            <div class="card-header"><h3>&#128203; نتایج نهایی سطح ۳ — عوامل (وزن جهانی)</h3></div>
            <div class="card-body">
                <div class="table-wrapper">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>رتبه</th><th>کد عامل</th><th>عنوان</th><th>بُعد</th>
                                <th>وزن محلی</th><th>وزن جهانی</th><th>درصد</th><th>میانگین دلفی</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${factors.map(f => `
                                <tr>
                                    <td><span class="badge ${f.rank <= 3 ? 'badge-success' : f.rank <= 10 ? 'badge-warning' : 'badge-info'}">${AHPCommon.faNum(f.rank)}</span></td>
                                    <td>${AHPCommon.faNum(f.code)}</td>
                                    <td><strong>${f.title}</strong></td>
                                    <td style="font-size:12px;">${f.dimension}</td>
                                    <td>${AHPCommon.faWeight(f.local_weight)}</td>
                                    <td><strong style="color:var(--primary);">${AHPCommon.faWeight(f.global_weight)}</strong></td>
                                    <td><strong>${AHPCommon.faPercent(f.percent)}</strong></td>
                                    <td>${f.delphi_mean !== null ? AHPCommon.faNum(f.delphi_mean) : AHP_DASH}</td>
                                </tr>`).join('')}
                        </tbody>
                    </table>
                </div>
                <div style="margin-top:10px;font-size:12px;color:var(--text-muted);">
                    جمع وزن نهایی: ${AHPCommon.faNum(r.totals.global_weight_sum)} (باید ۱ باشد) &middot;
                    «میانگین دلفی» امتیاز راند ۲ دلفی برای مقایسه با وزن AHP است.
                </div>
            </div>
        </div>

        <div class="card" style="margin-bottom:16px;">
            <div class="card-header">
                <div>
                    <h3>&#9878; جدول سازگاری (نرخ سازگاری CR)</h3>
                    <p style="font-size:12px;color:var(--text-muted);margin-top:4px;">اگر CR ≥ ۰٫۱ باشد، ماتریس ناسازگار است و باید بازبینی شود</p>
                </div>
            </div>
            <div class="card-body">
                <div class="table-wrapper">
                    <table class="data-table">
                        <thead>
                            <tr><th>خبره</th><th>تعداد مقایسه‌ها</th><th>CR فردی (حداکثر)</th><th>ماتریس ناسازگار</th><th>وضعیت</th><th>جزئیات</th></tr>
                        </thead>
                        <tbody>
                            ${cons.experts.map(e => `
                                <tr class="${e.is_consistent ? '' : 'ahp-row-warn'}">
                                    <td><strong>${e.name}</strong></td>
                                    <td>${AHPCommon.faNum(e.answered)} از ${AHPCommon.faNum(e.total)}</td>
                                    <td><strong>${AHPCommon.faNum(e.cr_max)}</strong></td>
                                    <td>${AHPCommon.faNum(e.inconsistent_matrices)}</td>
                                    <td><span class="badge ${e.is_consistent ? 'badge-success' : 'badge-danger'}">${e.is_consistent ? 'سازگار' : 'ناسازگار'}</span></td>
                                    <td style="white-space:nowrap;">
                                        ${e.matrices.filter(m => !m.is_consistent).map(m =>
                                            `<button class="btn btn-outline btn-sm" style="font-size:10px;margin:1px;" title="${m.matrix}: CR=${AHPCommon.faNum(m.cr)}" onclick="jumpToAHPMatrix(${m.level}, '${String(m.parent).replace(/'/g, "\\'")}')">ویرایش ${AHPCommon.faNum(m.cr)}</button>`
                                        ).join(' ') || AHP_DASH}
                                    </td>
                                </tr>
                                <tr class="ahp-detail-row" style="display:none;" id="ahp-cons-${e.expert_id}">
                                    <td colspan="6">
                                        ${e.matrices.map(m => `<div>${m.matrix}: ${AHPCommon.faNum(m.answered)}/${AHPCommon.faNum(m.total)} مقایسه، λmax=${AHPCommon.faNum(m.lambda_max)}، CI=${AHPCommon.faNum(m.ci)}، RI=${AHPCommon.faNum(m.ri)}، CR=<strong>${AHPCommon.faNum(m.cr)}</strong></div>`).join('')}
                                    </td>
                                </tr>`).join('')}
                            <tr style="background:var(--border-light);">
                                <td><strong>ماتریس گروهی</strong></td>
                                <td>${AHPCommon.faNum(r.comparison_count)} از ${AHPCommon.faNum(r.total_comparisons * r.experts_count)}</td>
                                <td><strong>${AHPCommon.faNum(cons.group_cr_max)}</strong></td>
                                <td>${AHPCommon.faNum((cons.group || []).filter(m => !m.is_consistent).length)}</td>
                                <td><span class="badge ${cons.group_is_consistent ? 'badge-success' : 'badge-danger'}">${cons.group_is_consistent ? 'سازگار' : 'ناسازگار'}</span></td>
                                <td>${(cons.group || []).map(m => `${m.matrix}: CR=${AHPCommon.faNum(m.cr)}`).join(' | ')}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div style="margin-top:10px;font-size:12px;color:var(--text-muted);">
                    CR = CI / RI با CI = (λmax − n)/(n − 1) و RIهای ساتی: n=3→۰٫۵۸، 4→۰٫۹۰، 5→۱٫۱۲، 6→۱٫۲۴، 7→۱٫۳۲.
                </div>
            </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
            <div class="card">
                <div class="card-header"><h3>&#128202; نمودار ستونی ۳۰ وزن نهایی</h3></div>
                <div class="card-body"><canvas id="chart-ahp-factors" height="260"></canvas></div>
            </div>
            <div class="card">
                <div class="card-header"><h3>&#128202; نمودار دایره‌ای اوزان ۶ بُعد</h3></div>
                <div class="card-body"><canvas id="chart-ahp-dims" height="260"></canvas></div>
            </div>
        </div>`;

    renderAHPCharts(r);
}

function renderAHPCharts(r) {
    if (typeof Chart === 'undefined') return;
    if (ahpCharts.factor) ahpCharts.factor.destroy();
    if (ahpCharts.dim) ahpCharts.dim.destroy();

    const finalWeights = (r.charts && r.charts.final_weights) || [];
    const dimWeights = (r.charts && r.charts.dimension_weights) || [];

    if (finalWeights.length) {
        ahpCharts.factor = new Chart(document.getElementById('chart-ahp-factors'), {
            type: 'bar',
            data: {
                labels: finalWeights.map(f => `${AHPCommon.faNum(f.code)} ${f.title.substring(0, 22)}${f.title.length > 22 ? '…' : ''}`),
                datasets: [{ label: 'وزن نهایی', data: finalWeights.map(f => (f.weight * 100).toFixed(2)), backgroundColor: '#2563eb' }]
            },
            options: {
                responsive: true, indexAxis: 'y',
                plugins: { legend: { display: false }, tooltip: { rtl: true } },
                scales: { x: { beginAtZero: true, title: { display: true, text: 'درصد وزن' } } }
            }
        });
    }

    if (dimWeights.length) {
        ahpCharts.dim = new Chart(document.getElementById('chart-ahp-dims'), {
            type: 'doughnut',
            data: {
                labels: dimWeights.map(d => d.title),
                datasets: [{ data: dimWeights.map(d => (d.weight * 100).toFixed(2)), backgroundColor: ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'] }]
            },
            options: { responsive: true, plugins: { legend: { position: 'bottom', labels: { font: { family: 'Vazirmatn' } } }, tooltip: { rtl: true } } }
        });
    }
}
