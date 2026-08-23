let currentSection = 'dashboard';
let selectedExpertId = null;

function showSection(section) {
    document.querySelectorAll('.section').forEach(s => s.style.display = 'none');
    const el = document.getElementById(`section-${section}`);
    if (el) el.style.display = 'block';
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    event?.target?.closest?.('.nav-item')?.classList.add('active');
    currentSection = section;

    const titles = {
        dashboard: ['داشبورد', 'نمای کلی سامانه مدیریت پژوهش دلفی'],
        experts: ['مدیریت نخبگان', 'ثبت و ویرایش فهرست نخبگان'],
        delphi: ['راند اول دلفی', 'انتخاب نخبه و ثبت پاسخ راند اول'],
        finalfactors: ['بانک عوامل نهایی', 'مدیریت و ویرایش عوامل شناسایی‌شده برای راند دوم'],
        round2: ['راند دوم دلفی', 'مشاهده پاسخ‌های راند دوم و اولویت‌بندی'],
        ahp: ['مقایسه زوجی AHP', 'اولویت‌بندی عوامل با روش تحلیل سلسله مراتبی'],
        analysis: ['تحلیل آماری', 'آمار توصیفی، نمودارها و تحلیل فراوانی'],
        factorbank: ['بانک عوامل مرجع', 'فهرست پیشنهادی عوامل مرجع پژوهش'],
        activities: ['پیگیری‌ها', 'مدیریت فعالیت‌ها و پیگیری‌های نخبگان'],
        exports: ['خروجی‌ها', 'دریافت گزارش‌ها و خروجی‌های مختلف'],
        settings: ['تنظیمات فرم', 'ویرایش عنوان‌ها و متون فرم‌های پرسشنامه']
    };
    document.getElementById('page-title').textContent = titles[section]?.[0] || '';
    document.getElementById('page-subtitle').textContent = titles[section]?.[1] || '';

    if (section === 'dashboard') loadDashboard();
    else if (section === 'experts') loadExperts();
    else if (section === 'delphi') loadDelphiSection();
    else if (section === 'finalfactors') loadFinalFactors();
    else if (section === 'round2') loadRound2();
    else if (section === 'ahp') loadAHP();
    else if (section === 'analysis') loadAnalysis();
    else if (section === 'factorbank') loadFactorBank();
    else if (section === 'activities') loadActivities();
    else if (section === 'exports') loadExports();
    else if (section === 'settings') loadSettings();

    document.getElementById('sidebar').classList.remove('open');
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
}

function toggleTheme() {
    const html = document.documentElement;
    const current = html.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    document.querySelector('.theme-toggle').textContent = next === 'dark' ? '&#9788;' : '&#9790;';
}

async function loadDashboard() {
    try {
        const stats = await api.get('/dashboard');
        const researchStats = await api.get('/analysis/research-stats');
        const frequency = await api.get('/analysis/factor-frequency');
        const priorities = await api.get('/analysis/ahp-priorities');
        const expertProgress = await api.get('/expert-progress');

        document.getElementById('section-dashboard').innerHTML = `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon blue">&#9786;</div>
                    <div class="stat-info">
                        <h4>${stats.total_experts}</h4>
                        <p>نخبه ثبت‌شده</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon green">&#9998;</div>
                    <div class="stat-info">
                        <h4>${stats.completed_responses}/${stats.total_responses}</h4>
                        <p>راند اول تکمیل</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon purple">&#9878;</div>
                    <div class="stat-info">
                        <h4>${researchStats.unique_factors || 0}</h4>
                        <p>عوامل یکتا</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon orange">&#128200;</div>
                    <div class="stat-info">
                        <h4>${researchStats.total_ahp_comparisons || 0}</h4>
                        <p>مقایسه AHP</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon green">&#10003;</div>
                    <div class="stat-info">
                        <h4>${researchStats.average_factors_per_expert || 0}</h4>
                        <p>میانگین عوامل/نخبه</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon orange">&#8987;</div>
                    <div class="stat-info">
                        <h4>${stats.pending_activities}</h4>
                        <p>پیگیری در انتظار</p>
                    </div>
                </div>
            </div>

            <div class="card" style="margin-bottom: 20px;">
                <div class="card-header"><h3>&#128203; وضعیت پیشرفت نخبگان</h3></div>
                <div class="card-body">
                    ${expertProgress.length === 0 ? '<div class="empty-state"><p>هنوز نخبه‌ای ثبت نشده</p></div>' : `
                    <div class="table-wrapper">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>نام</th>
                                    <th>سازمان</th>
                                    <th>روش شناسایی</th>
                                    <th>راند ۱</th>
                                    <th>تاریخ راند ۱</th>
                                    <th>راند ۲</th>
                                    <th>تاریخ راند ۲</th>
                                    <th>مقایسه AHP</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${expertProgress.map((e, i) => `
                                    <tr>
                                        <td>${i + 1}</td>
                                        <td><strong>${e.name}</strong></td>
                                        <td style="font-size: 12px;">${e.org}</td>
                                        <td><span class="badge badge-primary">${e.qualification_method}</span></td>
                                        <td><span class="badge ${e.round1_status === 'تکمیل‌شده' ? 'badge-success' : e.round1_status === 'انجام نشده' ? 'badge-danger' : 'badge-warning'}">${e.round1_status}</span></td>
                                        <td style="font-size: 11px; color: var(--text-muted);">${e.round1_date || '-'}</td>
                                        <td><span class="badge ${e.round2_status === 'تکمیل‌شده' ? 'badge-success' : e.round2_status === 'انجام نشده' ? 'badge-danger' : 'badge-warning'}">${e.round2_status}</span></td>
                                        <td style="font-size: 11px; color: var(--text-muted);">${e.round2_date || '-'}</td>
                                        <td style="text-align: center;">${e.ahp_count}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>`}
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                <div class="card">
                    <div class="card-header"><h3>&#128202; نمودار عوامل بر اساس دسته</h3></div>
                    <div class="card-body"><canvas id="chart-categories" height="200"></canvas></div>
                </div>
                <div class="card">
                    <div class="card-header"><h3>&#128200; نمودار اولویت AHP</h3></div>
                    <div class="card-body"><canvas id="chart-priorities" height="200"></canvas></div>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                <div class="card">
                    <div class="card-header"><h3>&#128196; فراوانی ۱۰ عامل اول</h3></div>
                    <div class="card-body"><canvas id="chart-frequency" height="200"></canvas></div>
                </div>
                <div class="card">
                    <div class="card-header"><h3>&#128202; وضعیت پاسخ‌ها</h3></div>
                    <div class="card-body"><canvas id="chart-status" height="200"></canvas></div>
                </div>
            </div>

            <div class="card">
                <div class="card-header"><h3>&#128204; راهنمای مراحل پژوهش</h3></div>
                <div class="card-body">
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
                        <div class="expert-info-item" style="cursor: pointer;" onclick="showSection('experts')">
                            <div class="info-icon" style="background: var(--success-bg); color: var(--success);">۱</div>
                            <div class="info-text">
                                <div class="info-label">مرحله اول</div>
                                <div class="info-value">ثبت نخبگان</div>
                            </div>
                        </div>
                        <div class="expert-info-item" style="cursor: pointer;" onclick="showSection('delphi')">
                            <div class="info-icon" style="background: var(--primary-bg); color: var(--primary);">۲</div>
                            <div class="info-text">
                                <div class="info-label">مرحله دوم</div>
                                <div class="info-value">راند اول دلفی</div>
                            </div>
                        </div>
                        <div class="expert-info-item" style="cursor: pointer;" onclick="showSection('round2')">
                            <div class="info-icon" style="background: var(--warning-bg); color: var(--warning);">۳</div>
                            <div class="info-text">
                                <div class="info-label">مرحله سوم</div>
                                <div class="info-value">راند دوم / اولویت‌بندی</div>
                            </div>
                        </div>
                        <div class="expert-info-item" style="cursor: pointer;" onclick="showSection('analysis')">
                            <div class="info-icon" style="background: var(--info-bg); color: var(--info);">۴</div>
                            <div class="info-text">
                                <div class="info-label">مرحله چهارم</div>
                                <div class="info-value">تحلیل و گزارش</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;

        document.getElementById('nav-badge-experts').textContent = stats.total_experts;

        setTimeout(() => {
            renderDashboardCharts(researchStats, frequency, priorities);
        }, 100);

    } catch (e) {
        showToast(e.message, 'error');
    }
}

function renderDashboardCharts(stats, frequency, priorities) {
    const catData = stats.factor_categories || {};
    const catLabels = Object.keys(catData);
    const catValues = Object.values(catData);

    if (catLabels.length > 0) {
        new Chart(document.getElementById('chart-categories'), {
            type: 'doughnut',
            data: {
                labels: catLabels,
                datasets: [{
                    data: catValues,
                    backgroundColor: ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']
                }]
            },
            options: { responsive: true, plugins: { legend: { position: 'bottom', labels: { font: { family: 'Vazirmatn' } } } } }
        });
    }

    if (priorities.factors && priorities.factors.length > 0) {
        const topFactors = priorities.factors.slice(0, 10);
        new Chart(document.getElementById('chart-priorities'), {
            type: 'bar',
            data: {
                labels: topFactors.map(f => f.title.substring(0, 25) + '...'),
                datasets: [{
                    label: 'وزن اولویت',
                    data: topFactors.map(f => (f.weight * 100).toFixed(1)),
                    backgroundColor: '#2563eb'
                }]
            },
            options: { indexAxis: 'y', responsive: true, plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true } } }
        });
    }

    if (frequency.length > 0) {
        const topFreq = frequency.slice(0, 10);
        new Chart(document.getElementById('chart-frequency'), {
            type: 'bar',
            data: {
                labels: topFreq.map(f => f.title.substring(0, 20) + '...'),
                datasets: [{
                    label: 'فراوانی',
                    data: topFreq.map(f => f.count),
                    backgroundColor: '#10b981'
                }]
            },
            options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
        });
    }

    new Chart(document.getElementById('chart-status'), {
        type: 'doughnut',
        data: {
            labels: ['تکمیل‌شده', 'ناتمام'],
            datasets: [{
                data: [stats.completed_responses, stats.total_delphi_responses - stats.completed_responses],
                backgroundColor: ['#10b981', '#f59e0b']
            }]
        },
        options: { responsive: true, plugins: { legend: { position: 'bottom', labels: { font: { family: 'Vazirmatn' } } } } }
    });
}

async function adminLogin(e) {
    e.preventDefault();
    const password = document.getElementById('admin-password-input').value;
    const errEl = document.getElementById('admin-login-error');
    try {
        const res = await fetch(`${API_BASE}/auth/admin-login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || 'رمز اشتباه');
        }
        const data = await res.json();
        setAdminToken(data.token);
        document.getElementById('admin-login-screen').style.display = 'none';
        document.getElementById('app-layout').style.display = 'flex';
        loadDashboard();
    } catch (err) {
        errEl.textContent = err.message;
        errEl.style.display = 'block';
    }
}

async function adminLogout() {
    const token = getAdminToken();
    if (token) {
        await fetch(`${API_BASE}/auth/admin-logout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ token })
        }).catch(() => {});
    }
    setAdminToken('');
    document.getElementById('admin-login-screen').style.display = 'flex';
    document.getElementById('app-layout').style.display = 'none';
    document.getElementById('admin-password-input').value = '';
}

document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    const themeBtn = document.querySelector('.theme-toggle');
    if (themeBtn) themeBtn.textContent = savedTheme === 'dark' ? '&#9788;' : '&#9790;';

    // Check admin session
    const token = getAdminToken();
    if (token) {
        fetch(`${API_BASE}/auth/admin-check?token=${encodeURIComponent(token)}`)
            .then(r => r.json())
            .then(data => {
                if (data.valid) {
                    document.getElementById('admin-login-screen').style.display = 'none';
                    document.getElementById('app-layout').style.display = 'flex';
                    loadDashboard();
                }
            })
            .catch(() => {});
    }

    // Handle 401 from admin panel API calls
    const origFetch = window.fetch;
    window.fetch = function(...args) {
        return origFetch.apply(this, args).then(res => {
            if (res.url?.includes('/api/') && res.status === 401 && !res.url?.includes('/api/auth/')) {
                const token = getAdminToken();
                if (token) {
                    setAdminToken('');
                    document.getElementById('admin-login-screen').style.display = 'flex';
                    document.getElementById('app-layout').style.display = 'none';
                }
                return res;
            }
            return res;
        });
    };
});
