import { scheduleSheetsSync } from './_sheets.js';
import {json,fail,readJson,clean,isEmail,isPhone,isGcashRef,makeMemberNo,hasDb,noDb,randomToken} from './_utils.js';
import { MEMBER_PRINT_FEE } from './_catalog.js';
import {digest} from './_security.js';
import {prepareSubmission,submissionStatement,savedSubmission,SubmissionError} from './_submissions.js';
export async function onRequestPost(context) {
 const {request,env}=context;if(!hasDb(env))return noDb();const body=await readJson(request);if(!body)return fail('Send a JSON body.');
 const firstName=clean(body.firstName,60),lastName=clean(body.lastName,60),email=clean(body.email,160).toLowerCase(),phone=clean(body.phone,24),city=clean(body.city,80),province=clean(body.province,80);
 const division=body.division||'open',printedId=body.printedId===true?1:0,gcashRef=clean(body.gcashRef,20).replace(/[\s-]/g,'');
 const birthYear=body.birthYear?Number(body.birthYear):null,fields={};
 if(firstName.length<2)fields.firstName='Enter a first name.';if(lastName.length<2)fields.lastName='Enter a last name.';
 if(!isEmail(email))fields.email='Enter a valid email address.';if(!isPhone(phone))fields.phone='Use a PH mobile number, e.g. 09171234567.';
 if(!['open','kiddies'].includes(division))fields.division='Choose an available division.';
 if(body.printedId!==undefined&&typeof body.printedId!=='boolean')fields.printedId='Choose whether to order the printed card.';
 if(birthYear!==null&&(!Number.isInteger(birthYear)||birthYear<1900||birthYear>new Date().getUTCFullYear()))fields.birthYear='Enter a valid birth year.';
 if(gcashRef&&!isGcashRef(gcashRef)||printedId&&!isGcashRef(gcashRef))fields.gcashRef='Add the 13-digit GCash reference for the printed card.';
 if(Object.keys(fields).length)return fail('Please check the highlighted fields.',422,fields);
 const payload={firstName,lastName,email,phone,city,province,birthYear,division,printedId,gcashRef};
 let submission;
 try{submission=await prepareSubmission(env,'member',body,payload);if(submission.response)return json(submission.response);}catch(e){return fail(e instanceof SubmissionError?e.message:'Please retry the registration.',e instanceof SubmissionError?e.status:503);}
 for(let attempt=0;attempt<5;attempt++){
  const memberNo=makeMemberNo(),cardToken=randomToken();
  const response={ok:true,member:{memberNo,firstName,lastName,division:division==='kiddies'?'Kiddies':'Open',printedId:!!printedId,printedFee:printedId?MEMBER_PRINT_FEE:0,printedNote:printedId?'The club verifies receipt of your ₱200 GCash payment before printing your ID and lanyard.':'Your free digital card is ready. Keep its private link for future visits.'},cardUrl:`/membership/?m=${memberNo}#card&key=${cardToken}`};
  try{
   const insert=env.DB.prepare(`INSERT INTO members(member_no,first_name,last_name,email,phone,city,province,birth_year,division,printed_id,gcash_ref,status,card_token_hash) VALUES(?,?,?,?,?,?,?,?,?,?,?,'active',?)`).bind(memberNo,firstName,lastName,email,phone,city,province,birthYear,division,printedId,gcashRef,await digest(cardToken));
   const marker=await submissionStatement(env,'member',submission,response);await env.DB.batch([insert,...(marker?[marker]:[])]);
   scheduleSheetsSync(context);return json(response);
  }catch{
   const saved=await savedSubmission(env,submission);if(saved)return json(saved);
   const collision=await env.DB.prepare('SELECT id FROM members WHERE member_no=?').bind(memberNo).first();if(collision)continue;
   console.error('member_insert_failed');return fail('Could not save the registration. Retry this form; do not pay again.',503);
  }
 }
 return fail('Could not issue a membership number. Please retry.',503);
}
