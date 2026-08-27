function sameOrder(first,second){return Array.isArray(first)&&Array.isArray(second)&&first.length===second.length&&first.every((value,index)=>value===second[index])}

function randomIndex(max){
  if(max<=1)return 0;
  const values=new Uint32Array(1);crypto.getRandomValues(values);
  return values[0]%max;
}

function shuffle(values){
  const result=[...values];
  for(let index=result.length-1;index>0;index--){const target=randomIndex(index+1);[result[index],result[target]]=[result[target],result[index]]}
  return result;
}

function distinctShuffle(values,previous){
  const result=shuffle(values);
  if(result.length>1&&sameOrder(result,previous))return [...result.slice(1),result[0]];
  return result;
}

export function parseOrder(value,fallback){
  try{const parsed=typeof value==='string'?JSON.parse(value):value;return Array.isArray(parsed)&&parsed.length===fallback.length?parsed:fallback}catch{return fallback}
}

export function parseOptionOrders(value){
  try{const parsed=typeof value==='string'?JSON.parse(value):value;return parsed&&typeof parsed==='object'&&!Array.isArray(parsed)?parsed:{}}catch{return {}}
}

export function buildAttemptOrders(questions,{shuffleQuestions=false,shuffleOptions=false}={},previous={}){
  const questionIds=questions.map(question=>question.id);
  const previousQuestions=parseOrder(previous.questionOrder,questionIds);
  const previousOptions=parseOptionOrders(previous.optionOrders);
  const questionOrder=shuffleQuestions?distinctShuffle(questionIds,previousQuestions):questionIds;
  const optionOrders={};
  for(const question of questions){
    const optionCount=Array.isArray(question.options)?question.options.length:Number(question.optionCount||0);
    const natural=Array.from({length:optionCount},(_,index)=>index);
    optionOrders[question.id]=shuffleOptions?distinctShuffle(natural,previousOptions[question.id]):natural;
  }
  return {questionOrder,optionOrders};
}

export function presentQuestions(questions,questionOrder,optionOrders){
  const byId=new Map(questions.map(question=>[question.id,question]));
  const orderedIds=parseOrder(questionOrder,questions.map(question=>question.id));
  const matched=orderedIds.map(id=>byId.get(id)).filter(Boolean);const orderedQuestions=matched.length===questions.length?matched:questions;
  return orderedQuestions.map(question=>{
    const natural=question.options.map((_,index)=>index);const order=parseOrder(optionOrders?.[question.id],natural);
    return {...question,options:order.map(index=>question.options[index])};
  });
}

export function toOriginalOption(displayIndex,question,optionOrders){
  const natural=question.options.map((_,index)=>index);const order=parseOrder(optionOrders?.[question.id],natural);
  return Number.isInteger(displayIndex)&&displayIndex>=0&&displayIndex<order.length?Number(order[displayIndex]):-1;
}

export function toDisplayOption(originalIndex,question,optionOrders){
  const natural=question.options.map((_,index)=>index);const order=parseOrder(optionOrders?.[question.id],natural);
  return order.indexOf(Number(originalIndex));
}
