'use strict';
/* ══ HERMES v2 — App Router & Utilities ══ */

/* ── Globals ── */
const Hermes = {
  currentPage: null,
  pages: {},   // populated by page scripts
};

/* ── Formatters ── */
const fmt    = v => 'R$ '+Number(v||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
const fmtPct = v => Number(v||0).toFixed(1)+'%';
const fmtDate= v => v ? new Date(v).toLocaleDateString('pt-BR') : '—';
const fmtDT  = v => v ? new Date(v).toLocaleString('pt-BR') : '—';

/* ── Toast ── */
function toast(msg, type='success', dur=3200){
  const icons={success:'check-circle',error:'x-circle',warning:'alert-triangle',info:'info'};
  const el=document.createElement('div');
  el.className=`toast ${type}`;
  el.innerHTML=`<i data-lucide="${icons[type]||'info'}"></i><span>${msg}</span>`;
  document.getElementById('toast-container').appendChild(el);
  lucide.createIcons({nodes:[el]});
  setTimeout(()=>{ el.style.animation='slideOut .3s ease forwards'; setTimeout(()=>el.remove(),300); }, dur);
}

/* ── Modal ── */
function openModal(html){
  const c=document.getElementById('modal-container');
  c.innerHTML=html;
  lucide.createIcons({nodes:[c]});
  const bd=c.querySelector('.modal-backdrop');
  if(bd){
    bd.addEventListener('click',e=>{ if(e.target===bd) closeModal(); });
    bd.querySelectorAll('[data-close-modal]').forEach(b=>b.addEventListener('click',closeModal));
  }
}
function closeModal(){ document.getElementById('modal-container').innerHTML=''; }

/* ── Confirm ── */
function confirm2(title, msg, onOk){
  openModal(`<div class="modal-backdrop">
    <div class="modal-box modal-sm">
      <div class="modal-header"><h2>${title}</h2><button class="modal-close" data-close-modal><i data-lucide="x"></i></button></div>
      <div class="modal-body"><p style="color:var(--t2);line-height:1.6">${msg}</p></div>
      <div class="modal-footer">
        <button class="btn btn-ghost" data-close-modal>Cancelar</button>
        <button class="btn btn-danger" id="confirm-ok-btn"><i data-lucide="trash-2"></i> Confirmar</button>
      </div>
    </div></div>`);
  document.getElementById('confirm-ok-btn').addEventListener('click',()=>{ closeModal(); onOk(); });
}

/* ── Pill Nav / Router ── */
function initNav(){
  const tabs=document.querySelectorAll('.pill-tab');
  const slider=document.getElementById('pill-slider');
  function moveSlider(btn){
    const nr=document.getElementById('pill-nav').getBoundingClientRect();
    const br=btn.getBoundingClientRect();
    slider.style.left=(br.left-nr.left)+'px';
    slider.style.width=br.width+'px';
  }
  function navigate(page){
    if(Hermes.currentPage===page) return;
    if(Hermes.pages[Hermes.currentPage]?.destroy) Hermes.pages[Hermes.currentPage].destroy();
    Hermes.currentPage=page;
    tabs.forEach(t=>t.classList.toggle('active',t.dataset.page===page));
    const btn=document.querySelector(`.pill-tab[data-page="${page}"]`);
    if(btn) moveSlider(btn);
    const content=document.getElementById('page-content');
    content.innerHTML=`<div class="page-loading"><i data-lucide="loader-2" class="spin"></i></div>`;
    lucide.createIcons({nodes:[content]});
    const pg=Hermes.pages[page];
    if(!pg){ content.innerHTML='<p style="padding:40px;color:var(--t3)">Página não encontrada.</p>'; return; }
    content.innerHTML=`<div class="page-enter">${pg.template}</div>`;
    lucide.createIcons({nodes:[content]});
    if(pg.init) pg.init();
    updateGlobalStatus();
  }
  tabs.forEach(t=>t.addEventListener('click',()=>navigate(t.dataset.page)));
  // expose for other modules
  Hermes.navigate=navigate;
  setTimeout(()=>moveSlider(document.querySelector('.pill-tab.active')),50);
  navigate('dashboard');
}

/* ── Global Status Bar + Caixa Pill ── */
function updateGlobalStatus(){
  const prods=DB.getProdutos();
  const alertasProd=prods.filter(p=>p.estoque<=p.minimo).length;
  const alertasFin=DB.countAlertasFinanceiros();
  document.getElementById('sb-produtos').textContent=prods.length+' produtos';
  const caixa=DB.getCaixaAberto();
  const saldo=DB.getSaldoCaixa();
  document.getElementById('sb-caixa').textContent=caixa?'Caixa aberto — '+fmt(saldo):'Caixa fechado';
  document.getElementById('sb-alertas').textContent=alertasProd+' alertas';

  // badge financeiro
  const badgeFin=document.getElementById('badge-financeiro');
  if(badgeFin){ badgeFin.textContent=alertasFin; badgeFin.classList.toggle('hidden',alertasFin===0); }

  // caixa status pill in header
  const pillEl=document.getElementById('caixa-status-pill');
  if(pillEl){
    if(caixa){
      pillEl.innerHTML=`<button class="cs-pill aberto" onclick="Hermes.navigate('financeiro')">
        <span class="cs-dot"></span>Caixa Aberto — ${fmt(saldo)}</button>`;
    } else {
      pillEl.innerHTML=`<button class="cs-pill fechado" onclick="Hermes.navigate('financeiro')">
        <span class="cs-dot"></span>Caixa Fechado</button>`;
    }
  }
}

/* ── Clock ── */
function initClock(){
  const el=document.getElementById('clock-display');
  const tick=()=>{ el.textContent=new Date().toLocaleTimeString('pt-BR'); };
  tick(); setInterval(tick,1000);
}

/* ── Seed ── */
document.addEventListener('DOMContentLoaded',()=>{
  document.getElementById('seed-btn').addEventListener('click',()=>{
    confirm2('Carregar dados de exemplo',
      'Isso apagará <strong>todos</strong> os dados atuais e preencherá com exemplos. Continuar?',
      ()=>{ DB.seed(); Hermes.navigate(Hermes.currentPage||'dashboard'); toast('Dados de exemplo carregados!'); updateGlobalStatus(); }
    );
  });
  initClock();
  initNav();
});
