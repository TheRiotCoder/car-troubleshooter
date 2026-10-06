/* Garage: vehicle list, add/edit form (NHTSA makes/models/VIN), detail, recalls */
(function(){
var CC = window.CC, esc=CC.esc, $=CC.$;
CC.views = CC.views || {};

CC.views.garage=function(ctx){
  CC.header("My Garage");
  var vs=CC.state.vehicles, act=CC.settings.get().activeVehicle;
  var html='';
  if(!vs.length){
    html+=CC.empty("🚗","Your garage is empty","Add a vehicle to get recall checks, a service log and reminders. You can add as many as you like.",'<a class="btn primary" href="#/vehicle/new">Add your first vehicle</a>');
  } else {
    html+='<div class="list">'+vs.map(function(v){
      return '<a class="row-btn" href="#/vehicle/'+esc(v.id)+'"><span class="ico">🚘</span><span class="grow"><b>'+esc(CC.vehicleName(v))+(v.id===act?' <span class="badge info">Active</span>':'')+'</b><span>'+esc(CC.vehicleFull(v))+(v.odometer?' · '+CC.fmtNum(v.odometer)+' '+CC.unit():'')+'</span></span><span class="chev">›</span></a>';
    }).join('')+'</div><a class="btn primary block" href="#/vehicle/new">＋ Add vehicle</a>';
  }
  html+='<h2>Quick start</h2><div class="list">'+
    '<a class="row-btn" href="#/diagnose"><span class="ico">🔧</span><span class="grow"><b>Troubleshoot a problem</b><span>Step-by-step guided diagnosis</span></span><span class="chev">›</span></a>'+
    '<a class="row-btn" href="#/ref/lights"><span class="ico">⚠️</span><span class="grow"><b>Warning light guide</b><span>What does that dash light mean?</span></span><span class="chev">›</span></a>'+
    '<a class="row-btn" href="#/ref/codes"><span class="ico">📟</span><span class="grow"><b>OBD-II code lookup</b><span>P0300, P0420 and more</span></span><span class="chev">›</span></a>'+
    '<a class="row-btn" href="#/log/new"><span class="ico">📒</span><span class="grow"><b>Add service entry</b><span>Oil change, tires, repairs…</span></span><span class="chev">›</span></a></div>'+CC.disclaimer();
  ctx.el.innerHTML=html;
};

/* ---------- add / edit vehicle ---------- */
CC.views.vehicleForm=function(ctx){
  var existing=ctx.id?CC.getVehicle(ctx.id):null;
  if(ctx.id&&!existing){ ctx.el.innerHTML=CC.empty("❓","Vehicle not found","",'<a class="btn" href="#/garage">Back to garage</a>'); return; }
  var v=existing||{};
  CC.header(existing?"Edit vehicle":"Add vehicle","#/"+(existing?"vehicle/"+v.id:"garage"));
  var thisYear=new Date().getFullYear()+1, years='<option value="">Select year</option>';
  for(var y=thisYear;y>=1950;y--) years+='<option value="'+y+'"'+(String(v.year)===String(y)?' selected':'')+'>'+y+'</option>';
  ctx.el.innerHTML=
   '<form id="vf" autocomplete="off" novalidate>'+
   '<div class="card"><h3>Quick fill by VIN <small>(optional)</small></h3>'+
     '<label for="vin">VIN (17 characters)</label><div style="display:flex;gap:8px"><input id="vin" maxlength="17" autocapitalize="characters" autocorrect="off" spellcheck="false" inputmode="text" placeholder="1HGCM82633A004352" value="'+esc(v.vin||"")+'"><button type="button" class="btn" id="decode" style="min-width:100px">Decode</button></div>'+
     '<div id="vin-msg" class="muted" style="margin-top:6px;font-size:.88rem">Uses the free NHTSA database (needs internet). Or just pick or type below.</div></div>'+
   '<div class="card"><h3>Vehicle</h3>'+
     '<label for="year">Year</label><select id="year" required>'+years+'</select>'+
     '<label for="make">Make</label><div class="combo"><input id="make" required placeholder="Start typing – e.g. Toyota" value="'+esc(v.make||"")+'" autocapitalize="words"></div>'+
     '<div id="make-msg" class="muted" style="font-size:.82rem;margin-top:4px"></div>'+
     '<label for="model">Model</label><div class="combo"><input id="model" required placeholder="e.g. Camry" value="'+esc(v.model||"")+'" autocapitalize="words"></div>'+
     '<div id="model-msg" class="muted" style="font-size:.82rem;margin-top:4px">Pick a year and make to load models, or type any model.</div>'+
     '<label for="trim">Trim / engine <small>(optional)</small></label><input id="trim" placeholder="e.g. LE 2.5L" value="'+esc(v.trim||"")+'">'+
     '<label for="nick">Nickname <small>(optional)</small></label><input id="nick" placeholder="e.g. Daily driver" value="'+esc(v.nickname||"")+'">'+
     '<label for="odo">Current odometer ('+CC.unit()+')</label><input id="odo" type="number" inputmode="numeric" min="0" step="1" value="'+(v.odometer!=null?esc(v.odometer):"")+'">'+
   '</div>'+
   '<div id="form-err" class="notice bad" hidden></div>'+
   '<div class="btn-row"><button class="btn primary" type="submit">'+(existing?"Save changes":"Add to garage")+'</button><a class="btn" href="#/'+(existing?"vehicle/"+v.id:"garage")+'">Cancel</a></div></form>';

  var makeIn=$("#make"), modelIn=$("#model"), yearSel=$("#year"), makeMap={}, makeList=[], popular=CC.POPULAR_MAKES, selMakeId=v.makeId||null, modelNames=[], modelTimer;
  function norm(n){ var up=n.toUpperCase(); for(var i=0;i<popular.length;i++) if(popular[i].toUpperCase()===up) return popular[i]; return n.length<=3?n:CC.titleCase(n); }
  // makes
  CC.NHTSA.makes().then(function(r){
    makeList=r.data.map(function(m){return {id:m[0],name:m[1]};});
    makeList.forEach(function(m){makeMap[m.name.toUpperCase()]=m.id;});
    $("#make-msg").textContent=r.cached?"Make list loaded from device ("+makeList.length.toLocaleString()+" makes).":"Loaded "+makeList.length.toLocaleString()+" makes from NHTSA – saved for offline use.";
    resolveMake(); scheduleModels();
  }).catch(function(){
    $("#make-msg").textContent="Offline and make list not saved yet – showing common makes. You can type any make.";
  });
  function resolveMake(){ var id=makeMap[makeIn.value.trim().toUpperCase()]; selMakeId=id||null; }
  CC.combo({input:makeIn,getItems:function(q){
    if(!q) return popular.slice(0,60).map(function(n){return {label:n};});
    var ql=q.toLowerCase(), pre=[], inc=[], src=makeList.length?makeList.map(function(m){return m.name;}):popular;
    for(var i=0;i<src.length&&pre.length<40;i++){ var n=src[i], nl=n.toLowerCase(); if(nl.indexOf(ql)===0) pre.push(n); else if(inc.length<40&&nl.indexOf(ql)>0) inc.push(n); }
    var out=pre.concat(inc).slice(0,40).map(function(n){return {label:norm(n)};});
    if(!out.length) out=[{label:"No match – keep typing to enter a custom make",hint:true}];
    return out;
  },onPick:function(it){ resolveMake(); modelIn.value=""; scheduleModels(); modelIn.focus(); }});
  makeIn.addEventListener("input",function(){ resolveMake(); scheduleModels(); });
  yearSel.addEventListener("change",function(){ scheduleModels(); });
  function scheduleModels(){ clearTimeout(modelTimer); modelTimer=setTimeout(loadModels,450); }
  var modelSeq=0;
  function loadModels(){
    var make=makeIn.value.trim(), year=yearSel.value, msg=$("#model-msg");
    if(!make||!year){ modelNames=[]; msg.textContent="Pick a year and make to load models, or type any model."; return; }
    var my=++modelSeq; msg.innerHTML='<span class="spinner"></span> Loading models…';
    CC.NHTSA.models({id:selMakeId,name:make},year).then(function(r){
      if(my!==modelSeq) return; modelNames=r.data;
      msg.textContent=modelNames.length?(modelNames.length+" models found"+(r.cached?" (saved on device)":"")+" – tap the field to choose, or type your own."):"No models listed for that year – type the model manually.";
    }).catch(function(){ if(my!==modelSeq) return; modelNames=[]; msg.textContent="Can't reach NHTSA (offline?) and nothing saved for this make/year – just type the model manually."; });
  }
  CC.combo({input:modelIn,getItems:function(q){
    if(!modelNames.length) return [];
    var ql=q.toLowerCase();
    var out=modelNames.filter(function(n){return !ql||n.toLowerCase().indexOf(ql)>=0;}).slice(0,60).map(function(n){return {label:n};});
    return out;
  }});
  if(v.year) scheduleModels();

  $("#decode").onclick=function(){
    var vin=$("#vin").value, msg=$("#vin-msg"), btn=$("#decode"); btn.disabled=true; msg.innerHTML='<span class="spinner"></span> Decoding…';
    CC.NHTSA.decodeVin(vin).then(function(r){
      if(r.year) yearSel.value=r.year; if(r.make) makeIn.value=norm(r.make); if(r.model) modelIn.value=r.model;
      var extra=[r.trim,r.engine].filter(Boolean).join(" "); if(extra&&!$("#trim").value) $("#trim").value=extra;
      $("#vin").value=r.vin; resolveMake(); scheduleModels();
      msg.innerHTML='✅ '+esc([r.year,r.make,r.model].filter(Boolean).join(" "))+(r.body?' · '+esc(r.body):'')+(r.engine?' · '+esc(r.engine):'')+(r.plant?' · built in '+esc(r.plant):'');
    }).catch(function(e){ msg.textContent="⚠️ "+(e.message&&/HTTP|fetch|Failed|network|abort/i.test(e.message)?"Couldn't reach NHTSA – check your connection or enter details by hand.":e.message); })
      .then(function(){btn.disabled=false;});
  };

  $("#vf").onsubmit=function(e){
    e.preventDefault(); var err=$("#form-err"); err.hidden=true;
    var year=yearSel.value, make=makeIn.value.trim(), model=modelIn.value.trim();
    if(!year||!make||!model){ err.textContent="Please choose a year and enter a make and model."; err.hidden=false; return; }
    var vin=$("#vin").value.trim().toUpperCase();
    if(vin&&!/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)){ err.textContent="That VIN doesn't look valid (17 characters, no I, O or Q) – fix it or clear it."; err.hidden=false; return; }
    resolveMake();
    var rec=Object.assign({},existing||{},{id:existing?existing.id:CC.uid(),year:+year,make:norm(make),model:model,makeId:selMakeId,trim:$("#trim").value.trim(),vin:vin,
      nickname:$("#nick").value.trim(),odometer:$("#odo").value===""?null:+$("#odo").value,createdAt:existing?existing.createdAt:Date.now(),updatedAt:Date.now()});
    CC.DB.put("vehicles",rec).then(function(){ return CC.loadVehicles(); }).then(function(){
      if(!existing||!CC.activeVehicle()) CC.setActive(rec.id);
      if(!existing) CC.setActive(rec.id);
      CC.toast(existing?"Vehicle updated":"Vehicle added"); location.hash="#/vehicle/"+rec.id;
    }).catch(function(er){ err.textContent="Could not save: "+er.message; err.hidden=false; });
  };
};

/* ---------- vehicle detail ---------- */
CC.views.vehicle=function(ctx){
  var v=CC.getVehicle(ctx.id);
  if(!v){ CC.header("Vehicle","#/garage"); ctx.el.innerHTML=CC.empty("❓","Vehicle not found","",'<a class="btn" href="#/garage">Back to garage</a>'); return; }
  CC.header(CC.vehicleName(v),"#/garage");
  var isActive=CC.settings.get().activeVehicle===v.id;
  ctx.el.innerHTML=
   '<div class="card"><h3>'+esc(CC.vehicleFull(v))+' '+(isActive?'<span class="badge info">Active</span>':'')+'</h3>'+
   '<dl class="kv">'+(v.nickname?'<dt>Nickname</dt><dd>'+esc(v.nickname)+'</dd>':'')+(v.vin?'<dt>VIN</dt><dd>'+esc(v.vin)+'</dd>':'')+
   '<dt>Odometer</dt><dd>'+(v.odometer!=null?CC.fmtNum(v.odometer)+' '+CC.unit():'—')+'</dd></dl>'+
   '<label for="odo2">Update odometer ('+CC.unit()+')</label><div style="display:flex;gap:8px"><input id="odo2" type="number" inputmode="numeric" min="0" value="'+(v.odometer!=null?esc(v.odometer):"")+'"><button class="btn" id="odo-save">Save</button></div></div>'+
   '<div class="list">'+
   (isActive?'':'<button class="row-btn" id="set-active"><span class="ico">✅</span><span class="grow"><b>Make this the active vehicle</b><span>Used for the service log, reminders and recalls</span></span></button>')+
   '<a class="row-btn" href="#/recalls/'+esc(v.id)+'"><span class="ico">📢</span><span class="grow"><b>Recalls &amp; complaints</b><span>Live from NHTSA</span></span><span class="chev">›</span></a>'+
   '<a class="row-btn" id="to-log" href="#/log"><span class="ico">📒</span><span class="grow"><b>Service log &amp; reminders</b></span><span class="chev">›</span></a>'+
   '<a class="row-btn" href="#/diagnose"><span class="ico">🔧</span><span class="grow"><b>Troubleshoot a problem</b></span><span class="chev">›</span></a>'+
   '<a class="row-btn" href="#/vehicle/'+esc(v.id)+'/edit"><span class="ico">✏️</span><span class="grow"><b>Edit vehicle</b></span><span class="chev">›</span></a></div>'+
   '<button class="btn danger block" id="del-v">Delete vehicle &amp; its log…</button>';
  var sa=$("#set-active"); if(sa) sa.onclick=function(){ CC.setActive(v.id); CC.views.vehicle(ctx); CC.toast("Active vehicle set"); };
  $("#to-log").onclick=function(){ CC.setActive(v.id); };
  $("#odo-save").onclick=function(){ var val=$("#odo2").value; v.odometer=val===""?null:+val; v.updatedAt=Date.now(); CC.DB.put("vehicles",v).then(function(){ CC.toast("Odometer saved"); CC.views.vehicle(ctx); }); };
  $("#del-v").onclick=function(){
    CC.confirm("This permanently deletes "+CC.vehicleName(v)+" and all of its service log entries and receipt photos from this device. Export a backup first if you might need them.","Delete",true,"Delete vehicle?").then(function(ok){
      if(!ok) return;
      CC.DB.byVehicle(v.id).then(function(logs){
        return Promise.all(logs.map(function(l){ return Promise.all([CC.DB.del("logs",l.id), l.photoId?CC.DB.del("photos",l.photoId):null]); }));
      }).then(function(){ return CC.DB.del("vehicles",v.id); }).then(function(){ return CC.loadVehicles(); }).then(function(){ CC.toast("Vehicle deleted"); location.hash="#/garage"; });
    });
  };
};

/* ---------- recalls & complaints ---------- */
CC.views.recalls=function(ctx){
  var v=CC.getVehicle(ctx.id)||CC.activeVehicle();
  if(!v){ CC.header("Recalls","#/garage"); ctx.el.innerHTML=CC.empty("📢","No vehicle selected","Add a vehicle to check recalls and complaints.",'<a class="btn primary" href="#/vehicle/new">Add vehicle</a>'); return; }
  CC.header("Recalls & complaints","#/vehicle/"+v.id);
  ctx.el.innerHTML='<div class="card"><b>'+esc(CC.vehicleFull(v))+'</b></div><div id="rc"><p><span class="spinner"></span> Checking NHTSA…</p></div>'+
    '<div class="notice info">Recalls are specific to certain production runs. Confirm with a VIN check at <a href="https://www.nhtsa.gov/recalls" target="_blank" rel="noopener">nhtsa.gov/recalls</a> or your dealer – repairs for open safety recalls are free.</div>'+CC.disclaimer();
  var box=$("#rc");
  Promise.all([CC.NHTSA.recalls(v).catch(function(e){return {error:e};}),CC.NHTSA.complaints(v).catch(function(e){return {error:e};})]).then(function(rs){
    var rec=rs[0], com=rs[1], h='';
    h+='<h2>Safety recalls</h2>';
    if(rec.error) h+='<div class="notice warn">Couldn\'t load recalls – you appear to be offline and nothing is saved for this vehicle yet. Reconnect and open this page again.</div>';
    else {
      if(rec.cached) h+='<div class="notice warn">Showing saved data from '+CC.ago(rec.ts)+(navigator.onLine===false?' (offline).':'.')+'</div>';
      if(!rec.data.length) h+='<div class="notice ok">✅ No recalls on record for this year/make/model.</div>';
      else {
        h+='<p><b>'+rec.data.length+'</b> recall'+(rec.data.length>1?'s':'')+' found.</p>'+rec.data.map(function(r){
          return '<details'+(r.parkIt?' open':'')+'><summary>'+(r.parkIt?'🛑 ':'')+esc(r.component||"Recall")+' <small style="margin-left:6px">'+esc(r.id)+'</small></summary><div>'+
            (r.parkIt?'<div class="notice bad"><b>Do not drive</b> – manufacturer says park this vehicle until repaired.</div>':'')+
            (r.parkOutSide?'<div class="notice bad">Park outside – fire risk.</div>':'')+
            '<p class="muted">Reported '+esc(r.date||"")+' · '+esc(r.manufacturer||"")+(r.ota?' · Over-the-air fix':'')+'</p>'+
            '<h3>Problem</h3><p>'+esc(r.summary||"")+'</p><h3>Risk</h3><p>'+esc(r.consequence||"")+'</p><h3>Fix</h3><p>'+esc(r.remedy||"")+'</p></div></details>';
        }).join('');
      }
    }
    h+='<h2>Owner complaints</h2>';
    if(com.error) h+='<div class="notice warn">Couldn\'t load complaints (offline and not saved yet).</div>';
    else {
      var c=com.data;
      if(com.cached) h+='<div class="notice warn">Showing saved data from '+CC.ago(com.ts)+'.</div>';
      if(!c.count) h+='<div class="notice ok">No complaints on file.</div>';
      else {
        h+='<div class="stat-grid"><div class="stat"><b>'+c.count.toLocaleString()+'</b><span>complaints</span></div><div class="stat"><b>'+c.crash+'</b><span>crashes</span></div><div class="stat"><b>'+c.fire+'</b><span>fires</span></div></div>'+
           '<h3>Most-reported problem areas</h3><div class="card">'+c.top.map(function(t){ var pct=Math.round(t[1]/c.count*100); return '<div style="margin:6px 0"><div style="display:flex;justify-content:space-between;font-size:.9rem"><span>'+esc(t[0])+'</span><b>'+t[1]+'</b></div><div class="progress"><i style="width:'+Math.max(2,pct)+'%"></i></div></div>'; }).join('')+'</div>'+
           '<h3>Recent reports</h3>'+c.recent.map(function(r){ return '<details><summary>'+esc(r.date||"")+' · '+esc((r.components||"").split(",")[0])+'</summary><div><p class="muted">'+esc(r.components||"")+'</p><p>'+esc(r.summary)+'…</p></div></details>'; }).join('');
      }
    }
    box.innerHTML=h;
  });
};
})();
