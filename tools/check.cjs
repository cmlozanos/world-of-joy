const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
function files(dir){return fs.readdirSync(path.join(root,dir),{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(dir+'/'+e.name):[dir+'/'+e.name]);}
for(const file of ['learning-gate.js','gate-session.js','sw.js',...files('src').filter(f=>f.endsWith('.js'))]){
 const source=fs.readFileSync(path.join(root,file),'utf8');
 const result=spawnSync(process.execPath,['--input-type=module','--check'],{input:source,encoding:'utf8'});
 assert.equal(result.status,0,file+': '+result.stderr);
}
const gate=require('../learning-gate.js');assert.equal(gate.Core.interval,600000);
const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.json'),'utf8'));assert.equal(manifest.scope,'./');
for(const icon of manifest.icons){const png=fs.readFileSync(path.join(root,icon.src)),size=Number(icon.sizes.split('x')[0]);assert.equal(icon.type,'image/png');assert.equal(png.toString('hex',0,8),'89504e470d0a1a0a');assert.equal(png.readUInt32BE(16),size);assert.equal(png.readUInt32BE(20),size);}
// Exercise adapter lifecycle without a GPU: the UI gate itself is independently tested.
const handlers={},button={textContent:'',setAttribute:(key,value)=>handlers[key]=value,getAttribute:key=>handlers[key],addEventListener:(key,fn)=>handlers[key]=fn};
let callbacks,timersPaused=false;
const learning={createTimers:()=>({pause:()=>timersPaused=true,resume:()=>timersPaused=false}),mount:options=>{callbacks=options;options.onLock();return{check:()=>{}};}};
const windowMock={LearningGate:learning};
vm.runInNewContext(fs.readFileSync(path.join(root,'gate-session.js'),'utf8'),{window:windowMock,LearningGate:learning,document:{getElementById:()=>button}});
const audio={state:'running',suspend(){this.state='suspended';return Promise.resolve();},resume(){this.state='running';return Promise.resolve();}};
const sample={isRunning:true,input:{keys:{ArrowUp:true},setVirtualTurnAxis(value){this.axis=value;}},sound:{getAudioContext:()=>audio,cancelSpeech:()=>{}},clock:{getDelta:()=>0}};
windowMock.WorldLearning.attach(sample);assert.equal(audio.state,'suspended');assert.equal(Object.keys(sample.input.keys).length,0);assert.equal(timersPaused,true);
callbacks.onUnlock();assert.equal(audio.state,'suspended','sound remains OFF after first challenge');assert.equal(timersPaused,false);
handlers.click();assert.equal(audio.state,'running');callbacks.onLock();assert.equal(audio.state,'suspended');assert.equal(timersPaused,true);
callbacks.onUnlock();assert.equal(audio.state,'running','enabled audio resumes');audio.state='suspended';callbacks.onLock();callbacks.onUnlock();assert.equal(audio.state,'suspended','manually suspended audio remains suspended');
for(const file of ['main','WordGame','NumberGame','RacingGame']){
 const source=fs.readFileSync(path.join(root,'src',file+'.js'),'utf8');
 assert.match(source,/WorldLearning\.attach\(this\)/);assert.match(source,/WorldLearning\.blocked\(\)/);
}
assert.match(fs.readFileSync(path.join(root,'src/engine/WellbeingManager.js'),'utf8'),/BREAK_AFTER_SECONDS = 12 \* 60/);
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');assert.match(html,/href="https:\/\/cmlozanos.github.io\/games\/"/);assert.ok(html.indexOf('learning-gate.js')<html.indexOf('src/main.js'));
const listeners={},deleted=[];const sandbox={self:{registration:{scope:'https://example.test/world-of-joy/'},addEventListener:(name,fn)=>listeners[name]=fn,skipWaiting:()=>Promise.resolve(),clients:{claim:()=>Promise.resolve()}},caches:{keys:()=>Promise.resolve(['other-game-sentinel','world-of-joy-old']),delete:key=>{deleted.push(key);return Promise.resolve(true);}},URL};
vm.createContext(sandbox);vm.runInContext(fs.readFileSync(path.join(root,'sw.js'),'utf8'),sandbox);
const assets=vm.runInContext('PRECACHE_URLS',sandbox);
for(const file of assets)assert.ok(fs.existsSync(path.join(root,file)),file+' exists');
for(const file of files('src').filter(f=>/\.(js|css)$/.test(f)))assert.ok(assets.includes(file),file+' cached');
assert.ok(assets.includes('vendor/three.module.js'));assert.ok(assets.includes('learning-gate.js'));assert.ok(assets.includes('gate-session.js'));
let activation;listeners.activate({waitUntil:p=>activation=p});
activation.then(()=>{assert.deepEqual(deleted,['world-of-joy-old']);console.log('World of Joy: four gated modes, syntax, local assets, 10-minute gate, preserved wellbeing and isolated caches verified.');}).catch(error=>{console.error(error);process.exitCode=1;});
