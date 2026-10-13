// Print the Supabase plugin deployment payload. Contains source only, never secrets.
import fs from 'node:fs/promises';
const files=[{name:'index.js',content:"import { handleEdgeTutor } from './edge-tutor.ts';\nDeno.serve(request => handleEdgeTutor(request, Deno.env.toObject()));\n"}];
for(const name of ['edge-tutor','tutor','data']) {
 let content=await fs.readFile(new URL('../src/lib/'+name+'.ts',import.meta.url),'utf8');
 content=content.replaceAll('from "./data"','from "./data.ts"').replaceAll('from "./tutor"','from "./tutor.ts"');
 content=content.replace('import type { Message } from "./domain";','type Message = { role: "user" | "assistant"; content: string };');
 files.push({name:name+'.ts',content});
}
const project=JSON.parse(await fs.readFile(new URL('../supabase/project.json',import.meta.url),'utf8'));
console.log(JSON.stringify({project_id:project.id,name:'fluent-tutor',entrypoint_path:'index.js',verify_jwt:false,files}));
