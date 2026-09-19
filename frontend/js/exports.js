function loadExports() {
    const container = document.getElementById('section-exports');
    container.innerHTML = `
        <div class="card" style="margin-bottom: 20px;">
            <div class="card-header">
                <div>
                    <h3>&#8681; راند اول - شناسایی عوامل</h3>
                    <p style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">خروجی‌های مرحله شناسایی و استخراج عوامل از نخبگان</p>
                </div>
            </div>
            <div class="card-body">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 12px;">
                    ${exportCard('&#128101;', 'blue', 'نخبگان', 'فهرست کامل نخبگان با اطلاعات تماس', 'experts.csv', 'experts.csv')}
                    ${exportCard('&#128221;', 'green', 'پاسخ‌های راند ۱', 'تمامی عوامل شناسایی‌شده توسط نخبگان', 'responses.csv', 'responses.csv')}
                    ${exportCard('&#128203;', 'orange', 'عوامل یکتا', 'عوامل منحصربه‌فرد با فراوانی', 'unique-factors.csv', 'unique_factors.csv')}
                    ${exportCard('&#128196;', 'purple', 'گزارش یکپارچه', 'ترکیب نخبگان + عوامل در یک فایل', 'combined.csv', 'combined.csv')}
                </div>
            </div>
        </div>

        <div class="card" style="margin-bottom: 20px;">
            <div class="card-header">
                <div>
                    <h3>&#8681; راند دوم - اولویت‌بندی</h3>
                    <p style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">خروجی‌های مرحله اولویت‌بندی و تحلیل آماری</p>
                </div>
            </div>
            <div class="card-body">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 12px;">
                    ${exportCard('&#128202;', 'green', 'اولویت‌بندی راند ۲', 'میانگین امتیازات + انحراف معیار', 'round2-priorities.csv', 'round2_priorities.csv')}
                    ${exportCard('&#128200;', 'purple', 'اولویت‌بندی AHP', 'وزن‌های محاسبه‌شده با تحلیل سلسله مراتبی', 'ahp-priorities.csv', 'ahp_priorities.csv')}
                    ${exportCard('&#128202;', 'orange', 'فراوانی عوامل', 'تعداد تکرار هر عامل در کل پژوهش', 'factor-frequency.csv', 'factor_frequency.csv')}
                </div>
            </div>
        </div>

        <div class="card" style="margin-bottom: 20px;">
            <div class="card-header">
                <div>
                    <h3>&#128190; پشتیبان‌گیری و بازیابی</h3>
                    <p style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">ذخیره و بازیابی کل داده‌های پژوهش</p>
                </div>
            </div>
            <div class="card-body">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 12px;">
                    <div class="expert-info-item" style="cursor:pointer;border:2px solid #10b981;border-radius:12px;" onclick="downloadCSV('activities.csv','activities.csv')">
                        <div class="info-icon" style="background:#ecfdf5;color:#10b981;">&#128196;</div>
                        <div class="info-text"><div class="info-label">فایل CSV</div><div class="info-value">فعالیت‌ها و پیگیری‌ها</div></div>
                    </div>
                    <div class="expert-info-item" style="cursor:pointer;border:2px solid #10b981;border-radius:12px;" onclick="downloadCSV('backup.json','backup.json')">
                        <div class="info-icon" style="background:#ecfdf5;color:#10b981;">&#128190;</div>
                        <div class="info-text"><div class="info-label">فایل JSON</div><div class="info-value">پشتیبان کامل داده‌ها</div></div>
                    </div>
                    <div class="expert-info-item" style="cursor:pointer;border:2px solid #f59e0b;border-radius:12px;" onclick="document.getElementById('import-file-input').click()">
                        <div class="info-icon" style="background:#fffbeb;color:#f59e0b;">&#128194;</div>
                        <div class="info-text"><div class="info-label">بازیابی داده‌ها</div><div class="info-value">بارگذاری فایل پشتیبان JSON</div></div>
                    </div>
                    <input type="file" id="import-file-input" accept=".json" style="display:none;" onchange="importBackup(this.files[0])">
                </div>
                <div style="margin-top: 20px; padding: 14px 16px; background: var(--info-bg); border: 1px solid var(--info); border-radius: 10px; font-size: 12px; color: var(--info); line-height: 1.8;">
                    <strong>&#9432; راهنما:</strong> فایل‌های CSV با BOM ذخیره می‌شوند (سازگار با Excel فارسی). برای بازیابی، فایل backup.json که قبلاً دانلود کرده‌اید را آپلود کنید. نخبگان تکراری ایجاد نمی‌شوند.
                </div>
            </div>
        </div>`;
}

function exportCard(icon, color, title, desc, endpoint, filename) {
    const colorMap = { blue: '#eff6ff', green: '#ecfdf5', orange: '#fffbeb', purple: '#eef2ff' };
    const textMap = { blue: '#2563eb', green: '#10b981', orange: '#f59e0b', purple: '#8b5cf6' };
    return `
        <div class="expert-info-item" style="cursor:pointer;transition:all 0.2s;" onclick="downloadCSV('${endpoint}','${filename}')" onmouseover="this.style.borderColor='var(--primary)';this.style.transform='translateY(-2px)'" onmouseout="this.style.borderColor='var(--border)';this.style.transform='none'">
            <div class="info-icon" style="background:${colorMap[color] || '#eff6ff'};color:${textMap[color] || '#2563eb'};">${icon}</div>
            <div class="info-text">
                <div class="info-label" style="font-size:11px;">فایل CSV</div>
                <div class="info-value" style="font-size:14px;">${title}</div>
                <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">${desc}</div>
            </div>
            <span style="font-size:18px;color:var(--text-muted);margin-right:auto;">&#8681;</span>
        </div>`;
}

async function downloadCSV(endpoint, filename) {
    try {
        await api.downloadFile(`/export/${endpoint}`, filename);
        showToast(`دانلود شد: ${filename}`);
    } catch (err) { showToast('خطا در دانلود', 'error'); }
}

async function importBackup(file) {
    if (!file) return;
    if (!confirm('آیا از بازیابی داده‌ها مطمئن هستید؟ نخبگان تکراری ایجاد نمی‌شوند و فقط داده‌های جدید اضافه می‌شوند.')) return;
    try {
        const formData = new FormData();
        formData.append('file', file);
        const response = await fetch(`${API_BASE}/export/import`, {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + getAdminToken() },
            body: formData
        });
        if (!response.ok) { const err = await response.json(); throw new Error(err.detail || 'خطا'); }
        const result = await response.json();
        showToast(`بازیابی موفق: ${result.imported.experts} نخبه، ${result.imported.responses} پاسخ، ${result.imported.factors} عامل`);
        document.getElementById('import-file-input').value = '';
    } catch (err) { showToast(err.message || 'خطا', 'error'); }
}