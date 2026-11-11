/* RTEÜ Nefroloji uygulamaları: ortak arayüz katmanı.
   RTEU.init({key:"nakil", version:"1.1", date:"11.11.2026", tools:"#sidefoot seçici", view:"#view"}) */
(function(){
 const LS={get(k,d){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
 const STEPS=[0.9,1,1.1,1.2,1.35];
 const R=window.RTEU={cfg:{key:"app"},
  /* ---- yazı boyutu (tüm uygulamalarda ortak anahtar) */
  fs(){return LS.get("rteu-fs",1)},
  setFs(i){i=Math.max(0,Math.min(STEPS.length-1,i));LS.set("rteu-fs",i);document.documentElement.style.setProperty("--fs",STEPS[i]);document.querySelectorAll(".rt-fs").forEach(el=>{el.children[0].disabled=i===0;el.children[1].disabled=i===STEPS.length-1})},
  /* ---- sık kullanılanlar ve son açılanlar */
  favs(){return LS.get(R.cfg.key+"-fav",[])},
  isFav(id){return R.favs().includes(id)},
  toggleFav(id){let f=R.favs();f=f.includes(id)?f.filter(x=>x!==id):[id,...f].slice(0,12);LS.set(R.cfg.key+"-fav",f);return f.includes(id)},
  recents(){return LS.get(R.cfg.key+"-son",[])},
  visit(id){LS.set(R.cfg.key+"-son",[id,...R.recents().filter(x=>x!==id)].slice(0,6))},
  starHTML(id){const on=R.isFav(id);return `<button type="button" class="rt-star" data-rt-star="${id}" aria-pressed="${on}">${on?"★ Sık kullanılanlarda":"☆ Sık kullanılanlara ekle"}</button>`},
  /* ---- akış şeması: adım = "metin" | [başlık,metin,tür] | {q:"soru", o:[[etiket,metin,tür],...]} */
  flowHTML(steps,cap,esc){esc=esc||(x=>x);const one=(s,tag)=>{if(typeof s==="string")s=["",s];return `<div class="fs ${s[2]||""}">${tag?`<i>${esc(tag)}</i>`:""}${s[0]?`<b>${esc(s[0])}</b>`:""}${s[1]?`<span>${esc(s[1])}</span>`:""}</div>`};
   return `<div class="flow" role="list">${steps.map((s,i)=>{const a=i?'<div class="fa" aria-hidden="true"></div>':"";if(s&&s.q!==undefined)return a+`<div class="fs q"><b>${esc(s.q)}</b></div><div class="fa" aria-hidden="true"></div><div class="fb">${s.o.map(o=>one([o[1]&&o[3]?o[3]:"",o[1],o[2]],o[0])).join("")}</div>`;return a+one(s)}).join("")}</div>${cap?`<p class="flowcap">${esc(cap)}</p>`:""}`},
  /* ---- görünüm her yenilendiğinde: tablo ipucu ve hesaplayıcı sıfırlama */
  enhance(root){root=root||document;
   root.querySelectorAll(".tbl,.table-wrap,.tablo").forEach(t=>{if(t.dataset.rt)return;t.dataset.rt=1;t.classList.add("rt-scroll");const h=document.createElement("p");h.className="rt-hint";h.textContent="Tablonun devamı için yana kaydırın →";t.after(h);const upd=()=>t.classList.toggle("rt-more",t.scrollWidth-t.clientWidth-t.scrollLeft>8);t.addEventListener("scroll",upd,{passive:true});requestAnimationFrame(upd)});
   root.querySelectorAll(".calc").forEach(c=>{if(c.dataset.rt)return;c.dataset.rt=1;const hd=c.querySelector("header");if(!hd)return;const b=document.createElement("button");b.type="button";b.className="rt-reset";b.textContent="Sıfırla";b.title="Örnek değerlere dön";b.addEventListener("click",()=>{c.querySelectorAll("input,select").forEach(el=>{if(el.type==="checkbox"||el.type==="radio")el.checked=el.defaultChecked;else if(el.tagName==="SELECT"){[...el.options].forEach(o=>o.selected=o.defaultSelected)}else el.value=el.defaultValue});c.dispatchEvent(new Event("input",{bubbles:true}))});hd.style.display="flex";hd.style.alignItems="baseline";hd.style.gap="10px";hd.style.flexWrap="wrap";hd.appendChild(b)})},
  bylineHTML(){return `<p class="rt-byline"><span class="rt-by-mark" aria-hidden="true">EK</span><span><b>Prof. Dr. Ekrem KARA</b><small>Recep Tayyip Erdoğan Üniversitesi Tıp Fakültesi · Nefroloji Bilim Dalı</small></span></p>`},
  focus(el){if(!el)return;el.classList.remove("rt-focus");void el.offsetWidth;el.classList.add("rt-focus");setTimeout(()=>el.classList.remove("rt-focus"),2000)},
  motion(view){
   /* sayfa girişi */
   view.classList.remove("rt-in");void view.offsetWidth;view.classList.add("rt-in");
   /* akış şeması: görünür olunca sırayla */
   const io=("IntersectionObserver" in window)?new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.remove("rt-wait");e.target.classList.add("rt-go");io.unobserve(e.target)}}),{threshold:.12}):null;
   view.querySelectorAll(".flow").forEach(f=>{[...f.children].forEach((c,i)=>c.style.setProperty("--i",i));if(io){f.classList.add("rt-wait");io.observe(f)}});
   /* hesap sonucu değişince sayı canlanır */
   view.querySelectorAll(".calc .out").forEach(o=>{if(o.dataset.rtm)return;o.dataset.rtm=1;let last="";new MutationObserver(()=>{const v=o.querySelector(".big .v, .msg .pill");const t=v?v.textContent:"";if(v&&t!==last){last=t;v.classList.add("rt-pop")}}).observe(o,{childList:true})});
  },
  init(cfg){R.cfg=Object.assign(R.cfg,cfg||{});
   document.addEventListener("click",e=>{const b=e.target.closest("[data-sec]");if(b){const id=b.dataset.sec;setTimeout(()=>R.focus(document.getElementById(id)),b.dataset.go?140:60)}const st=e.target.closest(".rt-star");if(st){st.classList.remove("rt-pop");void st.offsetWidth;st.classList.add("rt-pop")}});
   const host=document.querySelector(R.cfg.tools||".sidefoot");
   if(host&&!host.querySelector(".rt-fs")){const w=document.createElement("div");w.className="rt-tools";w.innerHTML=`<span class="rt-fs" role="group" aria-label="Yazı boyutu"><button type="button" aria-label="Yazıyı küçült">A−</button><button type="button" aria-label="Yazıyı büyüt">A+</button></span>`;host.prepend(w);const th=host.querySelector(".themebtn,#themeBtn");if(th)w.prepend(th);w.querySelector(".rt-fs").children[0].addEventListener("click",()=>R.setFs(R.fs()-1));w.querySelector(".rt-fs").children[1].addEventListener("click",()=>R.setFs(R.fs()+1));
    if(R.cfg.author!==false){const au=document.createElement("span");au.className="rt-author";au.innerHTML="<b>Prof. Dr. Ekrem KARA</b>RTEÜ Tıp Fakültesi Nefroloji Bilim Dalı";host.appendChild(au)}
    if(R.cfg.version){const v=document.createElement("span");v.className="rt-ver";v.textContent="Sürüm "+R.cfg.version+(R.cfg.date?" · "+R.cfg.date:"");host.appendChild(v)}}
   R.setFs(R.fs());
   const view=document.querySelector(R.cfg.view||"#view")||document.body;
   new MutationObserver(()=>{R.enhance(view);R.motion(view)}).observe(view,{childList:true,subtree:false});R.enhance(view);R.motion(view);
   window.addEventListener("resize",()=>document.querySelectorAll(".rt-scroll").forEach(t=>t.classList.toggle("rt-more",t.scrollWidth-t.clientWidth-t.scrollLeft>8)));
  }};
 document.documentElement.style.setProperty("--fs",STEPS[R.fs()]||1);
})();
