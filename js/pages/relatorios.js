'use strict';
/* ══ HERMES — Page: Relatórios ══ */
Hermes.pages.relatorios = {
_current: null,
template: `
<div class="page-header">
  <div><h1>Relatórios</h1><p class="page-subtitle">Selecione um relatório para visualizar, exportar ou imprimir</p></div>
</div>
<div class="report-selector" id="rep-cards">
  <div class="rep-card" data-rep="vendas"><div class="rep-card-icon"><i data-lucide="shopping-cart"></i></div><h3>Vendas</h3><p>Histórico completo, por período, canal e produto</p></div>
  <div class="rep-card" data-rep="estoque"><div class="rep-card-icon"><i data-lucide="boxes"></i></div><h3>Estoque</h3><p>Posição atual, margens e alertas de reposição</p></div>
  <div class="rep-card" data-rep="financeiro"><div class="rep-card-icon"><i data-lucide="landmark"></i></div><h3>Financeiro</h3><p>Fluxo de caixa, contas a pagar/receber e DRE</p></div>
  <div class="rep-card" data-rep="margens"><div class="rep-card-icon"><i data-lucide="percent"></i></div><h3>Margens & Lucro</h3><p>Análise de lucratividade por produto e categoria</p></div>
  <div class="rep-card" data-rep="anual"><div class="rep-card-icon"><i data-lucide="calendar"></i></div><h3>Visão Anual</h3><p>Faturamento e lucro mês a mês</p></div>
  <div class="rep-card" data-rep="contas"><div class="rep-card-icon"><i data-lucide="file-text"></i></div><h3>Contas</h3><p>Relatório de contas a pagar e receber</p></div>
</div>
<div id="rep-actions" class="report-actions" style="display:none">
  <button class="btn btn-ghost" id="rep-pdf"><i data-lucide="printer"></i> Imprimir / PDF</button>
  <button class="btn btn-ghost" id="rep-xlsx"><i data-lucide="file-spreadsheet"></i> Exportar XLSX</button>
</div>
<div id="rep-content"></div>`,

init(){
  document.querySelectorAll('.rep-card').forEach(c=>c.addEventListener('click',()=>{
    document.querySelectorAll('.rep-card').forEach(x=>x.classList.remove('active'));
    c.classList.add('active');
    this._current=c.dataset.rep;
    this.renderReport(c.dataset.rep);
  }));
  document.getElementById('rep-pdf').addEventListener('click',()=>this.printPDF());
  document.getElementById('rep-xlsx').addEventListener('click',()=>this.exportXLSX());
},
renderReport(tipo){
  document.getElementById('rep-actions').style.display='flex';
  const el=document.getElementById('rep-content');
  const renders={
    vendas:()=>this.rVendas(), estoque:()=>this.rEstoque(),
    financeiro:()=>this.rFinanceiro(), margens:()=>this.rMargens(),
    anual:()=>this.rAnual(), contas:()=>this.rContas()
  };
  (renders[tipo]||function(){ el.innerHTML=''; })();
},

/* ─ VENDAS ─ */
rVendas(){
  const vendas=[...DB.getVendas()].sort((a,b)=>new Date(b.data)-new Date(a.data));
  const fat=vendas.reduce((s,v)=>s+v.total,0);
  const luc=vendas.reduce((s,v)=>s+v.lucro,0);
  document.getElementById('rep-content').innerHTML=`
    <div class="chart-card full">
      <div class="chart-card-header"><h2>Relatório de Vendas</h2><span class="chart-badge">${vendas.length} registros</span></div>
      <div style="display:flex;gap:14px;margin-bottom:16px">
        <div class="ms-card" style="flex:1"><div class="ms-label">Faturamento Total</div><div class="ms-value">${fmt(fat)}</div></div>
        <div class="ms-card" style="flex:1"><div class="ms-label">Lucro Total</div><div class="ms-value" style="color:var(--green)">${fmt(luc)}</div></div>
        <div class="ms-card" style="flex:1"><div class="ms-label">Margem Média</div><div class="ms-value">${fat>0?fmtPct(luc/fat*100):'—'}</div></div>
        <div class="ms-card" style="flex:1"><div class="ms-label">Transações</div><div class="ms-value">${vendas.length}</div></div>
      </div>
      <div class="table-wrapper bare"><table id="rep-table">
        <thead><tr><th>Data</th><th>Produto</th><th>Canal</th><th>Qtd.</th><th>Preço Unit.</th><th>Total</th><th>Lucro</th></tr></thead>
        <tbody>${vendas.map(v=>`<tr><td>${fmtDT(v.data)}</td><td>${v.produtoNome}</td><td>${v.canal||'—'}</td>
          <td>${v.quantidade}</td><td>${fmt(v.precoUnit)}</td><td>${fmt(v.total)}</td><td>${fmt(v.lucro)}</td></tr>`).join('')}
        </tbody></table></div>
    </div>`;
},

/* ─ ESTOQUE ─ */
rEstoque(){
  const prods=DB.getProdutos();
  document.getElementById('rep-content').innerHTML=`
    <div class="chart-card full">
      <div class="chart-card-header"><h2>Relatório de Estoque</h2></div>
      <div class="table-wrapper bare"><table id="rep-table">
        <thead><tr><th>Produto</th><th>SKU</th><th>Categoria</th><th>Custo</th><th>Preço</th><th>Margem</th><th>Estoque</th><th>Mínimo</th><th>Status</th></tr></thead>
        <tbody>${prods.map(p=>{
          const s=p.estoque===0?'Zerado':p.estoque<=p.minimo?'Baixo':'OK';
          return `<tr><td>${p.nome}</td><td>${p.sku||'—'}</td><td>${p.categoria}</td>
            <td>${fmt(p.custo)}</td><td>${fmt(p.preco)}</td><td>${fmtPct(p.margem)}</td>
            <td>${p.estoque}</td><td>${p.minimo}</td><td>${s}</td></tr>`;
        }).join('')}</tbody></table></div>
    </div>`;
},

/* ─ FINANCEIRO ─ */
rFinanceiro(){
  const movs=DB.getMovimentos();
  const e=movs.filter(m=>m.tipo==='entrada').reduce((s,m)=>s+m.valor,0);
  const s2=movs.filter(m=>m.tipo==='saida').reduce((s,m)=>s+m.valor,0);
  document.getElementById('rep-content').innerHTML=`
    <div class="chart-card full">
      <div class="chart-card-header"><h2>Relatório Financeiro</h2></div>
      <div style="display:flex;gap:14px;margin-bottom:16px">
        <div class="ms-card" style="flex:1"><div class="ms-label">Total Entradas</div><div class="ms-value" style="color:var(--green)">${fmt(e)}</div></div>
        <div class="ms-card" style="flex:1"><div class="ms-label">Total Saídas</div><div class="ms-value" style="color:var(--red)">${fmt(s2)}</div></div>
        <div class="ms-card hi" style="flex:1"><div class="ms-label">Resultado</div><div class="ms-value">${fmt(e-s2)}</div></div>
      </div>
      <div class="table-wrapper bare"><table id="rep-table">
        <thead><tr><th>Data</th><th>Tipo</th><th>Categoria</th><th>Descrição</th><th>Valor</th></tr></thead>
        <tbody>${[...movs].sort((a,b)=>new Date(b.data)-new Date(a.data)).map(m=>`<tr>
          <td>${fmtDT(m.data)}</td><td>${m.tipo}</td><td>${m.categoria}</td><td>${m.descricao}</td>
          <td style="color:${m.tipo==='entrada'?'var(--green)':'var(--red)'}">${fmt(m.valor)}</td></tr>`).join('')}
        </tbody></table></div>
    </div>`;
},

/* ─ MARGENS ─ */
rMargens(){
  const map={};
  DB.getVendas().forEach(v=>{ if(!map[v.produtoNome]) map[v.produtoNome]={n:v.produtoNome,cat:v.categoria,custo:v.custoUnit,preco:v.precoUnit,luc:0,un:0};
    map[v.produtoNome].luc+=v.lucro; map[v.produtoNome].un+=v.quantidade; });
  const rows=Object.values(map).sort((a,b)=>b.luc-a.luc);
  document.getElementById('rep-content').innerHTML=`
    <div class="chart-card full">
      <div class="chart-card-header"><h2>Análise de Margens</h2></div>
      <div class="table-wrapper bare"><table id="rep-table">
        <thead><tr><th>#</th><th>Produto</th><th>Categoria</th><th>Custo</th><th>Preço</th><th>Margem %</th><th>Lucro Total</th><th>Unid.</th></tr></thead>
        <tbody>${rows.map((r,i)=>{const mg=r.preco>0?((r.preco-r.custo)/r.preco*100):0;
          return `<tr><td>#${i+1}</td><td>${r.n}</td><td>${r.cat}</td><td>${fmt(r.custo)}</td><td>${fmt(r.preco)}</td>
            <td>${fmtPct(mg)}</td><td style="color:var(--green)">${fmt(r.luc)}</td><td>${r.un}</td></tr>`;}).join('')}
        </tbody></table></div>
    </div>`;
},

/* ─ ANUAL ─ */
rAnual(){
  const ano=new Date().getFullYear();
  const vendas=DB.getVendas();
  const meses=['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  const rows=meses.map((m,i)=>{
    const mv=vendas.filter(v=>{const d=new Date(v.data);return d.getFullYear()===ano&&d.getMonth()===i;});
    return {m,fat:mv.reduce((s,v)=>s+v.total,0),luc:mv.reduce((s,v)=>s+v.lucro,0),un:mv.reduce((s,v)=>s+v.quantidade,0)};
  });
  document.getElementById('rep-content').innerHTML=`
    <div class="chart-card full">
      <div class="chart-card-header"><h2>Visão Anual ${ano}</h2></div>
      <div class="chart-wrap tall" style="margin-bottom:16px"><canvas id="ch-anual"></canvas></div>
      <div class="table-wrapper bare"><table id="rep-table">
        <thead><tr><th>Mês</th><th>Faturamento</th><th>Lucro</th><th>Unidades</th></tr></thead>
        <tbody>${rows.map(r=>`<tr><td>${r.m}</td><td>${fmt(r.fat)}</td><td style="color:var(--green)">${fmt(r.luc)}</td><td>${r.un}</td></tr>`).join('')}
        </tbody></table></div>
    </div>`;
  renderChartAnualDual('ch-anual', meses, rows.map(r=>r.fat), rows.map(r=>r.luc));
},

/* ─ CONTAS ─ */
rContas(){
  const cp=DB.getContasPagar(), cr=DB.getContasReceber();
  const totCP=cp.filter(c=>c.status!=='paga').reduce((s,c)=>s+c.valor,0);
  const totCR=cr.filter(c=>c.status!=='recebida').reduce((s,c)=>s+c.valor,0);
  document.getElementById('rep-content').innerHTML=`
    <div class="chart-card full" style="margin-bottom:14px">
      <div class="chart-card-header"><h2>Contas a Pagar</h2><span>${fmt(totCP)} em aberto</span></div>
      <div class="table-wrapper bare"><table id="rep-table">
        <thead><tr><th>Fornecedor</th><th>Descrição</th><th>Valor</th><th>Vencimento</th><th>Status</th></tr></thead>
        <tbody>${cp.map(c=>`<tr><td>${c.fornecedor}</td><td>${c.descricao}</td><td>${fmt(c.valor)}</td>
          <td>${fmtDate(c.vencimento)}</td><td>${c.status}</td></tr>`).join('')}</tbody></table></div>
    </div>
    <div class="chart-card full">
      <div class="chart-card-header"><h2>Contas a Receber</h2><span>${fmt(totCR)} em aberto</span></div>
      <div class="table-wrapper bare"><table id="rep-table-cr">
        <thead><tr><th>Cliente</th><th>Descrição</th><th>Valor</th><th>Vencimento</th><th>Status</th></tr></thead>
        <tbody>${cr.map(c=>`<tr><td>${c.cliente}</td><td>${c.descricao}</td><td>${fmt(c.valor)}</td>
          <td>${fmtDate(c.vencimento)}</td><td>${c.status}</td></tr>`).join('')}</tbody></table></div>
    </div>`;
},

/* ─ PRINT ─ */
printPDF(){
  const table=document.getElementById('rep-table');
  if(!table){ toast('Gere um relatório primeiro.','warning'); return; }
  const printEl=document.getElementById('print-area');
  const title=document.querySelector('.rep-card.active h3')?.textContent||'Relatório';
  // Para o relatório de Contas, inclui também a segunda tabela (Contas a Receber)
  const tableCR=document.getElementById('rep-table-cr');
  const extraTable=tableCR?`<h2 style="margin:20px 0 8px;font-size:15px">Contas a Receber</h2>${tableCR.outerHTML.replace(/class="[^"]*"/g,'').replace(/<button[^>]*>.*?<\/button>/gs,'')}`:'';
  printEl.innerHTML=`<div class="print-header"><h1>Hermes — ${title}</h1><p>Emitido em ${new Date().toLocaleString('pt-BR')}</p></div>
    ${table.outerHTML.replace(/class="[^"]*"/g,'').replace(/<button[^>]*>.*?<\/button>/gs,'')}
    ${extraTable}
    <div class="print-footer">Hermes v2.0 — Sistema de Gestão Empresarial</div>`;
  window.print();
},

/* ─ XLSX ─ */
exportXLSX(){
  const table=document.getElementById('rep-table');
  if(!table||typeof XLSX==='undefined'){ toast('Relatório não disponível para exportação.','warning'); return; }
  const title=document.querySelector('.rep-card.active h3')?.textContent||'Relatorio';
  const wb=XLSX.utils.book_new();
  const ws=XLSX.utils.table_to_sheet(table);
  XLSX.utils.book_append_sheet(wb,ws,title.slice(0,31));
  XLSX.writeFile(wb,`Hermes_${title.replace(/\s/g,'_')}_${new Date().toISOString().slice(0,10)}.xlsx`);
  toast('XLSX exportado com sucesso!');
},
destroy(){ destroyChart('ch-anual'); }
};
