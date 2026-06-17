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

/* ── Theme ── */
const THEMES = [
  {id:'amber',  label:'Âmbar',  color:'#f59e0b', color2:'#fbbf24', shade:'#ffaa45'},
  {id:'blue',   label:'Azul',   color:'#3b9eff', color2:'#60b4ff', shade:'#7ac4ff'},
  {id:'green',  label:'Verde',  color:'#22d3a0', color2:'#34dca8', shade:'#5de8bb'},
  {id:'purple', label:'Roxo',   color:'#c084fc', color2:'#d09ffd', shade:'#d4a4fd'},
  {id:'rose',   label:'Rosa',   color:'#f472b6', color2:'#f9a8d4', shade:'#fba6c9'},
];

function applyTheme(id){
  const t=THEMES.find(x=>x.id===id)||THEMES[0];
  const r=document.documentElement;
  r.style.setProperty('--accent',t.color);
  r.style.setProperty('--accent2',t.color2);
  r.style.setProperty('--orange',t.shade);
  localStorage.setItem('h_theme',id);
}

function applyBg(mode){
  document.documentElement.setAttribute('data-bg',mode);
  localStorage.setItem('h_bg',mode);
}

function initTheme(){
  applyTheme(localStorage.getItem('h_theme')||'amber');
  applyBg(localStorage.getItem('h_bg')||'dark');

  const btn=document.getElementById('theme-btn');
  let pop=null;

  function closePop(){ if(pop){ pop.remove(); pop=null; } }

  btn.addEventListener('click',e=>{
    e.stopPropagation();
    if(pop){ closePop(); return; }
    const curT=localStorage.getItem('h_theme')||'amber';
    const curB=localStorage.getItem('h_bg')||'dark';
    pop=document.createElement('div');
    pop.id='theme-popover';
    pop.innerHTML=`
      <div class="tp-label">Fundo</div>
      <div class="tp-row">
        <button class="tp-mode-btn${curB==='dark'?' active':''}" data-bg="dark"><i data-lucide="moon"></i> Escuro</button>
        <button class="tp-mode-btn${curB==='light'?' active':''}" data-bg="light"><i data-lucide="sun"></i> Claro</button>
      </div>
      <div class="tp-divider"></div>
      <div class="tp-label">Destaque</div>
      <div class="tp-row">
        ${THEMES.map(t=>`<button class="theme-swatch${t.id===curT?' active':''}" data-id="${t.id}" title="${t.label}" style="background:${t.color}"></button>`).join('')}
      </div>`;
    const rect=btn.getBoundingClientRect();
    pop.style.top=(rect.bottom+8)+'px';
    pop.style.right=(window.innerWidth-rect.right)+'px';
    document.body.appendChild(pop);
    lucide.createIcons({nodes:[pop]});

    pop.querySelectorAll('.tp-mode-btn').forEach(b=>{
      b.addEventListener('click',ev=>{
        ev.stopPropagation();
        applyBg(b.dataset.bg);
        pop.querySelectorAll('.tp-mode-btn').forEach(x=>x.classList.remove('active'));
        b.classList.add('active');
      });
    });
    pop.querySelectorAll('.theme-swatch').forEach(sw=>{
      sw.addEventListener('click',ev=>{
        ev.stopPropagation();
        applyTheme(sw.dataset.id);
        pop.querySelectorAll('.theme-swatch').forEach(s=>s.classList.remove('active'));
        sw.classList.add('active');
      });
    });

    const outside=ev=>{ if(!pop?.contains(ev.target)&&ev.target!==btn){ closePop(); document.removeEventListener('click',outside); } };
    setTimeout(()=>document.addEventListener('click',outside),0);
  });
}

/* ── Boot ── */
document.addEventListener('DOMContentLoaded',()=>{
  initTheme();
  initClock();
  initNav();
});
