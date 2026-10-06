/* NHTSA vPIC + recalls/complaints clients with offline caching */
(function(){
var CC = window.CC = window.CC || {};
var VPIC="https://vpic.nhtsa.dot.gov/api/vehicles", API="https://api.nhtsa.gov";
var DAY=864e5;

function fetchJSON(url,ms){
  var ctl=("AbortController" in window)?new AbortController():null, timer;
  if(ctl) timer=setTimeout(function(){ctl.abort();},ms||20000);
  return fetch(url,{signal:ctl?ctl.signal:undefined}).then(function(r){
    if(timer) clearTimeout(timer);
    if(!r.ok) throw new Error("HTTP "+r.status);
    return r.json();
  },function(e){ if(timer) clearTimeout(timer); throw e; });
}
/* Try network, store in cache, else serve cache regardless of age. Returns {data, cached, ts} */
function cachedFetch(key,url,transform,maxAge){
  return CC.cache.get(key).then(function(rec){
    if(rec && maxAge && Date.now()-rec.ts<maxAge) return {data:rec.value,cached:true,ts:rec.ts};
    if(navigator.onLine===false && rec) return {data:rec.value,cached:true,ts:rec.ts,stale:true};
    return fetchJSON(url).then(function(j){
      var data=transform(j);
      CC.cache.set(key,data);
      return {data:data,cached:false,ts:Date.now()};
    }).catch(function(err){
      if(rec) return {data:rec.value,cached:true,ts:rec.ts,stale:true};
      throw err;
    });
  });
}
var N = CC.NHTSA = {
  /* All makes: [{id,name}] sorted. */
  makes:function(){
    return cachedFetch("makes",VPIC+"/GetAllMakes?format=json",function(j){
      return (j.Results||[]).map(function(m){return [m.Make_ID,m.Make_Name];});
    },30*DAY);
  },
  /* Models for make (by id if known, else by name) and year */
  models:function(make,year){
    var url, key;
    if(make.id){ url=VPIC+"/GetModelsForMakeIdYear/makeId/"+make.id+"/modelyear/"+year+"?format=json"; key="models:"+make.id+":"+year; }
    else { url=VPIC+"/GetModelsForMakeYear/make/"+encodeURIComponent(make.name)+"/modelyear/"+year+"?format=json"; key="models:n:"+make.name.toLowerCase()+":"+year; }
    return cachedFetch(key,url,function(j){
      var seen={}, out=[];
      (j.Results||[]).forEach(function(r){ var n=r.Model_Name; if(n&&!seen[n]){seen[n]=1;out.push(n);} });
      return out.sort();
    },30*DAY);
  },
  decodeVin:function(vin){
    vin=String(vin||"").trim().toUpperCase();
    if(!/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) return Promise.reject(new Error("A VIN is 17 letters/numbers (no I, O or Q)."));
    return fetchJSON(VPIC+"/DecodeVinValues/"+vin+"?format=json").then(function(j){
      var r=(j.Results&&j.Results[0])||{};
      if(!r.Make && !r.Model) throw new Error("VIN not recognised"+(r.ErrorText?": "+r.ErrorText.split(";")[0]:""));
      var engine=[r.DisplacementL?(+r.DisplacementL).toFixed(1)+"L":"", r.EngineCylinders?r.EngineCylinders+"-cyl":"", r.FuelTypePrimary||""].filter(Boolean).join(" ");
      return {vin:vin,year:r.ModelYear,make:titleCase(r.Make),model:r.Model,trim:[r.Trim,r.Series].filter(Boolean).join(" "),
        body:r.BodyClass,engine:engine,drive:r.DriveType,fuel:r.FuelTypePrimary,plant:[r.PlantCity,r.PlantCountry].filter(Boolean).join(", "),
        errorText:r.ErrorText};
    });
  },
  recalls:function(v){
    var q="make="+encodeURIComponent(v.make)+"&model="+encodeURIComponent(v.model)+"&modelYear="+encodeURIComponent(v.year);
    return cachedFetch("recalls:"+q,API+"/recalls/recallsByVehicle?"+q,function(j){
      return (j.results||j.Results||[]).map(function(r){return {
        id:r.NHTSACampaignNumber,date:r.ReportReceivedDate,component:r.Component,summary:r.Summary,consequence:r.Consequence,remedy:r.Remedy,
        manufacturer:r.Manufacturer,parkIt:!!r.parkIt,parkOutSide:!!r.parkOutSide,ota:!!r.overTheAirUpdate};});
    },DAY);
  },
  complaints:function(v){
    var q="make="+encodeURIComponent(v.make)+"&model="+encodeURIComponent(v.model)+"&modelYear="+encodeURIComponent(v.year);
    return cachedFetch("complaints:"+q,API+"/complaints/complaintsByVehicle?"+q,function(j){
      var res=j.results||[], comp={}, crash=0,fire=0,inj=0,death=0;
      res.forEach(function(c){
        if(c.crash) crash++; if(c.fire) fire++; inj+=c.numberOfInjuries||0; death+=c.numberOfDeaths||0;
        String(c.components||"").split(",").forEach(function(x){ x=x.trim(); if(x) comp[x]=(comp[x]||0)+1; });
      });
      var top=Object.keys(comp).map(function(k){return [k,comp[k]];}).sort(function(a,b){return b[1]-a[1];}).slice(0,8);
      var recent=res.slice().sort(function(a,b){ return dnum(b.dateComplaintFiled)-dnum(a.dateComplaintFiled); }).slice(0,8).map(function(c){return {
        odi:c.odiNumber,date:c.dateComplaintFiled,components:c.components,summary:String(c.summary||"").slice(0,500),crash:!!c.crash,fire:!!c.fire,injuries:c.numberOfInjuries||0};});
      return {count:j.count!=null?j.count:res.length,crash:crash,fire:fire,injuries:inj,deaths:death,top:top,recent:recent};
    },DAY);
  }
};
function dnum(s){ var m=/(\d\d)\/(\d\d)\/(\d{4})/.exec(s||""); return m? +(m[3]+m[1]+m[2]) : 0; }
function titleCase(s){ return String(s||"").toLowerCase().replace(/\b[a-z]/g,function(c){return c.toUpperCase();}); }
CC.titleCase=titleCase;
})();
