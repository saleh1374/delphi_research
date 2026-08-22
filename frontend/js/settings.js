let settingsData = [];

const SETTINGS_GROUPS = {
    survey1: { label: 'پرسشنامه راند اول', icon: '&#9998;' },
    survey2: { label: 'پرسشنامه راند دوم', icon: '&#9878;' },
    general: { label: 'تنظیمات عمومی', icon: '&#9881;' },
};

async function loadSettings() {
    try {
        settingsData = await api.get('/settings/');
        renderSettings();
    } catch (e) {
        showToast(e.message, 'error');
    }
}

function renderSettings() {
    const el = document.getElementById('section-settings');
    const groups = {};
    settingsData.forEach(s => {
        if (!groups[s.setting_group]) groups[s.setting_group] = [];
        groups[s.setting_group].push(s);
    });

    el.innerHTML = `
        <div class="card" style="margin-bottom: 20px;">
            <div class="card-header">
                <h3>&#9881; تنظیمات محتوای فرم‌ها</h3>
                <p style="font-size: 13px; color: var(--text-secondary); margin-top: 4px;">
                    متن‌های نمایشی در فرم‌های پرسشنامه را اینجا ویرایش کنید. تغییرات بلافاصله اعمال می‌شود.
                </p>
            </div>
        </div>

        <div style="display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap;">
            ${Object.entries(SETTINGS_GROUPS).map(([key, g]) => `
                <button class="btn btn-outline settings-tab active" onclick="filterSettingsGroup('${key}', this)">
                    ${g.icon} ${g.label}
                </button>
            `).join('')}
            <button class="btn btn-outline settings-tab" onclick="filterSettingsGroup('all', this)">
                همه
            </button>
        </div>

        <form id="settings-form" onsubmit="saveSettings(event)">
            ${Object.entries(groups).map(([group, items]) => `
                <div class="card settings-group-card" data-group="${group}" style="margin-bottom: 16px;">
                    <div class="card-header">
                        <h3>${SETTINGS_GROUPS[group]?.icon || '&#9881;'} ${SETTINGS_GROUPS[group]?.label || group}</h3>
                    </div>
                    <div class="card-body">
                        ${items.map(item => `
                            <div class="form-group">
                                <label class="form-label">${item.label || item.setting_key}</label>
                                ${item.setting_value && item.setting_value.length > 80 ?
                                    `<textarea class="form-input settings-input" name="${item.setting_key}" rows="3">${item.setting_value || ''}</textarea>` :
                                    `<input type="text" class="form-input settings-input" name="${item.setting_key}" value="${(item.setting_value || '').replace(/"/g, '&quot;')}">`
                                }
                            </div>
                        `).join('')}
                    </div>
                </div>
            `).join('')}
        </form>

        <div style="text-align: center; padding: 16px 0;">
            <button class="btn btn-primary" onclick="saveSettings(event)" style="padding: 12px 40px; font-size: 15px;">
                &#10003; ذخیره تمام تنظیمات
            </button>
        </div>
    `;
}

function filterSettingsGroup(group, btn) {
    document.querySelectorAll('.settings-tab').forEach(t => t.classList.remove('active'));
    if (btn) btn.classList.add('active');
    document.querySelectorAll('.settings-group-card').forEach(card => {
        if (group === 'all' || card.dataset.group === group) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

async function saveSettings(e) {
    if (e) e.preventDefault();
    const form = document.getElementById('settings-form');
    if (!form) return;
    const formData = new FormData(form);
    const settings = {};
    for (const [key, value] of formData.entries()) {
        settings[key] = value;
    }

    try {
        await api.put('/settings/bulk', { settings });
        showToast('تنظیمات با موفقیت ذخیره شد');
        settingsData = await api.get('/settings/');
    } catch (e) {
        showToast(e.message, 'error');
    }
}
