/* IndexedDB wrapper + localStorage settings. All data stays on-device. */
(function(){
var CC = window.CC = window.CC || {};
var DB_NAME="carcare", DB_VER=1, _db=null, memFallback=null;

function open(){
  if(_db) return Promise.resolve(_db);
  return new Promise(function(res,rej){
    if(!window.indexedDB){ rej(new Error("IndexedDB unavailable")); return; }
    var rq=indexedDB.open(DB_NAME,DB_VER);
    rq.onupgradeneeded=function(){
      var db=rq.result;
      if(!db.objectStoreNames.contains("vehicles")) db.createObjectStore("vehicles",{keyPath:"id"});
      if(!db.objectStoreNames.contains("logs")){ var s=db.createObjectStore("logs",{keyPath:"id"}); s.createIndex("vehicleId","vehicleId"); }
      if(!db.objectStoreNames.contains("photos")) db.createObjectStore("photos",{keyPath:"id"});
      if(!db.objectStoreNames.contains("cache")) db.createObjectStore("cache",{keyPath:"key"});
    };
    rq.onsuccess=function(){ _db=rq.result; _db.onversionchange=function(){_db.close();_db=null;}; res(_db); };
    rq.onerror=function(){ rej(rq.error); };
  });
}
function tx(store,mode,fn){
  return open().then(function(db){
    return new Promise(function(res,rej){
      var t=db.transaction(store,mode), s=t.objectStore(store), out;
      try{ out=fn(s); }catch(e){ rej(e); return; }
      t.oncomplete=function(){ res(out && "result" in out ? out.result : out); };
      t.onerror=function(){ rej(t.error); };
      t.onabort=function(){ rej(t.error||new Error("tx aborted")); };
    });
  });
}
var DB = CC.DB = {
  all:function(store){ return tx(store,"readonly",function(s){ return s.getAll(); }); },
  get:function(store,id){ return tx(store,"readonly",function(s){ return s.get(id); }); },
  put:function(store,obj){ return tx(store,"readwrite",function(s){ s.put(obj); }).then(function(){return obj;}); },
  del:function(store,id){ return tx(store,"readwrite",function(s){ s.delete(id); }); },
  clear:function(store){ return tx(store,"readwrite",function(s){ s.clear(); }); },
  byVehicle:function(vid){ return tx("logs","readonly",function(s){ return s.index("vehicleId").getAll(vid); }); }
};
CC.uid=function(){ return Date.now().toString(36)+Math.random().toString(36).slice(2,8); };

/* simple cached JSON with TTL stored in IndexedDB; falls back to localStorage if IDB not available */
CC.cache={
  get:function(key){
    return DB.get("cache",key).catch(function(){ try{var v=localStorage.getItem("cache:"+key);return v?JSON.parse(v):null;}catch(e){return null;} });
  },
  set:function(key,value){
    var rec={key:key,value:value,ts:Date.now()};
    return DB.put("cache",rec).catch(function(){ try{localStorage.setItem("cache:"+key,JSON.stringify(rec));}catch(e){} });
  }
};

/* settings in localStorage */
var DEFAULTS={theme:"auto",units:"mi",currency:"$",activeVehicle:"",installDismissed:0,intervals:{}};
CC.settings={
  get:function(){ try{ return Object.assign({},DEFAULTS,JSON.parse(localStorage.getItem("cc.settings")||"{}")); }catch(e){ return Object.assign({},DEFAULTS); } },
  set:function(patch){ var s=Object.assign(CC.settings.get(),patch); try{localStorage.setItem("cc.settings",JSON.stringify(s));}catch(e){} return s; }
};
})();
