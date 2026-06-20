const header = document.querySelector('.topbar');
const menu = document.querySelector('.menu');
const nav = document.querySelector('.mobile-nav');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

menu?.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menu.setAttribute('aria-expanded', open);
  document.body.classList.toggle('menu-open', open);
});
document.querySelectorAll('.mobile-nav a').forEach(a => a.addEventListener('click', () => nav.classList.remove('open')));

const pill = document.querySelector('.nav-pill');
pill?.addEventListener('pointermove', e => {
  const r = pill.getBoundingClientRect();
  pill.style.setProperty('--nav-x', `${e.clientX - r.left}px`);
  pill.style.setProperty('--nav-y', `${e.clientY - r.top}px`);
});
pill?.addEventListener('pointerleave', () => {
  pill.style.setProperty('--nav-x', '50%');
  pill.style.setProperty('--nav-y', '50%');
});

// Lightweight 2D fallback for browsers without WebGL.
const c = document.querySelector('#sky');
const ctx = c?.getContext('2d');
let stars = [];
function resizeStars(){
  if(!c || !ctx) return;
  const d = Math.min(devicePixelRatio, 2);
  c.width = innerWidth * d; c.height = innerHeight * d;
  c.style.width = innerWidth+'px'; c.style.height = innerHeight+'px';
  ctx.setTransform(d,0,0,d,0,0);
  stars = Array.from({length:Math.min(74, Math.floor(innerWidth/18))}, () => ({x:Math.random()*innerWidth,y:Math.random()*innerHeight,r:Math.random()*1.2+.2,v:Math.random()*.14+.02,p:Math.random()*Math.PI*2}));
}
function drawStars(t){
  if(!ctx) return;
  ctx.clearRect(0,0,innerWidth,innerHeight);
  // Dust particles: native canvas, light and always visible.
  for(const s of stars){
    s.y-=s.v;
    if(s.y<0){s.y=innerHeight+4;s.x=Math.random()*innerWidth;}
    const a=.20+Math.sin(t/780+s.p)*.14;
    ctx.fillStyle=`rgba(204,231,255,${a})`;
    ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,Math.PI*2);ctx.fill();
  }
  // Polaris constellation: sits in the open upper-middle field, away from the service carousel.
  const ox=innerWidth*.46, oy=innerHeight*.14, sc=Math.min(innerWidth,innerHeight)/840;
  const nodes=[[0,72],[52,26],[120,78],[188,18],[257,70],[314,35]];
  ctx.save();
  ctx.lineWidth=1;
  ctx.strokeStyle='rgba(132,216,255,.34)';
  ctx.shadowColor='rgba(112,213,255,.45)';ctx.shadowBlur=10;
  ctx.beginPath();
  nodes.forEach(([x,y],i)=>{const px=ox+x*sc,py=oy+y*sc;i?ctx.lineTo(px,py):ctx.moveTo(px,py)});
  ctx.stroke();
  nodes.forEach(([x,y],i)=>{const px=ox+x*sc,py=oy+y*sc;const pulse=.62+Math.sin(t/700+i)*.25;ctx.fillStyle=i===3?`rgba(202,255,88,${pulse})`:`rgba(155,222,255,${.5+pulse*.25})`;ctx.beginPath();ctx.arc(px,py,(i===3?3.6:2.1)*sc,0,Math.PI*2);ctx.fill();});
  const p=nodes[3];ctx.fillStyle='rgba(202,255,88,.74)';ctx.font=`10px DM Mono, monospace`;ctx.fillText('POLARIS',ox+(p[0]+10)*sc,oy+(p[1]-8)*sc);
  ctx.restore();
  requestAnimationFrame(drawStars);
}
resizeStars(); addEventListener('resize',resizeStars,{passive:true}); requestAnimationFrame(drawStars);

const cards = [...document.querySelectorAll('.rotator-card')];
const dots = [...document.querySelectorAll('.rotator-dots i')];
let carouselIndex = 0;
setInterval(() => {
  cards.forEach(x => x.classList.remove('active')); dots.forEach(x => x.classList.remove('on'));
  carouselIndex = (carouselIndex + 1) % 4;
  cards[carouselIndex]?.classList.add('active'); dots[carouselIndex]?.classList.add('on');
}, 3250);

function startMotion() {
  const hasGSAP = window.gsap && window.ScrollTrigger;
  if (!hasGSAP || reduceMotion.matches) return;
  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);

  gsap.to('.orb-a', { xPercent: -18, yPercent: 22, scale: 1.18, duration: 8, ease: 'sine.inOut', repeat: -1, yoyo: true });
  gsap.to('.orb-b', { xPercent: 16, yPercent: -14, scale: .88, duration: 10, ease: 'sine.inOut', repeat: -1, yoyo: true });
  gsap.to('.service-rotator', { y: -18, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: .8 } });
  gsap.to('.hero-content', { y: 82, opacity: .16, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

  gsap.utils.toArray('.system-card').forEach((card, index) => {
    gsap.from(card, { y: 56, opacity: 0, rotateX: 7, transformPerspective: 900, duration: .9, ease: 'power3.out', delay: index * .08, scrollTrigger: { trigger: card, start: 'top 84%', once: true } });
  });
  gsap.utils.toArray('.project').forEach((card, index) => {
    gsap.from(card, { y: 70, opacity: 0, clipPath: 'inset(12% 0 0 0)', duration: 1.05, ease: 'power3.out', delay: index * .12, scrollTrigger: { trigger: card, start: 'top 82%', once: true } });
  });

  gsap.utils.toArray('.section-head h2, .contact h2').forEach(el => {
    gsap.from(el, { y: 38, opacity: 0, duration: .8, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 84%', once: true } });
  });

  ScrollTrigger.create({
    start: 18,
    onUpdate: self => header?.classList.toggle('scrolled', self.scroll() > 18),
  });

  // Elegant magnetic micro-interaction without changing button layout.
  document.querySelectorAll('.button.primary').forEach(button => {
    button.addEventListener('pointermove', event => {
      if (!matchMedia('(hover:hover)').matches) return;
      const r = button.getBoundingClientRect();
      gsap.to(button, { x: (event.clientX-r.left-r.width/2)*.13, y: (event.clientY-r.top-r.height/2)*.13, duration: .35, ease: 'power2.out', overwrite: true });
    });
    button.addEventListener('pointerleave', () => gsap.to(button, { x:0, y:0, duration:.55, ease:'elastic.out(1,.45)' }));
  });
}

// Pinned chapters: the existing layout stays stable, while GSAP provides a clean scroll refresh layer.
(function initChapters(){
  const intro = document.querySelector('.intro');
  const method = document.querySelector('.method');
  const type = document.querySelector('#scroll-type');
  const steps = [...document.querySelectorAll('.method-list article')];
  const meter = document.querySelector('.method-meter-track i');
  const number = document.querySelector('.method-meter strong b');
  const rail = document.querySelector('.method-rail i');
  const desktop = matchMedia('(min-width:851px)');
  if(!intro || !method || !type) return;
  function wrap(el,name){ let n=el.querySelector(':scope > .'+name); if(n) return n; n=document.createElement('div'); n.className=name; [...el.children].forEach(child=>n.appendChild(child)); el.append(n); return n; }
  wrap(intro,'intro-stage'); wrap(method,'method-stage'); intro.classList.add('intro-pin'); method.classList.add('method-pin');
  const text=type.dataset.text||''; let last=-1;
  const clamp=n=>Math.max(0,Math.min(1,n));
  const progressFor=el=>{const r=el.getBoundingClientRect(); const distance=Math.max(1,el.offsetHeight-innerHeight); return clamp(-r.top/distance)};
  function setType(p){
    if(reduceMotion.matches){type.textContent=text; type.classList.add('is-complete'); return;}
    const writing=clamp((p-.16)/.68), count=Math.round(text.length*writing);
    if(count!==last){ type.textContent=text.slice(0,count); last=count; type.classList.toggle('is-complete',count===text.length); }
  }
  function setMethod(p){
    const idx=Math.min(steps.length-1,Math.floor(Math.min(.9999,p)*steps.length));
    steps.forEach((step,i)=>step.classList.toggle('in-view',i===idx));
    const current=idx+1,pct=current/steps.length*100;
    if(meter) meter.style.width=pct+'%'; if(rail) rail.style.height=pct+'%'; if(number) number.textContent=String(current).padStart(2,'0');
  }
  let queued=false;
  function update(){
    queued=false;
    header?.classList.toggle('scrolled', scrollY>18);
    if(!desktop.matches || reduceMotion.matches){type.textContent=text;type.classList.add('is-complete');steps.forEach((s,i)=>s.classList.toggle('in-view',i===0));return;}
    const p1=progressFor(intro), p3=progressFor(method);
    intro.style.setProperty('--chapter-progress',p1); method.style.setProperty('--method-progress',p3);
    setType(p1); setMethod(p3);
  }
  function request(){if(!queued){queued=true;requestAnimationFrame(update)}}
  addEventListener('scroll',request,{passive:true});addEventListener('resize',request);desktop.addEventListener?.('change',request);reduceMotion.addEventListener?.('change',request); request();
})();

startMotion();
document.querySelectorAll('.system-card').forEach(card=>card.addEventListener('pointermove',e=>{const r=card.getBoundingClientRect();card.style.setProperty('--card-x',`${e.clientX-r.left}px`);card.style.setProperty('--card-y',`${e.clientY-r.top}px`)}));

// Mobile navigation and animations: preserve the same glass-menu experience on touch screens.
(function initMobileExperience(){
  const isMobile = matchMedia('(max-width:850px)');
  const closeMenu = () => {
    if (!nav || !menu) return;
    nav.classList.remove('open');
    menu.setAttribute('aria-expanded','false');
    document.body.classList.remove('menu-open');
  };
  menu?.addEventListener('click', () => {
    const isOpen = nav?.classList.contains('open');
    document.body.classList.toggle('menu-open', !isOpen);
  });
  document.addEventListener('click', (event) => {
    if (!isMobile.matches || !nav?.classList.contains('open')) return;
    if (!nav.contains(event.target) && !pill?.contains(event.target)) closeMenu();
  });
  document.querySelectorAll('.mobile-nav a').forEach(a => a.addEventListener('click', closeMenu));

  const animated = ['.intro-copy','.intro-detail','.system-card','.method-sticky','.method-list article','.project','.contact > *'];
  animated.forEach(sel => document.querySelectorAll(sel).forEach(el => el.classList.add('reveal-mobile')));
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, {threshold:.12, rootMargin:'0px 0px -36px'});
  function observeMobile(){
    if (!isMobile.matches || reduceMotion.matches) {
      document.querySelectorAll('.reveal-mobile').forEach(el => el.classList.add('is-visible'));
      return;
    }
    document.querySelectorAll('.reveal-mobile').forEach(el => observer.observe(el));
  }
  isMobile.addEventListener?.('change', observeMobile);
  observeMobile();
})();
