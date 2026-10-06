/* Settings, backup (JSON/CSV export & import), install help */
(function(){
var CC = window.CC, esc=CC.esc, $=CC.$;
CC.views = CC.views || {};

var CSV_HEAD=["Vehicle","Year","Make","Model","Trim","VIN","Date","Mileage","Service Type","Custom Service Name","Cost","Done By","Shop","Notes"];

function stamp(){ return CC.today(); }

/* ---------- export ---------- */
CC.exportJSON=function(){
  return Promise.all([CC.DB.all("vehicles"),CC.DB.all("logs"),CC.DB.all("photos")]).then(function(r){
    return Promise.all(r[2].map(function(p){ return CC.blobToDataURL(p.blob).then(function(d){ return {id:p.id,data:d}; }); })).then(function(photos){
      var s=CC.settings.get();
      var data={app:"carcare",version:1,exportedAt:new Date().toISOString(),settings:{units:s.units,currency:s.currency,intervals:s.intervals},vehicles:r[0],logs:r[1],photos:photos};
      CC.download("carcare-backup-"+stamp()+".json","application/json",JSON.stringify(data,null,1));
      CC.toast("Backup exported ("+r[0].length+" vehicles, "+r[1].length+" entries)");
    });
  });
};
CC.exportCSV=function(vehicleId){
  return Promise.all([CC.DB.all("vehicles"),CC.DB.all("logs")]).then(function(r){
    var vm={}; r[0].forEach(function(v){vm[v.id]=v;});
    var logs=r[1].filter(function(l){return !vehicleId||l.vehicleId===vehicleId;}).sort(function(a,b){return (a.date||"").localeCompare(b.date||"");});
    var rows=[CSV_HEAD].concat(logs.map(function(l){ var v=vm[l.vehicleId]||{};
      var t=CC.SERVICE_TYPES.filter(function(x){return x[0]===l.type;})[0];
      return [CC.vehicleName(v),v.year,v.make,v.model,v.trim,v.vin,l.date,l.mileage,t?t[1]:l.type,l.customName,l.cost,l.who==="diy"?"DIY":"Shop",l.shop,l.notes]; }));
    var csv=rows.map(function(row){return row.map(CC.csvEscape).join(",");}).join("\r\n");
    var name="carcare-log"+(vehicleId&&vm[vehicleId]?"-"+(vm[vehicleId].make+"-"+vm[vehicleId].model).replace(/[^\w]+/g,"_"):"")+"-"+stamp()+".csv";
    CC.download(name,"text/csv;charset=utf-8","\uFEFF"+csv);
    CC.toast("CSV exported ("+logs.length+" entries)");
  });
};

/* ---------- import ---------- */
function importJSON(text,mode){
  var d; try{ d=JSON.parse(text); }catch(e){ throw new Error("That file isn't valid JSON."); }
  if(!d||d.app!=="carcare"||!Array.isArray(d.vehicles)||!Array.isArray(d.logs)) throw new Error("This doesn't look like a CarCare backup file.");
  var chain=Promise.resolve();
  if(mode==="replace") chain=Promise.all(["vehicles","logs","photos"].map(function(s){return CC.DB.clear(s);}));
  return chain.then(function(){
    var ps=[];
    d.vehicles.forEach(function(v){ if(v&&v.id) ps.push(CC.DB.put("vehicles",v)); });
    d.logs.forEach(function(l){ if(l&&l.id&&l.vehicleId) ps.push(CC.DB.put("logs",l)); });
    (d.photos||[]).forEach(function(p){ if(p&&p.id&&p.data) ps.push(CC.DB.put("photos",{id:p.id,blob:CC.dataURLToBlob(p.data),type:""})); });
    if(d.settings&&mode==="replace") CC.settings.set({units:d.settings.units||"mi",currency:d.settings.currency||"$",intervals:d.settings.intervals||{}});
    return Promise.all(ps);
  }).then(function(){ return CC.loadVehicles(); }).then(function(){ return {vehicles:d.vehicles.length,logs:d.logs.length}; });
}
function importCSV(text){
  var rows=CC.parseCSV(text); if(rows.length<2) throw new Error("CSV has no data rows.");
  var head=rows[0].map(function(h){return h.trim().toLowerCase();});
  function col(n){ return head.indexOf(n.toLowerCase()); }
  var ix={veh:col("Vehicle"),year:col("Year"),make:col("Make"),model:col("Model"),trim:col("Trim"),vin:col("VIN"),date:col("Date"),mil:col("Mileage"),type:col("Service Type"),cust:col("Custom Service Name"),cost:col("Cost"),who:col("Done By"),shop:col("Shop"),notes:col("Notes")};
  if(ix.date<0||ix.type<0) throw new Error("CSV needs at least 'Date' and 'Service Type' columns (use a CarCare CSV export as a template).");
  return Promise.all([CC.DB.all("vehicles"),CC.DB.all("logs")]).then(function(r){
    var vehicles=r[0].slice(), logs=r[1], added=0, skipped=0, newV=0, ps=[];
    var seen={}; logs.forEach(function(l){ seen[[l.vehicleId,l.date,l.mileage,l.type,l.cost].join("|")]=1; });
    var act=CC.activeVehicle();
    function get(row,i){ return i>=0&&row[i]!=null?String(row[i]).trim():""; }
    rows.slice(1).forEach(function(row){
      if(!row.join("").trim()) return;
      var vin=get(row,ix.vin).toUpperCase(), year=+get(row,ix.year)||null, make=get(row,ix.make), model=get(row,ix.model), vname=get(row,ix.veh);
      var v=null;
      if(vin) v=vehicles.filter(function(x){return x.vin&&x.vin===vin;})[0];
      if(!v&&make&&model) v=vehicles.filter(function(x){return x.make.toLowerCase()===make.toLowerCase()&&x.model.toLowerCase()===model.toLowerCase()&&(!year||x.year===year)&&(!vname||CC.vehicleName(x)===vname||!x.nickname);})[0];
      if(!v&&!make&&!model){ v=act||vehicles[0]; }
      if(!v){
        if(!make||!model) { skipped++; return; }
        v={id:CC.uid(),year:year||new Date().getFullYear(),make:make,model:model,trim:get(row,ix.trim),vin:vin,nickname:(vname&&vname!==[year,make,model].filter(Boolean).join(" "))?vname:"",odometer:null,createdAt:Date.now()+newV};
        vehicles.push(v); newV++; ps.push(CC.DB.put("vehicles",v));
      }
      var date=get(row,ix.date); if(!/^\d{4}-\d{2}-\d{2}$/.test(date)){ var d=new Date(date); if(isNaN(d)){skipped++;return;} date=d.getFullYear()+"-"+("0"+(d.getMonth()+1)).slice(-2)+"-"+("0"+d.getDate()).slice(-2); }
      var tname=get(row,ix.type), t=CC.SERVICE_TYPES.filter(function(x){return x[0]===tname.toLowerCase()||x[1].toLowerCase()===tname.toLowerCase();})[0];
      var type=t?t[0]:"custom", custom=t&&t[0]!=="custom"?"":(get(row,ix.cust)||tname);
      var mil=get(row,ix.mil).replace(/[, ]/g,""), cost=get(row,ix.cost).replace(/[^0-9.\-]/g,"");
      var rec={id:CC.uid(),vehicleId:v.id,date:date,mileage:mil===""?null:+mil,type:type,customName:custom,cost:cost===""?0:+cost,who:/diy/i.test(get(row,ix.who))?"diy":"shop",shop:get(row,ix.shop),notes:get(row,ix.notes),updatedAt:Date.now()};
      var key=[rec.vehicleId,rec.date,rec.mileage,rec.type,rec.cost].join("|");
      if(seen[key]){ skipped++; return; } seen[key]=1;
      ps.push(CC.DB.put("logs",rec)); added++;
      if(rec.mileage&&rec.mileage>(v.odometer||0)){ v.odometer=rec.mileage; ps.push(CC.DB.put("vehicles",v)); }
    });
    return Promise.all(ps).then(function(){ return CC.loadVehicles(); }).then(function(){ return {added:added,skipped:skipped,newVehicles:newV}; });
  });
}
function pickFile(accept){
  return new Promise(function(res){
    var i=document.createElement("input"); i.type="file"; i.accept=accept; i.style.display="none"; document.body.appendChild(i);
    i.onchange=function(){ var f=i.files[0]; i.remove(); res(f||null); };
    i.addEventListener("cancel",function(){ i.remove(); res(null); });
    i.click();
  });
}
function doImportJSON(){
  pickFile("application/json,.json").then(function(f){
    if(!f) return; return CC.readFile(f).then(function(text){
      CC.modal({title:"Import backup",html:'<p><b>Merge</b> adds the backup\'s vehicles and entries to what\'s already here (same IDs are overwritten).</p><p><b>Replace</b> erases everything on this device first.</p>',buttons:[
        {label:"Merge",cls:"primary",onClick:function(){ importJSON(text,"merge").then(function(r){ CC.toast("Imported "+r.vehicles+" vehicles, "+r.logs+" entries"); CC.route(); }).catch(function(e){ CC.toast(e.message,4500); }); }},
        {label:"Replace everything",cls:"danger",onClick:function(){ importJSON(text,"replace").then(function(r){ CC.toast("Restored "+r.vehicles+" vehicles, "+r.logs+" entries"); CC.route(); }).catch(function(e){ CC.toast(e.message,4500); }); }},
        {label:"Cancel"}]});
    });
  }).catch(function(e){ CC.toast(e.message); });
}
function doImportCSV(){
  pickFile("text/csv,.csv").then(function(f){
    if(!f) return; return CC.readFile(f).then(function(t){ return importCSV(t); }).then(function(r){ CC.toast("Imported "+r.added+" entries"+(r.newVehicles?", "+r.newVehicles+" new vehicle(s)":"")+(r.skipped?" ("+r.skipped+" skipped)":""),4500); CC.route(); });
  }).catch(function(e){ CC.toast(e.message,5000); });
}
CC._importJSON=importJSON; CC._importCSV=importCSV;

/* ---------- install ---------- */
CC.install={
  deferred:null,
  isStandalone:function(){ return (window.matchMedia&&matchMedia("(display-mode: standalone)").matches)||window.navigator.standalone===true; },
  isIOS:function(){ return /iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1); },
  iosHelp:function(){
    CC.modal({title:"Install on iPhone / iPad",html:'<ol class="tips" style="padding-left:22px"><li>Open this page in <b>Safari</b>.</li><li>Tap the <b>Share</b> button <span aria-hidden="true" style="font-size:1.2em">⬆️</span> (square with an arrow) in the toolbar.</li><li>Scroll down and tap <b>Add to Home Screen</b>.</li><li>Tap <b>Add</b>. CarCare now opens full-screen like an app and works offline.</li></ol><p class="muted">Tip: your data is stored in this browser/app on your device. Export a backup from <b>More</b> now and then.</p>',buttons:[{label:"Got it",cls:"primary"}]});
  },
  prompt:function(){
    if(CC.install.isIOS()&&!CC.install.deferred){ CC.install.iosHelp(); return Promise.resolve(); }
    if(CC.install.deferred){ var d=CC.install.deferred; d.prompt(); return d.userChoice.then(function(c){ CC.install.deferred=null; CC.install.hideBanner(); if(c.outcome==="accepted") CC.toast("Installing…"); }); }
    if(CC.install.isIOS()) { CC.install.iosHelp(); return Promise.resolve(); }
    CC.modal({title:"Install CarCare",html:'<p>Use your browser menu: <b>⋮ → Install app</b> / <b>Add to Home screen</b> (Chrome, Edge, Samsung Internet), or <b>Share → Add to Home Screen</b> (Safari).</p>',buttons:[{label:"OK",cls:"primary"}]});
    return Promise.resolve();
  },
  hideBanner:function(){ $("#install-banner").hidden=true; document.body.classList.remove("has-banner"); },
  showBanner:function(){
    if(CC.install.isStandalone()) return;
    var s=CC.settings.get(); if(s.installDismissed&&Date.now()-s.installDismissed<14*864e5) return;
    var ios=CC.install.isIOS(); if(!ios&&!CC.install.deferred) return;
    $("#install-sub").textContent=ios?"Tap Install for Share → Add to Home Screen steps.":"Add it to your home screen for quick, offline access.";
    $("#install-banner").hidden=false; document.body.classList.add("has-banner");
  },
  init:function(){
    window.addEventListener("beforeinstallprompt",function(e){ e.preventDefault(); CC.install.deferred=e; setTimeout(CC.install.showBanner,1200); });
    window.addEventListener("appinstalled",function(){ CC.install.deferred=null; CC.install.hideBanner(); CC.toast("CarCare installed 🎉"); });
    $("#install-btn").onclick=function(){ CC.install.prompt(); };
    $("#install-dismiss").onclick=function(){ CC.settings.set({installDismissed:Date.now()}); CC.install.hideBanner(); };
    if(CC.install.isIOS()) setTimeout(CC.install.showBanner,2500);
  }
};

/* ---------- settings page ---------- */
CC.views.settings=function(ctx){
  CC.header("More");
  var s=CC.settings.get(), v=CC.activeVehicle();
  var installed=CC.install.isStandalone();
  function sel(id,opts,cur){ return '<select id="'+id+'">'+opts.map(function(o){return '<option value="'+o[0]+'"'+(o[0]===cur?' selected':'')+'>'+esc(o[1])+'</option>';}).join('')+'</select>'; }
  ctx.el.innerHTML=
   '<div class="card"><h3>Appearance &amp; units</h3>'+
    '<label for="s-theme">Theme</label>'+sel("s-theme",[["auto","Match device"],["light","Light"],["dark","Dark"]],s.theme)+
    '<label for="s-units">Distance units</label>'+sel("s-units",[["mi","Miles"],["km","Kilometers"]],s.units)+
    '<label for="s-cur">Currency symbol</label>'+sel("s-cur",[["$","$ Dollar"],["€","€ Euro"],["£","£ Pound"],["¥","¥ Yen/Yuan"],["₹","₹ Rupee"],["R$","R$ Real"],["kr","kr Krona"],["CHF","CHF Franc"]],s.currency)+
    '<p class="muted" style="font-size:.82rem">Changing units only changes labels and reminder intervals – existing mileages aren\'t converted.</p></div>'+
   (installed?'':'<div class="card"><h3>Install app</h3><p>Add CarCare to your home screen for a full-screen, offline-ready app.</p><button class="btn primary block" id="s-install">Install CarCare</button></div>')+
   '<div class="card"><h3>Backup &amp; restore</h3><p class="muted">All your data lives only on this device. Export backups regularly – clearing browser data or uninstalling can erase it.</p>'+
    '<div class="btn-row"><button class="btn" id="x-json">⬇️ Export JSON (full backup)</button><button class="btn" id="i-json">⬆️ Import JSON</button></div>'+
    '<div class="btn-row"><button class="btn" id="x-csv-v"'+(v?'':' disabled')+'>⬇️ CSV – this vehicle</button><button class="btn" id="x-csv">⬇️ CSV – all vehicles</button></div>'+
    '<div class="btn-row"><button class="btn" id="i-csv">⬆️ Import CSV</button></div>'+
    '<div id="storage" class="muted" style="font-size:.85rem"></div></div>'+
   '<div class="card"><h3>Data sources &amp; offline</h3><p>Vehicle makes/models, VIN decoding, recalls and complaints come from the free <a href="https://vpic.nhtsa.dot.gov/api/" target="_blank" rel="noopener">NHTSA APIs</a> and are cached on your device after first use. Guides, warning lights, OBD-II codes and your log work fully offline.</p>'+
    '<button class="btn block" id="s-refresh">Refresh app files</button></div>'+
   '<div class="card"><h3>Danger zone</h3><button class="btn danger block" id="s-wipe">Erase all data on this device…</button></div>'+
   CC.disclaimer()+'<p class="muted" style="text-align:center">CarCare v'+CC.VERSION+'</p>';
  $("#s-theme").onchange=function(){ CC.settings.set({theme:this.value}); CC.applyTheme(); };
  $("#s-units").onchange=function(){ CC.settings.set({units:this.value}); CC.toast("Units updated"); };
  $("#s-cur").onchange=function(){ CC.settings.set({currency:this.value}); };
  var ib=$("#s-install"); if(ib) ib.onclick=function(){ CC.install.prompt(); };
  $("#x-json").onclick=function(){ CC.exportJSON().catch(function(e){CC.toast("Export failed: "+e.message);}); };
  $("#i-json").onclick=doImportJSON;
  $("#x-csv").onclick=function(){ CC.exportCSV().catch(function(e){CC.toast("Export failed: "+e.message);}); };
  $("#x-csv-v").onclick=function(){ if(v) CC.exportCSV(v.id).catch(function(e){CC.toast("Export failed: "+e.message);}); };
  $("#i-csv").onclick=doImportCSV;
  $("#s-refresh").onclick=function(){
    if(!("serviceWorker" in navigator)) return CC.toast("Not supported here");
    navigator.serviceWorker.getRegistration().then(function(r){ if(!r) return CC.toast("No service worker"); return r.update().then(function(){ CC.toast("Checked for updates"); }); });
  };
  $("#s-wipe").onclick=function(){
    CC.confirm("This permanently deletes ALL vehicles, service entries, photos and settings on this device. This cannot be undone.","Erase everything",true,"Erase all data?").then(function(ok){
      if(!ok) return;
      Promise.all(["vehicles","logs","photos","cache"].map(function(x){return CC.DB.clear(x);})).then(function(){ localStorage.removeItem("cc.settings"); CC.applyTheme(); return CC.loadVehicles(); }).then(function(){ CC.toast("All data erased"); location.hash="#/garage"; });
    });
  };
  var st=$("#storage");
  if(navigator.storage&&navigator.storage.estimate){
    navigator.storage.estimate().then(function(e){ st.textContent="Storage used: "+((e.usage||0)/1048576).toFixed(1)+" MB"; });
    if(navigator.storage.persist) navigator.storage.persisted().then(function(p){
      if(!p){ st.insertAdjacentHTML("beforeend",' · <a href="#" id="persist">Ask browser to keep my data</a>'); $("#persist").onclick=function(e){ e.preventDefault(); navigator.storage.persist().then(function(g){ CC.toast(g?"Storage protected":"Browser declined (install the app to improve odds)"); }); }; }
      else st.insertAdjacentHTML("beforeend"," · protected ✔");
    });
  }
};
})();
