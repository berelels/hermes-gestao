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
  <div class="rep-card" data-rep="vendas-produto"><div class="rep-card-icon"><i data-lucide="package"></i></div><h3>Vendas por Produto</h3><p>Quantidades e faturamento por item em um mês</p></div>
  <div class="rep-card" data-rep="estoque"><div class="rep-card-icon"><i data-lucide="boxes"></i></div><h3>Estoque</h3><p>Posição atual, markup e alertas de reposição</p></div>
  <div class="rep-card" data-rep="financeiro"><div class="rep-card-icon"><i data-lucide="landmark"></i></div><h3>Financeiro</h3><p>Fluxo de caixa, contas a pagar/receber e DRE</p></div>
  <div class="rep-card" data-rep="margens"><div class="rep-card-icon"><i data-lucide="percent"></i></div><h3>Markup &amp; Lucro</h3><p>Análise de lucratividade por produto e categoria</p></div>
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
  const renders={
    vendas:()=>this.rVendas(), 'vendas-produto':()=>this.rVendasProduto(),
    estoque:()=>this.rEstoque(), financeiro:()=>this.rFinanceiro(),
    margens:()=>this.rMargens(), anual:()=>this.rAnual(), contas:()=>this.rContas()
  };
  (renders[tipo]||function(){})();
},

/* ─ helpers ─ */
_mesesNomes:['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'],
_filterVendasByPeriodo(vendas,mes,ano){
  return vendas.filter(v=>{
    const d=new Date(v.data);
    return (ano===''||d.getFullYear()===+ano)&&(mes===''||d.getMonth()===+mes);
  });
},
_periodoSelHTML(idMes,idAno,curMes='',curAno=''){
  const now=new Date();
  const anos=[...new Set(DB.getVendas().map(v=>new Date(v.data).getFullYear()))].sort((a,b)=>b-a);
  const anosOpts=anos.map(a=>`<option value="${a}"${a===+curAno?'selected':''}>${a}</option>`).join('');
  const mesesOpts=this._mesesNomes.map((m,i)=>`<option value="${i}"${i===+curMes?'selected':''}>${m}</option>`).join('');
  return `<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
    <select id="${idMes}" style="width:auto">
      <option value="">Todos os meses</option>${mesesOpts}
    </select>
    <select id="${idAno}" style="width:auto">
      <option value="">Todos os anos</option>${anosOpts}
    </select>
  </div>`;
},

/* ─ VENDAS ─ */
rVendas(){
  const mes=document.getElementById('rep-vmes')?.value??'';
  const ano=document.getElementById('rep-vano')?.value??'';
  const vendas=[...this._filterVendasByPeriodo(DB.getVendas(),mes,ano)]
    .sort((a,b)=>new Date(b.data)-new Date(a.data));
  const fat=vendas.reduce((s,v)=>s+v.total,0);
  const luc=vendas.reduce((s,v)=>s+v.lucro,0);
  document.getElementById('rep-content').innerHTML=`
    <div class="chart-card full">
      <div class="chart-card-header"><h2>Relatório de Vendas</h2><span class="chart-badge">${vendas.length} registros</span></div>
      <div style="margin-bottom:14px">${this._periodoSelHTML('rep-vmes','rep-vano',mes,ano)}</div>
      <div style="display:flex;gap:14px;margin-bottom:16px">
        <div class="ms-card" style="flex:1"><div class="ms-label">Faturamento</div><div class="ms-value">${fmt(fat)}</div></div>
        <div class="ms-card" style="flex:1"><div class="ms-label">Lucro</div><div class="ms-value" style="color:var(--green)">${fmt(luc)}</div></div>
        <div class="ms-card" style="flex:1"><div class="ms-label">Markup Médio</div><div class="ms-value">${fat>0?fmtPct(luc/fat*100):'—'}</div></div>
        <div class="ms-card" style="flex:1"><div class="ms-label">Transações</div><div class="ms-value">${vendas.length}</div></div>
      </div>
      <div class="table-wrapper bare"><table id="rep-table">
        <thead><tr><th>Data</th><th>Produto(s)</th><th>Canal</th><th>Qtd.</th><th>Total</th><th>Lucro</th></tr></thead>
        <tbody>${vendas.map(v=>{
          const nome=v.produtoNome||(v.itens?.map(i=>`${i.quantidade}× ${i.produtoNome}`).join(', ')||'—');
          const qtd=v.quantidade||(v.itens?.reduce((s,i)=>s+i.quantidade,0)||0);
          return `<tr><td>${fmtDT(v.data)}</td><td>${nome}</td><td>${v.canal||'—'}</td>
            <td>${qtd}</td><td>${fmt(v.total)}</td><td>${fmt(v.lucro)}</td></tr>`;
        }).join('')}
        </tbody></table></div>
    </div>`;
  document.getElementById('rep-vmes')?.addEventListener('change',()=>this.rVendas());
  document.getElementById('rep-vano')?.addEventListener('change',()=>this.rVendas());
},

/* ─ VENDAS POR PRODUTO ─ */
rVendasProduto(){
  const mes=document.getElementById('rep-vpmes')?.value??new Date().getMonth().toString();
  const ano=document.getElementById('rep-vpano')?.value??new Date().getFullYear().toString();
  const vendas=this._filterVendasByPeriodo(DB.getVendas(),mes,ano);
  // Flatten items
  const map={};
  vendas.forEach(v=>{
    const itens=v.itens||[{produtoNome:v.produtoNome,categoria:v.categoria||'—',quantidade:v.quantidade||0,
      precoUnit:v.precoUnit||0,subtotal:v.total||0,lucro:v.lucro||0}];
    itens.forEach(it=>{
      if(!map[it.produtoNome]) map[it.produtoNome]={nome:it.produtoNome,cat:it.categoria||'—',qtd:0,fat:0,luc:0};
      map[it.produtoNome].qtd+=it.quantidade;
      map[it.produtoNome].fat+=it.subtotal||it.quantidade*it.precoUnit;
      map[it.produtoNome].luc+=it.lucro||0;
    });
  });
  const rows=Object.values(map).sort((a,b)=>b.qtd-a.qtd);
  document.getElementById('rep-content').innerHTML=`
    <div class="chart-card full">
      <div class="chart-card-header"><h2>Vendas por Produto</h2><span class="chart-badge">${rows.length} produtos</span></div>
      <div style="margin-bottom:14px">${this._periodoSelHTML('rep-vpmes','rep-vpano',mes,ano)}</div>
      ${rows.length===0?'<div class="empty-state"><i data-lucide="package-open"></i><p>Sem vendas no período.</p></div>':
      `<div class="table-wrapper bare"><table id="rep-table">
        <thead><tr><th>#</th><th>Produto</th><th>Categoria</th><th>Qtd. Vendida</th><th>Faturamento</th><th>Lucro</th></tr></thead>
        <tbody>${rows.map((r,i)=>`<tr>
          <td>#${i+1}</td><td><strong>${r.nome}</strong></td><td>${r.cat}</td>
          <td><strong>${r.qtd}</strong> unid.</td>
          <td>${fmt(r.fat)}</td>
          <td style="color:var(--green)">${fmt(r.luc)}</td>
        </tr>`).join('')}
        </tbody></table></div>`}
    </div>`;
  lucide.createIcons({nodes:[document.getElementById('rep-content')]});
  document.getElementById('rep-vpmes')?.addEventListener('change',()=>this.rVendasProduto());
  document.getElementById('rep-vpano')?.addEventListener('change',()=>this.rVendasProduto());
},

/* ─ ESTOQUE ─ */
rEstoque(){
  const prods=DB.getProdutos();
  document.getElementById('rep-content').innerHTML=`
    <div class="chart-card full">
      <div class="chart-card-header"><h2>Relatório de Estoque</h2></div>
      <div class="table-wrapper bare"><table id="rep-table">
        <thead><tr><th>Produto</th><th>SKU</th><th>Categoria</th><th>Custo s/imp</th><th>Imposto</th><th>Preço</th><th>Markup</th><th>Estoque</th><th>Mínimo</th><th>Status</th></tr></thead>
        <tbody>${prods.map(p=>{
          const s=p.estoque===0?'Zerado':p.estoque<=p.minimo?'Baixo':'OK';
          const mk=DB.calcMarkup(p);
          const mc=DB.markupClass(mk);
          return `<tr><td>${p.nome}</td><td>${p.sku||'—'}</td><td>${p.categoria}</td>
            <td>${fmt(p.custo)}</td>
            <td>${p.impostoPercent?p.impostoPercent+'%':'—'}</td>
            <td>${fmt(p.preco)}</td>
            <td><span class="chip chip-markup-${mc}">${fmtPct(mk)}</span></td>
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

/* ─ MARKUP & LUCRO ─ */
rMargens(){
  const map={};
  DB.getVendas().forEach(v=>{
    const itens=v.itens||[{produtoNome:v.produtoNome,categoria:v.categoria,custoUnit:v.custoUnit,precoUnit:v.precoUnit,lucro:v.lucro,quantidade:v.quantidade}];
    itens.forEach(it=>{
      if(!map[it.produtoNome]) map[it.produtoNome]={n:it.produtoNome,cat:it.categoria||'—',custo:it.custoUnit||0,preco:it.precoUnit||0,luc:0,un:0};
      map[it.produtoNome].luc+=it.lucro||0; map[it.produtoNome].un+=it.quantidade||0;
    });
  });
  const rows=Object.values(map).sort((a,b)=>b.luc-a.luc);
  document.getElementById('rep-content').innerHTML=`
    <div class="chart-card full">
      <div class="chart-card-header"><h2>Análise de Markup &amp; Lucro</h2></div>
      <div class="table-wrapper bare"><table id="rep-table">
        <thead><tr><th>#</th><th>Produto</th><th>Categoria</th><th>Custo</th><th>Preço</th><th>Markup %</th><th>Lucro Total</th><th>Unid.</th></tr></thead>
        <tbody>${rows.map((r,i)=>{
          const mk=r.preco>0&&r.custo>0?((r.preco/r.custo-1)*100):0;
          const mc=DB.markupClass(mk);
          return `<tr><td>#${i+1}</td><td>${r.n}</td><td>${r.cat}</td><td>${fmt(r.custo)}</td><td>${fmt(r.preco)}</td>
            <td><span class="chip chip-markup-${mc}">${fmtPct(mk)}</span></td>
            <td style="color:var(--green)">${fmt(r.luc)}</td><td>${r.un}</td></tr>`;
        }).join('')}
        </tbody></table></div>
    </div>`;
},

/* ─ ANUAL ─ */
rAnual(){
  const ano=new Date().getFullYear();
  const vendas=DB.getVendas();
  const rows=this._mesesNomes.map((m,i)=>{
    const mv=vendas.filter(v=>{const d=new Date(v.data);return d.getFullYear()===ano&&d.getMonth()===i;});
    return {m,fat:mv.reduce((s,v)=>s+v.total,0),luc:mv.reduce((s,v)=>s+v.lucro,0),un:mv.reduce((s,v)=>s+(v.quantidade||v.itens?.reduce((x,j)=>x+j.quantidade,0)||0),0)};
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
  renderChartAnualDual('ch-anual',this._mesesNomes,rows.map(r=>r.fat),rows.map(r=>r.luc));
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
        <thead><tr><th>Fonte</th><th>Descrição</th><th>Valor</th><th>Vencimento</th><th>Status</th></tr></thead>
        <tbody>${cr.map(c=>`<tr><td>${c.fonte||c.cliente||'—'}</td><td>${c.descricao}</td><td>${fmt(c.valor)}</td>
          <td>${fmtDate(c.vencimento)}</td><td>${c.status}</td></tr>`).join('')}</tbody></table></div>
    </div>`;
},

/* ─ PRINT ─ */
printPDF(){
  const table=document.getElementById('rep-table');
  if(!table){ toast('Gere um relatório primeiro.','warning'); return; }
  const printEl=document.getElementById('print-area');
  const title=document.querySelector('.rep-card.active h3')?.textContent||'Relatório';
  const tableCR=document.getElementById('rep-table-cr');
  const extraTable=tableCR?`<h2 style="margin:20px 0 8px;font-size:15px">Contas a Receber</h2>${tableCR.outerHTML.replace(/class="[^"]*"/g,'').replace(/<button[^>]*>.*?<\/button>/gs,'')}`:'' ;
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
