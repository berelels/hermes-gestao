'use strict';
/* ══ HERMES — Page: Dashboard ══ */
Hermes.pages.dashboard = {
template: `
<div class="page-header">
  <div><h1>Dashboard</h1><p class="page-subtitle">Visão geral do negócio</p></div>
  <div class="page-hdr-actions">
    <select id="dash-period" style="width:auto">
      <option value="7">7 dias</option><option value="30" selected>30 dias</option><option value="90">90 dias</option>
    </select>
  </div>
</div>
<div id="dash-caixa-banner"></div>
<div class="kpi-grid" id="dash-kpis"></div>
<div class="charts-2col">
  <div class="chart-card">
    <div class="chart-card-header"><h2>Vendas Recentes</h2><span class="chart-badge" id="dash-period-lbl">30 dias</span></div>
    <div class="chart-wrap"><canvas id="ch-dash-vendas"></canvas></div>
  </div>
  <div class="chart-card">
    <div class="chart-card-header"><h2>Mais Vendidos</h2></div>
    <div class="chart-wrap"><canvas id="ch-dash-top"></canvas></div>
  </div>
</div>
<div class="charts-2col">
  <div class="chart-card">
    <div class="chart-card-header"><h2>Últimas Vendas</h2>
      <button class="btn btn-primary btn-sm" id="dash-btn-venda"><i data-lucide="plus"></i> Nova Venda</button>
    </div>
    <div id="dash-ultimas-vendas"></div>
  </div>
  <div class="chart-card">
    <div class="chart-card-header"><h2>Alertas</h2></div>
    <div id="dash-alertas"></div>
  </div>
</div>`,

init(){
  document.getElementById('dash-period').addEventListener('change',()=>this.render());
  document.getElementById('dash-btn-venda')?.addEventListener('click',()=>Hermes.navigate('vendas'));
  this.render();
},
render(){
  const dias=+document.getElementById('dash-period').value||30;
  document.getElementById('dash-period-lbl').textContent=`${dias} dias`;
  const corte=new Date(); corte.setDate(corte.getDate()-dias);
  const vendas=DB.getVendas().filter(v=>new Date(v.data)>=corte);
  const fat=vendas.reduce((s,v)=>s+v.total,0);
  const luc=vendas.reduce((s,v)=>s+v.lucro,0);
  const un=vendas.reduce((s,v)=>s+v.quantidade,0);
  const alertasProd=DB.getProdutos().filter(p=>p.estoque<=p.minimo).length;
  const alertasFin=DB.countAlertasFinanceiros();
  const caixa=DB.getCaixaAberto();
  const saldo=DB.getSaldoCaixa();

  // Caixa banner
  const banner=document.getElementById('dash-caixa-banner');
  if(caixa){
    banner.innerHTML=`<div class="caixa-banner aberto">
      <div class="cb-info"><div class="cb-dot"></div><div><div class="cb-title">Caixa Aberto</div>
        <div class="cb-sub">Desde ${fmtDT(caixa.aberturaEm)}</div></div></div>
      <div class="cb-saldo">${fmt(saldo)}</div>
      <button class="btn btn-ghost btn-sm" onclick="Hermes.navigate('financeiro')"><i data-lucide="landmark"></i> Ver Financeiro</button>
    </div>`;
  } else {
    banner.innerHTML=`<div class="caixa-banner fechado">
      <div class="cb-info"><div class="cb-dot"></div><div><div class="cb-title">Caixa Fechado</div>
        <div class="cb-sub">Abra o caixa para registrar vendas e movimentações</div></div></div>
      <button class="btn btn-primary btn-sm" onclick="Hermes.navigate('financeiro')"><i data-lucide="landmark"></i> Abrir Caixa</button>
    </div>`;
  }

  // KPIs
  document.getElementById('dash-kpis').innerHTML=`
    <div class="kpi-card"><div class="kpi-icon ki-amber"><i data-lucide="trending-up"></i></div>
      <div class="kpi-info"><span class="kpi-label">Faturamento</span><span class="kpi-value">${fmt(fat)}</span><span class="kpi-delta">${vendas.length} vendas</span></div></div>
    <div class="kpi-card"><div class="kpi-icon ki-green"><i data-lucide="wallet"></i></div>
      <div class="kpi-info"><span class="kpi-label">Lucro</span><span class="kpi-value">${fmt(luc)}</span><span class="kpi-delta">${fat>0?fmtPct(luc/fat*100):'-'} margem</span></div></div>
    <div class="kpi-card"><div class="kpi-icon ki-blue"><i data-lucide="shopping-bag"></i></div>
      <div class="kpi-info"><span class="kpi-label">Unidades Vendidas</span><span class="kpi-value">${un}</span><span class="kpi-delta">no período</span></div></div>
    <div class="kpi-card"><div class="kpi-icon ${alertasProd+alertasFin>0?'ki-red':'ki-green'}"><i data-lucide="${alertasProd+alertasFin>0?'alert-triangle':'check-circle'}"></i></div>
      <div class="kpi-info"><span class="kpi-label">Alertas</span><span class="kpi-value">${alertasProd+alertasFin}</span>
      <span class="kpi-delta">${alertasProd} estoque · ${alertasFin} financ.</span></div></div>`;
  lucide.createIcons({nodes:[document.getElementById('dash-kpis')]});

  // Charts
  const byDay={};
  vendas.forEach(v=>{ const d=v.data.slice(0,10); byDay[d]=(byDay[d]||0)+v.total; });
  const days=Object.keys(byDay).sort();
  renderChartLine('ch-dash-vendas', days.map(d=>{ const[y,m,dd]=d.split('-'); return `${dd}/${m}`; }), days.map(d=>byDay[d]));

  const byProd={};
  vendas.forEach(v=>{ byProd[v.produtoNome]=(byProd[v.produtoNome]||0)+v.quantidade; });
  const top=Object.entries(byProd).sort((a,b)=>b[1]-a[1]).slice(0,5);
  renderChartBar('ch-dash-top', top.map(x=>x[0].slice(0,14)), top.map(x=>x[1]));

  // Últimas vendas
  const ults=[...DB.getVendas()].sort((a,b)=>new Date(b.data)-new Date(a.data)).slice(0,6);
  document.getElementById('dash-ultimas-vendas').innerHTML=ults.length
    ?`<table><thead><tr><th>Produto</th><th>Total</th><th>Data</th></tr></thead><tbody>
      ${ults.map(v=>`<tr><td>${v.produtoNome}</td><td><strong>${fmt(v.total)}</strong></td><td>${fmtDate(v.data)}</td></tr>`).join('')}
      </tbody></table>`
    :`<div class="empty-state"><i data-lucide="shopping-bag"></i><p>Nenhuma venda ainda</p></div>`;
  lucide.createIcons({nodes:[document.getElementById('dash-ultimas-vendas')]});

  // Alertas
  const alertsEl=document.getElementById('dash-alertas');
  const baixos=DB.getProdutos().filter(p=>p.estoque<=p.minimo).slice(0,4);
  const venc=DB.getContasPagar().filter(c=>c.status==='vencida').slice(0,3);
  if(!baixos.length&&!venc.length){
    alertsEl.innerHTML=`<div class="empty-state"><i data-lucide="check-circle-2"></i><p>Sem alertas!</p></div>`;
  } else {
    alertsEl.innerHTML=baixos.map(p=>`
      <div class="alert-card ${p.estoque===0?'critical':'warning'}">
        <div class="alert-icon"><i data-lucide="${p.estoque===0?'x-circle':'alert-triangle'}"></i></div>
        <div class="alert-info"><div class="alert-title">${p.nome}</div>
          <div class="alert-sub">Estoque: ${p.estoque} (mín: ${p.minimo})</div></div>
      </div>`).join('')+
      venc.map(c=>`
      <div class="alert-card critical">
        <div class="alert-icon"><i data-lucide="clock"></i></div>
        <div class="alert-info"><div class="alert-title">${c.fornecedor}</div>
          <div class="alert-sub">Vencida em ${fmtDate(c.vencimento)} — ${fmt(c.valor)}</div></div>
      </div>`).join('');
  }
  lucide.createIcons({nodes:[alertsEl]});
},
destroy(){ destroyChart('ch-dash-vendas'); destroyChart('ch-dash-top'); }
};
