(()=>{
 'use strict';
 // Preserve access to cards issued before the registration redesign.
 const member=new URLSearchParams(location.search).get('m')||'';
 if(/^CU-\d{4}-(?:\d{4}|\d{8})$/.test(member)&&location.hash.startsWith('#card')){location.replace('/membership/card/'+location.search+location.hash);return;}
 const form=document.querySelector('[data-club-registration]');if(!form)return;
 const birth=form.elements.dateOfBirth,age=form.elements.age,source=form.elements.rankingSource,ranking=form.elements.chessRanking,guests=form.elements.guestCount,names=form.elements.guestNames;
 const today=()=>new Date(Date.now()+8*3600000).toISOString().slice(0,10);
 const updateAge=()=>{birth.max=today();if(!/^\d{4}-\d{2}-\d{2}$/.test(birth.value)){age.value='';return;}const[y,m,d]=birth.value.split('-').map(Number),[ty,tm,td]=today().split('-').map(Number);const n=ty-y-(tm<m||tm===m&&td<d?1:0);age.value=n>=0&&n<=120?n:'';};
 const updateRanking=()=>{const enabled=source.value!=='Unrated';form.querySelector('[data-ranking-field]').hidden=!enabled;ranking.disabled=!enabled;ranking.required=enabled;if(!enabled)ranking.value='';};
 const updateGuests=()=>{const enabled=Number(guests.value)>0;form.querySelector('[data-guests-field]').hidden=!enabled;names.required=enabled;if(!enabled)names.value='';};
 birth.addEventListener('input',updateAge);birth.addEventListener('change',updateAge);source.addEventListener('change',updateRanking);guests.addEventListener('input',updateGuests);guests.addEventListener('change',updateGuests);updateAge();updateRanking();updateGuests();
})();
