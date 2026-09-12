#!/usr/bin/env node
const http = require('http');

const baseUrl = process.env.LLM_WIKI_API_BASE_URL || 'http://127.0.0.1:19828';
const token = process.env.LLM_WIKI_API_TOKEN || '';

const args = process.argv.slice(2);
const command = args[0] || 'health';

async function request(endpoint, options = {}) {
  const url = new URL(endpoint, baseUrl);
  const headers = { ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const res = await fetch(url.toString(), { ...options, headers });
    const data = await res.json();
    return data;
  } catch (err) {
    return { error: err.message, note: 'Is LLM Wiki desktop app running at ' + baseUrl + '?' };
  }
}

async function main() {
  if (command === 'health') {
    const res = await request('/api/v1/health');
    console.log(JSON.stringify(res, null, 2));
  } else if (command === 'projects') {
    const res = await request('/api/v1/projects');
    console.log(JSON.stringify(res, null, 2));
  } else if (command === 'search') {
    const query = args[1] || '';
    const res = await request('/api/v1/projects/current/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, topK: 5 })
    });
    console.log(JSON.stringify(res, null, 2));
  } else {
    console.log('Usage: node query.mjs [health | projects | search "<query>"]');
  }
}

main();
