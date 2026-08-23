let analysisCharts = {};
let currentAnalysisTab = 'round1';

async function loadAnalysis() {
    try {
        const [stats, freqRound1, freqRound2, priorities, round1Responses, round2Responses] = await Promise.all([
            api.get('/analysis/research-stats'),
            api.get('/analysis/factor-frequency?round_no=1'),
            api.get('/analysis/factor-frequency?round_no=2'),
            api.get('/analysis/ahp-priorities'),
            api.get('/responses?round_no=1'),
            api.get('/responses?round_no=2')
        ]);
        renderAnalysis(stats, freqRound1, freqRound2, priorities, round1Responses, round2Responses);
    } catch (e) {
        showToast(e.message, 'error');
    }
}

function switchAnalysisTab(tab) {
    currentAnalysisTab = tab;
    document.querySelectorAll('.analysis-tab').forEach(t => t.classList.remove('active'));
    const btn = document.querySelector(`[data-tab="${tab}"]`);
    if (btn) btn.classList.add('active');
    document.getElementById('analysis-round1').style.display = tab === 'round1' ? 'block' : 'none';
    document.getElementById('analysis-round2').style.display = tab === 'round2' ? 'block' : 'none';
}

function renderAnalysis(stats, freqRound1, freqRound2, priorities, round1Responses, round2Responses) {
    const container = document.getElementById('section-analysis');
    const categories = stats.factor_categories || {};
    const kendallW = calculateKendallW(round2Responses);

    container.innerHTML = `
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon blue">&#128101;</div>
                <div class="stat-info">
                    <h4>${stats.total_experts}</h4>
                    <p>کل نخبگان</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon green">&#9998;</div>
                <div class="stat-info">
                    <h4>${round1Responses.length}</h4>
                    <p>پاسخ راند ۱</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon orange">&#128203;</div>
                <div class="stat-info">
                    <h4>${stats.unique_factors}</h4>
                    <p>عوامل یکتا</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon purple">&#9878;</div>
                <div class="stat-info">
                    <h4>${round2Responses.length}</h4>
                    <p>پاسخ راند ۲</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon green">&#128200;</div>
                <div class="stat-info">
                    <h4>${kendallW.w.toFixed(3)}</h4>
                    <p>Kendall's W</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon orange">&#128202;</div>
                <div class="stat-info">
                    <h4>${kendallW.pValue < 0.05 ? 'معنادار' : 'غیرمعنادار'}</h4>
                    <p>همبستگی (${kendallW.pValue.toFixed(3)})</p>
                </div>
            </div>
        </div>

        <div class="analysis-tabs">
            <button class="btn analysis-tab active" data-tab="round1" onclick="switchAnalysisTab('round1')">&#128221; تحلیل راند اول - شناسایی عوامل</button>
            <button class="btn analysis-tab" data-tab="round2" onclick="switchAnalysisTab('round2')">&#128200; تحلیل راند دوم - اولویت‌بندی</button>
        </div>

        <div id="analysis-round1">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                <div class="card">
                    <div class="card-header"><h3>&#128202; توزیع عوامل بر اساس دسته (راند ۱)</h3></div>
                    <div class="card-body"><canvas id="analysis-cat-chart" height="220"></canvas></div>
                </div>
                <div class="card">
                    <div class="card-header"><h3>&#128202; وضعیت پاسخ‌ها</h3></div>
                    <div class="card-body"><canvas id="analysis-status-chart" height="220"></canvas></div>
                </div>
            </div>

            <div class="card" style="margin-bottom: 20px;">
                <div class="card-header"><h3>&#128203; فهرست فراوانی عوامل (راند ۱)</h3></div>
                <div class="card-body">
                    ${freqRound1.length === 0 ? '<p style="color: var(--text-muted);">هنوز پاسخی در راند اول ثبت نشده</p>' : `
                    <div class="table-wrapper">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>عنوان عامل</th>
                                    <th>دسته</th>
                                    <th>فراوانی</th>
                                    <th>درصد</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${freqRound1.map((f, i) => `
                                    <tr>
                                        <td>${i + 1}</td>
                                        <td><strong>${f.title}</strong></td>
                                        <td><span class="badge badge-primary">${f.category || 'نامشخص'}</span></td>
                                        <td><strong>${f.count}</strong></td>
                                        <td>${f.percentage}%</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>`}
                </div>
            </div>

            <div class="card">
                <div class="card-header"><h3>&#128196; گزارش راند اول</h3></div>
                <div class="card-body">
                    <div style="background: var(--bg); border: 1px solid var(--border); border-radius: 8px; padding: 24px; font-size: 14px; line-height: 2.2;">
                        <h3 style="margin-bottom: 12px; font-size: 16px;">گزارش مرحله شناسایی عوامل</h3>
                        <p><strong>موضوع:</strong> بررسی عوامل مؤثر بر صادرات برق ایران با تأکید بر نیروگاه‌های خورشیدی</p>
                        <hr style="margin: 12px 0; border-color: var(--border);">
                        <ul style="padding-right: 20px; margin-bottom: 12px;">
                            <li>تعداد نخبگان: ${stats.total_experts} نفر</li>
                            <li>پاسخ‌های دریافتی: ${round1Responses.length}</li>
                            <li>تعداد کل عوامل: ${stats.total_factors_identified}</li>
                            <li>عوامل یکتا: ${stats.unique_factors}</li>
                            <li>میانگین عوامل به ازای هر نخبه: ${stats.average_factors_per_expert}</li>
                        </ul>
                        <p><strong>توزیع دسته‌بندی عوامل:</strong></p>
                        <ul style="padding-right: 20px;">
                            ${Object.entries(categories).map(([cat, count]) => `<li>${cat}: ${count} عامل</li>`).join('')}
                        </ul>
                    </div>
                </div>
            </div>
        </div>

        <div id="analysis-round2" style="display: none;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                <div class="card">
                    <div class="card-header"><h3>&#128200; اولویت‌بندی AHP</h3></div>
                    <div class="card-body"><canvas id="analysis-ahp-chart" height="220"></canvas></div>
                </div>
                <div class="card">
                    <div class="card-header"><h3>&#128196; فراوانی ۱۰ عامل اول (راند ۲)</h3></div>
                    <div class="card-body"><canvas id="analysis-freq-chart" height="220"></canvas></div>
                </div>
            </div>

            <div class="card" style="margin-bottom: 20px;">
                <div class="card-header"><h3>&#128200; تحلیل Kendall's W (همبستگی رتبه‌بندی)</h3></div>
                <div class="card-body">
                    <div style="background: var(--info-bg); border: 1px solid var(--info); border-radius: 8px; padding: 16px; margin-bottom: 16px; font-size: 13px; color: var(--info); line-height: 1.8;">
                        <strong>Kendall's W:</strong> ضریب همبستگی رتبه‌بندی نخبگان است. اگر نزدیک ۱ باشد یعنی نخبگان تقریباً هم‌نظر هستند.
                        اگر نزدیک ۰ باشد یعنی نظرات متفاوت است.
                    </div>
                    <div class="table-wrapper">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>شاخص</th>
                                    <th>مقدار</th>
                                    <th>تفسیر</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td><strong>Kendall's W</strong></td>
                                    <td><strong style="color: var(--primary);">${kendallW.w.toFixed(4)}</strong></td>
                                    <td>${kendallW.w > 0.7 ? 'همبستگی قوی' : kendallW.w > 0.4 ? 'همبستگی متوسط' : 'همبستگی ضعیف'}</td>
                                </tr>
                                <tr>
                                    <td><strong>Chi-Square</strong></td>
                                    <td>${kendallW.chiSquare.toFixed(4)}</td>
                                    <td>-</td>
                                </tr>
                                <tr>
                                    <td><strong>P-Value</strong></td>
                                    <td>${kendallW.pValue.toFixed(4)}</td>
                                    <td>${kendallW.pValue < 0.05 ? '<span style="color: var(--success);">معنادار (p&lt;0.05)</span>' : '<span style="color: var(--danger);">غیرمعنادار</span>'}</td>
                                </tr>
                                <tr>
                                    <td><strong>تعداد داوران</strong></td>
                                    <td>${kendallW.n}</td>
                                    <td>-</td>
                                </tr>
                                <tr>
                                    <td><strong>تعداد عوامل</strong></td>
                                    <td>${kendallW.k}</td>
                                    <td>-</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header"><h3>&#128196; گزارش راند دوم</h3></div>
                <div class="card-body">
                    <div style="background: var(--bg); border: 1px solid var(--border); border-radius: 8px; padding: 24px; font-size: 14px; line-height: 2.2;">
                        <h3 style="margin-bottom: 12px; font-size: 16px;">گزارش مرحله اولویت‌بندی</h3>
                        <ul style="padding-right: 20px; margin-bottom: 12px;">
                            <li>تعداد پاسخ‌های راند ۲: ${round2Responses.length}</li>
                            <li>ضریب همبستگی Kendall's W: ${kendallW.w.toFixed(4)}</li>
                            <li>وضعیت همبستگی: ${kendallW.w > 0.7 ? 'قوی' : kendallW.w > 0.4 ? 'متوسط' : 'ضعیف'}</li>
                            <li>معناداری آماری: ${kendallW.pValue < 0.05 ? 'بله' : 'خیر'}</li>
                        </ul>
                        ${priorities.factors && priorities.factors.length > 0 ? `
                        <p><strong>۵ عامل اول از نظر اولویت:</strong></p>
                        <ol style="padding-right: 20px;">
                            ${priorities.factors.slice(0, 5).map(f => `<li>${f.title} (${(f.weight * 100).toFixed(1)}%)</li>`).join('')}
                        </ol>` : ''}
                    </div>
                </div>
            </div>
        </div>`;

    setTimeout(() => {
        renderAnalysisCharts(stats, freqRound1, freqRound2, priorities);
    }, 100);
}

function renderAnalysisCharts(stats, freqRound1, freqRound2, priorities) {
    Object.values(analysisCharts).forEach(c => c.destroy());
    analysisCharts = {};

    const catData = stats.factor_categories || {};
    const catLabels = Object.keys(catData);
    const catValues = Object.values(catData);

    if (catLabels.length > 0 && document.getElementById('analysis-cat-chart')) {
        analysisCharts.cat = new Chart(document.getElementById('analysis-cat-chart'), {
            type: 'pie',
            data: {
                labels: catLabels,
                datasets: [{ data: catValues, backgroundColor: ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'] }]
            },
            options: { responsive: true, plugins: { legend: { position: 'bottom', labels: { font: { family: 'Vazirmatn', size: 11 } } } } }
        });
    }

    if (priorities.factors && priorities.factors.length > 0 && document.getElementById('analysis-ahp-chart')) {
        const top = priorities.factors.slice(0, 10);
        analysisCharts.ahp = new Chart(document.getElementById('analysis-ahp-chart'), {
            type: 'bar',
            data: {
                labels: top.map(f => f.title.substring(0, 20) + '...'),
                datasets: [{ label: 'وزن', data: top.map(f => (f.weight * 100).toFixed(1)), backgroundColor: '#8b5cf6' }]
            },
            options: { indexAxis: 'y', responsive: true, plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true } } }
        });
    }

    if (freqRound2.length > 0 && document.getElementById('analysis-freq-chart')) {
        const topFreq = freqRound2.slice(0, 10);
        analysisCharts.freq = new Chart(document.getElementById('analysis-freq-chart'), {
            type: 'bar',
            data: {
                labels: topFreq.map(f => f.title.substring(0, 18) + '...'),
                datasets: [{ label: 'فراوانی', data: topFreq.map(f => f.count), backgroundColor: '#10b981' }]
            },
            options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
        });
    }

    if (document.getElementById('analysis-status-chart')) {
        const completed = stats.completed_responses || 0;
        const total = stats.total_delphi_responses || 0;
        analysisCharts.status = new Chart(document.getElementById('analysis-status-chart'), {
            type: 'doughnut',
            data: {
                labels: ['تکمیل‌شده', 'ناتمام'],
                datasets: [{ data: [completed, total - completed], backgroundColor: ['#10b981', '#f59e0b'] }]
            },
            options: { responsive: true, plugins: { legend: { position: 'bottom', labels: { font: { family: 'Vazirmatn' } } } } }
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

    if (n < 2 || k < 2) {
        return { w: 0, chiSquare: 0, pValue: 1, n, k };
    }

    const ranks = {};
    factors.forEach(f => {
        const vals = experts.map(e => factorRatings[f][e] || 5);
        const sorted = [...vals].sort((a, b) => a - b);
        ranks[f] = vals.map(v => sorted.indexOf(v) + 1);
    });

    const rankSums = factors.map(f => {
        const r = ranks[f];
        return r.reduce((a, b) => a + b, 0);
    });

    const S = rankSums.reduce((sum, r) => sum + Math.pow(r - (n * (k + 1) / 2), 2), 0);
    const W = (12 * S) / (n * n * (k * k * k - k) / (k - 1 || 1));
    const chiSquare = n * (k - 1) * W;
    const pValue = 1 - chiSquareCDF(chiSquare, k - 1);

    return { w: Math.max(0, Math.min(1, W)), chiSquare, pValue, n, k };
}

function chiSquareCDF(x, k) {
    if (x <= 0) return 0;
    if (k <= 0) return 0;
    let sum = 0;
    for (let i = 0; i < k; i++) {
        sum += Math.pow(x / 2, i) / factorial(i);
    }
    return 1 - Math.exp(-x / 2) * sum;
}

function factorial(n) {
    if (n <= 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) result *= i;
    return result;
}
