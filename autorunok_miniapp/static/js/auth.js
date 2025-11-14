// /static/js/auth.js
(function(){
  const LONG_MS = 1200;
  const tabProfile = document.getElementById('tabProfile');
  const toast = (msg)=>{
    const t = document.getElementById('toast') || Object.assign(document.body.appendChild(document.createElement('div')), {
      id:'toast', className:'toast'
    });
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(()=>t.classList.remove('show'), 1600);
  };

  async function devLogin(){
    try{
      const r = await fetch(`/api/dev_login?t=${Date.now()}`, {credentials:'include'});
      if(!r.ok) throw new Error(await r.text());
      toast('Dev-логин: OK');
      // немного подождём, чтобы сессия точно записалась
      setTimeout(()=>location.reload(), 250);
    }catch(e){
      toast('Dev-логин ошибка: ' + (e?.message || e));
      console.error('[dev_login]', e);
    }
  }

  if(tabProfile){
    let timer = null, down = false;

    const start = ()=>{ down = true; timer = setTimeout(()=>{ if(down) devLogin(); }, LONG_MS); };
    const cancel = ()=>{ down = false; if(timer){ clearTimeout(timer); timer=null; } };

    tabProfile.addEventListener('mousedown', start);
    tabProfile.addEventListener('touchstart', start, {passive:true});
    ['mouseup','mouseleave','touchend','touchcancel'].forEach(ev=>tabProfile.addEventListener(ev, cancel));

    // На клик — обычный переход в профиль
    tabProfile.addEventListener('click', (e)=>{
      // если длинный тап уже сработал — не мешаем
      if(down) return;
    });
  }

  // для удобства на десктопе в консоли:
  window.devLogin = devLogin;
})();