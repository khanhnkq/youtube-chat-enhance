// usage: node profile.mjs <seconds> <outname>
const secs = +process.argv[2] || 10, out = process.argv[3] || 'run';
const fs = await import('fs');
const baseUrl = process.env.CDP_URL || 'http://localhost:9222';
const targets = await (await fetch(`${baseUrl}/json`)).json();
const t = targets.find(x => x.type === 'page' && x.url.includes('youtube.com/watch'));
if (!t) { console.log('no yt tab'); process.exit(1); }
const ws = new WebSocket(t.webSocketDebuggerUrl);
let id = 0; const pend = new Map();
const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m.result || m); pend.delete(m.id); } };
await new Promise(r => ws.onopen = r);
await send('Performance.enable');
await send('Profiler.enable');
await send('Profiler.setSamplingInterval', { interval: 200 });
const m0 = (await send('Performance.getMetrics')).metrics;
// frame timing + long tasks in page main world
await send('Runtime.evaluate', { expression: `(()=>{const tok=window.__pfTok=(window.__pfTok||0)+1;if(window.__pfObs)window.__pfObs.disconnect();const pf=window.__pf={f:[],lt:0,ltms:0};(function l(t){if(window.__pfTok!==tok)return;pf.f.push(t);if(pf.f.length<100000)requestAnimationFrame(l)})(performance.now());try{window.__pfObs=new PerformanceObserver(l=>{for(const e of l.getEntries()){pf.lt++;pf.ltms+=e.duration}});window.__pfObs.observe({type:'longtask'})}catch(e){}})()` });
await send('Profiler.start');
await new Promise(r => setTimeout(r, secs * 1000));
const prof = (await send('Profiler.stop')).profile;
const m1 = (await send('Performance.getMetrics')).metrics;
const pf = (await send('Runtime.evaluate', { expression: `(()=>{window.__pfTok++;const f=__pf.f;const d=[];for(let i=1;i<f.length;i++)d.push(f[i]-f[i-1]);d.sort((a,b)=>a-b);return JSON.stringify({frames:d.length,fps:d.length/((f[f.length-1]-f[0])/1000),p50:d[d.length>>1],p95:d[Math.floor(d.length*0.95)],over33:d.filter(x=>x>33).length,longTasks:__pf.lt,longTaskMs:Math.round(__pf.ltms),iframes:document.querySelectorAll('iframe').length,canvas:(()=>{const c=document.querySelector('.yt-danmaku-canvas');return c?c.width+'x'+c.height:null})()})})()`, returnByValue: true })).result.value;
const get = (m, n) => (m.find(x => x.name === n) || {}).value;
const delta = n => +(get(m1, n) - get(m0, n)).toFixed(3);
// self time by url
const dt = {}; const byId = new Map(prof.nodes.map(n => [n.id, n]));
for (let i = 0; i < prof.samples.length; i++) { const n = byId.get(prof.samples[i]); const k = (n.callFrame.url || '(' + n.callFrame.functionName + ')'); dt[k] = (dt[k] || 0) + (prof.timeDeltas[i] || 0); }
const byFn = {};
for (let i = 0; i < prof.samples.length; i++) { const n = byId.get(prof.samples[i]); if (!n.callFrame.url.startsWith('chrome-extension')) continue; const k = n.callFrame.url.split('/').pop() + ':' + n.callFrame.functionName + ':' + n.callFrame.lineNumber; byFn[k] = (byFn[k] || 0) + (prof.timeDeltas[i] || 0); }
const top = (o, k) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, k).map(([a, b]) => `${(b / 1000).toFixed(0)}ms ${a.slice(-90)}`);
const res = { out, secs, page: JSON.parse(pf), TaskDuration: delta('TaskDuration'), ScriptDuration: delta('ScriptDuration'), LayoutDuration: delta('LayoutDuration'), RecalcStyleDuration: delta('RecalcStyleDuration'), LayoutCount: delta('LayoutCount'), JSHeapMB: +(get(m1, 'JSHeapUsedSize') / 1e6).toFixed(1), Nodes: get(m1, 'Nodes'), topUrls: top(dt, 8), topExtFns: top(byFn, 12) };
fs.mkdirSync('./perf-results', { recursive: true });
fs.writeFileSync(`./perf-results/${out}.json`, JSON.stringify(res, null, 1));
console.log(JSON.stringify(res, null, 1)); process.exit(0);
