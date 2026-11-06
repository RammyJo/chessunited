import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
/** Build-time fingerprints prevent browsers running old checkout/auth scripts. */
export function scriptUrl(name: string) {
 const bytes=readFileSync(resolve(process.cwd(),'public/scripts',name));
 return `/scripts/${name}?v=${createHash('sha256').update(bytes).digest('hex').slice(0,12)}`;
}
