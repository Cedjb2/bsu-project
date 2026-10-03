import { corpus, guidance } from './corpus.mjs';
import { bowieCounseling, bowieResources } from '../bowie-resources.mjs';
const stop = new Set('i am a an the to and of for in on my me with it is have has do does can you your that this be at as are been how what from but'.split(' '));
const aliases={calculus:'exam',flunk:'failed',flunking:'failed',failing:'failed',tests:'test',exams:'exam',grades:'grade',assignments:'assignment',deadlines:'deadline',studying:'study',studies:'study',mom:'family',dad:'family',parents:'family',therapy:'counselor',therapist:'counselor',argue:'arguing',fighting:'arguing',conflicts:'conflict',panicking:'panic',worries:'worry',worried:'worry',anxious:'anxiety',sleeping:'sleep',slept:'sleep',resting:'rest'};
export function tokenize(text) { return (String(text).toLowerCase().replace(/[’']/g,'').match(/[a-z]+/g)||[]).filter(t=>!stop.has(t)).map(t=>aliases[t]||t); }
// Train a multinomial Naive Bayes classifier at startup. Laplace smoothing
// allows unseen combinations of training words without zero probabilities.
const vocabulary=new Set(), trained={};
for (const [label, samples] of Object.entries(corpus)) {
 const counts={}; let total=0;
 for(const sample of samples) for(const word of tokenize(sample)) {vocabulary.add(word); counts[word]=(counts[word]||0)+1; total++;}
 trained[label]={counts,total,prior:samples.length/Object.values(corpus).flat().length};
}
export function classify(text) {
 const words=tokenize(text).filter(w=>vocabulary.has(w));
 if(!words.length) return {topic:'unknown',confidence:0};
 const scores=Object.entries(trained).map(([topic,m])=>({topic,score:Math.log(m.prior)+words.reduce((s,w)=>s+Math.log(((m.counts[w]||0)+1)/(m.total+vocabulary.size)),0)})).sort((a,b)=>b.score-a.score);
 const top=scores[0], sum=scores.reduce((s,r)=>s+Math.exp(r.score-top.score),0);
 return {topic:top.topic, confidence:1/sum};
}
// Safety routing precedes inference. This is deliberately separate from the
// learned model and is not a clinically validated crisis assessment.
export function needsUrgentSupport(text) {
 return /\b(suicid\w*|self[ -]?harm|kill myself|hurt myself|end my life|want to die|wanna die|dont want to live|do not want to live|don’t want to live|not want to be alive|overdos\w*|cutting myself|harm someone|kill someone|cant stay safe|cannot stay safe|can’t stay safe)\b/i.test(text);
}
const urgent={reply:'Your safety matters. If you might act on these thoughts or cannot stay safe, call 911 in the U.S. or your local emergency number. Call or text 988 in the U.S., or use 988lifeline.org for live crisis support. If you can, reach out to someone you trust and stay near them while getting help. Campus Calm cannot provide emergency care.',topic:'Urgent human support',intent:'urgent',urgent:true,action:'Get human support',suggestions:[]};
export function respond(message, history=[], goal='Listen and reflect') {
 if(needsUrgentSupport(message)) return {...urgent,reply:urgent.reply+'\n\nOn Bowie State’s campus, Public Safety is 301-860-4040. BSU also lists 301-860-4164 for urgent or after-hours counseling support.'};
 const bowieQuery=/\b(bowie|bsu)\b/i.test(message);
 if(bowieQuery && /after[ -]?hours|urgent|crisis/i.test(message))return {reply:'Bowie State lists 301-860-4164 for urgent or after-hours counseling support through ProtoCall. For immediate danger, call 911. Campus Public Safety is 301-860-4040. In the U.S., you can also call or text 988. Open Bowie State support for official links.',topic:'Bowie State support',intent:'bowie',urgent:false,action:'View Bowie State support',suggestions:['How can I book counseling at Bowie State?']};
 if(bowieQuery){
  const match=[['wellness',/wellness center|primary care|henry wise/i],['dss',/accommodations?|disabilit|\bdss\b/i],['lgbtqia',/lgbt|gender|supportive community/i],['first-year',/freshman|first[ -]?year|peer counsel/i],['advising',/advising|advisement|class schedule|course planning/i],['financial',/financial aid|financial wellness/i]].find(([,pattern])=>pattern.test(message));
  if(match){const resource=bowieResources.find(r=>r.id===match[0]);return {reply:`${resource.name}: ${resource.description}\n\n${resource.details}${resource.phone?'\nCall '+resource.phone+'.':''}${resource.email?'\nEmail '+resource.email+'.':''}\n\nOpen Bowie State support for the official page and contact links.`,topic:'Bowie State support',intent:'bowie',urgent:false,action:'View Bowie State support',suggestions:['How can I book counseling at Bowie State?','I want to talk more about this']};}
 }
 if(bowieQuery && /counsel|therap|resources?|support|wellness|accommodations/i.test(message))return {reply:`Bowie State Counseling Services offers free counseling for enrolled students. Call ${bowieCounseling.phone} or email ${bowieCounseling.email} to ask about an appointment. The main service page lists Robinson Hall, Suite 2800 and Monday–Friday hours from 8 a.m. to 5:30 p.m.; confirm location and availability when booking.\n\nOpen Bowie State support for official counseling, Wellness Center, accommodations, and other campus contacts. What kind of support are you looking for?`,topic:'Bowie State support',intent:'bowie',urgent:false,action:'View Bowie State support',suggestions:['What mental health support does Bowie have after hours?','I feel stressed about exams']};
 const isFollowup=text=>tokenize(text).length<9 && /^(yes|no|maybe|okay|ok|why|how$|tell me more|that|tomorrow|today|both|not really|i dont know|i don’t know|help me find a next step|i want to talk more about this)\b/i.test(text.trim());
 let {topic,confidence}=classify(message); const previous=history.filter(m=>m.role==='user' && !isFollowup(m.content)).at(-1);
 // Brief follow-ups reuse recent user context only when their own signal is weak.
 const shortFollowup=isFollowup(message);
 if(previous && (shortFollowup || confidence<.25)) {const prior=classify(previous.content); if(prior.confidence>.3){topic=prior.topic;confidence=prior.confidence;}}
 if(topic==='unknown'||confidence<.18) return {reply:'I may be missing what you mean. I work best with college wellness topics such as school pressure, loneliness, sleep, relationships, and money stress. Could you describe what happened or how you have been feeling?',topic:'Let’s clarify',intent:'unknown',urgent:false,action:'Choose a topic',suggestions:['I feel stressed about exams','I feel lonely on campus','I cannot sleep']};
 const g=guidance[topic]; const turns=history.filter(m=>m.role==='user').length;
 let reply=g.intro;
 if(g.steps.length) {
  if(goal==='Find a next step') reply+='\n\nA small next step: '+g.steps[turns%g.steps.length];
  else if(goal==='Try a coping tool') reply+='\n\n'+'Try the grounding exercise in Reset to notice your surroundings. Stop if the exercise feels uncomfortable.';
  else if(previous && classify(previous.content).topic===topic) reply+='\n\nWe can keep focusing on '+g.label.toLowerCase()+'. '+g.steps[turns%g.steps.length];
  else reply+='\n\n'+g.steps[0];
 }
 reply+='\n\n'+g.question;
 if(topic==='care'||topic==='lowmood')reply+=`\n\nFor Bowie State students: contact Counseling Services at ${bowieCounseling.phone} or ${bowieCounseling.email}.`; 
 return {reply,topic:g.label,intent:topic,urgent:false,action:goal==='Try a coping tool'&&g.steps.length?'Try grounding':g.action,suggestions:topic==='greeting'?['I feel stressed about exams','I feel lonely on campus','I cannot sleep']:['Help me find a next step','I want to talk more about this','Bowie State counseling resources']};
}
export const modelInfo={type:'Multinomial Naive Bayes',topics:Object.keys(corpus).length,trainingExamples:Object.values(corpus).flat().length,externalAI:false};
