/* Autoplay inline and muted when visible; sound always follows a visitor action. */
(()=>{
 'use strict';
 document.querySelectorAll('[data-highlight]').forEach(section=>{
  const video=section.querySelector('[data-highlight-video]');
  const button=section.querySelector('[data-highlight-play]');
  const sound=section.querySelector('[data-highlight-sound]');
  const status=section.querySelector('[data-highlight-status]');
  if(!video||!button||!sound||!status)return;
  let inView=false,pending=false,autoEligible=true,manualTravel=false;
  video.defaultMuted=true;
  video.muted=true;
  const message=text=>{status.textContent=text;status.hidden=!text;};
  const updateSound=()=>{
   const audible=!video.muted&&video.volume>0;
   sound.textContent=audible?'Turn sound off':'Turn sound on';
   sound.setAttribute('aria-pressed',String(audible));
  };
  const showPlayer=()=>{
   manualTravel=true;
   video.scrollIntoView({block:'center',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
  };
  const restoreCover=text=>{
   autoEligible=false;
   const restoreFocus=document.activeElement===video||document.activeElement===sound;
   video.controls=false;video.tabIndex=-1;button.hidden=false;sound.hidden=true;
   if(restoreFocus)button.focus({preventScroll:true});
   message(text);
  };
  const retry=()=>restoreCover('The video could not load. Check your connection, then tap play to try again.');
  const start=async(manual=false)=>{
   if(manual){
    autoEligible=true;
    video.muted=false;
    updateSound();
    showPlayer();
   }
   if(pending)return;
   if(!video.getAttribute('src')){
    video.poster=section.querySelector('.highlight-poster')?.currentSrc||video.dataset.videoPoster;
    const smallScreen=window.matchMedia('(max-width: 760px)').matches;
    video.src=smallScreen&&video.dataset.videoMobileSrc?video.dataset.videoMobileSrc:video.dataset.videoSrc;
   }else if(video.error){video.load();}
   video.controls=true;video.tabIndex=0;button.hidden=true;sound.hidden=false;
   if(manual){video.focus({preventScroll:true});message('Loading the highlights…');}
   pending=true;
   try{
    await video.play();
    message('');
   }catch(error){
    if(error.name==='NotAllowedError')restoreCover('Tap play to watch the highlights.');
    else if(error.name!=='AbortError')retry();
   }finally{pending=false;}
  };
  const resume=()=>{
   if(inView&&!document.hidden&&autoEligible&&!video.ended&&video.paused&&!pending)void start();
  };
  button.addEventListener('click',()=>void start(true));
  sound.addEventListener('click',()=>{
   if(video.muted||video.volume===0){video.volume=1;video.muted=false;}
   else video.muted=true;
   updateSound();
  });
  video.addEventListener('volumechange',updateSound);
  video.addEventListener('playing',()=>{
   message('');
   if(document.hidden||(!inView&&!manualTravel))video.pause();
  });
  video.addEventListener('pause',()=>{
   if(inView&&!document.hidden&&!video.ended)autoEligible=false;
  });
  video.addEventListener('ended',()=>{autoEligible=false;});
  video.addEventListener('error',retry);
  if('IntersectionObserver' in window){
   const observer=new IntersectionObserver(entries=>{
    inView=entries[0].isIntersecting&&entries[0].intersectionRatio>=.25;
    if(inView){manualTravel=false;resume();}
    else if(!manualTravel)video.pause();
   },{threshold:[0,.25]});
   observer.observe(video);
  }
  document.querySelectorAll('[data-highlight-jump]').forEach(link=>link.addEventListener('click',event=>{
   if(event.defaultPrevented||event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
   event.preventDefault();
   if(location.hash!=='#highlights')history.pushState(null,'','#highlights');
   void start(true);
  }));
  document.addEventListener('visibilitychange',()=>{
   if(document.hidden)video.pause();
   else resume();
  });
 });
})();
