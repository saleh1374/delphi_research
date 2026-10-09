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
                    <h3>&#9878; ماژول AHP - تحلیل سلسله‌مراتبی</h3>
                    <p style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">خروجی‌های مرحله دوم پژوهش (اولویت‌بندی نهایی عوامل و سازگاری خبرگان)</p>
                </div>
            </div>
            <div class="card-body">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 12px;">
                    <div class="expert-info-item" style="cursor:pointer;border:2px solid #8b5cf6;border-radius:12px;" onclick="api.downloadFile('/ahp/export.json','ahp_results.json')">
                        <div class="info-icon" style="background:#eef2ff;color:#8b5cf6;">&#128196;</div>
                        <div class="info-text"><div class="info-label">فایل JSON</div><div class="info-value">سلسله‌مراتب + مقایسه‌ها + نتایج AHP</div></div>
                    </div>
                    <div class="expert-info-item" style="cursor:pointer;border:2px solid #8b5cf6;border-radius:12px;" onclick="api.downloadFile('/ahp/export.csv','ahp_results.csv')">
                        <div class="info-icon" style="background:#eef2ff;color:#8b5cf6;">&#128202;</div>
                        <div class="info-text"><div class="info-label">فایل Excel/CSV</div><div class="info-value">وزن ابعاد، وزن نهایی ۳۰ عامل و CR</div></div>
                    </div>
                    <div class="expert-info-item" style="cursor:pointer;border:2px solid #f59e0b;border-radius:12px;" onclick="window.open('/ahp-guide','_blank')">
                        <div class="info-icon" style="background:#fffbeb;color:#f59e0b;">&#128214;</div>
                        <div class="info-text"><div class="info-label">راهنما</div><div class="info-value">راهنمای یک‌صفحه‌ای خبره (طیف ۱ تا ۹)</div></div>
                    </div>
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
                    <div class="expert-info-item" id="import-card" style="cursor:pointer;border:2px solid #f59e0b;border-radius:12px;" onclick="document.getElementById('import-file-input').click()">
                        <div class="info-icon" style="background:#fffbeb;color:#f59e0b;">&#128194;</div>
                        <div class="info-text"><div class="info-label">بازیابی داده‌ها</div><div class="info-value">بارگذاری فایل پشتیبان JSON</div></div>
                    </div>
                    <input type="file" id="import-file-input" accept=".json" style="display:none;" onchange="importBackup(this.files[0])">
                </div>
                <div style="margin-top: 20px; padding: 14px 16px; background: var(--info-bg); border: 1px solid var(--info); border-radius: 10px; font-size: 12px; color: var(--info); line-height: 1.8;">
                    <strong>&#9432; راهنما:</strong> فایل‌های CSV با BOM ذخیره می‌شوند (سازگار با Excel فارسی). برای بازیابی، فایل backup.json که قبلاً دانلود کرده‌اید را آپلود کنید: داده‌های تکراری اضافه نمی‌شوند، پاسخ هر خبره/راند فقط یک‌بار می‌ماند و اگر همه‌چیز قبلاً موجود باشد پیام «موجود» می‌بینید. بلافاصله پس از بازیابی، بخش‌های سایت به‌روزرسانی می‌شوند.
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
    const input = document.getElementById('import-file-input');
    if (input) input.value = '';          // همیشه اول پاک شود تا انتخاب دوباره همان فایل هم اثر کند
    if (!file) return;

    // ۱) اعتبارسنجی ساختار فایل، قبل از هر پیام تأیید
    let data;
    try {
        data = JSON.parse(await file.text());
    } catch (e) {
        showToast('فایل انتخاب‌شده یک فایل JSON معتبر نیست', 'error');
        return;
    }
    const backupKeys = ['experts', 'responses', 'activities', 'factor_bank'];
    if (!data || typeof data !== 'object' || Array.isArray(data) ||
        !backupKeys.some(k => k in data)) {
        showToast('این فایل، فایل پشتیبان سامانه نیست؛ فایل backup.json را انتخاب کنید (نه خروجی نتایج AHP)', 'error');
        return;
    }

    if (!confirm('آیا از بازیابی داده‌ها مطمئن هستید؟ داده‌های موجود تکرار نمی‌شوند و فقط موارد جدید اضافه می‌شوند.')) return;

    // ۲) حالت «در حال بازیابی» روی کارت
    const card = document.getElementById('import-card');
    const cardHTML = card ? card.innerHTML : '';
    if (card) card.innerHTML = `<div class="info-icon" style="background:#fffbeb;color:#f59e0b;">&#8987;</div>
        <div class="info-text"><div class="info-label">در حال بازیابی…</div><div class="info-value">لطفاً صبر کنید</div></div>`;

    try {
        const formData = new FormData();
        formData.append('file', new File([JSON.stringify(data)], file.name || 'backup.json',
            { type: 'application/json' }));
        const response = await fetch(`${API_BASE}/export/import`, { method: 'POST', body: formData });
        if (!response.ok) {
            let detail = 'خطا در بازیابی';
            try { detail = (await response.json()).detail || detail; } catch (e) { }
            throw new Error(detail);
        }
        const result = await response.json();
        const imp = result.imported || {};
        const already = result.already || {};
        const totalNew = Object.values(imp).reduce((a, b) => a + (Number(b) || 0), 0);
        const totalOld = Object.values(already).reduce((a, b) => a + (Number(b) || 0), 0);

        if (totalNew > 0) {
            showToast(`بازیابی انجام شد: ${imp.experts || 0} نخبه، ${imp.responses || 0} پاسخ، ` +
                `${imp.factors || 0} عامل، ${imp.activities || 0} فعالیت، ${imp.ahp || 0} مقایسه AHP جدید`);
        } else if (totalOld > 0) {
            showToast(`همه ${totalOld} مورد این فایل قبلاً در سایت موجود است؛ چیزی تکرار نشد. ` +
                `داده‌های فعلی سایت دست‌نخورده ماند.`, 'info');
        } else {
            showToast('هیچ داده‌ای برای بازیابی در این فایل پیدا نشد', 'error');
        }

        // ۳) به‌روزرسانی سایت تا داده‌ها بلافاصله دیده شوند
        if (typeof showSection === 'function' && typeof currentSection !== 'undefined') {
            showSection(currentSection);
        }
    } catch (err) {
        showToast(err.message || 'خطا در بازیابی', 'error');
        if (card) card.innerHTML = cardHTML;   // بازگرداندن کارت به حالت اولیه
    }
}