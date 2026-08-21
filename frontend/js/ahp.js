let ahpFactors = [];
let ahpExperts = [];
let ahpComparisons = {};
let selectedAHPExpert = null;

async function loadAHP() {
    try {
        ahpFactors = await api.get('/analysis/ahp-factors');
        ahpExperts = await api.get('/experts');
    } catch (e) {
        showToast(e.message, 'error');
    }
    renderAHPSection();
}

function renderAHPSection() {
    const container = document.getElementById('section-ahp');
    container.innerHTML = `
        <div class="card" style="margin-bottom: 20px;">
            <div class="card-header">
                <h3>&#9878; انتخاب نخبه برای مقایسه زوجی</h3>
            </div>
            <div class="card-body">
                <p style="font-size: 14px; color: var(--text-secondary); margin-bottom: 16px;">
                    ابتدا نخبه مورد نظر را انتخاب کنید تا فرم مقایسه زوجی AHP برای او نمایش داده شود.
                </p>
                <select class="form-select" id="ahp-expert-select" onchange="selectAHPExpert(this.value)" style="max-width: 400px;">
                    <option value="">انتخاب نخبه...</option>
                    ${ahpExperts.map(e => `<option value="${e.expert_id}">${e.full_name} - ${e.organization}</option>`).join('')}
                </select>
            </div>
        </div>
        <div id="ahp-form-container"></div>
        <div id="ahp-results-container" style="margin-top: 20px;"></div>`;
}

async function selectAHPExpert(expertId) {
    if (!expertId) {
        document.getElementById('ahp-form-container').innerHTML = '';
        document.getElementById('ahp-results-container').innerHTML = '';
        return;
    }
    selectedAHPExpert = parseInt(expertId);
    ahpComparisons = {};

    try {
        const existing = await api.get(`/analysis/ahp-comparisons?expert_id=${selectedAHPExpert}`);
        existing.forEach(c => {
            ahpComparisons[`${c.factor_a_id}_${c.factor_b_id}`] = c.value;
        });
    } catch (e) { }

    renderAHPForm();
    loadAHPResults();
}

function renderAHPForm() {
    const container = document.getElementById('ahp-form-container');
    if (ahpFactors.length < 2) {
        container.innerHTML = '<div class="card"><div class="card-body"><p>حداقل دو عامل برای مقایسه زوجی نیاز است.</p></div></div>';
        return;
    }

    const scaleLabels = {
        1: 'یکسان',
        2: 'ضعفی',
        3: 'متوسط',
        4: 'ضعیف قوی',
        5: 'متوسط قوی',
        6: 'قوی',
        7: 'خیلی قوی',
        8: 'خیلی خیلی قوی',
        9: 'مطلق'
    };

    let pairsHTML = '';
    for (let i = 0; i < ahpFactors.length; i++) {
        for (let j = i + 1; j < ahpFactors.length; j++) {
            const fa = ahpFactors[i];
            const fb = ahpFactors[j];
            const key = `${fa.ahp_factor_id}_${fb.ahp_factor_id}`;
            const reverseKey = `${fb.ahp_factor_id}_${fa.ahp_factor_id}`;
            const existingVal = ahpComparisons[key] || ahpComparisons[reverseKey] || 1;

            pairsHTML += `
                <div class="factor-row" style="grid-template-columns: 1fr auto 1fr; align-items: center; padding: 16px;">
                    <div style="text-align: right;">
                        <strong style="font-size: 14px;">${fa.title}</strong>
                        <div style="font-size: 12px; color: var(--text-muted);">${fa.category}</div>
                    </div>
                    <div style="display: flex; flex-direction: column; align-items: center; min-width: 200px;">
                        <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">میزان اهمیت نسبی</div>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <input type="range" min="1" max="9" step="1" value="${existingVal}" 
                                id="comp_${fa.ahp_factor_id}_${fb.ahp_factor_id}"
                                oninput="updateCompValue(${fa.ahp_factor_id}, ${fb.ahp_factor_id}, this.value)"
                                style="width: 120px;">
                            <span id="comp_label_${fa.ahp_factor_id}_${fb.ahp_factor_id}" 
                                style="min-width: 60px; text-align: center; font-weight: 700; color: var(--primary); font-size: 16px;">${existingVal}</span>
                        </div>
                        <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;" id="comp_text_${fa.ahp_factor_id}_${fb.ahp_factor_id}">
                            ${scaleLabels[existingVal] || ''}
                        </div>
                        <div style="display: flex; justify-content: space-between; width: 120px; font-size: 10px; color: var(--text-muted); margin-top: 2px;">
                            <span>۱</span><span>۵</span><span>۹</span>
                        </div>
                    </div>
                    <div style="text-align: left;">
                        <strong style="font-size: 14px;">${fb.title}</strong>
                        <div style="font-size: 12px; color: var(--text-muted);">${fb.category}</div>
                    </div>
                </div>`;
        }
    }

    container.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3>&#9878; فرم مقایسه زوجی AHP</h3>
            </div>
            <div class="card-body">
                <div style="background: var(--info-bg); border: 1px solid var(--info); border-radius: 8px; padding: 16px; margin-bottom: 20px; font-size: 13px; color: var(--info);">
                    <strong>راهنما:</strong> برای هر جفت عامل، میزان اهمیت نسبی یکی نسبت به دیگری را با استفاده از مقیاس ۱ تا ۹ مشخص کنید.
                    عدد ۱ یعنی هر دو یکسان مهم هستند. عدد ۹ یعنی عامل سمت چپ بسیار مهم‌تر است.
                </div>
                <form id="ahpForm" onsubmit="saveAHPComparisons(event)">
                    ${pairsHTML}
                    <div style="margin-top: 20px;">
                        <button type="submit" class="btn btn-primary btn-lg">ذخیره مقایسه‌ها</button>
                    </div>
                </form>
            </div>
        </div>`;
}

function updateCompValue(factorAId, factorBId, value) {
    const key = `${factorAId}_${factorBId}`;
    ahpComparisons[key] = parseInt(value);
    document.getElementById(`comp_label_${factorAId}_${factorBId}`).textContent = value;

    const scaleLabels = {
        1: 'یکسان', 2: 'ضعفی', 3: 'متوسط', 4: 'ضعیف قوی', 5: 'متوسط قوی',
        6: 'قوی', 7: 'خیلی قوی', 8: 'خیلی خیلی قوی', 9: 'مطلق'
    };
    document.getElementById(`comp_text_${factorAId}_${factorBId}`).textContent = scaleLabels[value] || '';
}

async function saveAHPComparisons(e) {
    e.preventDefault();
    if (!selectedAHPExpert) {
        showToast('ابتدا نخبه را انتخاب کنید', 'error');
        return;
    }

    const comparisons = [];
    for (const key in ahpComparisons) {
        const [aId, bId] = key.split('_').map(Number);
        comparisons.push({
            expert_id: selectedAHPExpert,
            factor_a_id: aId,
            factor_b_id: bId,
            value: ahpComparisons[key]
        });
    }

    if (comparisons.length === 0) {
        showToast('حداقل یک مقایسه ثبت کنید', 'error');
        return;
    }

    try {
        await api.post('/analysis/ahp-comparisons/batch', comparisons);
        showToast('مقایسه‌ها با موفقیت ذخیره شد');
        loadAHPResults();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function loadAHPResults() {
    try {
        const result = await api.get(`/analysis/ahp-priorities?expert_id=${selectedAHPExpert}`);
        renderAHPResults(result);
    } catch (e) {
        console.error(e);
    }
}

function renderAHPResults(data) {
    const container = document.getElementById('ahp-results-container');
    if (!data.factors || data.factors.length === 0) {
        container.innerHTML = '';
        return;
    }

    const maxWeight = Math.max(...data.factors.map(f => f.weight));

    container.innerHTML = `
        <div class="card" style="margin-bottom: 20px;">
            <div class="card-header">
                <h3>&#128200; نتایج اولویت‌بندی AHP</h3>
            </div>
            <div class="card-body">
                <div class="table-wrapper">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>رتبه</th>
                                <th>عامل</th>
                                <th>دسته</th>
                                <th>وزن اولویت</th>
                                <th>نمودار</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.factors.map(f => `
                                <tr>
                                    <td><span class="badge ${f.rank <= 3 ? 'badge-success' : f.rank <= 6 ? 'badge-warning' : 'badge-info'}">${f.rank}</span></td>
                                    <td><strong>${f.title}</strong></td>
                                    <td><span class="badge badge-primary">${f.category}</span></td>
                                    <td><strong style="color: var(--primary);">${(f.weight * 100).toFixed(1)}%</strong></td>
                                    <td>
                                        <div style="background: var(--border-light); border-radius: 4px; height: 20px; width: 200px; overflow: hidden;">
                                            <div style="background: linear-gradient(90deg, var(--primary), var(--accent)); height: 100%; width: ${(f.weight / maxWeight * 100).toFixed(0)}%; border-radius: 4px;"></div>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        ${data.consistency && data.consistency.length > 0 ? `
        <div class="card">
            <div class="card-header">
                <h3>&#9878; بررسی سازگاری (Consistency)</h3>
            </div>
            <div class="card-body">
                <div style="background: var(--info-bg); border: 1px solid var(--info); border-radius: 8px; padding: 12px; margin-bottom: 16px; font-size: 13px; color: var(--info);">
                    اگر CR کمتر از ۰.۱ باشد، مقایسه‌ها سازگار هستند.
                </div>
                <div class="table-wrapper">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>نخبه</th>
                                <th>CR</th>
                                <th>λmax</th>
                                <th>CI</th>
                                <th>RI</th>
                                <th>وضعیت</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.consistency.map(c => `
                                <tr>
                                    <td><strong>${c.expert_name}</strong></td>
                                    <td><strong>${c.consistency_ratio.toFixed(4)}</strong></td>
                                    <td>${c.lambda_max.toFixed(4)}</td>
                                    <td>${c.ci.toFixed(4)}</td>
                                    <td>${c.si.toFixed(4)}</td>
                                    <td>
                                        <span class="badge ${c.is_consistent ? 'badge-success' : 'badge-danger'}">
                                            ${c.is_consistent ? 'سازگار' : 'ناسازگار'}
                                        </span>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>` : ''}`;
}
