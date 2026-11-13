/* The full film is requested only after a deliberate play action. */
(()=>{
 'use strict';
 document.querySelectorAll('[data-highlight]').forEach(section=>{
  const video=section.querySelector('[data-highlight-video]');
  const button=section.querySelector('[data-highlight-play]');
  const status=section.querySelector('[data-highlight-status]');
  if(!video||!button||!status)return;
  const message=text=>{status.textContent=text;status.hidden=!text;};
  const retry=()=>{
   const restoreFocus=document.activeElement===video;
   video.controls=false;video.tabIndex=-1;button.hidden=false;button.disabled=false;
   if(restoreFocus)button.focus({preventScroll:true});
   message('The video could not load. Check your connection, then tap play to try again.');
  };
  button.addEventListener('click',async()=>{
   if(button.disabled)return;
   button.disabled=true;message('Loading the highlights…');
   video.poster=section.querySelector('.highlight-poster')?.currentSrc||video.dataset.videoPoster;
   const smallScreen=window.matchMedia('(max-width: 760px)').matches;
   video.src=smallScreen&&video.dataset.videoMobileSrc?video.dataset.videoMobileSrc:video.dataset.videoSrc;
   video.controls=true;video.tabIndex=0;button.hidden=true;
   video.focus({preventScroll:true});
   try{await video.play();message('');}
   catch{retry();}
  });
  video.addEventListener('playing',()=>message(''));
  video.addEventListener('error',retry);
  document.querySelectorAll('[data-highlight-jump]').forEach(link=>link.addEventListener('click',event=>{
   if(event.defaultPrevented||event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
   if(button.hidden)void video.play().catch(retry);
   else button.click();
  }));
  document.addEventListener('visibilitychange',()=>{if(document.hidden)video.pause();});
 });
})();
