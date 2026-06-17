'use strict';
/* ══ HERMES v2 — Chart helpers ══ */
const CC = {
  amber:'#f59e0b', orange:'#ffaa45', green:'#22d3a0',
  blue:'#3b9eff', purple:'#c084fc', red:'#ff5c6a',
  text:'#8892a4', border:'#2a2f3f', bg:'#13161e'
};
const _ch={};
function destroyChart(id){ if(_ch[id]){_ch[id].destroy();delete _ch[id];} }

const baseOpts={
  responsive:true, maintainAspectRatio:false,
  plugins:{legend:{display:false},tooltip:{backgroundColor:'#1a1e2a',borderColor:'#2a2f3f',borderWidth:1,titleColor:'#eef0f6',bodyColor:'#8892a4',padding:9,cornerRadius:7}},
  scales:{x:{grid:{color:'#2a2f3f'},ticks:{color:'#555e72',font:{size:11}}},y:{grid:{color:'#2a2f3f'},ticks:{color:'#555e72',font:{size:11}}}}
};

function renderChartLine(id, labels, data){
  destroyChart(id);
  const ctx=document.getElementById(id); if(!ctx) return;
  const grad=ctx.getContext('2d').createLinearGradient(0,0,0,200);
  grad.addColorStop(0,'rgba(245,158,11,.35)'); grad.addColorStop(1,'rgba(245,158,11,.02)');
  _ch[id]=new Chart(ctx,{type:'line',data:{labels,datasets:[{data,borderColor:CC.amber,backgroundColor:grad,borderWidth:2,pointRadius:3,pointBackgroundColor:CC.amber,fill:true,tension:.4}]},
    options:{...baseOpts,plugins:{...baseOpts.plugins,tooltip:{...baseOpts.plugins.tooltip,callbacks:{label:c=>'R$ '+c.raw.toFixed(2)}}}}});
}

function renderChartBar(id, labels, data){
  destroyChart(id);
  const ctx=document.getElementById(id); if(!ctx) return;
  const colors=[CC.amber,CC.orange,CC.green,CC.blue,CC.purple,CC.red];
  _ch[id]=new Chart(ctx,{type:'bar',data:{labels,datasets:[{data,backgroundColor:colors,borderRadius:6,borderSkipped:false}]},
    options:{...baseOpts,indexAxis:'y',plugins:{...baseOpts.plugins},scales:{x:{...baseOpts.scales.x},y:{...baseOpts.scales.y,ticks:{color:CC.text,font:{size:11}}}}}});
}

function renderChartDoughnut(id, labels, data){
  destroyChart(id);
  const ctx=document.getElementById(id); if(!ctx) return;
  const colors=[CC.amber,CC.orange,CC.green,CC.blue,CC.purple,CC.red];
  _ch[id]=new Chart(ctx,{type:'doughnut',data:{labels,datasets:[{data,backgroundColor:colors,borderColor:CC.bg,borderWidth:3,hoverOffset:5}]},
    options:{responsive:true,maintainAspectRatio:false,cutout:'65%',
      plugins:{legend:{display:true,position:'bottom',labels:{color:CC.text,font:{size:11},padding:10,boxWidth:11}},
        tooltip:{...baseOpts.plugins.tooltip,callbacks:{label:c=>c.label+': R$ '+c.raw.toFixed(2)}}}}});
}

function renderChartAnualDual(id, labels, fat, luc){
  destroyChart(id);
  const ctx=document.getElementById(id); if(!ctx) return;
  const gF=ctx.getContext('2d').createLinearGradient(0,0,0,240);
  gF.addColorStop(0,'rgba(34,211,160,.3)'); gF.addColorStop(1,'rgba(34,211,160,.02)');
  const gL=ctx.getContext('2d').createLinearGradient(0,0,0,240);
  gL.addColorStop(0,'rgba(192,132,252,.3)'); gL.addColorStop(1,'rgba(192,132,252,.02)');
  _ch[id]=new Chart(ctx,{type:'line',data:{labels,datasets:[
    {label:'Faturamento',data:fat,borderColor:CC.green,backgroundColor:gF,borderWidth:2,fill:true,tension:.4,pointRadius:4,pointBackgroundColor:CC.green},
    {label:'Lucro',data:luc,borderColor:CC.purple,backgroundColor:gL,borderWidth:2,fill:true,tension:.4,pointRadius:4,pointBackgroundColor:CC.purple}
  ]},options:{...baseOpts,plugins:{legend:{display:true,labels:{color:CC.text,font:{size:11},padding:10,boxWidth:10}},
    tooltip:{...baseOpts.plugins.tooltip,callbacks:{label:c=>c.dataset.label+': R$ '+c.raw.toFixed(2)}}}}});
}
