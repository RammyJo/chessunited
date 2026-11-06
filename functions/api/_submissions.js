import { digest } from './_security.js';
export class SubmissionError extends Error { constructor(message,status=422){super(message);this.status=status;} }
const enc=new TextEncoder();
async function keyFor(token){return crypto.subtle.importKey('raw',Uint8Array.from(token.match(/../g),v=>parseInt(v,16)),{name:'AES-GCM'},false,['encrypt','decrypt']);}
async function encrypt(token,response){
 const iv=crypto.getRandomValues(new Uint8Array(12));
 const cipher=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},await keyFor(token),enc.encode(JSON.stringify(response))));
 return btoa(String.fromCharCode(...iv,...cipher));
}
async function decrypt(token,value){
 const bytes=Uint8Array.from(atob(value),c=>c.charCodeAt(0));
 return JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:bytes.slice(0,12)},await keyFor(token),bytes.slice(12))));
}
export async function prepareSubmission(env,kind,body,payload) {
 // Retain compatibility for an already-open legacy form. Current forms send
 // a cryptographically random key. Retried replies are encrypted by that key.
 if(body.submissionToken===undefined)return {};
 if(typeof body.submissionToken!=='string'||!/^[a-f0-9]{64}$/.test(body.submissionToken))throw new SubmissionError('Refresh this form to start a new submission.');
 const key=await digest(kind+':'+body.submissionToken),fingerprint=await digest(JSON.stringify(payload));
 const existing=await env.DB.prepare('SELECT fingerprint,encrypted_response FROM form_submissions WHERE key_hash=?').bind(key).first();
 if(existing && existing.fingerprint!==fingerprint)throw new SubmissionError('The details changed during a retry. Refresh the form before submitting the new details.',409);
 return {key,fingerprint,token:body.submissionToken,response:existing?await decrypt(body.submissionToken,existing.encrypted_response):null};
}
export async function submissionStatement(env,kind,submission,response) {
 if(!submission.key)return null;
 return env.DB.prepare('INSERT INTO form_submissions(key_hash,kind,fingerprint,encrypted_response) VALUES(?,?,?,?)').bind(submission.key,kind,submission.fingerprint,await encrypt(submission.token,response));
}
export async function savedSubmission(env,submission) {
 if(!submission.key)return null;
 const row=await env.DB.prepare('SELECT fingerprint,encrypted_response FROM form_submissions WHERE key_hash=?').bind(submission.key).first();
 return row?.fingerprint===submission.fingerprint?await decrypt(submission.token,row.encrypted_response):null;
}
