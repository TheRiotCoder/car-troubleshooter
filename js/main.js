/* Router, init, service worker registration */
(function(){
var CC = window.CC, $=CC.$;
var ctxCounter=0;

var routes=[
 [/^\/?$/, function(){ return {view:"garage",tab:"garage"}; }],
 [/^\/garage$/, function(){ return {view:"garage",tab:"garage"}; }],
 [/^\/vehicle\/new$/, function(){ return {view:"vehicleForm",tab:"garage"}; }],
 [/^\/vehicle\/([^\/]+)\/edit$/, function(m){ return {view:"vehicleForm",tab:"garage",id:m[1]}; }],
 [/^\/vehicle\/([^\/]+)$/, function(m){ return {view:"vehicle",tab:"garage",id:m[1]}; }],
 [/^\/recalls(?:\/([^\/]+))?$/, function(m){ return {view:"recalls",tab:"garage",id:m[1]}; }],
 [/^\/diagnose$/, function(){ return {view:"diagnose",tab:"diagnose"}; }],
 [/^\/diagnose\/([a-z]+)(?:\/([A-Za-z0-9_]+))?$/, function(m){ return {view:"diagStep",tab:"diagnose",cat:m[1],node:m[2]}; }],
 [/^\/ref(?:\/(lights|codes))?$/, function(m){ return {view:"ref",tab:"ref",tab2:m[1],tabName:m[1]}; }],
 [/^\/log$/, function(){ return {view:"log",tab:"log"}; }],
 [/^\/log\/new$/, function(){ return {view:"logForm",tab:"log"}; }],
 [/^\/log\/edit\/([^\/]+)$/, function(m){ return {view:"logForm",tab:"log",id:m[1]}; }],
 [/^\/log\/reminders$/, function(){ return {view:"reminders",tab:"log"}; }],
 [/^\/log\/intervals$/, function(){ return {view:"intervals",tab:"log"}; }],
 [/^\/settings$/, function(){ return {view:"settings",tab:"settings"}; }]
];

CC.route=function(){
  var raw=location.hash.replace(/^#/,"")||"/garage", qi=raw.indexOf("?"), path=qi>=0?raw.slice(0,qi):raw, qs=qi>=0?raw.slice(qi+1):"";
  var q={}; qs.split("&").forEach(function(p){ if(!p) return; var kv=p.split("="); try{ q[kv[0]]=decodeURIComponent((kv[1]||"").replace(/\+/g," ")); }catch(e){ q[kv[0]]=kv[1]; } });
  var hit=null;
  for(var i=0;i<routes.length;i++){ var m=routes[i][0].exec(path); if(m){ hit=routes[i][1](m); break; } }
  var el=$("#view");
  if(!hit){ CC.header("Not found"); el.innerHTML=CC.empty("🧭","Page not found","",'<a class="btn primary" href="#/garage">Go to garage</a>'); return; }
  CC.$$("#tabbar a").forEach(function(a){ a.classList.toggle("active",a.dataset.tab===hit.tab); });
  var ctx=Object.assign({el:el,q:q,tab:hit.tabName},hit);
  ctx.tab=hit.tabName||undefined; delete ctx.tabName; delete ctx.tab2;
  var fn=CC.views[hit.view];
  var tok=++ctxCounter;
  try{ fn(ctx); }catch(e){ console.error(e); el.innerHTML='<div class="notice bad">Something went wrong showing this page: '+CC.esc(e.message)+'</div>'; }
  if(tok===ctxCounter) { window.scrollTo(0,0); }
  document.body.dataset.route=hit.view;
};

function setOnline(){ $("#offline-bar").hidden=navigator.onLine!==false; }

function registerSW(){
  if(!("serviceWorker" in navigator)) return;
  var reloading=false;
  navigator.serviceWorker.register("sw.js").then(function(reg){
    reg.addEventListener("updatefound",function(){
      var nw=reg.installing; if(!nw) return;
      nw.addEventListener("statechange",function(){
        if(nw.state==="installed"&&navigator.serviceWorker.controller){
          CC.modal({title:"Update available",html:"<p>A new version of CarCare is ready.</p>",buttons:[{label:"Reload now",cls:"primary",onClick:function(){ nw.postMessage("skipWaiting"); }},{label:"Later"}]});
        }
      });
    });
  }).catch(function(e){ console.warn("SW registration failed",e); });
  navigator.serviceWorker.addEventListener("controllerchange",function(){ if(reloading||!window.__hadController) return; reloading=true; location.reload(); });
  window.__hadController=!!navigator.serviceWorker.controller;
}

function firstRunDisclaimer(){
  if(localStorage.getItem("cc.ack")) return;
  CC.modal({title:"Before you start",sticky:true,html:'<p><b>CarCare gives general guidance only.</b> It can\'t replace a qualified mechanic or your owner\'s manual. Never keep driving with brake, steering, fuel-leak, overheating, smoke or oil-pressure problems. Work on vehicles safely.</p><p class="muted">Your garage and service log are stored only on this device – use <b>More → Export</b> to back up.</p>',
    buttons:[{label:"I understand",cls:"primary",onClick:function(){ try{localStorage.setItem("cc.ack","1");}catch(e){} }}]});
}

function init(){
  CC.applyTheme();
  $("#back").onclick=function(){ var h=this.dataset.href; if(h) location.hash=h; else history.back(); };
  window.addEventListener("hashchange",CC.route);
  window.addEventListener("online",setOnline); window.addEventListener("offline",setOnline); setOnline();
  CC.install.init();
  registerSW();
  CC.loadVehicles().catch(function(e){ console.warn("DB error",e); CC.state.vehicles=[]; CC.toast("Storage unavailable – data won't be saved (private mode?)",6000); })
   .then(function(){ CC.route(); firstRunDisclaimer(); document.documentElement.classList.add("ready"); });
}
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",init); else init();
})();
