import worker from '../../worker/site-worker.js';

export async function onRequest(context) {
  return worker.fetch(context.request, context.env);
}
