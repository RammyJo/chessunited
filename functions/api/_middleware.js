import { fail } from './_utils.js';
import { secureResponse,requestGuard,boundedRequest,checkBudget } from './_security.js';
/** Applies to every API route, including errors and authenticated officer routes. */
export async function onRequest(context) {
 try {
  const rejected=requestGuard(context.request);if(rejected)return secureResponse(rejected);
  if(!context.env.DB)return secureResponse(fail('The service is temporarily unavailable. Please try again shortly.',503));
  const limited=await checkBudget(context.request,context.env);if(limited)return secureResponse(limited);
  const request=await boundedRequest(context.request);
  if(!request)return secureResponse(fail('This form is too large. Shorten the details and retry.',413));
  const response=await context.next(request);
  if(response.status>=500 && !response.headers.get('Content-Type')?.includes('application/json')){console.error('api_handler_failed');return secureResponse(fail('The service is temporarily unavailable. Your saved payment is not charged again; please retry.',503));}
  return secureResponse(response);
 }catch{console.error('api_request_failed');return secureResponse(fail('The service is temporarily unavailable. Please try again shortly.',503));}
}
