let analysisCharts = {};
let currentAnalysisTab = 'round1';

async function loadAnalysis() {
    const el = document.getElementById('section-analysis');
    el.innerHTML = '<div class="card"><div class="card-body" style="text-align:center;padding:60px;color:var(--text-muted);"><div class="spinner" style="margin:0 auto 16px;"></div>در حال بارگذاری تحلیل‌ها...</div></div>';

    try {
        const [stats, freqRound1, freqRound2, priorities, round1Responses, round2Responses, round2Ratings, expertProgress] = await Promise.all([
            api.get('/analysis/research-stats'),
            api.get('/analysis/factor-frequency?round_no=1'),
            api.get('/analysis/factor-frequency?round_no=2'),
            api.get('/analysis/ahp-priorities'),
            api.get('/responses?round_no=1'),
            api.get('/responses?round_no=2'),
            api.get('/analysis/round2-ratings'),
            api.get('/expert-progress')
        ]);
        renderAnalysis(stats, freqRound1, freqRound2, priorities, round1Responses, round2Responses, round2Ratings, expertProgress);
    } catch (e) {
        showToast(e.message, 'error');
        el.innerHTML = `<div class="card"><div class="card-body" style="text-align:center;padding:40px;color:var(--danger);">خطا در بارگذاری: ${e.message}</div></div>`;
    }
}

function switchAnalysisTab(tab) {
    currentAnalysisTab = tab;
    document.querySelectorAll('.analysis-tab').forEach(t => t.classList.remove('active'));
    const btn = document.querySelector(`[data-tab="${tab}"]`);
    if (btn) btn.classList.add('active');
    ['round1', 'round2', 'overview'].forEach(t => {
        const el = document.getElementById(`analysis-${t}`);
        if (el) el.style.display = t === tab ? 'block' : 'none';
    });
}

function getRound1Stats(responses) {
    const completed = responses.filter(r => r.response_status === 'تکمیل‌شده').length;
    const totalFactors = responses.reduce((sum, r) => sum + (r.factors?.length || 0), 0);
    const expertsWithResponse = [...new Set(responses.map(r => r.expert_id))].length;
    return { completed, totalFactors, expertsWithResponse, total: responses.length };
}

function renderAnalysis(stats, freqRound1, freqRound2, priorities, round1Responses, round2Responses, round2Ratings, expertProgress) {
    const container = document.getElementById('section-analysis');
    const categories = stats.factor_categories || {};
    const kendallW = calculateKendallW(round2Responses);
    const r1s = getRound1Stats(round1Responses);

    // Expert progress stats
    const r1Done = expertProgress.filter(e => e.round1_status === 'تکمیل‌شده').length;
    const r2Done = expertProgress.filter(e => e.round2_status === 'تکمیل‌شده').length;
    const r1NotDone = expertProgress.filter(e => e.round1_status === 'انجام نشده').length;
    const r2NotDone = expertProgress.filter(e => e.round2_status === 'انجام نشده').length;
    const ahpExperts = expertProgress.filter(e => e.ahp_count > 0).length;

    container.innerHTML = `
        <div class="analysis-tabs" style="margin-bottom: 24px;">
            <button class="btn analysis-tab active" data-tab="round1" onclick="switchAnalysisTab('round1')">&#128221; راند اول - شناسایی عوامل</button>
            <button class="btn analysis-tab" data-tab="round2" onclick="switchAnalysisTab('round2')">&#128200; راند دوم - اولویت‌بندی</button>
            <button class="btn analysis-tab" data-tab="overview" onclick="switchAnalysisTab('overview')">&#128202; نمای کلی پژوهش</button>
        </div>

        <!-- ===== ROUND 1 TAB ===== -->
        <div id="analysis-round1">
            <div class="stats-grid" style="grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));">
                <div class="stat-card"><div class="stat-icon blue">&#128101;</div><div class="stat-info"><h4>${r1s.expertsWithResponse}</h4><p>نخبه پاسخ‌دهنده</p></div></div>
                <div class="stat-card"><div class="stat-icon green">&#9998;</div><div class="stat-info"><h4>${r1s.completed}/${r1s.total}</h4><p>پاسخ تکمیل‌شده</p></div></div>
                <div class="stat-card"><div class="stat-icon orange">&#128203;</div><div class="stat-info"><h4>${stats.unique_factors}</h4><p>عامل یکتا</p></div></div>
                <div class="stat-card"><div class="stat-icon purple">&#128230;</div><div class="stat-info"><h4>${r1s.totalFactors}</h4><p>کل عوامل ثبت‌شده</p></div></div>
                <div class="stat-card"><div class="stat-icon blue">&#128202;</div><div class="stat-info"><h4>${stats.average_factors_per_expert}</h4><p>میانگین هر نخبه</p></div></div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                <div class="card">
                    <div class="card-header"><h3>&#128202; توزیع عوامل بر اساس دسته</h3></div>
                    <div class="card-body"><canvas id="acat-chart" height="240"></canvas></div>
                </div>
                <div class="card">
                    <div class="card-header"><h3>&#128196; ۱۰ عامل پرتکرار</h3></div>
                    <div class="card-body"><canvas id="afreq1-chart" height="240"></canvas></div>
                </div>
            </div>

            <div class="card" style="margin-bottom: 20px;">
                <div class="card-header"><h3>&#128203; فهرست کامل عوامل شناسایی‌شده (${freqRound1.length} عامل)</h3></div>
                <div class="card-body">
                    ${freqRound1.length === 0 ? '<div class="empty-state"><p>هنوز پاسخی در راند اول ثبت نشده</p></div>' : `
                    <div class="table-wrapper">
                        <table class="data-table">
                            <thead><tr><th>رتبه</th><th>عنوان عامل</th><th>دسته</th><th>فراوانی</th><th>درصد</th><th>تعداد نخبه</th></tr></thead>
                            <tbody>${freqRound1.map((f, i) => `
                                <tr>
                                    <td><span class="badge ${i < 3 ? 'badge-success' : i < 6 ? 'badge-warning' : 'badge-info'}">${i + 1}</span></td>
                                    <td><strong>${f.title}</strong></td>
                                    <td><span class="badge badge-primary">${f.category || 'نامشخص'}</span></td>
                                    <td><strong>${f.count}</strong></td>
                                    <td>${f.percentage}%</td>
                                    <td>${f.response_count}</td>
                                </tr>`).join('')}
                            </tbody>
                        </table>
                    </div>`}
                </div>
            </div>
        </div>

        <!-- ===== ROUND 2 TAB ===== -->
        <div id="analysis-round2" style="display: none;">
            <div class="stats-grid" style="grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));">
                <div class="stat-card"><div class="stat-icon purple">&#9878;</div><div class="stat-info"><h4>${round2Responses.length}</h4><p>پاسخ راند ۲</p></div></div>
                <div class="stat-card"><div class="stat-icon green">&#128200;</div><div class="stat-info"><h4>${kendallW.w.toFixed(3)}</h4><p>Kendall's W</p></div></div>
                <div class="stat-card"><div class="stat-icon orange">&#128202;</div><div class="stat-info"><h4>${kendallW.pValue < 0.05 ? 'معنادار' : 'غیرمعنادار'}</h4><p>p=${kendallW.pValue.toFixed(3)}</p></div></div>
                <div class="stat-card"><div class="stat-icon blue">&#128101;</div><div class="stat-info"><h4>${round2Ratings.total_respondents}</h4><p>شرکت‌کننده</p></div></div>
                <div class="stat-card"><div class="stat-icon green">&#128230;</div><div class="stat-info"><h4>${round2Ratings.factors?.length || 0}</h4><p>عامل ارزیابی‌شده</p></div></div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                <div class="card">
                    <div class="card-header"><h3>&#128200; میانگین امتیازات عوامل</h3></div>
                    <div class="card-body"><canvas id="ar2-ratings-chart" height="280"></canvas></div>
                </div>
                <div class="card">
                    <div class="card-header"><h3>&#128202; پراکندگی امتیازات (انحراف معیار)</h3></div>
                    <div class="card-body"><canvas id="ar2-stddev-chart" height="280"></canvas></div>
                </div>
            </div>

            <div class="card" style="margin-bottom: 20px;">
                <div class="card-header"><h3>&#9878; تحلیل Kendall's W</h3></div>
                <div class="card-body">
                    <div class="info-box" style="margin-bottom: 16px;">
                        <strong>Kendall's W:</strong> ضریب توافق بین ارزیاب‌ها. مقادیر نزدیک ۱ = توافق بالا. p-value کمتر از ۰.۰۵ = توافق معنادار آماری.
                    </div>
                    <div class="table-wrapper">
                        <table class="data-table">
                            <thead><tr><th>شاخص</th><th>مقدار</th><th>تفسیر</th></tr></thead>
                            <tbody>
                                <tr><td><strong>Kendall's W</strong></td><td><strong style="color:var(--primary);">${kendallW.w.toFixed(4)}</strong></td><td>${kendallW.w > 0.7 ? 'توافق قوی' : kendallW.w > 0.4 ? 'توافق متوسط' : 'توافق ضعیف'}</td></tr>
                                <tr><td><strong>Chi-Square</strong></td><td>${kendallW.chiSquare.toFixed(4)}</td><td>-</td></tr>
                                <tr><td><strong>P-Value</strong></td><td>${kendallW.pValue.toFixed(4)}</td><td>${kendallW.pValue < 0.05 ? '<span style="color:var(--success);">معنادار (p<0.05)</span>' : '<span style="color:var(--danger);">غیرمعنادار</span>'}</td></tr>
                                <tr><td><strong>تعداد ارزیاب</strong></td><td>${kendallW.n}</td><td>-</td></tr>
                                <tr><td><strong>تعداد عوامل</strong></td><td>${kendallW.k}</td><td>-</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header"><h3>&#128203; جدول امتیازات عوامل (${round2Ratings.factors?.length || 0} عامل)</h3></div>
                <div class="card-body">
                    ${!round2Ratings.factors || round2Ratings.factors.length === 0 ? '<div class="empty-state"><p>هنوز پاسخی در راند دوم ثبت نشده</p></div>' : `
                    <div class="table-wrapper">
                        <table class="data-table">
                            <thead><tr><th>رتبه</th><th>عامل</th><th>دسته</th><th>میانگین</th><th>کمترین</th><th>بیشترین</th><th>انحراف</th><th>رأی</th></tr></thead>
                            <tbody>${round2Ratings.factors.map((f, i) => `
                                <tr>
                                    <td><span class="badge ${i < 3 ? 'badge-success' : i < 6 ? 'badge-warning' : 'badge-info'}">${i + 1}</span></td>
                                    <td><strong>${f.title}</strong></td>
                                    <td><span class="badge badge-primary">${f.category || 'نامشخص'}</span></td>
                                    <td><strong style="color:var(--primary);">${f.average_rating}</strong></td>
                                    <td>${f.min_rating}</td>
                                    <td>${f.max_rating}</td>
                                    <td>${f.std_dev}</td>
                                    <td>${f.rating_count}</td>
                                </tr>`).join('')}
                            </tbody>
                        </table>
                    </div>`}
                </div>
            </div>
        </div>

        <!-- ===== OVERVIEW TAB ===== -->
        <div id="analysis-overview" style="display: none;">
            <div class="stats-grid" style="grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));">
                <div class="stat-card"><div class="stat-icon blue">&#128101;</div><div class="stat-info"><h4>${stats.total_experts}</h4><p>کل نخبگان</p></div></div>
                <div class="stat-card"><div class="stat-icon green">&#10003;</div><div class="stat-info"><h4>${r1Done}</h4><p>راند ۱ تکمیل</p></div></div>
                <div class="stat-card"><div class="stat-icon purple">&#10003;</div><div class="stat-info"><h4>${r2Done}</h4><p>راند ۲ تکمیل</p></div></div>
                <div class="stat-card"><div class="stat-icon orange">&#128200;</div><div class="stat-info"><h4>${ahpExperts}</h4><p>AHP انجام‌شده</p></div></div>
                <div class="stat-card"><div class="stat-icon blue">&#128230;</div><div class="stat-info"><h4>${stats.unique_factors}</h4><p>عوامل یکتا</p></div></div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                <div class="card">
                    <div class="card-header"><h3>&#128101; وضعیت مشارکت نخبگان</h3></div>
                    <div class="card-body"><canvas id="aover-participation-chart" height="240"></canvas></div>
                </div>
                <div class="card">
                    <div class="card-header"><h3>&#128202; مقایسه دو راند</h3></div>
                    <div class="card-body"><canvas id="aover-compare-chart" height="240"></canvas></div>
                </div>
            </div>

            <div class="card">
                <div class="card-header"><h3>&#128196; خلاصه پژوهش</h3></div>
                <div class="card-body">
                    <div style="background:var(--bg);border:1px solid var(--border);border-radius:12px;padding:24px;font-size:14px;line-height:2.2;">
                        <h3 style="margin-bottom:12px;font-size:16px;color:var(--primary);">گزارش نهایی پژوهش دلفی</h3>
                        <p><strong>موضوع:</strong> بررسی عوامل مؤثر بر صادرات برق ایران با تأکید بر نیروگاه‌های خورشیدی</p>
                        <hr style="margin:12px 0;border-color:var(--border);">
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
                            <div>
                                <h4 style="font-size:14px;margin-bottom:8px;color:var(--primary);">مرحله اول - شناسایی</h4>
                                <ul style="padding-right:20px;">
                                    <li>نخبگان ثبت‌شده: <strong>${stats.total_experts}</strong> نفر</li>
                                    <li>پاسخ‌های دریافتی: <strong>${round1Responses.length}</strong></li>
                                    <li>عوامل یکتا: <strong>${stats.unique_factors}</strong></li>
                                    <li>میانگین عوامل: <strong>${stats.average_factors_per_expert}</strong></li>
                                </ul>
                            </div>
                            <div>
                                <h4 style="font-size:14px;margin-bottom:8px;color:var(--primary);">مرحله دوم - اولویت‌بندی</h4>
                                <ul style="padding-right:20px;">
                                    <li>پاسخ‌های دریافتی: <strong>${round2Responses.length}</strong></li>
                                    <li>Kendall's W: <strong>${kendallW.w.toFixed(3)}</strong> (${kendallW.w > 0.7 ? 'توافق قوی' : kendallW.w > 0.4 ? 'متوسط' : 'ضعیف'})</li>
                                    <li>معناداری: <strong>${kendallW.pValue < 0.05 ? 'بله' : 'خیر'}</strong></li>
                                    <li>مقایسه AHP: <strong>${ahpExperts}</strong> نخبه</li>
                                </ul>
                            </div>
                        </div>
                        ${priorities.factors && priorities.factors.length > 0 ? `
                        <hr style="margin:12px 0;border-color:var(--border);">
                        <p><strong>۵ عامل برتر (AHP):</strong></p>
                        <ol style="padding-right:20px;">${priorities.factors.slice(0,5).map(f => `<li><strong>${f.title}</strong> - ${(f.weight*100).toFixed(1)}%</li>`).join('')}</ol>` : ''}
                        ${round2Ratings.factors && round2Ratings.factors.length > 0 ? `
                        <p style="margin-top:8px;"><strong>۵ عامل برتر (میانگین امتیازات):</strong></p>
                        <ol style="padding-right:20px;">${round2Ratings.factors.slice(0,5).map(f => `<li><strong>${f.title}</strong> - ${f.average_rating}</li>`).join('')}</ol>` : ''}
                    </div>
                </div>
            </div>
        </div>`;

    setTimeout(() => renderAllCharts(stats, freqRound1, freqRound2, priorities, round1Responses, round2Responses, round2Ratings, expertProgress), 150);
}

function renderAllCharts(stats, freqRound1, freqRound2, priorities, r1Res, r2Res, r2Ratings, expertProgress) {
    Object.values(analysisCharts).forEach(c => { try { c.destroy(); } catch(e) {} });
    analysisCharts = {};

    const catData = stats.factor_categories || {};
    const catLabels = Object.keys(catData);
    const catValues = Object.values(catData);
    const colors6 = ['#2563eb','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4'];

    // Round 1: Category pie
    if (catLabels.length > 0 && document.getElementById('acat-chart')) {
        analysisCharts.acat = new Chart(document.getElementById('acat-chart'), {
            type: 'doughnut',
            data: { labels: catLabels, datasets: [{ data: catValues, backgroundColor: colors6 }] },
            options: { responsive: true, plugins: { legend: { position: 'bottom', labels: { font: { family: 'Vazirmatn', size: 11 } } } } }
        });
    }

    // Round 1: Top 10 factors bar
    if (freqRound1.length > 0 && document.getElementById('afreq1-chart')) {
        const top = freqRound1.slice(0, 10);
        analysisCharts.afreq1 = new Chart(document.getElementById('afreq1-chart'), {
            type: 'bar',
            data: { labels: top.map(f => f.title.length > 25 ? f.title.substring(0,25)+'...' : f.title), datasets: [{ data: top.map(f => f.count), backgroundColor: colors6[0] }] },
            options: { indexAxis: 'y', responsive: true, plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true, ticks: { stepSize: 1 } } } }
        });
    }

    // Round 2: Average ratings bar
    if (r2Ratings.factors && r2Ratings.factors.length > 0 && document.getElementById('ar2-ratings-chart')) {
        const top = r2Ratings.factors.slice(0, 10);
        analysisCharts.ar2r = new Chart(document.getElementById('ar2-ratings-chart'), {
            type: 'bar',
            data: { labels: top.map(f => f.title.length > 25 ? f.title.substring(0,25)+'...' : f.title), datasets: [{ label: 'میانگین', data: top.map(f => f.average_rating), backgroundColor: '#8b5cf6' }] },
            options: { indexAxis: 'y', responsive: true, plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true, max: 9 } } }
        });
    }

    // Round 2: Std dev bubble
    if (r2Ratings.factors && r2Ratings.factors.length > 0 && document.getElementById('ar2-stddev-chart')) {
        const top = r2Ratings.factors.slice(0, 10);
        analysisCharts.ar2sd = new Chart(document.getElementById('ar2-stddev-chart'), {
            type: 'bar',
            data: { labels: top.map(f => f.title.length > 25 ? f.title.substring(0,25)+'...' : f.title), datasets: [{ label: 'انحراف معیار', data: top.map(f => f.std_dev), backgroundColor: '#f59e0b' }] },
            options: { indexAxis: 'y', responsive: true, plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true } } }
        });
    }

    // Overview: Participation
    if (document.getElementById('aover-participation-chart')) {
        const r1Done = expertProgress.filter(e => e.round1_status === 'تکمیل‌شده').length;
        const r2Done = expertProgress.filter(e => e.round2_status === 'تکمیل‌شده').length;
        const r1Pending = expertProgress.filter(e => e.round1_status !== 'انجام نشده' && e.round1_status !== 'تکمیل‌شده').length;
        const r2Pending = expertProgress.filter(e => e.round2_status !== 'انجام نشده' && e.round2_status !== 'تکمیل‌شده').length;
        const r1None = expertProgress.filter(e => e.round1_status === 'انجام نشده').length;
        const r2None = expertProgress.filter(e => e.round2_status === 'انجام نشده').length;
        const ahpDone = expertProgress.filter(e => e.ahp_count > 0).length;
        const ahpNone = expertProgress.filter(e => e.ahp_count === 0).length;

        analysisCharts.aoverp = new Chart(document.getElementById('aover-participation-chart'), {
            type: 'bar',
            data: {
                labels: ['راند ۱', 'راند ۲', 'AHP'],
                datasets: [
                    { label: 'تکمیل‌شده', data: [r1Done, r2Done, ahpDone], backgroundColor: '#10b981' },
                    { label: 'در انتظار/ناقص', data: [r1Pending, r2Pending, 0], backgroundColor: '#f59e0b' },
                    { label: 'انجام نشده', data: [r1None, r2None, ahpNone], backgroundColor: '#e2e8f0' }
                ]
            },
            options: { responsive: true, scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true, ticks: { stepSize: 1 } } }, plugins: { legend: { position: 'bottom', labels: { font: { family: 'Vazirmatn' } } } } }
        });
    }

    // Overview: Compare rounds
    if (document.getElementById('aover-compare-chart')) {
        analysisCharts.aoverc = new Chart(document.getElementById('aover-compare-chart'), {
            type: 'bar',
            data: {
                labels: ['نخبگان', 'پاسخ‌ها', 'عوامل یکتا', 'AHP'],
                datasets: [{ label: 'مقدار', data: [stats.total_experts, stats.total_delphi_responses, stats.unique_factors, stats.total_ahp_comparisons], backgroundColor: ['#2563eb','#10b981','#f59e0b','#8b5cf6'] }]
            },
            options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
        });
    }
}

function calculateKendallW(responses) {
    if (!responses || responses.length < 2) {
        return { w: 0, chiSquare: 0, pValue: 1, n: responses?.length || 0, k: 0 };
    }

    const factorRatings = {};
    responses.forEach(r => {
        r.factors?.forEach(f => {
            if (!factorRatings[f.factor_text]) factorRatings[f.factor_text] = {};
            factorRatings[f.factor_text][r.expert_id] = f.rating || 5;
        });
    });

    const factors = Object.keys(factorRatings);
    const experts = [...new Set(responses.map(r => r.expert_id))];
    const n = experts.length;
    const k = factors.length;

    if (n < 2 || k < 2) return { w: 0, chiSquare: 0, pValue: 1, n, k };

    // Rank within each expert
    const ranks = {};
    experts.forEach(eid => {
        const pairs = factors.map(f => ({ factor: f, rating: factorRatings[f][eid] || 5 }));
        pairs.sort((a, b) => b.rating - a.rating);
        let currentRank = 1;
        let i = 0;
        while (i < pairs.length) {
            let j = i;
            while (j < pairs.length && pairs[j].rating === pairs[i].rating) j++;
            const avgRank = (i + 1 + j) / 2;
            for (let t = i; t < j; t++) {
                if (!ranks[pairs[t].factor]) ranks[pairs[t].factor] = [];
                ranks[pairs[t].factor].push(avgRank);
            }
            i = j;
        }
    });

    const rankSums = factors.map(f => ranks[f].reduce((a, b) => a + b, 0));
    const meanRank = n * (k + 1) / 2;
    const S = rankSums.reduce((sum, r) => sum + Math.pow(r - meanRank, 2), 0);
    const denominator = n * n * (k * k * k - k) / (k - 1 || 1);
    const W = denominator > 0 ? (12 * S) / denominator : 0;
    const chiSquare = n * (k - 1) * W;
    const pValue = 1 - chiSquareCDF(chiSquare, k - 1);

    return { w: Math.max(0, Math.min(1, W)), chiSquare, pValue, n, k };
}

function chiSquareCDF(x, k) {
    if (x <= 0 || k <= 0) return 0;
    let sum = 0;
    for (let i = 0; i < k; i++) sum += Math.pow(x / 2, i) / factorial(i);
    return 1 - Math.exp(-x / 2) * sum;
}

function factorial(n) {
    if (n <= 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) result *= i;
    return result;
}