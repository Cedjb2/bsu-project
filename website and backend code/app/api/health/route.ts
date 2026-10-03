import { modelInfo } from '@/lib/ai/model.mjs';
export function GET(){return Response.json({status:'ok',app:'Campus Calm',model:modelInfo},{headers:{'Cache-Control':'no-store'}});}
