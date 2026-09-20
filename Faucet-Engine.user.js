/* ========================================================= */
/*              [2] إعدادات التأخير والتوقيتات                 */
/* ========================================================= */
const CLAIM_DELAY_MS = 300;
const LOGIN_DELAY_MS = 150;

(function() {
  'use strict';

  /* ========================================================= */
  /*             [4] تعيين المتغيرات والجداول الأساسية          */
  /* ========================================================= */
  const path = window.location.pathname, s = window.location.hostname;
  const sites = ['tronpick.io', 'bnbpick.io', 'dogepick.io', 'tonpick.game', 'solpick.io'];
  const nS = { 'tronpick.io': 'bnbpick.io', 'bnbpick.io': 'dogepick.io', 'dogepick.io': 'tonpick.game', 'tonpick.game': 'solpick.io', 'solpick.io': 'tronpick.io' };
  const pS = { 'tronpick.io': 'solpick.io', 'bnbpick.io': 'tronpick.io', 'dogepick.io': 'bnbpick.io', 'tonpick.game': 'dogepick.io', 'solpick.io': 'tronpick.game' };

  /* ========================================================= */
  /*              [5] تعريف قواعد أنماط CSS للإخفاء            */
  /* ========================================================= */
  const hideCss = ".cpx_uqnxd_80,.cpx_uqnxd_83,#show_surveys,#show_surveys > h3,table.history_tbl,th[width=\"50%\"],th.top_header,tr.history_row > td,div.faucet-tabs,.faucet-tab,.faucet-tab.is-active,#hourly_faucet > p,.level-progress-card.level-progress-card--tabs,.level-progress-card__inner,#cpx_survey,footer.footer,div.footer-container,.iconcaptcha-modal__header,.iconcaptcha-modal__footer,.iconcaptcha-modal__body-info,h2.single_title_n,div[class=\"single_title_n\"] > h2,p[style*=\"margin: 0px auto 30px\"],p[style*=\"margin:0 auto 30px\"],.promo-banner,#promo_banner,div[data-interval=\"5000\"],div[aria-roledescription=\"carousel\"],div[data-contest-end],div[aria-label=\"Feature promotions\"]{display:none!important}.dash_tp_menu_area{display:block!important;visibility:visible!important;opacity:1!important}.nav_container{display:flex!important;visibility:visible!important;opacity:1!important}";

  /* ========================================================= */
  /*           [6] حقن أنماط الإخفاء السريع في الصفحة           */
  /* ========================================================= */
  let fastStyle = null;
  function injectFastStyle() {
    if (!fastStyle && path.includes('faucet')) {
      const target = document.head || document.documentElement;
      if (target) {
        fastStyle = document.createElement('style');
        fastStyle.id = 'fast-hide-style';
        if (GM_getValue('gl_cl', true)) {
          fastStyle.innerHTML = hideCss;
        } else {
          fastStyle.innerHTML = '';
        }
        target.appendChild(fastStyle);
        return true;
      }
    }
    return false;
  }

  /* ========================================================= */
  /*          [7] مراقبة رأس الصفحة لحقن الأنماط مبكراً         */
  /* ========================================================= */
  if (!injectFastStyle()) {
    const earlyObs = new MutationObserver(() => {
      if (injectFastStyle()) earlyObs.disconnect();
    });
    earlyObs.observe(document, { childList: true, subtree: true });
  }

  /* ========================================================= */
  /*             [8] فحص حالة قفل الموقع الحالي                 */
  /* ========================================================= */
  function isUnlocked(dom) {
    const lT = GM_getValue('f_lock_' + dom, 0);
    return !lT || (Date.now() - lT >= 36e5);
  }

  /* ========================================================= */
  /*             [9] دالة إعادة تحميل الصفحة القسرية            */
  /* ========================================================= */
  function hR() {
    window.location.replace(window.location.origin + window.location.pathname + '?t=' + Date.now());
  }

  /* ========================================================= */
  /*            [11] معالجة حالة الفشل والتنقل للموقع التالي    */
  /* ========================================================= */
  function handleFailure() {
    let errCnt = GM_getValue('err_cnt_' + s, 0) + 1;
    if (errCnt >= 2) {
      GM_setValue('err_cnt_' + s, 0);
      const isLast = sites[sites.length - 1] === s;
      if (isLast) showDone();
      else {
        const nxt = nS[s];
        if (nxt) window.location.href = 'https://' + nxt + '/faucet.php';
        else showDone();
      }
      return true;
    }
    GM_setValue('err_cnt_' + s, errCnt);
    return false;
  }

  /* ========================================================= */
  /*           [12] معالجة حالة النجاح وتصفير عداد الأخطاء      */
  /* ========================================================= */
  function handleSuccess() {
    GM_setValue('err_cnt_' + s, 0);
  }

  /* ========================================================= */
  /*             [13] إدارة مؤقت الخمول وتحديثه                */
  /* ========================================================= */
  let inactivityTimer = null;
  function resetInactivityTimer() {
    if (!path.includes('faucet')) {
      if (inactivityTimer) clearTimeout(inactivityTimer);
      return;
    }
    if (isUnlocked(s)) {
      if (inactivityTimer) clearTimeout(inactivityTimer);
      return;
    }
    if (inactivityTimer) clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => showDone(), 4e4);
  }

  /* ========================================================= */
  /*           [14] ربط أحداث المستخدم بمؤقت الخمول             */
  /* ========================================================= */
  resetInactivityTimer();
  ['click', 'mousemove', 'keydown', 'scroll', 'touchstart'].forEach(evt => {
    window.addEventListener(evt, resetInactivityTimer, { passive: true });
  });

  /* ========================================================= */
  /*       [15] رصد عبارات الحماية والتمرير التلقائي للشاشة     */
  /* ========================================================= */
  let _phraseScrolled = false;
  function checkAndScrollForPhrase() {
    if (_phraseScrolled) return;
    if (document.body && document.body.innerText.includes('يستخدم هذا الموقع خدمة أمنية للحماية من الروبوتات') && !document.getElementById('process_claim_hourly_faucet')) {
      _phraseScrolled = true;
      setTimeout(() => {
        window.scrollBy({ top: 230, behavior: 'smooth' });
      }, 600);
    }
  }

  /* ========================================================= */
  /*             [16] إنشاء عنصر أزرار التحكم الفردية            */
  /* ========================================================= */
  function cBtn(txt, cb) {
    const b = document.createElement('div');
    b.className = 'tbdts-nav-btn';
    b.innerText = txt;
    b.style.cssText = `width:30px!important;height:30px!important;color:#fff!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;font-size:22px!important;cursor:pointer!important;font-weight:bold!important;user-select:none!important;transition:transform .2s ease!important;background:transparent!important;border:none!important;box-shadow:none!important;pointer-events:auto!important;font-family:sans-serif!important;line-height:1!important;`;
    b.onmouseover = () => b.style.transform = 'scale(1.25)';
    b.onmouseout = () => b.style.transform = 'scale(1)';
    b.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      cb();
    });
    return b;
  }

  /* ========================================================= */
  /*           [17] إنشاء الحاويات الرسومية لأزرار التنقل      */
  /* ========================================================= */
  function createNavContainers() {
    const rC = document.createElement('div');
    rC.style.cssText = 'position:fixed!important;bottom:20px!important;right:10px!important;display:flex!important;gap:12px!important;z-index:999999999!important;align-items:center!important;';
    const lC = document.createElement('div');
    lC.style.cssText = 'position:fixed!important;bottom:20px!important;left:10px!important;display:flex!important;gap:12px!important;z-index:999999999!important;align-items:center!important;';
    return { rC, lC };
  }

  /* ========================================================= */
  /*           [18] ربط حالة إخفاء العناصر بستايل الصفحة        */
  /* ========================================================= */
  function updateVisibilityStyle(active, btnC, st) {
    btnC.innerText = active ? '✨' : '👁️';
    if (st) {
      st.innerHTML = (active && path.includes('faucet')) ? hideCss : '';
    }
  }

  /* ========================================================= */
  /*             [19] إعداد وبناء شريط أزرار التنقل             */
  /* ========================================================= */
  let bA = false;
  function aB() {
    if (bA || !path.includes('faucet') || !document.body) return;
    const head = document.head || document.documentElement;
    if (!head) return;

    injectAccountBadge();

    const { rC, lC } = createNavContainers();
    let active = GM_getValue('gl_cl', true);
    let audioMuted = GM_getValue('gl_audio_muted', true);
    let st = document.getElementById('fast-hide-style');
    if (!st) {
      st = document.createElement('style');
      st.id = 'fast-hide-style';
      head.appendChild(st);
    }

    const apC = () => updateVisibilityStyle(active, btnC, st);

    const updateAudioBtnUI = () => {
      btnA.innerText = audioMuted ? '🔕' : '🔔';
    };
    const btnA = cBtn('🔔', () => {
      audioMuted = !audioMuted;
      GM_setValue('gl_audio_muted', audioMuted);
      updateAudioBtnUI();
    });
    const btnC = cBtn('👁️', () => {
      active = !active;
      GM_setValue('gl_cl', active);
      GM_setValue('gl_script_on', active);
      apC();
    });
    const btnP = cBtn('👈', () => { if (pS[s]) window.location.href = 'https://' + pS[s] + '/faucet.php'; });
    const btnN = cBtn('👉', () => { const target = nS[s] || 'tronpick.io'; window.location.href = 'https://' + target + '/faucet.php'; });
    updateAudioBtnUI();
    rC.appendChild(btnA);
    rC.appendChild(btnC);
    lC.appendChild(btnP);
    lC.appendChild(btnN);
    document.body.appendChild(rC);
    document.body.appendChild(lC);
    apC();
    bA = true;
  }

  /* ========================================================= */
  /*        [21] مراقب شجرة التغييرات (DOM Observer)             */
  /* ========================================================= */
  const initObserver = () => {
    const target = document.documentElement || document.body;
    if (!target) { setTimeout(initObserver, 50); return; }
    const obs = new MutationObserver(() => {
      if (!isCaptchaVerified()) lockClaimButton();
      checkAndScrollForPhrase();
      injectAccountBadge();
    });
    obs.observe(target, { childList: true, subtree: true });
  };
  initObserver();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', aB); else aB();

  /* ========================================================= */
  /*            [22] تهيئة سياق الصوت للتنبيهات                 */
  /* ========================================================= */
  let aC = null;
  function initAudioContext() {
    if (!aC) aC = new (window.AudioContext || window.webkitAudioContext)();
    if (aC.state === 'suspended') return aC.resume();
    return Promise.resolve();
  }

  /* ========================================================= */
  /*               [23] توليد نغمة النجاح الصوتية               */
  /* ========================================================= */
  function playSuccessSound() {
    const o = aC.createOscillator(), g = aC.createGain();
    o.connect(g); g.connect(aC.destination);
    o.type = 'sine';
    o.frequency.setValueAtTime(600, aC.currentTime);
    o.frequency.linearRampToValueAtTime(1000, aC.currentTime + .1);
    g.gain.setValueAtTime(.1, aC.currentTime);
    o.start();
    o.stop(aC.currentTime + .2);
  }

  /* ========================================================= */
  /*               [24] توليد نغمة الفشل الصوتية                */
  /* ========================================================= */
  function playErrorSound() {
    const pN = (f, tm) => {
      const o = aC.createOscillator(), g = aC.createGain();
      o.connect(g); g.connect(aC.destination);
      o.type = 'square';
      o.frequency.setValueAtTime(f, aC.currentTime + tm);
      g.gain.setValueAtTime(.1, aC.currentTime + tm);
      o.start(aC.currentTime + tm);
      o.stop(aC.currentTime + tm + .15);
    };
    pN(400, 0); pN(250, .15);
  }

  /* ========================================================= */
  /*               [25] موجه تشغيل التنبيهات الصوتية             */
  /* ========================================================= */
  const playAudio = t => {
    if (GM_getValue('gl_audio_muted', true)) return;
    try { initAudioContext().then(() => { if (t === 'success') playSuccessSound(); else playErrorSound(); }); } catch (e) { }
  };

  /* ========================================================= */
  /*            [26] ضبط طريقة العرض وتكبير الصفحة              */
  /* ========================================================= */
  function eZ() { const head = document.head || document.documentElement; if ((path.includes('withdraw') || window._isMaint) && head) { let m = document.querySelector('meta[name="viewport"]'); if (!m) { m = document.createElement('meta'); m.name = 'viewport'; head.appendChild(m); } m.content = 'width=device-width, initial-scale=1.0, user-scalable=yes'; } }

  /* ========================================================= */
  /*               [27] فحص وجود صفحة الصيانة                   */
  /* ========================================================= */
  function isMaintPage() { if (document.querySelector('meta[name="viewport"]')) return false; const txt = (document.body ? document.body.innerText : '').toLowerCase(), ttl = (document.title || '').toLowerCase(); return ['maintenance', 'under maintenance', 'be right back', 'scheduled maintenance'].some(k => txt.includes(k) || ttl.includes(k)) || (!document.getElementById('process_claim_hourly_faucet') && !document.querySelector('#select_captcha')); }

  /* ========================================================= */
  /*            [28] معالجة منطق التنقل عند الصيانة             */
  /* ========================================================= */
  let maintT = null;
  function handleMaintLogic() { if (window._maintHandled) return; window._maintHandled = true; window._isMaint = true; eZ(); const isLast = sites[sites.length - 1] === s; if (!maintT) { maintT = setTimeout(() => { if (isLast) showDone(); else { const nxt = nS[s]; if (nxt) window.location.href = 'https://' + nxt + '/faucet.php'; else showDone(); } }, 2000); } }

  /* ========================================================= */
  /*          [29] تهيئة المتغيرات المرجعية للكابتشا            */
  /* ========================================================= */
  window._tbdts_captcha_verified = false; window._tbdts_verified_token = null; window._tbdts_turnstile_hooked = false; window._tbdts_turnstile_watch = null; window._tbdts_claimed = false; window._tbdts_logged_in = false; window._tbdts_claim_scheduled = false; window._tbdts_request_sent = false;

  /* ========================================================= */
  /*             [30] الحصول على عنصر زر المطالبة               */
  /* ========================================================= */
  function getClaimButton() { return document.getElementById('process_claim_hourly_faucet'); }

  /* ========================================================= */
  /*           [31] الحصول على عنصر زر تسجيل الدخول             */
  /* ========================================================= */
  function getLoginButton() { return document.getElementById('process_login'); }

  /* ========================================================= */
  /*             [32] فحص مدى صحة توكين الكابتشا                */
  /* ========================================================= */
  function isCaptchaVerified() {
    if (window._tbdts_captcha_verified === true && typeof window._tbdts_verified_token === 'string' && window._tbdts_verified_token.length > 30) {
      return true;
    }
    const inputs = document.querySelectorAll('input[name="cf-turnstile-response"], input[name="g-recaptcha-response"]');
    for (let input of inputs) {
      if (input && input.value && typeof input.value === 'string' && input.value.trim().length > 30) {
        window._tbdts_verified_token = input.value.trim();
        window._tbdts_captcha_verified = true;
        return true;
      }
    }
    return false;
  }

  /* ========================================================= */
  /*            [33] قفل زر المطالبة ومنع النقر عليه            */
  /* ========================================================= */
  function lockClaimButton() {
    const b = getClaimButton();
    if (!b) return;
    if (!isCaptchaVerified()) {
      b.setAttribute('data-tbdts-claim-locked', '1');
      b.disabled = true;
      b.style.setProperty('pointer-events', 'none', 'important');
    }
  }

  /* ========================================================= */
  /*            [34] فك قفل زر المطالبة عند التحقق               */
  /* ========================================================= */
  function unlockClaimButton() {
    const b = getClaimButton();
    if (!b) return;
    b.removeAttribute('data-tbdts-claim-locked');
    b.disabled = false;
    b.style.removeProperty('pointer-events');
  }

  /* ========================================================= */
  /*            [35] تنفيذ عملية النقر على زر المطالبة          */
  /* ========================================================= */
  function triggerClaim() {
    if (window._tbdts_claimed || !isUnlocked(s) || !GM_getValue('gl_script_on', true)) return;
    const b = getClaimButton();
    if (b && isCaptchaVerified()) {
      window._tbdts_claimed = true;
      window._tbdts_request_sent = true;
      b.click();
    }
  }

  /* ========================================================= */
  /*         [36] تنفيذ عملية النقر على زر تسجيل الدخول         */
  /* ========================================================= */
  function triggerLogin() { if (window._tbdts_logged_in || !GM_getValue('gl_script_on', true)) return; const b = getLoginButton(); if (b && isCaptchaVerified()) { window._tbdts_logged_in = true; setTimeout(() => { b.click(); }, LOGIN_DELAY_MS); } }

  /* ========================================================= */
  /*         [37] الاعتراض المباشر للنقرات اليدوية العشوائية    */
  /* ========================================================= */
  document.addEventListener('click', e => {
    const b = getClaimButton();
    if (!b) return;
    if (e.target === b || b.contains(e.target)) {
      if (!isCaptchaVerified()) {
        e.preventDefault();
        e.stopImmediatePropagation();
        e.stopPropagation();
        return false;
      }
    }
  }, true);

  /* ========================================================= */
  /*            [38] تحديث حالة الكابتشا بالتوكين               */
  /* ========================================================= */
  function setCaptchaToken(token) {
    window._tbdts_verified_token = null;
    window._tbdts_captcha_verified = false;

    window._tbdts_verified_token = token;
    window._tbdts_captcha_verified = true;

    window._tbdts_claimed = false;
    window._tbdts_request_sent = false;

    if (typeof claimGuardObserver !== 'undefined' && claimGuardObserver) claimGuardObserver.disconnect();
    unlockClaimButton();
  }

  /* ========================================================= */
  /*            [39] إطلاق الإجراء المقترن بفك الكابتشا        */
  /* ========================================================= */
  function dispatchCaptchaAction() {
    if (path.includes('login') || getLoginButton()) {
      triggerLogin();
    } else if (path.includes('withdraw')) {
      const wBtn = document.getElementById('process_withdraw') || document.querySelector('form[action*="withdraw"] button[type="submit"]');
      if (wBtn) wBtn.removeAttribute('disabled');
    } else if (isUnlocked(s)) {
      if (!window._tbdts_claim_scheduled) {
        window._tbdts_claim_scheduled = true;
        unlockClaimButton();
        setTimeout(() => triggerClaim(), CLAIM_DELAY_MS);
      }
    }
  }

  /* ========================================================= */
  /*            [40] اعتماد توكين الكابتشا وتفعيل الإجراء      */
  /* ========================================================= */
  function markCaptchaVerified(token) {
    if (typeof token !== 'string' || token.length <= 30) return;
    setCaptchaToken(token);
    dispatchCaptchaAction();
  }

  /* ========================================================= */
  /*           [41] الفحص المباشر لعناصر المدخلات للتوكين       */
  /* ========================================================= */
  function checkDomForToken() {
    const inputs = document.querySelectorAll('input[name="cf-turnstile-response"], input[name="g-recaptcha-response"]');
    for (let input of inputs) {
      if (input && input.value && typeof input.value === 'string' && input.value.trim().length > 30) {
        const cleanToken = input.value.trim();
        if (window._tbdts_verified_token !== cleanToken) {
          markCaptchaVerified(cleanToken);
        }
        break;
      }
    }
  }

  /* ========================================================= */
  /*         [42] قراءة التوكين المباشرة بدون الاعتراض على الدالة  */
  /* ========================================================= */
  function hookTurnstileCallback() {
    const uWin = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;
    if (uWin.turnstile && !window._tbdts_turnstile_hooked) {
      const origRender = uWin.turnstile.render;
      if (typeof origRender === 'function') {
        window._tbdts_turnstile_hooked = true;
        uWin.turnstile.render = function(container, params) {
          if (params && typeof params === 'object') {
            const origCb = params.callback;
            params.callback = function(token) {
              if (typeof token === 'string' && token.length > 30) {
                setTimeout(() => markCaptchaVerified(token), 300);
              }
              if (typeof origCb === 'function') return origCb(token);
            };
          }
          return origRender.call(this, container, params);
        };
      }
    }
    checkDomForToken();
  }

  /* ========================================================= */
  /*            [43] المراقبة الدورية لحالة Turnstile           */
  /* ========================================================= */
  function watchTurnstile() { hookTurnstileCallback(); if (isCaptchaVerified() && window._tbdts_turnstile_watch) { clearInterval(window._tbdts_turnstile_watch); window._tbdts_turnstile_watch = null; } }
  window._tbdts_turnstile_watch = setInterval(watchTurnstile, 100);

  /* ========================================================= */
  /*          [44] مراقب التغييرات الخاص بحماية زر المطالبة      */
  /* ========================================================= */
  const claimGuardObserver = new MutationObserver(() => {
    const b = getClaimButton();
    if (!b) return;
    checkDomForToken();
    if (isCaptchaVerified() && isUnlocked(s)) {
      unlockClaimButton();
      dispatchCaptchaAction();
    } else {
      lockClaimButton();
    }
  });
  if (document.documentElement) { claimGuardObserver.observe(document.documentElement, { childList: true, subtree: true }); }

  /* ========================================================= */
  /*          [45] تعبئة مدخل البريد الإلكتروني                 */
  /* ========================================================= */
  function fillEmailInput(emailInP, emailVal) {
    if (emailVal && emailInP.value !== emailVal) {
      emailInP.value = emailVal;
      emailInP.dispatchEvent(new Event('input', { bubbles: true }));
      emailInP.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  /* ========================================================= */
  /*          [46] تعبئة مدخل كلمة السر                         */
  /* ========================================================= */
  function fillPasswordInput(passInP, passVal) {
    if (passVal && passInP.value !== passVal) {
      passInP.value = passVal;
      passInP.dispatchEvent(new Event('input', { bubbles: true }));
      passInP.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  /* ========================================================= */
  /*          [47] التمرير التلقائي في صفحة الدخول             */
  /* ========================================================= */
  function scrollLoginPage() {
    window.scrollBy({ top: 400, behavior: 'smooth' });
  }

  /* ========================================================= */
  /*          [48] تعبئة حقول بيانات تسجيل الدخول               */
  /* ========================================================= */
  function fillLoginFields() {
    const emailInP = document.getElementById('user_email'), passInP = document.getElementById('password');
    // الجلب من المتغير الثابت المعرف بالملف المحلي SITE_CREDS
    const creds = typeof SITE_CREDS !== 'undefined' ? SITE_CREDS[s] : null;
    if (emailInP && passInP && creds && !window._loginHandled) {
      window._loginHandled = true;
      fillEmailInput(emailInP, creds.email);
      fillPasswordInput(passInP, creds.pass);
      scrollLoginPage();
    }
  }

  /* ========================================================= */
  /*          [49] معالجة وتسليم عملية تسجيل الدخول التلقائي    */
  /* ========================================================= */
  function handleAutoLogin() {
    fillLoginFields();
    hookTurnstileCallback();
    if (isCaptchaVerified()) {
      triggerLogin();
    }
  }

  /* ========================================================= */
  /*           [50] فحص ورصد حظر Cloudflare (Error 1015 / Denied)*/
  /* ========================================================= */
  function isCloudflareBlocked() {
    return (document.title && document.title.includes('Access denied')) || document.body.innerText.includes('Error 1015');
  }

  /* ========================================================= */
  /*           [51] إيقاف المؤقتات عند اكتشاف حظر Cloudflare    */
  /* ========================================================= */
  function stopTimersOnBlock(clearTimeoutFn, clearIntervalFn) {
    clearTimeoutFn();
    clearIntervalFn();
    eZ();
  }

  /* ========================================================= */
  /*           [52] جدولة عملية إعادة التحميل بعد الحظر         */
  /* ========================================================= */
  function schedulePostBlockReload() {
    if (!window._cfR) {
      window._cfR = true;
      setTimeout(() => { if (!handleFailure()) hR(); }, 8000);
    }
  }

  /* ========================================================= */
  /*           [53] علاج أخطاء الحماية والحظر (Cloudflare)     */
  /* ========================================================= */
  function checkCloudflareErrors(clearTimeoutFn, clearIntervalFn) {
    if (isCloudflareBlocked()) {
      stopTimersOnBlock(clearTimeoutFn, clearIntervalFn);
      schedulePostBlockReload();
      return true;
    }
    return false;
  }

  /* ========================================================= */
  /*              [54] محاكاة تفاعل النقرة الأولى               */
  /* ========================================================= */
  function simulateFirstClick() {
    try {
      document.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window, clientX: Math.floor(Math.random() * window.innerWidth), clientY: Math.floor(Math.random() * window.innerHeight) }));
    } catch (e) { }
  }

  /* ========================================================= */
  /*              [55] محاكاة تفاعل المستخدم الأولي             */
  /* ========================================================= */
  function triggerInitialInteraction() {
    if (!window._scRolled) {
      window.scrollTo(0, 0);
      window._scRolled = true;
      simulateFirstClick();
    }
  }

  /* ========================================================= */
  /*             [56] ضبط وااختيار نوع الكابتشا المفضل           */
  /* ========================================================= */
  function selectPreferredCaptcha() {
    const sl = document.querySelector('#select_captcha');
    if (sl && sl.value !== '3') {
      sl.value = '3';
      sl.dispatchEvent(new Event('change', { bubbles: true }));
      sl.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  /* ========================================================= */
  /*          [57] تطبيق التنسيقات الخاصة بصفحة السحب           */
  /* ========================================================= */
  function applyWithdrawStyles() {
    eZ();
    const head = document.head || document.documentElement;
    if (!document.getElementById('pure-w-style') && head) {
      const ws = document.createElement('style');
      ws.id = 'pure-w-style';
      ws.innerHTML = `div[class="form-wrapper__main"] > p,#history_table tbody tr:not(:first-child){display:none!important}`;
      head.appendChild(ws);
    }
  }

  /* ========================================================= */
  /*           [58] التعبئة التلقائية لمبلغ السحب المطلوب       */
  /* ========================================================= */
  function autoFillWithdrawAmount() {
    if (!window._mCSet) {
      const am = document.getElementById('withdrawal_amount'), bal = document.querySelector('.user_balance');
      if (am && bal && bal.innerText.trim()) {
        const numMatch = bal.innerText.trim().match(/[\d\.]+/);
        if (numMatch) {
          am.value = numMatch[0];
          am.dispatchEvent(new Event('input', { bubbles: true }));
          am.dispatchEvent(new Event('change', { bubbles: true }));
          window._mCSet = true;
        }
      }
    }
  }

  /* ========================================================= */
  /*           [59] التعبئة التلقائية لعنوان محفظة السحب        */
  /* ========================================================= */
  function autoFillWithdrawAddress() {
    if (!window._aCplSet) {
      const ad = document.getElementById('withdrawal_address'), cp = document.querySelector('.js_clipboard,[data-copy],[data-clipboard-text]');
      if (ad && cp) {
        const val = cp.getAttribute('data-copy') || cp.getAttribute('data-clipboard-text') || cp.innerText.trim();
        if (val) {
          ad.value = val;
          ad.dispatchEvent(new Event('input', { bubbles: true }));
          ad.dispatchEvent(new Event('change', { bubbles: true }));
          window._aCplSet = true;
        }
      }
    }
  }

  /* ========================================================= */
  /*             [60] التمرير التلقائي في صفحة السحب            */
  /* ========================================================= */
  function scrollWithdrawPage() {
    if (window._mCSet && window._aCplSet && !window._withdrawScrolled) {
      window.scrollBy({ top: 410, behavior: 'smooth' });
      window._withdrawScrolled = true;
    }
  }

  /* ========================================================= */
  /*             [61] إدارة معالجة كشوف وصفحات السحب              */
  /* ========================================================= */
  function handleWithdrawLogic() {
    if (path.includes('withdraw')) {
      applyWithdrawStyles();
      autoFillWithdrawAmount();
      autoFillWithdrawAddress();
      scrollWithdrawPage();
      const cfInput = document.querySelector('form input[name="cf-turnstile-response"]');
      if (cfInput && cfInput.value && cfInput.value.length > 30) {
        window._tbdts_verified_token = cfInput.value;
        window._tbdts_captcha_verified = true;
      }
    }
  }

  /* ========================================================= */
  /*            [62] التوجيه التلقائي للموقع التالي عند النجاح  */
  /* ========================================================= */
  function navigateNextOnSuccess() {
    if (sites[sites.length - 1] === s) {
      showDone();
    } else {
      const nxt = nS[s];
      if (nxt) setTimeout(() => { window.location.href = 'https://' + nxt + '/faucet.php'; }, 1000);
    }
  }

  /* ========================================================= */
  /*            [63] معالجة نتيجة المطالبة الناجحة              */
  /* ========================================================= */
  function handleSuccessToast(clearTimeoutFn, clearIntervalFn) {
    clearTimeoutFn();
    clearIntervalFn();
    playAudio('success');
    handleSuccess();
    GM_setValue('f_lock_' + s, Date.now());
    navigateNextOnSuccess();
  }

  /* ========================================================= */
  /*            [64] معالجة نتيجة المطالبة الفاشلة               */
  /* ========================================================= */
  function handleFailureToast(clearTimeoutFn, clearIntervalFn) {
    clearTimeoutFn();
    clearIntervalFn();
    playAudio('error');
    GM_setValue('f_lock_' + s, 0);
    setTimeout(() => {
      if (!handleFailure()) hR();
    }, 10000);
  }

  /* ========================================================= */
  /*            [65] استخراج عنصر التنبيه الفعلي (Toast)         */
  /* ========================================================= */
  function getActiveToast() {
    const allToasts = document.querySelectorAll('.jq-toast-single');
    for (let t of allToasts) {
      let tTxt = (t.innerText || t.textContent || '').toLowerCase();
      if (s === 'solpick.io' && tTxt.includes('0.00000000')) continue;
      return t;
    }
    return null;
  }

  /* ========================================================= */
  /*            [66] توجيه إجراء التنبيه بناء على النتيجة       */
  /* ========================================================= */
  function processToastResult(realToast, clearTimeoutFn, clearIntervalFn) {
    const toastText = (realToast.innerText || realToast.textContent || '').toLowerCase();
    if (toastText.includes('success')) {
      handleSuccessToast(clearTimeoutFn, clearIntervalFn);
    } else {
      handleFailureToast(clearTimeoutFn, clearIntervalFn);
    }
  }

  /* ========================================================= */
  /*            [67] فحص ورصد رسائل التنبيه (Toasts)            */
  /* ========================================================= */
  function checkToasts(clearTimeoutFn, clearIntervalFn) {
    if (!path.includes('faucet')) return;
    hookTurnstileCallback();
    const realToast = getActiveToast();
    if (realToast) {
      processToastResult(realToast, clearTimeoutFn, clearIntervalFn);
    }
  }

  /* ========================================================= */
  /*               [68] ضبط المؤقت الوقائي للمحرك               */
  /* ========================================================= */
  function setupSafetyTimeout(getIntervalFn) {
    return setTimeout(() => {
      if (path.includes('faucet') && isUnlocked(s)) {
        clearInterval(getIntervalFn());
        if (!handleFailure()) setTimeout(() => hR(), 400);
      }
    }, 30000);
  }

  /* ========================================================= */
  /*               [69] تنفيذ المهام الدورية للمحرك             */
  /* ========================================================= */
  function runLoopCycle(clearTimeoutFn, clearIntervalFn) {
    if (!GM_getValue('gl_script_on', true)) return;
    if (!isCaptchaVerified()) lockClaimButton();
    checkAndScrollForPhrase();
    injectAccountBadge();
    if (isMaintPage()) {
      clearTimeoutFn();
      handleMaintLogic();
      return;
    }
    if (checkCloudflareErrors(clearTimeoutFn, clearIntervalFn)) return;
    triggerInitialInteraction();
    if (!bA) aB();
    selectPreferredCaptcha();
    if (path.includes('login') || document.getElementById('process_login')) handleAutoLogin();
    handleWithdrawLogic();
    if (!isUnlocked(s)) return;
    checkToasts(clearTimeoutFn, clearIntervalFn);
  }

  /* ========================================================= */
  /*          [70] المحرك الرئيسي وحلقة المراقبة (Main Loop)     */
  /* ========================================================= */
  const rS = () => {
    let iv = null;
    let wT = setupSafetyTimeout(() => iv);
    iv = setInterval(() => {
      if (!document.body) return;
      runLoopCycle(() => clearTimeout(wT), () => clearInterval(iv));
    }, 500);
  };

  /* ========================================================= */
  /*                 [71] بدء تشغيل المحرك الرئيسي               */
  /* ========================================================= */
  rS();
})();
