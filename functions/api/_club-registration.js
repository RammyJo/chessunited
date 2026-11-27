import {clean} from './_utils.js';
export const CLUB_HEADERS=['FULL NAME','AGE','DATE OF BIRTH','BRGY NAME','CITY NAME','PROVINCE NAME','CHESS CLUB','CHESS LEVEL','CHESS RANKING','TOURNAMENTS PLAYED IN','GUESTS COMING (NUMBER)','GUESTS COMING (NAMES)'];
export const LEGACY_TOURNAMENT_TAB='Tournament Entries';
export async function clubSetup(env){if(!env.DB)return null;try{return await env.DB.prepare('SELECT * FROM club_registration_setup WHERE id=1').first();}catch{return null;}}
export function manilaToday(now=new Date()){return new Date(now.valueOf()+8*3600000).toISOString().slice(0,10);}
export function ageOnDate(birth,today){const [y,m,d]=birth.split('-').map(Number),[ty,tm,td]=today.split('-').map(Number);return ty-y-((tm<m||tm===m&&td<d)?1:0);}
export function validateClubRegistration(body,today=manilaToday()){
 const fields={};const fullName=clean(body.fullName,120),dateOfBirth=clean(body.dateOfBirth,10),barangay=clean(body.barangay,120),city=clean(body.city,100),province=clean(body.province,100),chessClub=clean(body.chessClub,120)||'None';
 const chessLevel=clean(body.chessLevel,20),rankingSource=clean(body.rankingSource,20),chessRanking=rankingSource==='Unrated'?'':clean(body.chessRanking,80),tournamentsPlayed=String(body.tournamentsPlayed??'').trim()==='100'?'100+':String(body.tournamentsPlayed??'').trim();
 const birth=new Date(dateOfBirth+'T12:00:00Z');const validBirth=/^\d{4}-\d{2}-\d{2}$/.test(String(body.dateOfBirth||''))&&Number.isFinite(birth.valueOf())&&birth.toISOString().slice(0,10)===dateOfBirth&&dateOfBirth<=today;
 const age=validBirth?ageOnDate(dateOfBirth,today):-1;
 if(fullName.length<3)fields.fullName='Enter your full name.';
 if(!validBirth||age<0||age>120)fields.dateOfBirth='Enter a valid date of birth, not in the future.';
 if(!Number.isInteger(Number(body.age))||Number(body.age)!==age)fields.age='Age must match your date of birth. Select your birth date again.';
 for(const [key,value]of [['barangay',barangay],['city',city],['province',province]])if(value.length<2)fields[key]='Enter your '+(key==='barangay'?'barangay':key)+'.';
 if(!['Beginner','Intermediate','Advanced'].includes(chessLevel))fields.chessLevel='Choose Beginner, Intermediate or Advanced.';
 if(!['FIDE','Chess.com','Unrated'].includes(rankingSource))fields.rankingSource='Choose FIDE, Chess.com or Unrated.';
 if(rankingSource!=='Unrated'&&!chessRanking)fields.chessRanking='Enter your rating/ranking, or choose Unrated.';
 if(!/^(?:0|[1-9]\d?|100\+)$/.test(tournamentsPlayed))fields.tournamentsPlayed='Choose a number from 0 to 99, or 100+.';
 const guestCount=Number(body.guestCount),names=typeof body.guestNames==='string'?body.guestNames.split(/\r?\n/).map(n=>n.trim().replace(/\s+/g,' ')).filter(Boolean):[];
 if(!Number.isInteger(guestCount)||guestCount<0||guestCount>100)fields.guestCount='Enter a guest count from 0 to 100.';
 if(names.length!==guestCount||names.some(n=>n.length<2||n.length>120))fields.guestNames='Enter one full name per guest on a separate line, matching the guest count.';
 return {fields,payload:{fullName,age,dateOfBirth,barangay,city,province,chessClub,chessLevel,rankingSource,chessRanking,tournamentsPlayed,guestCount,guestNames:names.join('\n')}};
}
export function clubSheetRow(record){return[record.full_name,record.age,record.date_of_birth,record.barangay,record.city,record.province,record.chess_club,record.chess_level,record.ranking_source==='Unrated'?'Unrated':`${record.ranking_source}: ${record.chess_ranking}`,record.tournaments_played,record.guest_count,record.guest_names];}
