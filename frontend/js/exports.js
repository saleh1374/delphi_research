function loadExports() {
    const container = document.getElementById('section-exports');
    container.innerHTML = `
        <div class="card" style="margin-bottom: 20px;">
            <div class="card-header">
                <h3>&#8681; خروجی‌های مرحله اول (شناسایی عوامل)</h3>
            </div>
            <div class="card-body">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px;">
                    <div class="expert-info-item" style="cursor: pointer;" onclick="downloadCSV('experts.csv', 'experts.csv')">
                        <div class="info-icon">&#128196;</div>
                        <div class="info-text">
                            <div class="info-label">فایل CSV</div>
                            <div class="info-value">فهرست نخبگان</div>
                        </div>
                    </div>
                    <div class="expert-info-item" style="cursor: pointer;" onclick="downloadCSV('responses.csv', 'responses.csv')">
                        <div class="info-icon">&#128196;</div>
                        <div class="info-text">
                            <div class="info-label">فایل CSV</div>
                            <div class="info-value">پاسخ‌های راند اول</div>
                        </div>
                    </div>
                    <div class="expert-info-item" style="cursor: pointer;" onclick="downloadCSV('unique-factors.csv', 'unique_factors.csv')">
                        <div class="info-icon">&#128196;</div>
                        <div class="info-text">
                            <div class="info-label">فایل CSV</div>
                            <div class="info-value">عوامل یکتا شناسایی‌شده</div>
                        </div>
                    </div>
                    <div class="expert-info-item" style="cursor: pointer;" onclick="downloadCSV('combined.csv', 'combined.csv')">
                        <div class="info-icon">&#128196;</div>
                        <div class="info-text">
                            <div class="info-label">فایل CSV</div>
                            <div class="info-value">گزارش یکپارچه راند ۱</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="card" style="margin-bottom: 20px;">
            <div class="card-header">
                <h3>&#8681; خروجی‌های مرحله دوم (اولویت‌بندی)</h3>
            </div>
            <div class="card-body">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px;">
                    <div class="expert-info-item" style="cursor: pointer;" onclick="downloadCSV('ahp-priorities.csv', 'ahp_priorities.csv')">
                        <div class="info-icon" style="background: var(--warning-bg); color: var(--warning);">&#128200;</div>
                        <div class="info-text">
                            <div class="info-label">فایل CSV</div>
                            <div class="info-value">اولویت‌بندی AHP</div>
                        </div>
                    </div>
                    <div class="expert-info-item" style="cursor: pointer;" onclick="downloadCSV('factor-frequency.csv', 'factor_frequency.csv')">
                        <div class="info-icon" style="background: var(--info-bg); color: var(--info);">&#128202;</div>
                        <div class="info-text">
                            <div class="info-label">فایل CSV</div>
                            <div class="info-value">فراوانی عوامل</div>
                        </div>
                    </div>
                    <div class="expert-info-item" style="cursor: pointer;" onclick="downloadCSV('activities.csv', 'activities.csv')">
                        <div class="info-icon">&#128196;</div>
                        <div class="info-text">
                            <div class="info-label">فایل CSV</div>
                            <div class="info-value">فعالیت‌ها و پیگیری‌ها</div>
                        </div>
                    </div>
                    <div class="expert-info-item" style="cursor: pointer;" onclick="downloadCSV('round2-priorities.csv', 'round2_priorities.csv')">
                        <div class="info-icon" style="background: var(--success-bg); color: var(--success);">&#128202;</div>
                        <div class="info-text">
                            <div class="info-label">فایل CSV</div>
                            <div class="info-value">اولویت‌بندی راند ۲ با امتیازات</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="card" style="margin-bottom: 20px;">
            <div class="card-header">
                <h3>&#128190; پشتیبان‌گیری و بازیابی</h3>
            </div>
            <div class="card-body">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px;">
                    <div class="expert-info-item" style="cursor: pointer;" onclick="downloadCSV('backup.json', 'backup.json')">
                        <div class="info-icon" style="background: var(--success-bg); color: var(--success);">&#128190;</div>
                        <div class="info-text">
                            <div class="info-label">فایل JSON</div>
                            <div class="info-value">پشتیبان کامل داده‌ها</div>
                        </div>
                    </div>
                    <div class="expert-info-item" style="cursor: pointer;" onclick="document.getElementById('import-file-input').click()">
                        <div class="info-icon" style="background: var(--warning-bg); color: var(--warning);">&#128194;</div>
                        <div class="info-text">
                            <div class="info-label">بازیابی</div>
                            <div class="info-value">بارگذاری فایل پشتیبان</div>
                        </div>
                    </div>
                    <input type="file" id="import-file-input" accept=".json" style="display: none;" onchange="importBackup(this.files[0])">
                </div>
                <div style="margin-top: 20px; padding: 16px; background: var(--info-bg); border-radius: var(--radius-sm); font-size: 13px; color: var(--info);">
                    <strong>&#9432; نکته:</strong> فایل‌های CSV با رمزگذاری UTF-8 با BOM ذخیره می‌شوند و در Excel سازگار هستند.
                </div>
            </div>
        </div>`;
}

async function downloadCSV(endpoint, filename) {
    try {
        await api.downloadFile(`/export/${endpoint}`, filename);
        showToast(`فایل ${filename} با موفقیت دانلود شد`);
    } catch (err) {
        showToast('خطا در دانلود فایل', 'error');
    }
}

async function importBackup(file) {
    if (!file) return;
    if (!confirm('آیا از بازیابی داده‌ها از فایل پشتیبان مطمئن هستید؟ داده‌های جدید اضافه خواهند شد.')) return;

    try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/export/import', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || 'خطا در بازیابی');
        }

        const result = await response.json();
        showToast(`بازیابی با موفقیت انجام شد: ${result.imported.experts} نخبه، ${result.imported.responses} پاسخ، ${result.imported.factors} عامل، ${result.imported.activities} فعالیت`);
        document.getElementById('import-file-input').value = '';
    } catch (err) {
        showToast(err.message || 'خطا در بازیابی فایل', 'error');
    }
}
