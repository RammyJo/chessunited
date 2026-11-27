import{json,fail,readJson}from'./_utils.js';import{digest}from'./_security.js';import{prepareSubmission,submissionStatement,savedSubmission,SubmissionError}from'./_submissions.js';import{validateClubRegistration}from'./_club-registration.js';import{scheduleSheetsSync}from'./_sheets.js';
const acknowledgement={ok:true,message:'You’re registered. Chess United has received your details.'};
export async function onRequestPost(context){
 const{request,env}=context,body=await readJson(request);if(!body)return fail('Send a JSON body.');
 const{fields,payload}=validateClubRegistration(body);if(Object.keys(fields).length)return fail('Please check the highlighted fields.',422,fields);
 const identity=await digest('club-registration-v1:'+payload.fullName.toLocaleLowerCase('en')+':'+payload.dateOfBirth),fingerprint=await digest(JSON.stringify(payload));let submission;
 try{submission=await prepareSubmission(env,'club-registration',body,payload);if(submission.response)return json(submission.response);}catch(error){return fail(error instanceof SubmissionError?error.message:'Please retry the registration.',error instanceof SubmissionError?error.status:503);}
 try{
  const existing=await env.DB.prepare('SELECT payload_fingerprint FROM club_registrations WHERE identity_key=?').bind(identity).first();
  if(existing)return existing.payload_fingerprint===fingerprint?json(acknowledgement):fail('You are already registered. Contact the club if you need to change your details or guests.',409);
  const insert=env.DB.prepare('INSERT INTO club_registrations(identity_key,payload_fingerprint,full_name,age,date_of_birth,barangay,city,province,chess_club,chess_level,ranking_source,chess_ranking,tournaments_played,guest_count,guest_names) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(identity,fingerprint,payload.fullName,payload.age,payload.dateOfBirth,payload.barangay,payload.city,payload.province,payload.chessClub,payload.chessLevel,payload.rankingSource,payload.chessRanking,payload.tournamentsPlayed,payload.guestCount,payload.guestNames);
  const marker=await submissionStatement(env,'club-registration',submission,acknowledgement);await env.DB.batch([insert,...(marker?[marker]:[])]);
 }catch{
  const saved=await savedSubmission(env,submission);if(saved)return json(saved);
  const duplicate=await env.DB.prepare('SELECT payload_fingerprint FROM club_registrations WHERE identity_key=?').bind(identity).first();if(duplicate)return duplicate.payload_fingerprint===fingerprint?json(acknowledgement):fail('You are already registered. Contact the club to change your details.',409);
  console.error('club_registration_save_failed');return fail('Your registration could not be saved. Please try again.',503);
 }
 scheduleSheetsSync(context);return json(acknowledgement);
}
export function onRequestGet(){return fail('Registration details are private.',405);}
