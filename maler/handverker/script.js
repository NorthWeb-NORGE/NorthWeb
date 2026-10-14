(function(){
"use strict";
var $=function(s,c){return (c||document).querySelector(s)}, $$=function(s,c){return Array.prototype.slice.call((c||document).querySelectorAll(s))};

/* ---------- ting som fungerer uten animasjon ---------- */
/* «Ledig for oppstart fra uke …» */
try{
  var LEDIG_OM=4; /* PLASSHOLDER: antall uker til neste ledige oppstart */
  var uke=function(d){
    d=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()));
    var dn=d.getUTCDay()||7; d.setUTCDate(d.getUTCDate()+4-dn);
    return Math.ceil(((d-new Date(Date.UTC(d.getUTCFullYear(),0,1)))/864e5+1)/7);
  };
  $("#ledig").textContent="Ledig for oppstart fra uke "+uke(new Date(Date.now()+LEDIG_OM*7*864e5));
}catch(e){}

function oppdaterKunde(){
  var v=$("input[name=kunde]:checked").value;
  $("#org-felt").hidden = v==="privat";
  $("#hva").value = v==="privat" ? "Nytt bad" : "Rammeavtale";
}
$$("input[name=kunde]").forEach(function(r){r.addEventListener("change",oppdaterKunde)});
$$("[data-kunde]").forEach(function(a){a.addEventListener("click",function(){var r=$("#k-"+a.dataset.kunde);if(r){r.checked=true;oppdaterKunde();}})});

$$(".copy").forEach(function(b){
  b.addEventListener("click",function(){
    function ok(){b.textContent="Kopiert";setTimeout(function(){b.textContent="Kopier"},1800);}
    function fallback(){var r=document.createRange();r.selectNodeContents($("#tlf"));var s=getSelection();s.removeAllRanges();s.addRange(r);}
    try{navigator.clipboard.writeText(b.dataset.copy).then(ok,fallback);}catch(e){fallback();}
  });
});

/* Koble til ekte mottak her (backend, Formspree e.l.). Bilder ligger i data.bilder. */
function sendSkjema(data){ return Promise.resolve(); }
$("#tilbud").addEventListener("submit",function(e){
  e.preventDefault();
  var ok=true;
  [["navn","err-navn"],["telefon","err-telefon"]].forEach(function(p){
    var f=$("#"+p[0]), tom=!f.value.trim();
    $("#"+p[1]).hidden=!tom; f.setAttribute("aria-invalid",tom?"true":"false");
    if(tom&&ok){f.focus();ok=false;}
  });
  if(!ok) return;
  sendSkjema(Object.fromEntries(new FormData(this))).then(function(){$("#kvittering").hidden=false;});
});

/* korn */
try{
  var c=$("#grain"), x=c.getContext("2d"); c.width=c.height=160;
  var img=x.createImageData(160,160);
  for(var j=0;j<img.data.length;j+=4){var v=Math.random()*255;img.data[j]=img.data[j+1]=img.data[j+2]=v;img.data[j+3]=255;}
  x.putImageData(img,0,0);
  var url=c.toDataURL(), g=document.createElement("div");
  g.id="grain"; g.setAttribute("aria-hidden","true"); g.style.backgroundImage="url("+url+")"; g.style.backgroundSize="160px";
  c.replaceWith(g);
}catch(e){}

/* toppmeny: fast farge etter hero, skjul ved scroll ned */
var bar=$("#top-bar"), heroH=function(){return $(".hero").offsetHeight-80}, lastY=0;
function onScroll(y){
  bar.classList.toggle("solid", y>heroH());
  if(y>lastY && y>400) bar.classList.add("gone"); else bar.classList.remove("gone");
  lastY=y;
}
window.addEventListener("scroll",function(){onScroll(window.scrollY)},{passive:true});

/* telleren viser sluttverdien uten animasjon */
var TOTAL=parseFloat($(".hours").dataset.total)||21;
$("#hrs").textContent=TOTAL;

/* ---------- animasjon ---------- */
var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
if(reduce || !window.gsap || !window.ScrollTrigger){ return; }
gsap.registerPlugin(ScrollTrigger);
document.documentElement.classList.add("anim");
$("#hrs").textContent="0";

/* myk scrolling */
var lenis=null;
if(window.Lenis){
  lenis=new Lenis({duration:1.2,easing:function(t){return Math.min(1,1.001-Math.pow(2,-10*t))},smoothWheel:true,wheelMultiplier:1});
  lenis.on("scroll",ScrollTrigger.update);
  gsap.ticker.add(function(t){lenis.raf(t*1000)});
  gsap.ticker.lagSmoothing(0);
}
$$('a[href^="#"]').forEach(function(a){
  a.addEventListener("click",function(e){
    var id=a.getAttribute("href"); if(id.length<2) return;
    var t=$(id); if(!t) return;
    e.preventDefault();
    if(lenis) lenis.scrollTo(t,{offset:id==="#top"?0:-20,duration:1.6}); else t.scrollIntoView({behavior:"smooth"});
  });
});

/* intro */
var tl=gsap.timeline({defaults:{ease:"expo.out"}});
tl.from(".hero .li",{yPercent:118,rotate:2,duration:1.35,stagger:.11})
  .from(".stamp-spin",{scale:.4,rotate:-160,autoAlpha:0,duration:1.8},0)
  .from(".float .fin",{yPercent:60,rotate:-25,autoAlpha:0,duration:1.6,stagger:.12},.15)
  .from(".reveal-hero > *",{y:26,autoAlpha:0,duration:1,stagger:.08,ease:"power3.out"},.55)
  .from(".top .wrap > *",{y:-20,autoAlpha:0,duration:1,stagger:.08,ease:"power3.out"},.3);

/* stempel: roterer alltid, raskere med scroll */
gsap.to(".stamp-spin",{rotate:360,duration:30,repeat:-1,ease:"none"});
gsap.to(".stamp-wrap",{rotate:140,yPercent:30,ease:"none",scrollTrigger:{trigger:".hero",start:"top top",end:"bottom top",scrub:true}});

/* svevende verktøy, parallakse */
$$(".float").forEach(function(f){
  var s=parseFloat(f.dataset.speed)||.3;
  gsap.to(f,{yPercent:-s*120,rotate:s*40,ease:"none",scrollTrigger:{trigger:".hero",start:"top top",end:"bottom top",scrub:true}});
});
gsap.to(".hero h1",{yPercent:-12,ease:"none",scrollTrigger:{trigger:".hero",start:"top top",end:"bottom top",scrub:true}});

/* tumstokk-stripene glir når du scroller */
$$(".ruler").forEach(function(r){
  gsap.fromTo(r,{"--rx":"0px"},{"--rx":"-600px",ease:"none",scrollTrigger:{trigger:r,start:"top bottom",end:"bottom top",scrub:true}});
});

/* løpebånd som reagerer på scrollfart */
var mq=gsap.to(".marquee-track",{xPercent:-50,duration:32,ease:"none",repeat:-1});
mq.totalTime(mq.duration()*500);
if(lenis){
  var dir=1, settle=null;
  lenis.on("scroll",function(e){
    if(e.direction) dir=e.direction;
    var boost=Math.min(Math.abs(e.velocity)*.35,7);
    gsap.to(mq,{timeScale:dir*(1+boost),duration:.25,overwrite:true});
    clearTimeout(settle); settle=setTimeout(function(){gsap.to(mq,{timeScale:dir,duration:1.4,overwrite:true})},120);
  });
}

/* hilsen */
gsap.from(".foto",{clipPath:"inset(100% 0% 0% 0%)",duration:1.6,ease:"expo.inOut",scrollTrigger:{trigger:".foto",start:"top 82%"}});
gsap.fromTo(".foto .scene",{yPercent:-6,scale:1.15},{yPercent:6,scale:1,ease:"none",scrollTrigger:{trigger:".foto",start:"top bottom",end:"bottom top",scrub:true}});
gsap.fromTo(".foto .scene svg",{rotate:-8},{rotate:6,ease:"none",scrollTrigger:{trigger:".foto",start:"top bottom",end:"bottom top",scrub:true}});
gsap.from(".hello .kicker, .hello .h2, .hello .up",{y:40,autoAlpha:0,duration:1.1,stagger:.1,ease:"power3.out",scrollTrigger:{trigger:".hello .text",start:"top 78%"}});
var sl=$("#sign-line");
if(sl){var len=sl.getTotalLength();gsap.fromTo(sl,{strokeDasharray:len,strokeDashoffset:len},{strokeDashoffset:0,duration:1.6,ease:"power2.inOut",scrollTrigger:{trigger:".sign",start:"top 88%"}});}

/* overskrifter: ord for ord */
$$(".h2").forEach(function(h){
  if(h.closest(".hello")) return;
  var words=h.textContent.trim().split(/\s+/);
  h.setAttribute("aria-label",h.textContent.trim());
  h.innerHTML=words.map(function(w){return '<span class="line" style="display:inline-block" aria-hidden="true"><span class="li">'+w+'</span></span>'}).join(" ");
  gsap.from(h.querySelectorAll(".li"),{yPercent:115,duration:1.1,stagger:.06,ease:"expo.out",scrollTrigger:{trigger:h,start:"top 85%"}});
});
$$(".kicker").forEach(function(k){
  if(k.closest(".hello")) return;
  gsap.from(k,{x:-20,autoAlpha:0,duration:.9,ease:"power3.out",scrollTrigger:{trigger:k,start:"top 90%"}});
});
$$(".lead").forEach(function(l){
  gsap.from(l,{y:24,autoAlpha:0,duration:1,ease:"power3.out",scrollTrigger:{trigger:l,start:"top 90%"}});
});

var mm=gsap.matchMedia();

/* tjenester: horisontal scroll på store skjermer */
mm.add("(min-width: 900px)",function(){
  var track=$(".track"), sec=$(".counter");
  var dist=function(){return track.scrollWidth-window.innerWidth};
  var h=gsap.to(track,{x:function(){return -dist()},ease:"none",
    scrollTrigger:{trigger:sec,start:"top top",end:function(){return "+="+dist()},pin:true,scrub:1,invalidateOnRefresh:true,anticipatePin:1}});
  gsap.to(".progress i",{scaleX:1,ease:"none",scrollTrigger:{trigger:sec,start:"top top",end:function(){return "+="+dist()},scrub:true}});
  $$(".panel .pic svg").forEach(function(s){
    gsap.fromTo(s,{rotate:-14,scale:.85},{rotate:10,scale:1,ease:"none",scrollTrigger:{trigger:s.parentNode,containerAnimation:h,start:"left right",end:"right left",scrub:true}});
  });
  $$(".panel:not(.intro)").forEach(function(p){
    gsap.from(p.querySelectorAll("h3, p"),{y:30,autoAlpha:0,duration:.9,stagger:.06,ease:"power3.out",scrollTrigger:{trigger:p,containerAnimation:h,start:"left 85%"}});
  });

  /* 21 dager: teller og aktivt steg */
  var hrs=$("#hrs"), hb=$("#hrs-bar");
  ScrollTrigger.create({trigger:".steps",start:"top 60%",end:"bottom 60%",scrub:true,onUpdate:function(st){
    hrs.textContent=Math.round(st.progress*TOTAL); hb.style.transform="scaleX("+st.progress+")";
  }});
  $$(".step").forEach(function(s){
    ScrollTrigger.create({trigger:s,start:"top 60%",end:"bottom 60%",toggleClass:{targets:s,className:"on"}});
  });
  return function(){ hrs.textContent=TOTAL; };
});
mm.add("(max-width: 899px)",function(){
  $$(".panel").forEach(function(p){
    gsap.from(p,{y:50,autoAlpha:0,duration:1,ease:"power3.out",scrollTrigger:{trigger:p,start:"top 88%"}});
  });
  var hrs=$("#hrs");
  ScrollTrigger.create({trigger:".clock",start:"top 75%",once:true,onEnter:function(){
    var o={v:0};gsap.to(o,{v:TOTAL,duration:2,ease:"power2.out",onUpdate:function(){hrs.textContent=Math.round(o.v)}});
    gsap.to("#hrs-bar",{scaleX:1,duration:2,ease:"power2.out"});
  }});
});

/* prisliste */
gsap.from(".cake",{y:30,autoAlpha:0,duration:.9,stagger:.07,ease:"power3.out",scrollTrigger:{trigger:".cakes",start:"top 82%"}});
gsap.from(".biz",{y:80,autoAlpha:0,duration:1.3,ease:"expo.out",scrollTrigger:{trigger:".biz",start:"top 88%"}});
gsap.to(".biz .bg-stamp",{rotate:180,ease:"none",scrollTrigger:{trigger:".order",start:"top bottom",end:"bottom top",scrub:true}});

/* forhåndsvisning som følger musa */
if(window.matchMedia("(hover:hover) and (min-width:900px)").matches){
  var pv=$("#preview"), pu=$("#preview-use");
  var qx=gsap.quickTo(pv,"x",{duration:.6,ease:"power3"}), qy=gsap.quickTo(pv,"y",{duration:.6,ease:"power3"});
  gsap.set(pv,{xPercent:-50,yPercent:-50,scale:.6,rotate:-10});
  window.addEventListener("mousemove",function(e){qx(e.clientX+130);qy(e.clientY)});
  $$(".cake").forEach(function(r){
    r.addEventListener("mouseenter",function(){pu.setAttribute("href","#"+r.dataset.cake);gsap.to(pv,{autoAlpha:1,scale:1,rotate:0,duration:.5,ease:"back.out(1.6)"});});
    r.addEventListener("mouseleave",function(){gsap.to(pv,{autoAlpha:0,scale:.6,rotate:-10,duration:.35,ease:"power2.in"});});
  });
}

/* sitat: ord lyser opp mens du scroller */
var q=$("#quote");
q.innerHTML=q.textContent.split(" ").map(function(w){return '<span class="qw">'+w+'</span>'}).join(" ");
gsap.fromTo(q.querySelectorAll(".qw"),{opacity:.16},{opacity:1,stagger:.1,ease:"none",scrollTrigger:{trigger:q,start:"top 80%",end:"bottom 45%",scrub:true}});

/* kontakt */
gsap.from(".phone, .contact .small, .contact .mail",{y:24,autoAlpha:0,duration:.9,stagger:.08,ease:"power3.out",scrollTrigger:{trigger:".phone",start:"top 90%"}});
gsap.from("#tilbud > *",{y:30,autoAlpha:0,duration:.9,stagger:.06,ease:"power3.out",scrollTrigger:{trigger:"#tilbud",start:"top 85%"}});

/* bunn: stort ordmerke */
gsap.from(".wordmark span",{yPercent:100,duration:1.3,stagger:.06,ease:"expo.out",scrollTrigger:{trigger:".wordmark",start:"top 95%"}});
gsap.from(".foot > *",{y:30,autoAlpha:0,duration:1,stagger:.08,ease:"power3.out",scrollTrigger:{trigger:"footer",start:"top 85%"}});

/* magnetiske knapper */
if(window.matchMedia("(hover:hover)").matches){
  $$(".magnet").forEach(function(b){
    var mx=gsap.quickTo(b,"x",{duration:.5,ease:"power3"}), my=gsap.quickTo(b,"y",{duration:.5,ease:"power3"});
    b.addEventListener("mousemove",function(e){var r=b.getBoundingClientRect();mx((e.clientX-r.left-r.width/2)*.25);my((e.clientY-r.top-r.height/2)*.35);});
    b.addEventListener("mouseleave",function(){mx(0);my(0);});
  });
}

window.addEventListener("load",function(){ScrollTrigger.refresh()});
if(document.fonts&&document.fonts.ready) document.fonts.ready.then(function(){ScrollTrigger.refresh()});
})();
