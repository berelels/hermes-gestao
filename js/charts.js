'use strict';
/* ══ HERMES v2 — Chart helpers ══ */
const CC = {
  amber:'#f59e0b', orange:'#ffaa45', green:'#22d3a0',
  blue:'#3b9eff', purple:'#c084fc', red:'#ff5c6a',
};
const _ch={};
function destroyChart(id){ if(_ch[id]){_ch[id].destroy();delete _ch[id];} }

/* Lê CSS vars em tempo real → adapta ao tema claro/escuro */
function _cv(v){ return getComputedStyle(document.documentElement).getPropertyValue(v).trim(); }
function getBaseOpts(){
  const border=_cv('--border')||'#2a2f3f';
  const t1=_cv('--t1')||'#eef0f6';
  const t2=_cv('--t2')||'#8892a4';
  const t3=_cv('--t3')||'#555e72';
  const bg2=_cv('--bg-card2')||'#1a1e2a';
  return {
    responsive:true, maintainAspectRatio:false,
    plugins:{legend:{display:false},tooltip:{backgroundColor:bg2,borderColor:border,borderWidth:1,titleColor:t1,bodyColor:t2,padding:9,cornerRadius:7}},
    scales:{x:{grid:{color:border},ticks:{color:t3,font:{size:11}}},y:{grid:{color:border},ticks:{color:t3,font:{size:11}}}}
  };
}

function renderChartLine(id, labels, data){
  destroyChart(id);
  const ctx=document.getElementById(id); if(!ctx) return;
  const opts=getBaseOpts();
  const grad=ctx.getContext('2d').createLinearGradient(0,0,0,200);
  grad.addColorStop(0,'rgba(245,158,11,.35)'); grad.addColorStop(1,'rgba(245,158,11,.02)');
  _ch[id]=new Chart(ctx,{type:'line',data:{labels,datasets:[{data,borderColor:CC.amber,backgroundColor:grad,borderWidth:2,pointRadius:3,pointBackgroundColor:CC.amber,fill:true,tension:.4}]},
    options:{...opts,plugins:{...opts.plugins,tooltip:{...opts.plugins.tooltip,callbacks:{label:c=>'R$ '+c.raw.toFixed(2)}}}}});
}

function renderChartBar(id, labels, data){
  destroyChart(id);
  const ctx=document.getElementById(id); if(!ctx) return;
  const opts=getBaseOpts();
  const colors=[CC.amber,CC.orange,CC.green,CC.blue,CC.purple,CC.red];
  _ch[id]=new Chart(ctx,{type:'bar',data:{labels,datasets:[{data,backgroundColor:colors,borderRadius:6,borderSkipped:false}]},
    options:{...opts,indexAxis:'y',plugins:{...opts.plugins},scales:{x:{...opts.scales.x},y:{...opts.scales.y}}}});
}

function renderChartDoughnut(id, labels, data){
  destroyChart(id);
  const ctx=document.getElementById(id); if(!ctx) return;
  const opts=getBaseOpts();
  const colors=[CC.amber,CC.orange,CC.green,CC.blue,CC.purple,CC.red];
  const bgCard=_cv('--bg-card')||'#13161e';
  _ch[id]=new Chart(ctx,{type:'doughnut',data:{labels,datasets:[{data,backgroundColor:colors,borderColor:bgCard,borderWidth:3,hoverOffset:5}]},
    options:{responsive:true,maintainAspectRatio:false,cutout:'65%',
      plugins:{legend:{display:true,position:'bottom',labels:{color:opts.plugins.tooltip.bodyColor,font:{size:11},padding:10,boxWidth:11}},
        tooltip:{...opts.plugins.tooltip,callbacks:{label:c=>c.label+': R$ '+c.raw.toFixed(2)}}}}});
}

function renderChartAnualDual(id, labels, fat, luc){
  destroyChart(id);
  const ctx=document.getElementById(id); if(!ctx) return;
  const opts=getBaseOpts();
  const gF=ctx.getContext('2d').createLinearGradient(0,0,0,240);
  gF.addColorStop(0,'rgba(34,211,160,.3)'); gF.addColorStop(1,'rgba(34,211,160,.02)');
  const gL=ctx.getContext('2d').createLinearGradient(0,0,0,240);
  gL.addColorStop(0,'rgba(192,132,252,.3)'); gL.addColorStop(1,'rgba(192,132,252,.02)');
  _ch[id]=new Chart(ctx,{type:'line',data:{labels,datasets:[
    {label:'Faturamento',data:fat,borderColor:CC.green,backgroundColor:gF,borderWidth:2,fill:true,tension:.4,pointRadius:4,pointBackgroundColor:CC.green},
    {label:'Lucro',data:luc,borderColor:CC.purple,backgroundColor:gL,borderWidth:2,fill:true,tension:.4,pointRadius:4,pointBackgroundColor:CC.purple}
  ]},options:{...opts,plugins:{legend:{display:true,labels:{color:opts.plugins.tooltip.bodyColor,font:{size:11},padding:10,boxWidth:10}},
    tooltip:{...opts.plugins.tooltip,callbacks:{label:c=>c.dataset.label+': R$ '+c.raw.toFixed(2)}}}}});
}
