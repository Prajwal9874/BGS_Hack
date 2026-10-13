// Restore the encrypted hackathon configuration. Never prints keys or passwords.
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import readline from 'node:readline';
const root=new URL('../',import.meta.url);
const bundle=JSON.parse(await fs.readFile(new URL('handoff/fluent.ly-secrets.enc.json',root),'utf8'));
if(bundle.version!==1 || bundle.algorithm!=='aes-256-gcm' || bundle.kdf!=='scrypt')throw new Error('Unsupported handoff format.');
const password=await new Promise(resolve=>{
 if(!process.stdin.isTTY){const lines=readline.createInterface({input:process.stdin});lines.once('line',line=>{lines.close();resolve(line.trim());});return;}
 process.stdout.write('Handoff password (hidden): ');
 process.stdin.setRawMode(true);process.stdin.resume();process.stdin.setEncoding('utf8');
 let text='';
 const onData=chunk=>{
  for(const ch of chunk){
   if(ch==='\u0003'){process.stdin.setRawMode(false);process.exit(130);}
   if(ch==='\r'||ch==='\n'){process.stdin.off('data',onData);process.stdin.setRawMode(false);process.stdin.pause();process.stdout.write('\n');resolve(text);return;}
   if(ch==='\u007f'||ch==='\b')text=text.slice(0,-1);else text+=ch;
  }
 };
 process.stdin.on('data',onData);
});
let decoded;
try{
 const key=crypto.scryptSync(password,Buffer.from(bundle.salt,'base64'),32);
 const decipher=crypto.createDecipheriv('aes-256-gcm',key,Buffer.from(bundle.iv,'base64'));
 decipher.setAuthTag(Buffer.from(bundle.tag,'base64'));
 decoded=JSON.parse(Buffer.concat([decipher.update(Buffer.from(bundle.ciphertext,'base64')),decipher.final()]).toString('utf8'));
}catch{console.error('Unable to unlock: incorrect password or modified bundle.');process.exit(1);}
const allowed=['.env.local','.env.test-accounts'];
if(decoded.version!==1 || !decoded.files || Object.keys(decoded.files).some(name=>!allowed.includes(name)) || allowed.some(name=>typeof decoded.files[name]!=='string'))throw new Error('Invalid handoff files.');
for(const name of allowed){
 try{await fs.access(new URL(name,root));console.error(name+' already exists. Move your existing file aside before unlocking.');process.exit(1);}catch(e){if(e.code!=='ENOENT')throw e;}
}
for(const name of allowed)await fs.writeFile(new URL(name,root),decoded.files[name],{flag:'wx',mode:0o600});
console.log('Restored .env.local and .env.test-accounts. These files stay ignored by Git.');
process.exit(0);
