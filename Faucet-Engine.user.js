/* ========================================================================= */
/*                                                                           */
/*                  [القسم الثاني: المحرك البرمجي الديناميكي]                */
/*            (عند تحديث المحرك مستقبلاً، يتم استبدال ما تحته فقط)           */
/*                                                                           */
/* ========================================================================= */
(function() {
  'use strict';
  const uWin = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;
  /* ========================================================= */
  /* [2.1] قفل الشبكة الحديدي (Network Level Interceptor)       */
  /* ========================================================= */
  uWin._tbdts_SINGLE_LOCK = false;
  const origFetch = uWin.fetch;
  uWin.fetch = function(...args) {
    let url = '';
    if (args[0]) {
      if (typeof args[0] === 'string') {
        url = args[0];
      } else if (typeof args[0] === 'object') {
        url = args[0].url || args[0].href || args[0].toString() || '';
      }
    }
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes('claim') || lowerUrl.includes('process_claim')) {
      if (uWin._tbdts_SINGLE_LOCK) {
        return new Promise(() => {});
      }
      uWin._tbdts_SINGLE_LOCK = true;
    }
    return origFetch.apply(this, args);
  };
  const origXhrOpen = uWin.XMLHttpRequest.prototype.open;
  uWin.XMLHttpRequest.prototype.open = function(method, url, ...rest) {
    this._url = typeof url === 'string' ? url : '';
    if (this._url.toLowerCase().includes('claim') || this._url.toLowerCase().includes('process_claim')) {
      this._tbdts_is_claim_req = true;
    }
    return origXhrOpen.apply(this, [method, url, ...rest]);
  };
  const origXhrSend = uWin.XMLHttpRequest.prototype.send;
  uWin.XMLHttpRequest.prototype.send = function(...args) {
    if (this._tbdts_is_claim_req || (this._url && (this._url.toLowerCase().includes('claim') || this._url.toLowerCase().includes('process_claim')))) {
      if (uWin._tbdts_SINGLE_LOCK) {
        return;
      }
      uWin._tbdts_SINGLE_LOCK = true;
    }
    return origXhrSend.apply(this, args);
  };
})();

(function(){
  'use strict';
  if(window._m_run_active) return;
  window._m_run_active = true;
  const path = window.location.pathname.toLowerCase();
  const s = window.location.hostname.replace(/^www\./, '');
  const uWin = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;
  window._tbdts_page_open_time = Date.now();
  setTimeout(() => {
    const inputs = document.querySelectorAll('input[name="cf-turnstile-response"], input[name="g-recaptcha-response"]');
    inputs.forEach(input => {
      if (input && input.value && input.value.trim().length > 100) {
        window._tbdts_stale_token = input.value.trim();
        input.value = '';
      }
    });
  }, 100);
  const sites = uWin.MY_SITES || ['tronpick.io'];
  const nS = uWin.MY_NS || {'tronpick.io':'tronpick.io'};
  /* ========================================================= */
  /* [2.2] قواعد أنماط CSS للإخفاء (قابلة للتعديل والتحديث مستقبلاً) */
  /* ========================================================= */
  const hideCss = ".cpx_uqnxd_80,.cpx_uqnxd_83,#show_surveys,#show_surveys > h3,table.history_tbl,th[width=\"50%\"],th.top_header,tr.history_row > td,div.faucet-tabs,.faucet-tab,.faucet-tab.is-active,#hourly_faucet > p,.level-progress-card.level-progress-card--tabs,.level-progress-card__inner,#cpx_survey,footer.footer,div.footer-container,.iconcaptcha-modal__header,.iconcaptcha-modal__footer,.iconcaptcha-modal__body-info,h2.single_title_n,div[class=\"single_title_n\"] > h2,p[style*=\"margin: 0px auto 30px\"],p[style*=\"margin:0 auto 30px\"],.promo-banner,#promo_banner,div[data-interval=\"5000\"],div[aria-roledescription=\"carousel\"],div[data-contest-end],div[aria-label=\"Feature promotions\"]{display:none!important}.dash_tp_menu_area{display:block!important;visibility:visible!important;opacity:1!important}.nav_container{display:flex!important;visibility:visible!important;opacity:1!important}";
  
  uWin._tbdts_hideCss = hideCss;
  let fastStyle = null;
  function injectFastStyle(){
    if(!fastStyle && path.includes('faucet')){
      const target = document.head || document.documentElement;
      if(target){
        fastStyle = document.createElement('style');
        fastStyle.id = 'fast-hide-style';
        fastStyle.innerHTML = GM_getValue('gl_cl', true) ? hideCss : '';
        target.appendChild(fastStyle);
        return true;
      }
    }
    return false;
  }
  if(!injectFastStyle()){
    const earlyObs = new MutationObserver(()=>{if(injectFastStyle()) earlyObs.disconnect()});
    earlyObs.observe(document, {childList: true, subtree: true});
  }
  /* ========================================================= */
  /* [2.3] دوال التحقق، الحالة، التوقيت والأخطاء الأساسية       */
  /* ========================================================= */
  function isUnlocked(dom){
    const lT = GM_getValue('f_lock_' + dom, 0);
    return !lT || (Date.now() - lT >= 36e5);
  }
  function hR(){
    window.location.replace(window.location.origin + window.location.pathname + '?t=' + Date.now());
  }
  function goToNextSiteOrDone(){
    const isLast = sites[sites.length - 1] === s;
    if(isLast){
      if(typeof uWin.showDone === 'function') uWin.showDone();
      else window.location.reload();
    } else {
      const nxt = nS[s];
      if(nxt) window.location.href = 'https://' + nxt + '/faucet.php';
      else {
        if(typeof uWin.showDone === 'function') uWin.showDone();
        else window.location.reload();
      }
    }
  }
  function handleFailure(){
    let errCnt = GM_getValue('err_cnt_' + s, 0) + 1;
    if(errCnt >= 2){
      GM_setValue('err_cnt_' + s, 0);
      goToNextSiteOrDone();
      return true;
    }
    GM_setValue('err_cnt_' + s, errCnt);
    hR();
    return false;
  }
  function handleSuccess(){
    GM_setValue('err_cnt_' + s, 0);
  }
  let inactivityTimer = null;
  function resetInactivityTimer(){
    if(!path.includes('faucet') || isUnlocked(s)){
      if(inactivityTimer) clearTimeout(inactivityTimer);
      return;
    }
    if(inactivityTimer) clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(()=>{
      if(typeof uWin.showDone === 'function') uWin.showDone();
    }, 4e4);
  }
  resetInactivityTimer();
  ['click','mousemove','keydown','scroll','touchstart'].forEach(evt=>{
    window.addEventListener(evt, resetInactivityTimer, {passive: true});
  });
  let _phraseScrolled = false;
  function checkAndScrollForPhrase(){
    if(_phraseScrolled) return;
    if(document.body && document.body.innerText.includes('يستخدم هذا الموقع خدمة أمنية للحماية من الروبوتات') && !document.getElementById('process_claim_hourly_faucet')){
      _phraseScrolled = true;
      setTimeout(()=>{
        window.scrollBy({top: 230, behavior: 'smooth'});
      }, 600);
    }
  }
  const initObserver = () => {
    const target = document.documentElement || document.body;
    if(!target){ setTimeout(initObserver, 50); return; }
    const obs = new MutationObserver(()=>{
      checkAndScrollForPhrase();
      if(typeof uWin.injectAccountBadge === 'function') uWin.injectAccountBadge();
    });
    obs.observe(target, {childList: true, subtree: true});
  };
  initObserver();
  function playAudio(t){
    if(GM_getValue('gl_audio_muted', false)) return;
    try{
      const ac = new (window.AudioContext || window.webkitAudioContext)();
      if(ac.state === 'suspended') ac.resume();
      const o = ac.createOscillator(), g = ac.createGain();
      o.connect(g); g.connect(ac.destination);
      if(t === 'success'){
        o.type = 'sine';
        o.frequency.setValueAtTime(600, ac.currentTime);
        o.frequency.linearRampToValueAtTime(1000, ac.currentTime + .1);
      } else {
        o.type = 'square';
        o.frequency.setValueAtTime(400, ac.currentTime);
      }
      g.gain.setValueAtTime(.1, ac.currentTime);
      o.start();
      o.stop(ac.currentTime + .2);
    }catch(e){}
  }
  function eZ(){
    const head = document.head || document.documentElement;
    if((path.includes('withdraw') || window._isMaint) && head){
      let m = document.querySelector('meta[name="viewport"]');
      if(!m){
        m = document.createElement('meta');
        m.name = 'viewport';
        head.appendChild(m);
      }
      m.content = 'width=device-width, initial-scale=1.0, user-scalable=yes';
    }
  }
  function isMaintPage(){
    if(!path.includes('faucet')) return false;
    if(document.querySelector('meta[name="viewport"]')) return false;
    const txt = (document.body ? document.body.innerText : '').toLowerCase();
    return ['maintenance','under maintenance','be right back','scheduled maintenance'].some(k => txt.includes(k)) || (document.body && !document.getElementById('process_claim_hourly_faucet') && !document.querySelector('#select_captcha'));
  }
  let maintT = null;
  function handleMaintLogic(){
    if(window._maintHandled) return;
    window._maintHandled = true;
    window._isMaint = true;
    eZ();
    if(!maintT){
      maintT = setTimeout(()=>{ goToNextSiteOrDone(); }, 2000);
    }
  }
  /* ========================================================= */
  /* [2.4] الكابتشا، تسجيل الدخول والنقر المنفرد              */
  /* ========================================================= */
  window._tbdts_toast_processed = false;
  window._tbdts_clicked_once = false;
  function getClaimButton(){ return document.getElementById('process_claim_hourly_faucet'); }
  function getLoginButton(){ return document.getElementById('process_login'); }
  function isCaptchaVerified(){
    if (Date.now() - (window._tbdts_page_open_time || 0) < 1000) {
      return false;
    }
    const inputs = document.querySelectorAll('input[name="cf-turnstile-response"], input[name="g-recaptcha-response"]');
    for (let input of inputs) {
      if (input && input.value && typeof input.value === 'string' && input.value.trim().length > 100) {
        const val = input.value.trim();
        if (window._tbdts_stale_token && window._tbdts_stale_token === val) {
          input.value = '';
          return false;
        }
        return true;
      }
    }
    return false;
  }
  function executeSingleClaim(){
    if(window._tbdts_clicked_once || uWin._tbdts_SINGLE_LOCK) return;
    const b = getClaimButton();
    if(!b || !isCaptchaVerified()) return;
    
    // القفل الفوري والاستباقي لمنع أي سباق زمني أو إرسال طلبات متعددة
    window._tbdts_clicked_once = true;
    uWin._tbdts_SINGLE_LOCK = true;
    
    setTimeout(()=>{
      if(b) b.click();
    }, 300);
  }
  function executeSingleLogin(){
    if(window._tbdts_clicked_once || uWin._tbdts_SINGLE_LOCK) return;
    const b = getLoginButton();
    if(!b || !isCaptchaVerified()) return;
    window._tbdts_clicked_once = true;
    uWin._tbdts_SINGLE_LOCK = true;
    setTimeout(()=>{
      if(b) b.click();
    }, 300);
  }
  function fillLoginFields(){
    const emailInP = document.getElementById('user_email'), passInP = document.getElementById('password');
    const creds = uWin.SITE_CREDS ? uWin.SITE_CREDS[s] : null;
    if(emailInP && passInP && creds && !window._loginHandled){
      window._loginHandled = true;
      if(emailInP.value !== creds.email){
        emailInP.value = creds.email;
        emailInP.dispatchEvent(new Event('input', {bubbles: true}));
        emailInP.dispatchEvent(new Event('change', {bubbles: true}));
      }
      if(passInP.value !== creds.pass){
        passInP.value = creds.pass;
        passInP.dispatchEvent(new Event('input', {bubbles: true}));
        passInP.dispatchEvent(new Event('change', {bubbles: true}));
      }
      window.scrollBy({top: 400, behavior: 'smooth'});
    }
  }
  function handleAutoLogin(){
    if(window._tbdts_clicked_once || uWin._tbdts_SINGLE_LOCK) return;
    fillLoginFields();
    if(isCaptchaVerified()){
      executeSingleLogin();
    }
  }
  function checkCloudflareErrors(clearTimeoutFn, clearIntervalFn){
    const isBlocked = (document.title && document.title.includes('Access denied')) || (document.body && document.body.innerText.includes('Error 1015'));
    if(isBlocked){
      clearTimeoutFn();
      clearIntervalFn();
      eZ();
      if(!window._cfR){
        window._cfR = true;
        setTimeout(()=>{ handleFailure(); }, 4000);
      }
      return true;
    }
    return false;
  }
  function triggerInitialInteraction(){
    if(!window._scRolled){
      window.scrollTo(0, 0);
      window._scRolled = true;
      try{
        document.dispatchEvent(new MouseEvent('click', {bubbles: true, cancelable: true, view: window, clientX: Math.floor(Math.random()*window.innerWidth), clientY: Math.floor(Math.random()*window.innerHeight)}));
      }catch(e){}
    }
  }
  function selectPreferredCaptcha(){
    const sl = document.querySelector('#select_captcha');
    if(sl && sl.value !== '3'){
      sl.value = '3';
      sl.dispatchEvent(new Event('change', {bubbles: true}));
      sl.dispatchEvent(new Event('input', {bubbles: true}));
      // إضافة تفعيل jQuery لضمان استجابة الموقع 100% مهما كان نوع مستمع الأحداث لديه
      if(typeof window.jQuery !== 'undefined'){
        window.jQuery(sl).val('3').trigger('change').trigger('input');
      }
    }
  }
  function handleWithdrawLogic(){
    if(path.includes('withdraw')){
      eZ();
      const head = document.head || document.documentElement;
      if(!document.getElementById('pure-w-style') && head){
        const ws = document.createElement('style');
        ws.id = 'pure-w-style';
        ws.innerHTML = `div[class="form-wrapper__main"] > p,#history_table tbody tr:not(:first-child){display:none!important}`;
        head.appendChild(ws);
      }
      if(!window._mCSet){
        const am = document.getElementById('withdrawal_amount'), bal = document.querySelector('.user_balance');
        if(am && bal && bal.innerText.trim()){
          const numMatch = bal.innerText.trim().match(/[\d\.]+/);
          if(numMatch){
            am.value = numMatch[0];
            am.dispatchEvent(new Event('input', {bubbles: true}));
            am.dispatchEvent(new Event('change', {bubbles: true}));
            window._mCSet = true;
          }
        }
      }
      if(!window._aCplSet){
        const ad = document.getElementById('withdrawal_address'), cp = document.querySelector('.js_clipboard,[data-copy],[data-clipboard-text]');
        if(ad && cp){
          const val = cp.getAttribute('data-copy') || cp.getAttribute('data-clipboard-text') || cp.innerText.trim();
          if(val){
            ad.value = val;
            ad.dispatchEvent(new Event('input', {bubbles: true}));
            ad.dispatchEvent(new Event('change', {bubbles: true}));
            window._aCplSet = true;
          }
        }
      }
      if(window._mCSet && window._aCplSet && !window._withdrawScrolled){
        window.scrollBy({top: 410, behavior: 'smooth'});
        window._withdrawScrolled = true;
      }
    }
  }
  /* ========================================================= */
  /* [2.5] معالجة التنبيهات (Toasts) والنتائج                   */
  /* ========================================================= */
  function getActiveToast(){
    const allToasts = document.querySelectorAll('.jq-toast-single');
    for(let t of allToasts){
      let tTxt = (t.innerText || t.textContent || '').toLowerCase();
      return t;
    }
    return null;
  }
  function processToastResult(realToast, clearTimeoutFn, clearIntervalFn){
    if(window._tbdts_toast_processed) return;
    window._tbdts_toast_processed = true;
    window._tbdts_clicked_once = true;
    uWin._tbdts_SINGLE_LOCK = true;
    clearTimeoutFn();
    clearIntervalFn();
    const toastText = (realToast.innerText || realToast.textContent || '').toLowerCase();
    
    if(toastText.includes('success')){
      playAudio('success');
      handleSuccess();
      GM_setValue('f_lock_' + s, Date.now());
      setTimeout(()=>{ goToNextSiteOrDone(); }, 100);
    } else if(toastText.includes('too many requests')){
      playAudio('error');
      GM_setValue('err_cnt_' + s, 0);
      goToNextSiteOrDone();
    } else {
      playAudio('error');
      GM_setValue('f_lock_' + s, 0);
      setTimeout(()=>{ handleFailure(); }, 3000);
    }
  }
  function checkToasts(clearTimeoutFn, clearIntervalFn){
    if(!path.includes('faucet') || window._tbdts_toast_processed) return;
    const realToast = getActiveToast();
    if(realToast){
      processToastResult(realToast, clearTimeoutFn, clearIntervalFn);
    }
  }
  /* ========================================================= */
  /* [2.6] حلقة التشغيل الرئيسية والنبضات (Run Loop & Cycle)     */
  /* ========================================================= */
  function runLoopCycle(clearTimeoutFn, clearIntervalFn){
    if(!GM_getValue('gl_script_on', true) || window._tbdts_toast_processed) return;
    if(!window._tbdts_clicked_once && isCaptchaVerified()){
      if(isUnlocked(s)){
        if(path.includes('login') || getLoginButton()){
          handleAutoLogin();
        }else{
          executeSingleClaim();
        }
      }
    }
    checkAndScrollForPhrase();
    if(typeof uWin.injectAccountBadge === 'function') uWin.injectAccountBadge();
    if(isMaintPage()){
      clearTimeoutFn();
      clearIntervalFn();
      handleMaintLogic();
      return;
    }
    if(checkCloudflareErrors(clearTimeoutFn, clearIntervalFn)) return;
    triggerInitialInteraction();
    if(typeof uWin.aB === 'function') uWin.aB();
    selectPreferredCaptcha();
    if(path.includes('login') || document.getElementById('process_login')) handleAutoLogin();
    handleWithdrawLogic();
    if(!isUnlocked(s)) return;
    checkToasts(clearTimeoutFn, clearIntervalFn);
  }
  const rS = () => {
    let iv = null;
    let wT = setTimeout(()=>{
      if(path.includes('faucet') && isUnlocked(s)){
        clearInterval(iv);
        if(!window._tbdts_toast_processed){
          handleFailure();
        }
      }
    }, 18000);
    iv = setInterval(()=>{
      if(!document.body || window._tbdts_toast_processed){
        clearInterval(iv);
        return;
      }
      runLoopCycle(()=>clearTimeout(wT), ()=>clearInterval(iv));
    }, 200);
  };
  rS();
})();
