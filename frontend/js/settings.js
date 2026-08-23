let settingsData = [];
let activeSettingsGroup = 'all';

const SETTINGS_GROUPS = {
    survey1: { label: 'پرسشنامه راند اول', icon: '&#9998;' },
    survey2: { label: 'پرسشنامه راند دوم', icon: '&#9878;' },
    general: { label: 'تنظیمات عمومی', icon: '&#9881;' },
};

async function loadSettings() {
    const el = document.getElementById('section-settings');
    el.innerHTML = '<div class="card"><div class="card-body" style="text-align:center;padding:60px;color:var(--text-muted);"><div class="spinner" style="margin:0 auto 16px;"></div>در حال بارگذاری تنظیمات...</div></div>';
    try {
        settingsData = await api.get('/settings/');
        if (!settingsData || settingsData.length === 0) {
            el.innerHTML = `
                <div class="card">
                    <div class="card-header"><h3>&#9881; تنظیمات فرم</h3></div>
                    <div class="card-body" style="text-align:center;padding:40px;">
                        <div class="empty-icon" style="font-size:48px;margin-bottom:12px;">&#9881;</div>
                        <h4 style="margin-bottom:8px;">تنظیمات هنوز ایجاد نشده</h4>
                        <p style="color:var(--text-secondary);margin-bottom:20px;">با کلیک روی دکمه زیر، تنظیمات پیش‌فرض ایجاد می‌شوند</p>
                        <button class="btn btn-primary" onclick="initSettings()" style="padding:12px 32px;font-size:14px;">&#10003; ایجاد تنظیمات پیش‌فرض</button>
                    </div>
                </div>`;
            return;
        }
        renderSettings();
    } catch (e) {
        el.innerHTML = `<div class="card"><div class="card-body" style="text-align:center;padding:40px;color:var(--danger);">خطا: ${e.message}<br><button class="btn btn-primary" style="margin-top:12px;" onclick="initSettings()">ایجاد تنظیمات</button></div></div>`;
    }
}

async function initSettings() {
    const defaults = {
        s1_page_title: 'پرسشنامه راند اول دلفی', s1_hero_title: 'پرسشنامه راند اول دلفی',
        s1_hero_subtitle: 'بررسی عوامل مؤثر بر صادرات برق ایران با به‌کارگیری استراتژی توسعه نیروگاه‌های تجدیدپذیر (خورشیدی)',
        s1_question_title: 'سؤال اصلی پژوهش', s1_question_text: 'عوامل مؤثر بر توسعه صادرات برق ایران با تأکید بر توسعه نیروگاه‌های تجدیدپذیر (خورشیدی) کدامند؟',
        s1_section_title_info: 'اطلاعات فردی', s1_section_desc_info: 'لطفاً اطلاعات خود را تکمیل کنید تا بتوانید در پژوهش شرکت کنید',
        s1_section_title_factors: 'فهرست عوامل پیشنهادی شما', s1_section_desc_factors: 'عوامل خود را در ردیف‌های زیر وارد کنید یا از فهرست بالا انتخاب کنید',
        s1_ref_section_title: 'فهرست پیشنهادی عوامل مرجع', s1_ref_section_desc: 'می‌توانید از این عوامل الهام بگیرید یا آنها را مستقیماً به فرم اضافه کنید',
        s1_ref_tip: 'روی دکمه «افزودن به فرم» کلیک کنید تا عامل به اولین ردیف خالی اضافه شود',
        s1_note_title: 'یادداشت اختیاری', s1_note_placeholder: 'اگر نکته یا توضیحی دارید بنویسید...',
        s1_factor_count_label: 'تعداد عوامل ثبت‌شده', s1_success_title: 'پاسخ شما ثبت شد', s1_success_desc: 'از همکاری شما سپاسگزاریم',
        s1_max_factors: '20',
        s2_page_title: 'پرسشنامه راند دوم - اولویت‌بندی عوامل', s2_hero_title: 'پرسشنامه راند دوم دلفی',
        s2_hero_subtitle: 'اولویت‌بندی عوامل مؤثر بر صادرات برق ایران',
        s2_guide_title: 'راهنما', s2_guide_text: 'عوامل شناسایی‌شده از راند اول در اختیار شما قرار گرفته است. لطفاً برای هر عامل میزان اهمیت آن را با  مقیاس ۱ تا ۹ مشخص کنید.',
        s2_guide_scale: 'مقیاس: ۱ = بی‌اهمیت | ۳ = کم‌اهمیت | ۵ = متوسط | ۷ = مهم | ۹ = بسیار مهم',
        s2_success_title: 'اولویت‌بندی شما ثبت شد', s2_success_desc: 'از همکاری شما سپاسگزاریم',
        site_title: 'سامانه مدیریت پژوهش دلفی', site_subtitle: 'صادرات برق خورشیدی',
    };
    try {
        await api.put('/settings/bulk', { settings: defaults });
        showToast('تنظیمات پیش‌فرض ایجاد شد');
        settingsData = await api.get('/settings/');
        renderSettings();
    } catch (e) { showToast(e.message, 'error'); }
}

function renderSettings() {
    const el = document.getElementById('section-settings');
    const groups = {};
    settingsData.forEach(s => {
        if (!groups[s.setting_group]) groups[s.setting_group] = [];
        groups[s.setting_group].push(s);
    });

    el.innerHTML = `
        <div class="card" style="margin-bottom: 16px;">
            <div class="card-header">
                <div>
                    <h3>&#9881; تنظیمات محتوای فرم‌ها</h3>
                </div>
                <button class="btn btn-outline btn-sm" onclick="resetSettingsConfirm()" title="بازنشانی به پیش‌فرض">&#8635; بازنشانی</button>
            </div>
            <div class="card-body" style="padding: 12px 24px;">
                <p style="font-size: 13px; color: var(--text-muted);">متن‌های نمایشی فرم‌های پرسشنامه را اینجا ویرایش کنید. تغییرات بلافاصله در فرم‌ها اعمال می‌شود.</p>
            </div>
        </div>

        <div style="display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap;">
            ${Object.entries(SETTINGS_GROUPS).map(([key, g]) => `
                <button class="btn btn-outline settings-tab ${activeSettingsGroup === key ? 'active' : ''}" onclick="filterSettingsGroup('${key}', this)">${g.icon} ${g.label}</button>
            `).join('')}
            <button class="btn btn-outline settings-tab ${activeSettingsGroup === 'all' ? 'active' : ''}" onclick="filterSettingsGroup('all', this)">&#9776; همه</button>
        </div>

        <form id="settings-form" onsubmit="saveSettings(event)">
            ${Object.entries(groups).map(([group, items]) => `
                <div class="card settings-group-card" data-group="${group}" style="margin-bottom: 16px;${activeSettingsGroup !== 'all' && activeSettingsGroup !== group ? 'display:none;' : ''}">
                    <div class="card-header"><h3>${SETTINGS_GROUPS[group]?.icon || '&#9881;'} ${SETTINGS_GROUPS[group]?.label || group}</h3></div>
                    <div class="card-body">${items.map(item => `
                        <div class="form-group">
                            <label class="form-label">${item.label || item.setting_key}</label>
                            ${(item.setting_value && item.setting_value.length > 80) ?
                                `<textarea class="form-textarea settings-input" name="${item.setting_key}" rows="3">${item.setting_value || ''}</textarea>` :
                                `<input type="text" class="form-input settings-input" name="${item.setting_key}" value="${(item.setting_value || '').replace(/"/g, '&quot;')}">`}
                        </div>`).join('')}
                    </div>
                </div>`).join('')}
        </form>

        <div style="text-align: center; padding: 20px 0;">
            <button class="btn btn-primary btn-lg" onclick="saveSettings(event)" style="padding: 14px 48px; font-size: 15px;">&#10003; ذخیره تمام تنظیمات</button>
        </div>`;
}

function filterSettingsGroup(group, btn) {
    activeSettingsGroup = group;
    document.querySelectorAll('.settings-tab').forEach(t => t.classList.remove('active'));
    if (btn) btn.classList.add('active');
    document.querySelectorAll('.settings-group-card').forEach(card => {
        card.style.display = (group === 'all' || card.dataset.group === group) ? 'block' : 'none';
    });
}

function resetSettingsConfirm() {
    showConfirm('آیا از بازنشانی تمام تنظیمات به مقادیر پیش‌فرض اطمینان دارید؟', async () => {
        await initSettings();
        showToast('تنظیمات به پیش‌فرض بازنشانی شد');
    });
}

async function saveSettings(e) {
    if (e) e.preventDefault();
    const form = document.getElementById('settings-form');
    if (!form) return;
    const formData = new FormData(form);
    const settings = {};
    for (const [key, value] of formData.entries()) settings[key] = value;
    try {
        await api.put('/settings/bulk', { settings });
        showToast('تنظیمات با موفقیت ذخیره شد');
        settingsData = await api.get('/settings/');
    } catch (e) { showToast(e.message, 'error'); }
}