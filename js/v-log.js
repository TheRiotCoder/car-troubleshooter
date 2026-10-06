/* Service log: list, add/edit, reminders, totals */
(function(){
var CC = window.CC, esc=CC.esc, $=CC.$;
CC.views = CC.views || {};
var KM=1.609344;

CC.typeLabel=function(l){
  if(l.type==="custom") return l.customName||"Custom";
  var t=CC.SERVICE_TYPES.filter(function(x){return x[0]===l.type;})[0]; return t?t[1]:(l.customName||l.type||"Service");
};
function toUnit(mi){ return CC.unit()==="km"?Math.round(mi*KM/100)*100:mi; }
function fromUnit(v){ return CC.unit()==="km"?Math.round(v/KM):v; }
CC.intervalFor=function(t){ // returns {mi (in current unit), mo}
  var ov=(CC.settings.get().intervals||{})[t[0]];
  var mi=ov&&ov.mi!=null?ov.mi:t[2], mo=ov&&ov.mo!=null?ov.mo:t[3];
  return {mi:mi?toUnit(mi):0,mo:mo};
};
CC.currentOdo=function(v,logs){
  var m=v.odometer||0; (logs||[]).forEach(function(l){ if(l.mileage>m) m=l.mileage; }); return m;
};
/* compute reminders for vehicle: returns [{type,label,status,nextMi,nextDate,last,remainMi,remainDays}] */
CC.computeReminders=function(v,logs){
  var odo=CC.currentOdo(v,logs), today=CC.today(), warnMi=CC.unit()==="km"?800:500, out=[];
  CC.SERVICE_TYPES.forEach(function(t){
    var iv=CC.intervalFor(t); if(!iv.mi&&!iv.mo) return;
    var last=logs.filter(function(l){return l.type===t[0];}).sort(function(a,b){return (b.date||"").localeCompare(a.date||"")||(b.mileage||0)-(a.mileage||0);})[0];
    if(!last){ out.push({type:t[0],label:t[1],status:"none",iv:iv}); return; }
    var nextMi=iv.mi&&last.mileage!=null&&last.mileage!==""?(+last.mileage)+iv.mi:null;
    var nextDate=iv.mo&&last.date?CC.addMonths(last.date,iv.mo):null;
    var remMi=nextMi!=null&&odo?nextMi-odo:null, remDays=nextDate?CC.daysBetween(today,nextDate):null;
    var status="ok";
    if((remMi!=null&&remMi<=0)||(remDays!=null&&remDays<=0)) status="overdue";
    else if((remMi!=null&&remMi<=warnMi)||(remDays!=null&&remDays<=30)) status="soon";
    out.push({type:t[0],label:t[1],status:status,nextMi:nextMi,nextDate:nextDate,last:last,remMi:remMi,remDays:remDays,iv:iv});
  });
  var rank={overdue:0,soon:1,ok:2,none:3};
  out.sort(function(a,b){ return rank[a.status]-rank[b.status] || ((a.remDays==null?9e9:a.remDays)-(b.remDays==null?9e9:b.remDays)); });
  return out;
};
function remText(r){
  var parts=[];
  if(r.remMi!=null) parts.push(r.remMi<=0?CC.fmtNum(-r.remMi)+" "+CC.unit()+" overdue":"in "+CC.fmtNum(r.remMi)+" "+CC.unit());
  if(r.remDays!=null){ var d=r.remDays; parts.push(d<=0?Math.abs(d)+" days overdue":d<=60?"in "+d+" days":"by "+CC.fmtDate(r.nextDate)); }
  return parts.join(" · ");
}
function remRow(r){
  var b=r.status==="overdue"?'<span class="badge bad">Overdue</span>':r.status==="soon"?'<span class="badge warn">Due soon</span>':r.status==="ok"?'<span class="badge ok">OK</span>':'<span class="badge gray">No record</span>';
  return '<div class="card" style="margin:6px 0;padding:10px 12px"><div style="display:flex;justify-content:space-between;gap:8px;align-items:center"><b>'+esc(r.label)+'</b>'+b+'</div>'+
    (r.status==="none"?'<small class="muted">Every '+[r.iv.mi?CC.fmtNum(r.iv.mi)+" "+CC.unit():"",r.iv.mo?(r.iv.mo%12===0?(r.iv.mo/12)+" yr":r.iv.mo+" mo"):""].filter(Boolean).join(" / ")+' · <a href="#/log/new?type='+r.type+'">log it now</a></small>':
     '<small class="muted">'+esc(remText(r))+' · last: '+esc(CC.fmtDate(r.last.date))+(r.last.mileage?' @ '+CC.fmtNum(r.last.mileage):'')+'</small>')+'</div>';
}

function noVehicle(ctx,title){
  CC.header(title);
  ctx.el.innerHTML=CC.empty("🚗","Add a vehicle first","The service log is kept per vehicle.",'<a class="btn primary" href="#/vehicle/new">Add vehicle</a>');
}

CC.views.log=function(ctx){
  var v=CC.activeVehicle(); if(!v) return noVehicle(ctx,"Service log");
  CC.header("Service log");
  CC.DB.byVehicle(v.id).then(function(logs){
    logs.sort(function(a,b){return (b.date||"").localeCompare(a.date||"")||(b.mileage||0)-(a.mileage||0);});
    var rem=CC.computeReminders(v,logs), due=rem.filter(function(r){return r.status==="overdue"||r.status==="soon";});
    var total=0,year=0,diy=0,shop=0,thisY=String(new Date().getFullYear()), byType={};
    logs.forEach(function(l){ var c=+l.cost||0; total+=c; if((l.date||"").slice(0,4)===thisY) year+=c; if(l.who==="diy") diy+=c; else shop+=c; var k=CC.typeLabel(l); byType[k]=(byType[k]||0)+c; });
    var odo=CC.currentOdo(v,logs);
    var h='<div class="card"><b>'+esc(CC.vehicleFull(v))+'</b><div class="muted">'+(odo?CC.fmtNum(odo)+' '+CC.unit():'Set your odometer in the vehicle page for accurate reminders')+'</div></div>'+
     '<div class="stat-grid"><div class="stat"><b>'+CC.money(total)+'</b><span>total spent</span></div><div class="stat"><b>'+CC.money(year)+'</b><span>this year</span></div><div class="stat"><b>'+logs.length+'</b><span>entries</span></div></div>'+
     '<a class="btn primary block" href="#/log/new">＋ Add service entry</a>'+
     '<h2>Upcoming service</h2>'+
     (due.length?due.slice(0,4).map(remRow).join(''):'<div class="notice ok">✅ Nothing due right now'+(rem.some(function(r){return r.status==="none";})?' – log past services to start tracking.':'.')+'</div>')+
     '<div class="btn-row"><a class="btn small" href="#/log/reminders">All reminders</a><a class="btn small" href="#/log/intervals">Edit intervals</a></div>'+
     '<h2>History</h2>';
    if(!logs.length) h+=CC.empty("📒","No entries yet","Log oil changes, repairs, tires and more.");
    else h+='<div class="list">'+logs.map(function(l){
      return '<button class="row-btn log-item" data-id="'+esc(l.id)+'"><span class="ico">'+(l.who==="diy"?"🧰":"🏪")+'</span><span class="grow"><b>'+esc(CC.typeLabel(l))+'</b><span>'+esc(CC.fmtDate(l.date))+(l.mileage!=null&&l.mileage!==""?' · '+CC.fmtNum(l.mileage)+' '+CC.unit():'')+(l.shop?' · '+esc(l.shop):'')+(l.photoId?' · 📷':'')+'</span></span><span class="cost">'+(l.cost?CC.money(l.cost):'—')+'</span></button>';
    }).join('')+'</div>';
    if(logs.length){
      h+='<details><summary>Spending breakdown</summary><div><dl class="kv"><dt>At a shop</dt><dd>'+CC.money(shop)+'</dd><dt>DIY</dt><dd>'+CC.money(diy)+'</dd></dl><hr style="border:0;border-top:1px solid var(--border)"><dl class="kv">'+
        Object.keys(byType).sort(function(a,b){return byType[b]-byType[a];}).map(function(k){return '<dt>'+esc(k)+'</dt><dd>'+CC.money(byType[k])+'</dd>';}).join('')+'</dl></div></details>';
    }
    ctx.el.innerHTML=h;
    CC.$$(".log-item",ctx.el).forEach(function(b){ b.onclick=function(){ showEntry(logs.filter(function(l){return l.id===b.dataset.id;})[0]); }; });
  });
};

function showEntry(l){
  var urlToRevoke=null;
  var rows='<dl class="kv"><dt>Date</dt><dd>'+esc(CC.fmtDate(l.date))+'</dd>'+(l.mileage!=null&&l.mileage!==""?'<dt>Mileage</dt><dd>'+CC.fmtNum(l.mileage)+' '+CC.unit()+'</dd>':'')+
   '<dt>Cost</dt><dd>'+(l.cost?CC.money(l.cost):'—')+'</dd><dt>Done by</dt><dd>'+(l.who==="diy"?"DIY":"Shop"+(l.shop?" – "+esc(l.shop):""))+'</dd></dl>'+(l.notes?'<p style="white-space:pre-wrap">'+esc(l.notes)+'</p>':'')+'<div id="ph"></div>';
  CC.modal({title:CC.typeLabel(l),html:rows,onOpen:function(back){
    if(l.photoId) CC.DB.get("photos",l.photoId).then(function(p){ if(p&&p.blob){ urlToRevoke=URL.createObjectURL(p.blob); $("#ph",back).innerHTML='<img class="thumb" alt="Receipt photo" src="'+urlToRevoke+'">'; } });
  },buttons:[
    {label:"Edit",cls:"primary",onClick:function(){ location.hash="#/log/edit/"+l.id; }},
    {label:"Delete",cls:"danger",onClick:function(){ CC.confirm("Delete this entry"+(l.photoId?" and its receipt photo":"")+"?","Delete",true).then(function(ok){ if(!ok) return; Promise.all([CC.DB.del("logs",l.id),l.photoId?CC.DB.del("photos",l.photoId):null]).then(function(){ CC.toast("Entry deleted"); CC.route(); }); }); }},
    {label:"Close"}]});
}

CC.views.logForm=function(ctx){
  var existing=ctx.id?null:null, loadP;
  loadP=ctx.id?CC.DB.get("logs",ctx.id):Promise.resolve(null);
  loadP.then(function(ex){
    if(ctx.id&&!ex){ CC.header("Entry","#/log"); ctx.el.innerHTML=CC.empty("❓","Entry not found","",'<a class="btn" href="#/log">Back</a>'); return; }
    var l=ex||{}, q=ctx.q||{};
    var v=ex?CC.getVehicle(ex.vehicleId):CC.activeVehicle();
    if(!v&&!CC.state.vehicles.length) return noVehicle(ctx,"Add entry");
    v=v||CC.activeVehicle()||CC.state.vehicles[0];
    CC.header(ex?"Edit entry":"Add service","#/log");
    var typeVal=l.type||q.type||"oil";
    var vopts=CC.state.vehicles.map(function(x){return '<option value="'+esc(x.id)+'"'+(x.id===v.id?' selected':'')+'>'+esc(CC.vehicleName(x))+'</option>';}).join('');
    var topts=CC.SERVICE_TYPES.map(function(t){return '<option value="'+t[0]+'"'+(t[0]===typeVal?' selected':'')+'>'+esc(t[1])+'</option>';}).join('');
    ctx.el.innerHTML='<form id="lf" novalidate>'+
     (CC.state.vehicles.length>1?'<label for="lv">Vehicle</label><select id="lv">'+vopts+'</select>':'<input type="hidden" id="lv" value="'+esc(v.id)+'">')+
     '<div class="grid2"><div><label for="ld">Date</label><input id="ld" type="date" required value="'+esc(l.date||CC.today())+'"></div>'+
     '<div><label for="lm">Mileage ('+CC.unit()+')</label><input id="lm" type="number" inputmode="numeric" min="0" value="'+(l.mileage!=null?esc(l.mileage):(v.odometer!=null?esc(v.odometer):""))+'"></div></div>'+
     '<label for="lt">Service type</label><select id="lt">'+topts+'</select>'+
     '<div id="cust-wrap" '+(typeVal==="custom"?'':'hidden')+'><label for="lc">Custom service name</label><input id="lc" placeholder="e.g. Headlight bulb" value="'+esc(l.customName||"")+'"></div>'+
     '<div class="grid2"><div><label for="lcost">Cost ('+esc(CC.settings.get().currency)+')</label><input id="lcost" type="number" inputmode="decimal" min="0" step="0.01" value="'+(l.cost!=null&&l.cost!==""?esc(l.cost):"")+'"></div>'+
     '<div><label for="lw">Done by</label><select id="lw"><option value="shop"'+(l.who!=="diy"?' selected':'')+'>Shop / dealer</option><option value="diy"'+(l.who==="diy"?' selected':'')+'>DIY</option></select></div></div>'+
     '<div id="shop-wrap" '+(l.who==="diy"?'hidden':'')+'><label for="ls">Shop name</label><input id="ls" placeholder="e.g. Joe\'s Garage" value="'+esc(l.shop||"")+'"></div>'+
     '<label for="ln">Notes</label><textarea id="ln" placeholder="Parts used, oil grade, observations…">'+esc(l.notes||q.note||"")+'</textarea>'+
     '<label for="lp">Receipt photo <small>(optional)</small></label><input id="lp" type="file" accept="image/*"><div id="pv"></div>'+
     '<div id="lerr" class="notice bad" hidden></div>'+
     '<div class="btn-row"><button type="submit" class="btn primary">'+(ex?"Save changes":"Save entry")+'</button><a class="btn" href="#/log">Cancel</a></div></form>';
    var newBlob=null, removePhoto=false, pvUrl=null;
    function showPv(blob){ if(pvUrl) URL.revokeObjectURL(pvUrl); if(!blob){ $("#pv").innerHTML=''; return; } pvUrl=URL.createObjectURL(blob); $("#pv").innerHTML='<img class="thumb" alt="Receipt preview" src="'+pvUrl+'"><button type="button" class="btn small danger" id="rmph" style="margin-top:8px">Remove photo</button>'; $("#rmph").onclick=function(){ newBlob=null; removePhoto=true; $("#lp").value=""; showPv(null); }; }
    if(ex&&ex.photoId) CC.DB.get("photos",ex.photoId).then(function(p){ if(p&&!newBlob&&!removePhoto) showPv(p.blob); });
    $("#lt").onchange=function(){ $("#cust-wrap").hidden=this.value!=="custom"; };
    $("#lw").onchange=function(){ $("#shop-wrap").hidden=this.value==="diy"; };
    $("#lp").onchange=function(){ var f=this.files[0]; if(!f) return; CC.shrinkImage(f).then(function(b){ newBlob=b; removePhoto=false; showPv(b); }); };
    $("#lf").onsubmit=function(e){
      e.preventDefault(); var err=$("#lerr"); err.hidden=true;
      var date=$("#ld").value, type=$("#lt").value, cust=$("#lc").value.trim();
      if(!date){ err.textContent="Please enter a date."; err.hidden=false; return; }
      if(type==="custom"&&!cust){ err.textContent="Please name the custom service."; err.hidden=false; return; }
      var rec=Object.assign({},ex||{},{id:ex?ex.id:CC.uid(),vehicleId:$("#lv").value,date:date,mileage:$("#lm").value===""?null:+$("#lm").value,type:type,customName:type==="custom"?cust:"",
        cost:$("#lcost").value===""?0:+$("#lcost").value,who:$("#lw").value,shop:$("#lw").value==="shop"?$("#ls").value.trim():"",notes:$("#ln").value.trim(),updatedAt:Date.now()});
      var chain=Promise.resolve();
      if(newBlob){ var pid=(ex&&ex.photoId)||CC.uid(); rec.photoId=pid; chain=CC.DB.put("photos",{id:pid,blob:newBlob,type:newBlob.type}); }
      else if(removePhoto&&ex&&ex.photoId){ chain=CC.DB.del("photos",ex.photoId); rec.photoId=""; }
      chain.then(function(){ return CC.DB.put("logs",rec); }).then(function(){
        var veh=CC.getVehicle(rec.vehicleId);
        if(veh&&rec.mileage!=null&&rec.mileage>(veh.odometer||0)){ veh.odometer=rec.mileage; return CC.DB.put("vehicles",veh).then(CC.loadVehicles); }
      }).then(function(){ if(pvUrl) URL.revokeObjectURL(pvUrl); CC.toast(ex?"Entry updated":"Entry saved"); location.hash="#/log"; })
       .catch(function(er){ err.textContent="Could not save: "+er.message+(/quota/i.test(er.message)?" (storage is full – remove the photo)":""); err.hidden=false; });
    };
  });
};

CC.views.reminders=function(ctx){
  var v=CC.activeVehicle(); if(!v) return noVehicle(ctx,"Reminders");
  CC.header("Reminders","#/log");
  CC.DB.byVehicle(v.id).then(function(logs){
    var rem=CC.computeReminders(v,logs), odo=CC.currentOdo(v,logs);
    var tracked=rem.filter(function(r){return r.status!=="none";}), none=rem.filter(function(r){return r.status==="none";});
    ctx.el.innerHTML='<div class="card"><b>'+esc(CC.vehicleFull(v))+'</b><div class="muted">Odometer: '+(odo?CC.fmtNum(odo)+' '+CC.unit():'not set')+'</div></div>'+
      '<p class="muted">Reminders are based on your last logged entry of each type plus the interval (miles/km and/or months). Intervals are general guides – follow your owner\'s manual.</p>'+
      (tracked.length?tracked.map(remRow).join(''):'<div class="notice info">Nothing tracked yet – add log entries to begin.</div>')+
      (none.length?'<details><summary>Not tracked yet ('+none.length+')</summary><div>'+none.map(remRow).join('')+'</div></details>':'')+
      '<div class="btn-row"><a class="btn" href="#/log/intervals">Edit intervals</a><a class="btn primary" href="#/log/new">＋ Add entry</a></div>';
  });
};

CC.views.intervals=function(ctx){
  CC.header("Reminder intervals","#/log/reminders");
  var u=CC.unit();
  ctx.el.innerHTML='<p class="muted">Set how often each service is due. Leave a field at 0 to ignore that measure. Distances are in '+u+'.</p><form id="iv">'+
    CC.SERVICE_TYPES.filter(function(t){return t[0]!=="custom"&&t[0]!=="repair"&&t[0]!=="detail";}).map(function(t){
      var iv=CC.intervalFor(t);
      return '<div class="card" style="margin:8px 0"><b>'+esc(t[1])+'</b><div class="grid2"><div><label for="mi-'+t[0]+'">Every ('+u+')</label><input id="mi-'+t[0]+'" data-k="'+t[0]+'" data-f="mi" type="number" inputmode="numeric" min="0" value="'+iv.mi+'"></div><div><label for="mo-'+t[0]+'">Every (months)</label><input id="mo-'+t[0]+'" data-k="'+t[0]+'" data-f="mo" type="number" inputmode="numeric" min="0" value="'+iv.mo+'"></div></div></div>';
    }).join('')+'<div class="btn-row"><button class="btn primary" type="submit">Save</button><button type="button" class="btn" id="iv-reset">Reset to defaults</button></div></form>';
  $("#iv").onsubmit=function(e){
    e.preventDefault(); var ov={};
    CC.$$("#iv input").forEach(function(i){ var k=i.dataset.k; ov[k]=ov[k]||{}; var n=Math.max(0,+i.value||0); ov[k][i.dataset.f]=i.dataset.f==="mi"?fromUnit(n):n; });
    CC.settings.set({intervals:ov}); CC.toast("Intervals saved"); location.hash="#/log/reminders";
  };
  $("#iv-reset").onclick=function(){ CC.settings.set({intervals:{}}); CC.toast("Defaults restored"); CC.route(); };
};
})();
