/* ============================================================
   AHP Common — اجزای مشترک پرسشنامه مقایسه زوجی AHP
   (برای پنل مدیریت و صفحه عمومی خبره)
   ============================================================ */

const AHPCommon = (() => {

    const SCALE = {
        1: 'اهمیت برابر',
        2: 'دو میانه (بین برابر و کمی مهم‌تر)',
        3: 'کمی مهم‌تر',
        4: 'دو میانه (بین کمی مهم‌تر و مهم‌تر)',
        5: 'مهم‌تر',
        6: 'دو میانه (بین مهم‌تر و خیلی مهم‌تر)',
        7: 'خیلی مهم‌تر',
        8: 'دو میانه (بین خیلی مهم‌تر و کاملاً مهم‌تر)',
        9: 'کاملاً مهم‌تر'
    };

    const FA_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

    function faNum(value) {
        if (value === null || value === undefined || value === '') return '-';
        const s = String(value);
        return s.replace(/[0-9]/g, d => FA_DIGITS[+d]).replace('.', '٫');
    }

    function faPercent(v) {
        if (v === null || v === undefined) return '-';
        return faNum(Number(v).toFixed(1)) + '٪';
    }

    function faWeight(v) {
        if (v === null || v === undefined) return '-';
        return faNum(Number(v).toFixed(4));
    }

    function keyOf(q) {
        return `${q.level}|${q.parent}|${q.item_a}|${q.item_b}`;
    }

    function decodeValue(value) {
        // مقدار ذخیره‌شده (a/b بین 1/9 تا 9) → {choice, mag}
        if (value === null || value === undefined) return { choice: 'a', mag: 1, answered: false };
        const v = Number(value);
        if (v >= 1) return { choice: 'a', mag: Math.min(9, Math.max(1, Math.round(v))), answered: true };
        return { choice: 'b', mag: Math.min(9, Math.max(1, Math.round(1 / v))), answered: true };
    }

    function encodeValue(choice, mag) {
        const m = Math.min(9, Math.max(1, Math.round(Number(mag) || 1)));
        return choice === 'b' ? 1 / m : m;
    }

    function groupLabel(level, parent) {
        return level === 2
            ? 'سطح ۲ — ابعاد اصلی (نسبت به هدف)'
            : `سطح ۳ — بُعد «${parent}»`;
    }

    function levelBadge(level) {
        return level === 2
            ? '<span class="badge badge-primary">سطح ۲</span>'
            : '<span class="badge badge-info">سطح ۳</span>';
    }

    /* ---------- رندر پرسشنامه ---------- */
    function renderForm(container, questions, options = {}) {
        const onChange = options.onChange || (() => {});
        const values = options.values || {};
        const compact = !!options.compact;

        let html = '';
        let lastGroup = null;

        questions.forEach((q, idx) => {
            const gkey = `${q.level}|${q.parent}`;
            if (gkey !== lastGroup) {
                const inGroup = questions.filter(x => x.level === q.level && x.parent === q.parent);
                const answered = inGroup.filter(x => values[keyOf(x)] !== undefined && values[keyOf(x)] !== null).length;
                html += `
                <div class="ahp-group" id="ahp-group-${gkey.replace(/[^a-zA-Z0-9]/g, '_')}">
                    <div class="ahp-group-head">
                        <div>
                            ${levelBadge(q.level)}
                            <strong>${q.level === 2 ? 'ابعاد اصلی نسبت به هدف' : `عوامل بُعد «${q.parent}»`}</strong>
                        </div>
                        <span class="ahp-group-count">${faNum(answered)} / ${faNum(inGroup.length)} مقایسه</span>
                    </div>
                </div>`;
                lastGroup = gkey;
            }

            const key = keyOf(q);
            const dec = decodeValue(values[key]);
            const answered = values[key] !== undefined && values[key] !== null;
            const selA = dec.choice === 'a';
            const selB = dec.choice === 'b';
            const magLabel = dec.mag === 1 ? 'هم‌ارز' : `× ${faNum(dec.mag)}`;
            const winner = dec.mag === 1 ? 'هر دو یکسان مهم‌اند' : (selA ? q.item_a : q.item_b);

            html += `
            <div class="ahp-question ${answered ? 'answered' : 'pending'}" id="ahp-q-${idx}" data-key="${key}" data-level="${q.level}" data-parent="${q.parent}">
                <div class="ahp-q-head">
                    <span class="ahp-q-index">مقایسه ${faNum(idx + 1)} از ${faNum(questions.length)}</span>
                    ${answered ? '<span class="ahp-q-done">پاسخ ثبت شد</span>' : '<span class="ahp-q-todo">بدون پاسخ</span>'}
                </div>
                <div class="ahp-q-title">کدام مهم‌تر است و چند برابر؟</div>
                <div class="ahp-q-options">
                    <button type="button" class="ahp-opt ${selA && dec.mag !== 1 ? 'selected' : ''}" data-side="a">
                        <span class="ahp-opt-label">${q.item_a}</span>
                    </button>
                    <div class="ahp-q-vs">در برابر</div>
                    <button type="button" class="ahp-opt ${selB && dec.mag !== 1 ? 'selected' : ''}" data-side="b">
                        <span class="ahp-opt-label">${q.item_b}</span>
                    </button>
                </div>
                <div class="ahp-q-slider">
                    <div class="ahp-slider-labels"><span>۱ = اهمیت برابر</span><span>۹ = کاملاً مهم‌تر</span></div>
                    <input type="range" min="1" max="9" step="1" value="${dec.mag}" class="ahp-range" data-index="${idx}">
                    <div class="ahp-q-verdict">
                        <span class="ahp-verdict-winner">${dec.mag === 1 ? 'هر دو یکسان مهم‌اند' : `«${winner}» مهم‌تر است`}</span>
                        <span class="ahp-verdict-mag">${magLabel}</span>
                        <span class="ahp-verdict-scale">${SCALE[dec.mag] || ''}</span>
                    </div>
                </div>
            </div>`;
        });

        container.innerHTML = html;

        // رویدادها
        container.querySelectorAll('.ahp-question').forEach(qEl => {
            const idx = Number(qEl.id.replace('ahp-q-', ''));
            const q = questions[idx];
            const range = qEl.querySelector('.ahp-range');

            qEl.querySelectorAll('.ahp-opt').forEach(btn => {
                btn.addEventListener('click', () => {
                    const side = btn.dataset.side;
                    let mag = Number(range.value);
                    if (side === 'b' && mag === 1) { range.value = 3; mag = 3; }
                    if (side === 'a' && mag === 1) { mag = 1; }
                    commit(qEl, q, side, mag);
                });
            });

            range.addEventListener('input', () => {
                const cur = decodeValue(values[keyOf(q)]);
                commit(qEl, q, cur.choice, Number(range.value));
            });
        });

        function refreshGroup(q) {
            const inGroup = questions.filter(x => x.level === q.level && x.parent === q.parent);
            const answeredN = inGroup.filter(x => values[keyOf(x)] !== undefined && values[keyOf(x)] !== null).length;
            const gkey = `${q.level}|${q.parent}`;
            const el = document.getElementById('ahp-group-' + gkey.replace(/[^a-zA-Z0-9]/g, '_'));
            if (el) {
                const counter = el.querySelector('.ahp-group-count');
                if (counter) counter.textContent = `${faNum(answeredN)} / ${faNum(inGroup.length)} مقایسه`;
            }
        }

        function commit(qEl, q, choice, mag) {
            const value = encodeValue(choice, mag);
            values[keyOf(q)] = value;
            // به‌روزرسانی نمایش بدون رندر مجدد کل فرم
            const selA = choice === 'a' && mag !== 1;
            const selB = choice === 'b' && mag !== 1;
            qEl.querySelector('[data-side="a"]').classList.toggle('selected', selA);
            qEl.querySelector('[data-side="b"]').classList.toggle('selected', selB);
            const winner = mag === 1 ? 'هر دو یکسان مهم‌اند' : `«${choice === 'a' ? q.item_a : q.item_b}» مهم‌تر است`;
            qEl.querySelector('.ahp-verdict-winner').textContent = winner;
            qEl.querySelector('.ahp-verdict-mag').textContent = mag === 1 ? 'هم‌ارز' : `× ${faNum(mag)}`;
            qEl.querySelector('.ahp-verdict-scale').textContent = SCALE[mag] || '';
            qEl.classList.remove('pending');
            qEl.classList.add('answered');
            const done = qEl.querySelector('.ahp-q-done');
            const todo = qEl.querySelector('.ahp-q-todo');
            if (done) done.style.display = '';
            if (todo) todo.style.display = 'none';
            refreshGroup(q);
            onChange({ level: q.level, parent: q.parent, item_a: q.item_a, item_b: q.item_b, value });
        }
    }

    /* ---------- نوار پیشرفت ---------- */
    function renderProgress(container, answered, total, extraHtml = '') {
        const percent = total ? Math.round((answered / total) * 100) : 0;
        container.innerHTML = `
            <div class="ahp-progress">
                <div class="ahp-progress-top">
                    <span>پیشرفت مقایسه‌ها (ذخیره خودکار)</span>
                    <strong>${faNum(answered)} از ${faNum(total)} (${faNum(percent)}٪)</strong>
                </div>
                <div class="ahp-progress-bar"><div class="ahp-progress-fill" style="width:${percent}%"></div></div>
                ${extraHtml}
            </div>`;
    }

    function updateProgress(answered, total) {
        const el = document.querySelector('.ahp-progress');
        if (!el) return;
        const percent = total ? Math.round((answered / total) * 100) : 0;
        const strong = el.querySelector('strong');
        const fill = el.querySelector('.ahp-progress-fill');
        if (strong) strong.textContent = `${faNum(answered)} از ${faNum(total)} (${faNum(percent)}٪)`;
        if (fill) fill.style.width = percent + '%';
    }

    /* ---------- جهش به یک ماتریس (برای ویرایش مقایسه‌های ناسازگار) ---------- */
    function jumpToMatrix(level, parent) {
        const gkey = `${level}|${parent}`;
        const gid = 'ahp-group-' + gkey.replace(/[^a-zA-Z0-9]/g, '_');
        let group = document.getElementById(gid);
        if (!group) {
            const target = document.querySelector(`.ahp-question[data-level="${level}"][data-parent="${CSS.escape(parent)}"]`);
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            return;
        }
        group.scrollIntoView({ behavior: 'smooth', block: 'start' });
        document.querySelectorAll('.ahp-question').forEach(q => {
            q.classList.remove('flash');
            if (q.dataset.level === String(level) && q.dataset.parent === parent) {
                q.classList.add('flash');
                setTimeout(() => q.classList.remove('flash'), 2500);
            }
        });
    }

    return {
        SCALE, faNum, faPercent, faWeight, keyOf, decodeValue, encodeValue,
        groupLabel, levelBadge, renderForm, renderProgress, updateProgress, jumpToMatrix
    };
})();
