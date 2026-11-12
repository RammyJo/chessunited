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
   video.src=video.dataset.videoSrc;video.controls=true;video.tabIndex=0;button.hidden=true;
   video.focus({preventScroll:true});
   try{await video.play();message('');}
   catch{retry();}
  });
  video.addEventListener('playing',()=>message(''));
  video.addEventListener('error',retry);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)video.pause();});
 });
})();
