"use strict";
/* ---- Business details: edit these ---- */
const WHATSAPP = "918355833096";          // country code + number, no "+" or spaces
const EMAIL    = "biz@diimp.com";
const WEB3FORMS_KEY = "82cc8041-6c17-424c-a670-968627341aca";                 // Web3Forms access key for biz@diimp.com (public key, safe in page)

document.getElementById('yr').textContent = new Date().getFullYear();

/* Header shadow + active menu link */
const header = document.querySelector('header');
const links = [...document.querySelectorAll('.menu a')];
const secs = ['vision','products','solutions','reviews','contact'].map(id=>document.getElementById(id));
const heroEl=document.getElementById('vision');
const setHeaderMode=()=>{
  const menuOpen=document.querySelector('.menu')?.classList.contains('open');
  const overHero=heroEl && scrollY < heroEl.offsetHeight-80;
  header.classList.toggle('scrolled', scrollY>10);
  header.classList.toggle('on-hero', scrollY<=10 && !!overHero && !menuOpen);
};
setHeaderMode();
addEventListener('resize',setHeaderMode);
addEventListener('scroll',()=>{
  setHeaderMode();
  let cur='vision';
  secs.forEach(s=>{ if(s.getBoundingClientRect().top < 140) cur=s.id; });
  links.forEach(a=>a.classList.toggle('active', a.getAttribute('href')==='#'+cur && cur!=='contact'));
},{passive:true});

/* Mobile menu */
const burger=document.querySelector('.burger'), menu=document.querySelector('.menu');
burger.onclick=()=>{const o=menu.classList.toggle('open');burger.classList.toggle('x',o);burger.setAttribute('aria-expanded',o);setHeaderMode()};
links.forEach(a=>a.addEventListener('click',()=>{menu.classList.remove('open');burger.classList.remove('x');setHeaderMode()}));

/* Read more on long reviews */
document.querySelectorAll('.more').forEach(b=>b.onclick=()=>{const p=b.previousElementSibling;const open=p.classList.toggle('clamp');b.textContent=open?'Read more':'Show less'});

/* Reels: play on the page while visible; fall back to Instagram embed if the file is missing */
const igLoad=()=>{if(window.__ig)return;window.__ig=1;const sc=document.createElement('script');sc.async=true;sc.src='https://www.instagram.com/embed.js';document.body.appendChild(sc)};
const reelIO=new IntersectionObserver(es=>es.forEach(e=>{const v=e.target;if(e.isIntersecting){v.play().catch(()=>{})}else{v.pause()}}),{threshold:.5});
document.querySelectorAll('.reel-player').forEach(p=>{
  const v=p.querySelector('video'), btn=p.querySelector('.reel-sound');
  const fail=()=>{if(p.classList.contains('off'))return;p.classList.add('off');p.nextElementSibling.hidden=false;igLoad();if(window.instgrm)instgrm.Embeds.process()};
  v.addEventListener('error',fail);
  if(v.error||v.networkState===3)fail();
  reelIO.observe(v);
  v.onclick=()=>v.paused?v.play():v.pause();
  btn.onclick=()=>{
    const turnOn=v.muted;
    document.querySelectorAll('.reel-video').forEach(o=>{o.muted=true;o.parentElement.querySelector('.reel-sound').textContent='🔇'});
    v.muted=!turnOn; btn.textContent=turnOn?'🔊':'🔇'; btn.setAttribute('aria-label',turnOn?'Mute':'Turn sound on'); if(turnOn)v.play();
  };
});

/* Reveal on scroll */
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.12});
document.querySelectorAll('.rv').forEach((el,i)=>{el.style.transitionDelay=(i%4)*80+'ms';io.observe(el)});

/* Enquiry form → WhatsApp / email */
const form=document.getElementById('enquiry');
form.addEventListener('submit',e=>{
  e.preventDefault();
  const v=id=>form[id].value.trim();
  const checks={
    name: v('name').length>1,
    phone: /^[+]?[\d\s-]{10,15}$/.test(v('phone')),
    email: !v('email') || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v('email')),
    req: !!v('req')
  };
  let ok=true;
  for(const k in checks){form[k].closest('.f').classList.toggle('bad',!checks[k]); if(!checks[k]) ok=false;}
  if(!ok) return;
  const msg=`Hello! New enquiry from the website:%0A%0A*Name:* ${encodeURIComponent(v('name'))}%0A*Phone:* ${encodeURIComponent(v('phone'))}%0A*Email:* ${encodeURIComponent(v('email')||'-')}%0A*Requirement:* ${encodeURIComponent(v('req'))}%0A*Details:* ${encodeURIComponent(v('desc')||'-')}`;
  document.getElementById('waSend').href=`https://wa.me/${WHATSAPP}?text=${msg}`;
  lastEnquiry={name:v('name'),phone:v('phone'),email:v('email'),req:v('req'),desc:v('desc'),mailto:`mailto:${EMAIL}?subject=${encodeURIComponent('Print enquiry – '+v('req'))}&body=${msg.replace(/\*/g,'')}`};
  const st=document.getElementById('mailStatus'); st.textContent=''; st.className='mail-status';
  const mb=document.getElementById('mailSend'); mb.disabled=false; mb.textContent='Send by email'; sentOnce=false;
  [...form.children].forEach(c=>{if(c.id!=='sent')c.style.display='none'});
  document.getElementById('sent').style.display='block';
});
/* "Send by email": emails the enquiry straight to biz@diimp.com via Web3Forms */
let lastEnquiry=null, sentOnce=false;
document.getElementById('mailSend').addEventListener('click',async()=>{
  const e=lastEnquiry; if(!e) return;
  if(document.getElementById('botcheck').checked){ sentOnce=true; return; }   // honeypot: silently drop bots
  if(sentOnce) return;                                                         // one email per enquiry
  const st=document.getElementById('mailStatus'), mb=document.getElementById('mailSend');
  if(!WEB3FORMS_KEY){ location.href=e.mailto; return; }        // no key yet: open the mail app
  mb.disabled=true; mb.textContent='Sending…'; st.className='mail-status'; st.textContent='';
  try{
    const r=await fetch('https://api.web3forms.com/submit',{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},
      body:JSON.stringify({access_key:WEB3FORMS_KEY,subject:`New website enquiry – ${e.req} – ${e.name}`,from_name:'diimp.com enquiry form',
        Name:e.name,Phone:e.phone,Email:e.email||'-',Requirement:e.req,Description:e.desc||'-',...(e.email?{replyto:e.email}:{}),botcheck:false})});
    const j=await r.json().catch(()=>({}));
    if(!r.ok||!j.success) throw new Error(j.message||r.status);
    sentOnce=true; mb.textContent='Sent ✓'; st.className='mail-status ok'; st.textContent="Thank you! Your enquiry has reached us — we'll get back to you shortly.";
  }catch(err){
    mb.disabled=false; mb.textContent='Try again'; st.className='mail-status bad';
    st.textContent="Couldn't send right now. Please try again, or ";
    const a=document.createElement('a'); a.href=e.mailto; a.textContent='email us directly'; a.style.textDecoration='underline';
    st.append(a, ' / WhatsApp us.');
  }
});
form.querySelectorAll('input,select').forEach(el=>el.addEventListener('input',()=>el.closest('.f').classList.remove('bad')));

/* Reels carousel: arrows + dots (one dot per scroll position) */
(()=>{
  const row=document.querySelector('.reels-row'), nav=document.querySelector('.reel-nav');
  if(!row||!nav) return;
  const items=[...row.querySelectorAll('.reel-item')], dotsBox=nav.querySelector('.reel-dots');
  const [prev,next]=nav.querySelectorAll('.reel-arrow');
  let stops=[], dots=[];
  const maxScroll=()=>Math.max(0,row.scrollWidth-row.clientWidth);
  const current=()=>{let best=0,dist=Infinity;stops.forEach((x,i)=>{const d=Math.abs(x-row.scrollLeft);if(d<dist){dist=d;best=i;}});return best;};
  const go=i=>{i=Math.max(0,Math.min(stops.length-1,i));row.scrollTo({left:stops[i],behavior:'smooth'});};
  const build=()=>{
    const m=maxScroll(), seen=new Set();
    stops=items.map(it=>Math.min(Math.round(it.offsetLeft-items[0].offsetLeft),Math.round(m))).filter(x=>!seen.has(x)&&seen.add(x));
    dots=stops.map((_,i)=>{const b=document.createElement('button');b.type='button';b.className='reel-dot';b.setAttribute('role','tab');b.setAttribute('aria-label','Go to position '+(i+1)+' of '+stops.length);b.addEventListener('click',()=>go(i));return b;});
    dotsBox.replaceChildren(...dots);
    update();
  };
  const update=()=>{
    nav.hidden=stops.length<2;
    const c=current();
    dots.forEach((d,i)=>{d.classList.toggle('on',i===c);d.setAttribute('aria-selected',String(i===c));});
    prev.disabled=row.scrollLeft<=4; next.disabled=row.scrollLeft>=maxScroll()-4;
  };
  prev.addEventListener('click',()=>go(current()-1));
  next.addEventListener('click',()=>go(current()+1));
  row.addEventListener('scroll',()=>requestAnimationFrame(update),{passive:true});
  let t; addEventListener('resize',()=>{clearTimeout(t);t=setTimeout(build,150);});
  build();
})();
