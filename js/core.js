/* Core helpers: DOM, formatting, modal/toast, vehicle state, combo box, file helpers */
(function(){
var CC = window.CC = window.CC || {};
CC.VERSION="1.0.0";
CC.$=function(s,r){return (r||document).querySelector(s);};
CC.$$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s));};
CC.esc=function(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});};
var esc=CC.esc;

/* ---------- formatting ---------- */
CC.today=function(){ var d=new Date(); return d.getFullYear()+"-"+p2(d.getMonth()+1)+"-"+p2(d.getDate()); };
function p2(n){return n<10?"0"+n:""+n;}
CC.fmtDate=function(iso){ if(!iso) return ""; var p=iso.split("-"); if(p.length<3) return iso; var d=new Date(+p[0],+p[1]-1,+p[2]); return d.toLocaleDateString(undefined,{year:"numeric",month:"short",day:"numeric"}); };
CC.fmtNum=function(n){ return (n==null||n==="")?"":Number(n).toLocaleString(); };
CC.money=function(n){ var c=CC.settings.get().currency; var v=Number(n)||0; return c+v.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}); };
CC.unit=function(){ return CC.settings.get().units; };
CC.addMonths=function(iso,m){ var p=iso.split("-"); var d=new Date(+p[0],+p[1]-1+m,+p[2]); return d.getFullYear()+"-"+p2(d.getMonth()+1)+"-"+p2(d.getDate()); };
CC.daysBetween=function(a,b){ var pa=a.split("-"),pb=b.split("-"); return Math.round((new Date(+pb[0],+pb[1]-1,+pb[2])-new Date(+pa[0],+pa[1]-1,+pa[2]))/864e5); };
CC.ago=function(ts){ var m=Math.round((Date.now()-ts)/60000); if(m<2) return "just now"; if(m<90) return m+" min ago"; var h=Math.round(m/60); if(h<36) return h+" h ago"; return Math.round(h/24)+" days ago"; };

/* ---------- toast & modal ---------- */
var toastTimer;
CC.toast=function(msg,ms){ var t=CC.$("#toast"); t.textContent=msg; t.hidden=false; clearTimeout(toastTimer); toastTimer=setTimeout(function(){t.hidden=true;},ms||2600); };
CC.modal=function(o){
  var root=CC.$("#modal-root"), prevFocus=document.activeElement;
  var back=document.createElement("div"); back.className="modal-back";
  var btns=(o.buttons||[]).map(function(b,i){return '<button type="button" class="btn '+(b.cls||"")+' block" data-i="'+i+'" style="margin-top:8px">'+esc(b.label)+'</button>';}).join("");
  back.innerHTML='<div class="modal" role="dialog" aria-modal="true" aria-label="'+esc(o.title||"Dialog")+'"><h2>'+esc(o.title||"")+'</h2><div class="modal-body">'+(o.html||"")+'</div>'+btns+'</div>';
  root.appendChild(back);
  function close(){ if(back.parentNode) back.parentNode.removeChild(back); if(prevFocus&&prevFocus.focus) try{prevFocus.focus();}catch(e){} }
  back.addEventListener("click",function(e){
    if(e.target===back && !o.sticky){ close(); if(o.onCancel) o.onCancel(); return; }
    var b=e.target.closest("button[data-i]"); if(!b) return;
    var def=o.buttons[+b.dataset.i]; var r=def.onClick?def.onClick(back,close):undefined;
    if(r!==false && !def.keepOpen) close();
  });
  var first=back.querySelector("input,select,textarea,button"); if(first&&!o.noFocus) first.focus();
  if(o.onOpen) o.onOpen(back,close);
  return close;
};
CC.confirm=function(msg,okLabel,danger,title){
  return new Promise(function(res){
    CC.modal({title:title||"Are you sure?",html:'<p>'+esc(msg)+'</p>',onCancel:function(){res(false);},buttons:[
      {label:okLabel||"OK",cls:danger?"danger":"primary",onClick:function(){res(true);}},
      {label:"Cancel",onClick:function(){res(false);}}]});
  });
};

/* ---------- vehicle state ---------- */
CC.state={vehicles:[]};
CC.loadVehicles=function(){
  return CC.DB.all("vehicles").then(function(v){
    v.sort(function(a,b){return (a.createdAt||0)-(b.createdAt||0);});
    CC.state.vehicles=v;
    var s=CC.settings.get();
    if(!v.some(function(x){return x.id===s.activeVehicle;})) CC.settings.set({activeVehicle:v.length?v[0].id:""});
    CC.updateChip();
    return v;
  });
};
CC.activeVehicle=function(){ var id=CC.settings.get().activeVehicle; return CC.state.vehicles.filter(function(v){return v.id===id;})[0]||null; };
CC.setActive=function(id){ CC.settings.set({activeVehicle:id}); CC.updateChip(); };
CC.vehicleName=function(v){ if(!v) return "No vehicle"; return v.nickname?v.nickname:[v.year,v.make,v.model].filter(Boolean).join(" "); };
CC.vehicleFull=function(v){ return [v.year,v.make,v.model,v.trim].filter(Boolean).join(" "); };
CC.updateChip=function(){ var v=CC.activeVehicle(), c=CC.$("#vehicle-chip"); c.textContent=v?"🚗 "+CC.vehicleName(v):"＋ Add vehicle"; };
CC.getVehicle=function(id){ return CC.state.vehicles.filter(function(v){return v.id===id;})[0]||null; };

/* ---------- header ---------- */
CC.header=function(title,back){
  CC.$("#title").textContent=title;
  var b=CC.$("#back"); b.hidden=!back; b.dataset.href=back||"";
  document.title=(title&&title!=="CarCare"?title+" – ":"")+"CarCare";
};
CC.empty=function(icon,title,text,btn){
  return '<div class="empty"><div class="big">'+icon+'</div><h3>'+esc(title)+'</h3><p>'+esc(text)+'</p>'+(btn||"")+'</div>';
};
CC.disclaimer=function(){
  return '<div class="disclaimer" role="note"><b>Safety disclaimer.</b> This app gives general information only and is not a substitute for a qualified mechanic or your owner\'s manual. Diagnoses are possibilities, not certainties. If your vehicle has brake, steering, fuel-leak, smoke, overheating or oil-pressure problems, do not drive it – get professional help. Always follow safe working practices (jack stands, cool engine, no open flames). Use at your own risk.</div>';
};
CC.urgBadge=function(u){
  return u==="stop"?'<span class="badge bad">Stop driving</span>':u==="soon"?'<span class="badge warn">Get checked soon</span>':'<span class="badge ok">Safe to drive</span>';
};

/* ---------- files ---------- */
CC.download=function(name,mime,data){
  var blob=data instanceof Blob?data:new Blob([data],{type:mime});
  var url=URL.createObjectURL(blob), a=document.createElement("a");
  a.href=url; a.download=name; a.rel="noopener"; document.body.appendChild(a); a.click();
  setTimeout(function(){URL.revokeObjectURL(url);a.remove();},4000);
};
CC.readFile=function(file){ return new Promise(function(res,rej){ var r=new FileReader(); r.onload=function(){res(r.result);}; r.onerror=function(){rej(r.error);}; r.readAsText(file); }); };
CC.blobToDataURL=function(blob){ return new Promise(function(res,rej){ var r=new FileReader(); r.onload=function(){res(r.result);}; r.onerror=function(){rej(r.error);}; r.readAsDataURL(blob); }); };
CC.dataURLToBlob=function(u){ var p=u.split(","),m=/data:([^;]*)/.exec(p[0]),bin=atob(p[1]),a=new Uint8Array(bin.length); for(var i=0;i<bin.length;i++)a[i]=bin.charCodeAt(i); return new Blob([a],{type:m?m[1]:"application/octet-stream"}); };
/* downscale receipt photo to keep storage small */
CC.shrinkImage=function(file,max){
  max=max||1600;
  return new Promise(function(res){
    var url=URL.createObjectURL(file), img=new Image();
    img.onload=function(){
      try{
        var s=Math.min(1,max/Math.max(img.width,img.height)), c=document.createElement("canvas");
        c.width=Math.round(img.width*s); c.height=Math.round(img.height*s);
        c.getContext("2d").drawImage(img,0,0,c.width,c.height);
        c.toBlob(function(b){ URL.revokeObjectURL(url); res(b||file); },"image/jpeg",0.82);
      }catch(e){ URL.revokeObjectURL(url); res(file); }
    };
    img.onerror=function(){ URL.revokeObjectURL(url); res(file); };
    img.src=url;
  });
};
CC.csvEscape=function(v){ v=v==null?"":String(v); return /[",\n\r]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v; };
CC.parseCSV=function(text){
  text=text.replace(/^\uFEFF/,""); var rows=[],row=[],f="",q=false;
  for(var i=0;i<text.length;i++){
    var c=text[i];
    if(q){ if(c==='"'){ if(text[i+1]==='"'){f+='"';i++;} else q=false; } else f+=c; }
    else if(c==='"') q=true;
    else if(c===","){row.push(f);f="";}
    else if(c==="\n"||c==="\r"){ if(c==="\r"&&text[i+1]==="\n")i++; row.push(f);f=""; if(row.length>1||row[0]!=="")rows.push(row); row=[]; }
    else f+=c;
  }
  if(f!==""||row.length){row.push(f);rows.push(row);}
  return rows;
};

/* ---------- combo box (typeahead with free-text) ---------- */
/* opts: input, getItems(query)->[{label,value?,hint?}], onPick(item), minChars */
CC.combo=function(o){
  var input=o.input, list=document.createElement("ul"), sel=-1, items=[];
  list.className="combo-list"; list.setAttribute("role","listbox"); list.hidden=true;
  input.parentNode.appendChild(list);
  input.setAttribute("autocomplete","off"); input.setAttribute("role","combobox"); input.setAttribute("aria-expanded","false");
  function render(){
    var q=input.value.trim(); var r=o.getItems(q)||[]; items=r;
    if(!r.length){ list.hidden=true; input.setAttribute("aria-expanded","false"); return; }
    list.innerHTML=r.map(function(it,i){ return it.hint?'<li class="hint">'+esc(it.label)+'</li>':'<li role="option" data-i="'+i+'">'+esc(it.label)+'</li>'; }).join("");
    list.hidden=false; input.setAttribute("aria-expanded","true"); sel=-1;
  }
  function hide(){ list.hidden=true; input.setAttribute("aria-expanded","false"); }
  function pick(i){ var it=items[i]; if(!it||it.hint) return; input.value=it.label; hide(); if(o.onPick) o.onPick(it); }
  input.addEventListener("input",render); input.addEventListener("focus",render); input.addEventListener("click",function(){ if(list.hidden) render(); });
  input.addEventListener("blur",function(){ setTimeout(hide,180); });
  input.addEventListener("keydown",function(e){
    if(list.hidden) return; var lis=CC.$$("li[data-i]",list);
    if(e.key==="ArrowDown"){ e.preventDefault(); sel=Math.min(lis.length-1,sel+1); }
    else if(e.key==="ArrowUp"){ e.preventDefault(); sel=Math.max(0,sel-1); }
    else if(e.key==="Enter"&&sel>=0){ e.preventDefault(); pick(+lis[sel].dataset.i); return; }
    else if(e.key==="Escape"){ hide(); return; } else return;
    lis.forEach(function(l,i){l.classList.toggle("sel",i===sel);}); if(lis[sel]) lis[sel].scrollIntoView({block:"nearest"});
  });
  list.addEventListener("mousedown",function(e){e.preventDefault();});
  list.addEventListener("click",function(e){ var li=e.target.closest("li[data-i]"); if(li) pick(+li.dataset.i); });
  return {refresh:render,hide:hide};
};

/* ---------- theme ---------- */
CC.applyTheme=function(){
  var t=CC.settings.get().theme, root=document.documentElement;
  if(t==="light"||t==="dark") root.dataset.theme=t; else delete root.dataset.theme;
  var metas=CC.$$('meta[name="theme-color"]');
  metas.forEach(function(m,i){
    if(t==="auto"){ m.content=i===0?"#f4f6fb":"#0f172a"; if(!m.media) m.media=i===0?"(prefers-color-scheme: light)":"(prefers-color-scheme: dark)"; }
    else { m.removeAttribute("media"); m.content=t==="dark"?"#0f172a":"#f4f6fb"; }
  });
};
})();
