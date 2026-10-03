import { respond, modelInfo } from '@/lib/ai/model.mjs';
const headers={'Cache-Control':'no-store','Content-Type':'application/json'};
export async function POST(request:Request) {
 try {
  if(Number(request.headers.get('content-length')||0)>30000) return Response.json({error:'Please send a shorter conversation.'},{status:413,headers});
  const raw=await request.text(); if(raw.length>30000) return Response.json({error:'Please send a shorter conversation.'},{status:413,headers});
  const data=JSON.parse(raw);
  if(typeof data.message!=='string'||!data.message.trim()||data.message.length>2000) return Response.json({error:'Enter a message between 1 and 2,000 characters.'},{status:400,headers});
  const validGoals=['Listen and reflect','Find a next step','Try a coping tool'];
  const history=Array.isArray(data.history)?data.history.slice(-12).filter((m:any)=>m && ['user','assistant'].includes(m.role)&&typeof m.content==='string'&&m.content.length<=2000):[];
  return Response.json({...respond(data.message.trim(),history,validGoals.includes(data.goal)?data.goal:validGoals[0]),model:modelInfo.type},{headers});
 }catch{return Response.json({error:'Your message could not be processed. Please try again.'},{status:400,headers});}
}
