'use strict';
(() => {
const {rows:data,meta,kind}=window.REPORT_DATA;
const isR=kind==='resistance', $=id=>document.getElementById(id);
const median=a=>{const b=a.filter(Number.isFinite).sort((x,y)=>x-y),n=b.length;return n?(b[Math.floor((n-1)/2)]+b[Math.floor(n/2)])/2:null;};
const fmt=(v,n=2)=>v==null?'Unavailable':v.toLocaleString(undefined,{minimumFractionDigits:n,maximumFractionDigits:n});
const palette=['#2463a6','#10857b','#ba7136','#8056a3','#a44c70','#647d39','#677b88'];
const unique=a=>[...new Set(a)].sort();
const groupKey=isR?'tool':'protocol';
let selected=[],page=0;
const pageSize=25;
function options(id,values,all){$(id).replaceChildren(...(all?['']:[]).concat(values).map(v=>{const o=document.createElement('option');o.value=v;o.textContent=v||all;return o;}));}
options('family',unique(data.map(r=>r.family)),'All families');
options('group',unique(data.map(r=>r[groupKey])),isR?'All equipment':null);
if(!isR)$('group').value=meta.default_protocol;
options('from',Array.from({length:meta.period_max},(_,i)=>String(i+1)));
options('through',Array.from({length:meta.period_max},(_,i)=>String(i+1)));$('through').value=String(meta.period_max);
function cohort(){return data.filter(r=>(!$('family').value||r.family===$('family').value)&&(!$('group').value||r[groupKey]===$('group').value)&&r.period>=+$('from').value&&r.period<=+$('through').value);}
function searchRows(){return selected.filter(r=>r.wafer.toLowerCase().includes($('search').value.trim().toLowerCase())).sort($('sort').value==='metric'?(a,b)=>(isR?b.resistance_index-a.resistance_index:b.ith_ratio-a.ith_ratio):(a,b)=>a.wafer.localeCompare(b.wafer));}
function rank(a){const order=a.map((v,i)=>({v,i})).sort((a,b)=>a.v-b.v),out=[];for(let i=0;i<order.length;){let j=i+1;while(j<order.length&&order[j].v===order[i].v)j++;for(let k=i;k<j;k++)out[order[k].i]=(i+j-1)/2+1;i=j;}return out;}
function spearman(pairs){if(pairs.length<3)return null;const x=rank(pairs.map(p=>p[0])),y=rank(pairs.map(p=>p[1])),n=x.length,m=(n+1)/2;let xx=0,yy=0,xy=0;for(let i=0;i<n;i++){xx+=(x[i]-m)**2;yy+=(y[i]-m)**2;xy+=(x[i]-m)*(y[i]-m);}return xx&&yy?xy/Math.sqrt(xx*yy):null;}
function metric(label,value,note){return `<div class="metric"><span>${label}</span><strong>${value}</strong><small>${note}</small></div>`;}
function variables(){const view=$('view').value;return isR?{x:view==='time'?'period':$('covariate').value,y:'resistance_index',xl:view==='time'?'Relative process week':$('covariate').selectedOptions[0].textContent,yl:'Resistance index',logX:false,logY:false}:{x:view==='ratio'?'ith_ratio':view==='electrical'?'electrical_index':'period',y:view==='ratio'?'efficiency_ratio':$('outcome').value,xl:view==='ratio'?'Threshold endpoint / baseline':view==='electrical'?'Pre-stress resistance index':'Relative qualification week',yl:view==='ratio'?'Efficiency endpoint / baseline':$('outcome').selectedOptions[0].textContent,logX:view==='ratio',logY:true};}
function scatter(rows){
 const v=variables(),pairs=rows.filter(r=>Number.isFinite(r[v.x])&&Number.isFinite(r[v.y])&&(!v.logX||r[v.x]>0)&&(!v.logY||r[v.y]>0));
 $('chart-summary').textContent=`${pairs.length.toLocaleString()} of ${rows.length.toLocaleString()} selected wafers plotted. ${!isR?'Logarithmic ratio axes show the full positive range, including extremes. ':''}No outlier trimming. Exact values are in the evidence table.`;
 if(!pairs.length)return '<p class="empty">No paired values for this selection.</p>';
 const W=740,H=390,L=76,R=20,T=25,B=65;
 const trX=x=>v.logX?Math.log10(x):x,trY=y=>v.logY?Math.log10(y):y;
 const xs=pairs.map(r=>trX(r[v.x])),ys=pairs.map(r=>trY(r[v.y]));
 let xmin=Math.min(...xs),xmax=Math.max(...xs),ymin=Math.min(...ys),ymax=Math.max(...ys);
 const dx=Math.max((xmax-xmin)*.06,.01),dy=Math.max((ymax-ymin)*.08,.01);xmin-=dx;xmax+=dx;ymin-=dy;ymax+=dy;
 const x=n=>L+(trX(n)-xmin)/(xmax-xmin)*(W-L-R),y=n=>H-B-(trY(n)-ymin)/(ymax-ymin)*(H-T-B);
 const keys=unique(pairs.map(r=>isR?r.family:r.status)),color=k=>palette[keys.indexOf(k)%palette.length];
 let svg=`<svg role="img" aria-label="${v.xl} versus ${v.yl} for ${pairs.length} anonymized observed wafer summaries" viewBox="0 0 ${W} ${H}">`;
 for(let i=0;i<=4;i++){const a=ymin+(ymax-ymin)*i/4,yy=H-B-(a-ymin)/(ymax-ymin)*(H-T-B),val=v.logY?10**a:a;svg+=`<line x1="${L}" x2="${W-R}" y1="${yy}" y2="${yy}" stroke="#e5ebef"/><text x="${L-10}" y="${yy+4}" text-anchor="end">${v.logY?val.toPrecision(2):val.toFixed(0)}</text>`;}
 for(let i=0;i<=4;i++){const a=xmin+(xmax-xmin)*i/4,xx=L+(a-xmin)/(xmax-xmin)*(W-L-R),val=v.logX?10**a:a;svg+=`<text x="${xx}" y="${H-B+25}" text-anchor="middle">${v.logX?val.toPrecision(2):val.toFixed(0)}</text>`;}
 if(!isR){if(v.x==='ith_ratio'&&xmin<0&&xmax>0)svg+=`<line x1="${x(1)}" x2="${x(1)}" y1="${T}" y2="${H-B}" stroke="#98afbb" stroke-dasharray="4"/>`;if(ymin<0&&ymax>0)svg+=`<line x1="${L}" x2="${W-R}" y1="${y(1)}" y2="${y(1)}" stroke="#98afbb" stroke-dasharray="4"/>`;}
 pairs.forEach(r=>{svg+=`<circle cx="${x(r[v.x])}" cy="${y(r[v.y])}" r="${pairs.length>800?2.7:4}" fill="${color(isR?r.family:r.status)}" opacity=".68"><title>${r.wafer} · ${isR?r.family:r.status} · ${v.xl}: ${fmt(r[v.x],3)} · ${v.yl}: ${fmt(r[v.y],3)}</title></circle>`;});
 svg+=`<text x="${(W+L)/2}" y="${H-10}" text-anchor="middle">${v.xl}${v.logX?' (log scale)':''}</text><text transform="translate(18 ${H/2}) rotate(-90)" text-anchor="middle">${v.yl}${v.logY?' (log scale)':''}</text></svg><p class="caption">${keys.map(k=>`<span style="color:${color(k)}">● ${k}</span>`).join(' &nbsp; ')} · Hover for values; the table provides keyboard-accessible evidence.</p>`;
 return svg;
}
function comparison(rows){
 const key=isR?'tool':'status',field=isR?'resistance_index':$('outcome').value;
 const groups=unique(rows.map(r=>r[key])).map(k=>{const a=rows.filter(r=>r[key]===k);return {key:k,n:a.length,value:median(a.map(r=>r[field]))};});
 if(!groups.length)return '<p class="empty">No groups available.</p>';
 return groups.map(g=>`<div class="comparison-row"><strong>${g.key}</strong><span>${fmt(g.value,3)}</span><small>n=${g.n.toLocaleString()} wafers</small></div>`).join('');
}
function table(){
 const rows=searchRows();page=Math.max(0,Math.min(page,Math.ceil(rows.length/pageSize)-1));const slice=rows.slice(page*pageSize,(page+1)*pageSize);
 const fields=isR?['wafer','period','family','tool','resistance_index','geometry_index','variation_index','focus','missing_pct']:['wafer','period','family','protocol','status','paired_devices','ith_ratio','efficiency_ratio','electrical_index'];
 const labels={wafer:'Anonymous wafer',period:'Relative week',family:'Family',tool:'Equipment',resistance_index:'Resistance index',geometry_index:'Geometry mean index',variation_index:'Geometry variability index',focus:'Focus window',missing_pct:'Missing readings (%)',protocol:'Protocol',status:'Recorded outcome',paired_devices:'Paired devices',ith_ratio:'Threshold ratio',efficiency_ratio:'Efficiency ratio',electrical_index:'Pre-stress resistance index'};
 $('table-head').innerHTML='<tr>'+fields.map(f=>`<th scope="col">${labels[f]}</th>`).join('')+'</tr>';
 $('table-body').innerHTML=slice.length?slice.map(r=>'<tr>'+fields.map(f=>`<td>${r[f]==null?'Unavailable':typeof r[f]==='number'&&!Number.isInteger(r[f])?fmt(r[f],4):r[f]}</td>`).join('')+'</tr>').join(''):`<tr><td colspan="${fields.length}" class="empty">No records match.</td></tr>`;
 $('table-count').textContent=`${rows.length.toLocaleString()} matching wafers in this selection. Page ${rows.length?page+1:0} of ${Math.ceil(rows.length/pageSize)}. CSV includes every matching row.`;
 $('previous').disabled=page===0;$('next').disabled=(page+1)*pageSize>=rows.length;
}
function update(){
 selected=cohort();page=0;const n=selected.length,v=variables(),pairs=selected.filter(r=>Number.isFinite(r[v.x])&&Number.isFinite(r[v.y])).map(r=>[r[v.x],r[v.y]]),rho=spearman(pairs);
 $('status').textContent=+$('from').value>+$('through').value?'The starting week is after the ending week. Choose a valid range.':`${n.toLocaleString()} observed wafer summaries selected${isR?'':` · ${$('group').value} only; protocols are not pooled`}.`;
 const focus=selected.filter(r=>r.focus),other=selected.filter(r=>!r.focus),q=selected.filter(r=>r.status==='Qualified').length,evaluable=selected.filter(r=>['Qualified','Non-pass A','Non-pass B'].includes(r.status)).length;
 $('metrics').innerHTML=metric('Selected wafers',n.toLocaleString(),isR?'One observed wafer per point':'One wafer median within selected protocol')+(isR?metric('Median resistance',fmt(median(selected.map(r=>r.resistance_index))),'Index; full-cohort median = 100')+metric('Focus-window median',fmt(median(focus.map(r=>r.resistance_index))),`${focus.length} wafers in fixed focus window`)+metric('Other-period median',fmt(median(other.map(r=>r.resistance_index))),`${other.length} wafers outside focus window`):metric('Recorded qualification',evaluable?fmt(100*q/evaluable,1)+'%':'Unavailable',`${q} qualified / ${evaluable} recorded terminal outcomes`)+metric('Paired device records',selected.reduce((s,r)=>s+r.paired_devices,0).toLocaleString(),'Device rows underlying wafer medians')+metric('Median threshold ratio',fmt(median(selected.map(r=>r.ith_ratio)),3),'Median of wafer-level device-ratio medians'));
 $('main-chart').innerHTML=scatter(selected);$('tool-chart').innerHTML=comparison(selected);
 $('association').textContent=`Selected view: ${v.xl} vs ${v.yl}. Wafer-level Spearman ρ = ${rho==null?'unavailable':rho.toFixed(3)} (n=${pairs.length.toLocaleString()}). Descriptive association; no causal inference.`;
 let findings=isR?[
 ['The observed focus window differs from the broader cohort',focus.length&&other.length?`Focus-window median minus other-period median: ${fmt(median(focus.map(r=>r.resistance_index))-median(other.map(r=>r.resistance_index)))} index units. This comparison uses the original fixed window and observed records.`:'Select a range containing both focus-window and other-period wafers to make this comparison.'],
 ['A shared process history changes the interpretation','In the saved full-cohort analysis, an unadjusted geometry-variability rank association of 0.229 becomes 0.040 after adjustment for geometry mean, family, time, and shared process run. These saved model results apply to all 345 wafers, not the filtered selection.'],
 ['The focused adjusted model is underpowered','The original focus window contains 16 wafers across 8 shared runs. The full adjustment leaves 4 residual degrees of freedom; its association is withheld under the saved minimum of 5.'],
 ['Mechanism remains unresolved','The observed shift and process associations do not isolate a physical failure mechanism. Specific recipe, material, equipment, and interface details have been removed from this public edition.']
 ]:[
 ['Keep measurement protocols separate',`The selected protocol contributes ${n.toLocaleString()} wafers and ${selected.reduce((s,r)=>s+r.paired_devices,0).toLocaleString()} eligible paired-device records. Each protocol retains its original test-condition grouping; the public label hides the setup details.`],
 ['Pair first, then summarize',n?`Selected median wafer threshold ratio: ${fmt(median(selected.map(r=>r.ith_ratio)),3)}. Selected median wafer efficiency ratio: ${fmt(median(selected.map(r=>r.efficiency_ratio)),3)}. Each wafer value is a median of paired device ratios, not a ratio of pooled medians.`:'No paired measurements are available for this selection.'],
 ['Recorded status and degradation are different outcomes',`${q.toLocaleString()} selected wafers carry the recorded qualified label among ${evaluable.toLocaleString()} terminal outcomes. A device degradation ratio is not converted into a chip pass/fail verdict, and this page does not report burn-in chip yield.`],
 ['Extreme positive ratios remain visible','Logarithmic axes retain extreme positive ratios rather than trimming them. Very small positive baselines can amplify a ratio; such records require source review before a physical interpretation.']
 ];
 if(!n)findings=[['No selected evidence','Expand the family, equipment, protocol, or week filters to inspect observed records.']];
 $('finding-content').innerHTML=findings.map(([h,p])=>`<article class="finding"><h3>${h}</h3><p>${p}</p></article>`).join('');table();
}
['family','group','from','through','view','outcome','covariate'].forEach(id=>{if($(id))$(id).addEventListener('change',update);});
$('search').addEventListener('input',()=>{page=0;table();});$('sort').addEventListener('change',()=>{page=0;table();});
$('previous').addEventListener('click',()=>{page--;table();});$('next').addEventListener('click',()=>{page++;table();});
$('reset').addEventListener('click',()=>{$('family').value='';$('group').value=isR?'':meta.default_protocol;$('from').value='1';$('through').value=String(meta.period_max);$('search').value='';$('sort').value='wafer';$('view').value=isR?'time':'ratio';if($('outcome'))$('outcome').value='ith_ratio';update();});
$('download').addEventListener('click',()=>{const rows=searchRows();if(!rows.length){$('status').textContent='No rows to download. Expand the filters.';return;}const keys=Object.keys(rows[0]),quote=v=>'"'+String(v??'').replaceAll('"','""')+'"';const csv=[keys.map(quote).join(','),...rows.map(r=>keys.map(k=>quote(r[k])).join(','))].join('\r\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=`anonymized-${kind}-evidence.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
$('print').addEventListener('click',()=>window.print());update();
})();
