const M=[
{id:'COPPER',bm:'Kuprum (Copper)',en:'Copper',sym:'COPPER / LME',base:'tan metrik',price:'$9,520 / tan',desc:'Katod & concentrate. Rujukan LME.'},
{id:'TITA',bm:'Titanium',en:'Titanium',sym:'TITANIUM SPONGE',base:'tan metrik',price:'$11,500 / tan',desc:'Sponge & ilmenite. Rujukan Fastmarkets.'},
{id:'LITH',bm:'Litium (LCE)',en:'Lithium',sym:'LITHIUM CARBONATE',base:'tan metrik',price:'$10,800 / tan',desc:'Lithium carbonate equivalent.'},
{id:'COLTAN',bm:'Koltan (Coltan)',en:'Coltan',sym:'COLTAN',base:'kg',price:'$85 / kg',desc:'Coltan tantalum-niobium.'},
{id:'TANT',bm:'Tantalum',en:'Tantalum',sym:'TANTALUM',base:'kg',price:'$185 / kg',desc:'Tantalum concentrate.'},
{id:'AURUM',bm:'Aurum',en:'Aurum',sym:'AURUM / LBMA',base:'oz troy',price:'$2,675 / oz',desc:'Rujukan LBMA. Assay penuh.'},
{id:'SILVER',bm:'Perak (Silver)',en:'Silver',sym:'SILVER / COMEX',base:'oz troy',price:'$31.80 / oz',desc:'Rujukan COMEX.'},
{id:'TIN',bm:'Timah (Tin)',en:'Tin',sym:'TIN / LME',base:'tan metrik',price:'$32,200 / tan',desc:'Rujukan LME.'},
{id:'ALU',bm:'Aluminium',en:'Aluminium',sym:'ALUMINIUM / LME',base:'tan metrik',price:'$2,620 / tan',desc:'Rujukan LME.'}];
function card(m){return `<div class="card"><div class="sym">${m.sym}</div><h3>⭐ ${m.bm}</h3><p>${m.desc}</p><p><b>${m.price}</b> • ${m.base}</p><a class="btn" href="market-tool.html">Kira Nilai →</a></div>`}
const g=document.getElementById('minGrid'); if(g) g.innerHTML=M.map(card).join('');
const t=document.getElementById('tick'); if(t){const h=M.map(m=>`⭐ ${m.bm}: ${m.price}`).join(' • '); t.textContent=h+' • '+h;}
