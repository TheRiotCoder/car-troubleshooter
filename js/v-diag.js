/* Diagnose wizard, warning-light guide, OBD-II code lookup */
(function(){
var CC = window.CC, esc=CC.esc, $=CC.$;
CC.views = CC.views || {};
var path=[]; // visited node ids within current category

CC.views.diagnose=function(ctx){
  CC.header("Troubleshoot");
  var v=CC.activeVehicle();
  ctx.el.innerHTML='<div class="notice warn">🛟 <b>Safety first:</b> if you smell fuel, see smoke/fire, have no brakes, or lose steering – stop in a safe place and call for help.</div>'+
   '<h2 style="margin-top:.6rem">What\'s going on'+(v?' with your '+esc(CC.vehicleName(v)):'')+'?</h2>'+
   '<div class="list">'+CC.DIAG.map(function(c){
     return '<a class="row-btn" href="#/diagnose/'+c.id+'"><span class="ico">'+c.icon+'</span><span class="grow"><b>'+esc(c.name)+'</b><span>'+esc(c.desc)+'</span></span><span class="chev">›</span></a>';
   }).join('')+'</div>'+
   '<div class="list"><a class="row-btn" href="#/ref/lights"><span class="ico">⚠️</span><span class="grow"><b>Dashboard warning lights</b><span>Identify a light by color and name</span></span><span class="chev">›</span></a>'+
   '<a class="row-btn" href="#/ref/codes"><span class="ico">📟</span><span class="grow"><b>OBD-II code lookup</b><span>Enter a code from a scanner</span></span><span class="chev">›</span></a></div>'+CC.disclaimer();
};

CC.views.diagStep=function(ctx){
  var cat=CC.DIAG.filter(function(c){return c.id===ctx.cat;})[0];
  if(!cat){ ctx.el.innerHTML=CC.empty("❓","Unknown category","",'<a class="btn" href="#/diagnose">Back</a>'); return; }
  var id=ctx.node||cat.start, node=cat.nodes[id];
  if(!node){ id=cat.start; node=cat.nodes[id]; }
  if(id===cat.start||path.length===0||path.cat!==cat.id){ path=[id]; path.cat=cat.id; }
  else { var i=path.indexOf(id); if(i>=0) path.length=i+1; else path.push(id); }
  var prev=path.length>1?path[path.length-2]:null;
  var back=prev?"#/diagnose/"+cat.id+"/"+prev:"#/diagnose";
  CC.header(cat.name,back);
  var h='';
  if(node.q){
    var depth=path.length;
    h+='<div class="progress" aria-hidden="true"><i style="width:'+Math.min(90,depth*22)+'%"></i></div>'+
      '<div class="card q-card"><small>Question '+depth+'</small><h2>'+esc(node.q)+'</h2>'+(node.help?'<p class="muted">💡 '+esc(node.help)+'</p>':'')+'</div>'+
      node.opts.map(function(o){ return '<div class="opt"><a class="row-btn" href="#/diagnose/'+cat.id+'/'+o[1]+'"><span class="grow"><b>'+esc(o[0])+'</b></span><span class="chev">›</span></a></div>'; }).join('')+
      '<div class="btn-row"><a class="btn" href="#/diagnose">Start over</a></div>';
  } else {
    var r=node.r, v=CC.activeVehicle();
    h+='<div class="card"><small>Likely diagnosis</small><h2 style="margin-top:2px">'+esc(r.title)+'</h2>'+
      '<div class="urg '+r.urg+'" role="status"><span style="font-size:1.6rem">'+(r.urg==="stop"?"🛑":r.urg==="soon"?"⚠️":"✅")+'</span><span>'+(r.urg==="stop"?"Stop driving – do not continue until this is checked":r.urg==="soon"?"Get it checked soon – drive cautiously and keep trips short":"Generally safe to drive – address when convenient")+'</span></div>'+
      '<div class="result-head"><span class="badge info">🔧 '+esc(r.diy)+'</span></div>'+
      '<h3>Possible causes</h3>'+r.causes.map(function(c){ var p=c.split("|"); return '<div class="cause"><b>'+esc(p[0])+'</b>'+(p[1]?'<span class="muted">'+esc(p[1])+'</span>':'')+'</div>'; }).join('')+
      (r.tips.length?'<h3>Tips &amp; next steps</h3><ul class="tips">'+r.tips.map(function(t){return '<li>'+esc(t)+'</li>';}).join('')+'</ul>':'')+'</div>'+
      '<div class="btn-row">'+
      (v?'<a class="btn" href="#/recalls/'+esc(v.id)+'">📢 Check recalls</a>':'')+
      '<a class="btn" href="#/log/new?note='+encodeURIComponent("Issue: "+cat.name+" – "+r.title)+'">📒 Log a repair</a>'+
      '<a class="btn" href="#/ref/codes">📟 Look up a code</a></div>'+
      '<div class="btn-row"><a class="btn primary" href="#/diagnose/'+cat.id+'">Try again</a><a class="btn" href="#/diagnose">Other problems</a></div>'+CC.disclaimer();
  }
  ctx.el.innerHTML=h;
};

/* ---------- Reference: lights + codes ---------- */
CC.views.ref=function(ctx){
  CC.header("Lights & Codes");
  var tab=ctx.tab||"lights";
  var h='<div class="pills" role="tablist"><button role="tab" class="'+(tab==="lights"?"on":"")+'" data-t="lights">⚠️ Warning lights</button><button role="tab" class="'+(tab==="codes"?"on":"")+'" data-t="codes">📟 OBD-II codes</button></div><div id="ref-body"></div>';
  ctx.el.innerHTML=h;
  CC.$$(".pills button",ctx.el).forEach(function(b){ b.onclick=function(){ location.hash="#/ref/"+b.dataset.t; }; });
  (tab==="codes"?codesView:lightsView)($("#ref-body"));
};

function lightsView(el){
  var color="all", q="";
  var colors=[["all","All"],["red","🔴 Red"],["amber","🟠 Amber/Yellow"],["blue","🔵 Blue"],["green","🟢 Green"]];
  el.innerHTML='<div class="notice info"><b>Color code:</b> Red = serious/safety – act now. Amber = caution – service soon. Green/Blue = informational.</div>'+
   '<div class="search"><label for="lq" class="muted" style="margin:0 0 4px">Search lights</label><input id="lq" type="search" placeholder="e.g. battery, oil, ABS, tire" enterkeyhint="search"></div>'+
   '<div class="pills" id="cp">'+colors.map(function(c){return '<button data-c="'+c[0]+'" class="'+(c[0]==="all"?"on":"")+'">'+c[1]+'</button>';}).join('')+'</div><div id="ll" class="list"></div>'+CC.disclaimer();
  function draw(){
    var items=CC.LIGHTS.filter(function(l){ return (color==="all"||l[2]===color) && (!q||(l[1]+" "+l[4]).toLowerCase().indexOf(q)>=0); });
    $("#ll",el).innerHTML=items.length?items.map(function(l){
      return '<div class="card" style="margin:0"><div class="light-item"><div class="light-ico '+l[2]+'" aria-hidden="true" style="'+(l[0].length>2?'font-size:.95rem;font-weight:800':'')+'">'+esc(l[0])+'</div><div style="flex:1"><h3>'+esc(l[1])+'</h3>'+CC.urgBadge(l[3])+
        '<p>'+esc(l[4])+'</p><p><b>What to do:</b> '+esc(l[5])+'</p></div></div></div>';
    }).join(''):CC.empty("🔍","No matching lights","Try a different word or color.");
  }
  $("#lq",el).oninput=function(e){ q=e.target.value.trim().toLowerCase(); draw(); };
  $("#cp",el).onclick=function(e){ var b=e.target.closest("button"); if(!b) return; color=b.dataset.c; CC.$$("#cp button",el).forEach(function(x){x.classList.toggle("on",x===b);}); draw(); };
  draw();
}

function decodeStructure(code){
  var m=/^([PBCU])([0-3])([0-9A-F])([0-9A-F]{2})$/.exec(code); if(!m) return null;
  var sys=m[1], d2=+m[2], sub=m[3], out={system:CC.OBD_SYSTEMS[sys],type:(CC.OBD_DIGIT2[sys]||{})[d2],range:null};
  if(sys==="P"){
    var key=code.slice(0,2)+(code[2]); var n=parseInt(code.slice(1),16);
    for(var i=0;i<CC.OBD_P_RANGES.length;i++){ var r=CC.OBD_P_RANGES[i][0]; var mm=/P([0-9A-F]{4})–P([0-9A-F]{4})/.exec(r); if(mm && n>=parseInt(mm[1],16) && n<=parseInt(mm[2],16)){ out.range=CC.OBD_P_RANGES[i][1]; break; } }
  } else if(sys==="C"){ out.range="Chassis system (ABS, traction control, steering, suspension sensors)."; }
  else if(sys==="B"){ out.range="Body system (airbags/restraints, climate control, lighting, locks, seats)."; }
  else { out.range="Communication network (CAN bus) – lost communication with a module, often wiring or power/ground, or a failed module."; }
  return out;
}

function codesView(el){
  var all=Object.keys(CC.OBD_PARSED).map(function(k){return CC.OBD_PARSED[k];}).sort(function(a,b){return a.code<b.code?-1:1;});
  el.innerHTML='<div class="search"><label for="cq" class="muted" style="margin:0 0 4px">Enter a code or a keyword</label><input id="cq" type="search" placeholder="P0300 or &quot;misfire&quot;" autocapitalize="characters" autocorrect="off" spellcheck="false" enterkeyhint="search"></div>'+
   '<div id="cres"></div>'+
   '<details><summary>How to read an OBD-II code</summary><div><p>A code like <b class="code-big" style="font-size:1.1rem">P0301</b> has 5 characters:</p><ul class="tips"><li><b>1st letter</b> – system: <b>P</b>owertrain, <b>B</b>ody, <b>C</b>hassis, <b>U</b> network.</li><li><b>1st digit</b> – <b>0</b> = generic (same on every car), <b>1</b> = manufacturer-specific, <b>2</b> = generic (newer), <b>3</b> = mixed.</li><li><b>2nd digit</b> – subsystem (for P-codes: 1–2 fuel/air, 3 ignition/misfire, 4 emissions, 5 idle/speed, 6 computer, 7–8 transmission).</li><li><b>Last 2 digits</b> – specific fault.</li></ul><p class="muted">Get the code with an OBD-II scanner (Bluetooth dongles from ~$15, or free at most auto parts stores). Many also give freeze-frame data; write it down before clearing codes.</p></div></details>'+
   '<details><summary>Generic code ranges (P0xxx–P3xxx)</summary><div>'+CC.OBD_P_RANGES.map(function(r){return '<p><b>'+esc(r[0])+'</b><br><span class="muted">'+esc(r[1])+'</span></p>';}).join('')+
     '<p><b>B</b>, <b>C</b>, <b>U</b> codes follow the same pattern: B = body, C = chassis, U = network. Codes with a <b>1</b> as first digit (P1xxx, B1xxx…) are manufacturer-specific.</p></div></details>'+
   '<h2>Common codes <small class="muted" id="ccount"></small></h2><div id="clist" class="list"></div>'+CC.disclaimer();
  function itemHtml(c,open){
    var u=c.urg==="x"?"stop":c.urg==="s"?"soon":"ok";
    return '<details'+(open?' open':'')+'><summary><span class="code-big" style="font-size:1.1rem;margin-right:10px">'+esc(c.code)+'</span><span style="flex:1;font-weight:500;font-size:.92rem">'+esc(c.desc)+'</span></summary><div>'+CC.urgBadge(u)+'<p><b>Common causes:</b> '+esc(c.causes)+'</p></div></details>';
  }
  function draw(){
    var q=$("#cq",el).value.trim(), up=q.toUpperCase().replace(/\s+/g,""), res=$("#cres",el), items;
    var struct=/^[PBCU][0-3][0-9A-F]{3}$/.test(up);
    var h='';
    if(struct){
      var hit=CC.OBD_PARSED[up], s=decodeStructure(up);
      h+='<div class="card"><div class="code-big">'+esc(up)+'</div>';
      if(hit) h+='<h3>'+esc(hit.desc)+'</h3>'+CC.urgBadge(hit.urg==="x"?"stop":hit.urg==="s"?"soon":"ok")+'<p><b>Common causes:</b> '+esc(hit.causes)+'</p>';
      else h+='<p>This code isn\'t in the built-in list'+(up[1]!=="0"&&up[1]!=="2"?' (it looks <b>manufacturer-specific</b>, so the meaning depends on the make)':'')+'. Here\'s what its structure tells us:</p>';
      h+='<dl class="kv"><dt>System</dt><dd>'+esc(s.system)+'</dd><dt>Type</dt><dd>'+esc(s.type)+'</dd>'+(s.range?'<dt>Area</dt><dd>'+esc(s.range)+'</dd>':'')+'</dl>'+
        (hit?'':'<p><a href="https://www.google.com/search?q='+encodeURIComponent(up+" "+(CC.activeVehicle()?CC.vehicleFull(CC.activeVehicle()):"OBD-II code"))+'" target="_blank" rel="noopener">Search the web for '+esc(up)+(CC.activeVehicle()?' on your '+esc(CC.vehicleName(CC.activeVehicle())):'')+' ↗</a> (needs internet)</p>')+
        '<p class="muted">A code points to a circuit or system – not necessarily a bad part. Diagnose before replacing parts.</p></div>';
      items=all.filter(function(c){return c.code.slice(0,4)===up.slice(0,4)&&c.code!==up;});
    } else if(q){
      var ql=q.toLowerCase(); items=all.filter(function(c){return c.code.toLowerCase().indexOf(ql)===0||(c.desc+" "+c.causes).toLowerCase().indexOf(ql)>=0;});
      if(!items.length) h+='<div class="notice warn">No built-in codes match "'+esc(q)+'". Codes look like P0300 (a letter and 4 digits/letters).</div>';
    } else items=all;
    res.innerHTML=h;
    $("#clist",el).innerHTML=items.slice(0,q?80:120).map(function(c){return itemHtml(c,false);}).join('')+(items.length>(q?80:120)?'<p class="muted">Showing first '+(q?80:120)+' – refine your search.</p>':'');
    $("#ccount",el).textContent="("+items.length+")";
  }
  $("#cq",el).oninput=draw; draw();
}
})();
