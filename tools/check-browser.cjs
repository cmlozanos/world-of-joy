const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('@playwright/test');
const root=path.resolve(__dirname,'..');
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.json':'application/json'};
async function solve(page){const value=await page.locator('#gate-prompt').textContent(),m=value.match(/(\d)\s*([+−-])\s*(\d)/);assert.ok(m);const answer=m[2]==='+'?+m[1]+ +m[3]:+m[1]- +m[3];await page.locator('[data-gate-key="'+answer+'"]').click();await page.waitForSelector('#learning-gate',{state:'detached'});}
(async()=>{
 const server=http.createServer((req,res)=>{const url=new URL(req.url,'http://localhost'),file=path.resolve(root,'.'+(url.pathname.endsWith('/')?url.pathname+'index.html':url.pathname));if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);res.end();return;}res.setHeader('content-type',types[path.extname(file)]||'application/octet-stream');res.end(data);});});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 let browser;
 try{
  browser=await chromium.launch({headless:true,...(process.env.CHROME95_PATH?{executablePath:process.env.CHROME95_PATH}:{})});
  const context=await browser.newContext({viewport:process.env.WORLD_PHONE?{width:360,height:740}:{width:1024,height:768},hasTouch:true,isMobile:true});
  const page=await context.newPage(),errors=[],remote=[];page.setDefaultTimeout(10000);page.on('pageerror',error=>errors.push(error.message));page.on('request',req=>{if(!req.url().startsWith('http://127.0.0.1')&&!req.url().startsWith('data:'))remote.push(req.url());});
  await page.addInitScript(()=>{Math.random=()=>.1;const now=Date.now;window.testOffset=0;Date.now=()=>now()+window.testOffset;});
  await page.goto('http://127.0.0.1:'+server.address().port+'/?test=1');await page.waitForSelector('#learning-gate');await solve(page);await page.waitForFunction(()=>typeof window.__worldRead==='function');
  assert.equal(await page.locator('#global-home-btn').getAttribute('href'),'https://cmlozanos.github.io/games/');
  assert.equal(await page.locator('#global-sound-btn').getAttribute('aria-pressed'),'false');
  if(process.env.WORLD_SCREENSHOT_DIR){fs.mkdirSync(process.env.WORLD_SCREENSHOT_DIR,{recursive:true});await page.screenshot({path:path.join(process.env.WORLD_SCREENSHOT_DIR,'menu.png')});}
  if(process.env.WORLD_PHONE){const title=await page.locator('#start-screen h1').boundingBox(),home=await page.locator('#global-home-btn').boundingBox();assert.ok(title.y>=home.y+home.height,'title clears navigation');}
  for(const button of ['start-button','word-mode-button','number-mode-button','racing-mode-button']){
   await page.locator('#'+button).click();
   await page.waitForFunction(()=>__worldRead().some(g=>g.running),null,{timeout:20000});
   await page.waitForFunction(()=>__worldRead().some(g=>g.running&&g.state==='PLAYING'),null,{timeout:15000});
   if(process.env.WORLD_SCREENSHOT_DIR){fs.mkdirSync(process.env.WORLD_SCREENSHOT_DIR,{recursive:true});await page.screenshot({path:path.join(process.env.WORLD_SCREENSHOT_DIR,button+'.png')});}
   if(process.env.WORLD_PHONE&&(button==='word-mode-button'||button==='number-mode-button')){const panel=await page.locator(button==='word-mode-button'?'#word-display-panel':'#number-display-panel').boundingBox(),home=await page.locator('#global-home-btn').boundingBox();assert.ok(panel.y>=home.y+home.height,'educational content clears navigation');}
   await page.waitForFunction(()=>__worldRead().find(g=>g.running).audio==='suspended');
   await page.locator('#global-sound-btn').click();
   await page.waitForFunction(()=>__worldRead().find(g=>g.running).audio==='running');
   const before=await page.evaluate(()=>__worldRead().find(g=>g.running).position);
   await page.keyboard.down('ArrowUp');await page.waitForTimeout(350);await page.keyboard.up('ArrowUp');
   assert.notDeepEqual(await page.evaluate(()=>__worldRead().find(g=>g.running).position),before,'movement '+button);
   let touch;
   if(button==='start-button'){
    touch=await context.newCDPSession(page);const box=await page.locator('#joystick-base:visible').first().boundingBox(),x=box.x+box.width/2,y=box.y+box.height/2;
    const touchBefore=await page.evaluate(()=>__worldRead().find(g=>g.running).position);
    await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1}]});
    await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y-50,id:1}]});await page.waitForTimeout(250);
    assert.notDeepEqual(await page.evaluate(()=>__worldRead().find(g=>g.running).position),touchBefore,'native joystick moves explorer');
   }
   await page.evaluate(()=>{window.testOffset+=600001;window.dispatchEvent(new Event('focus'));});await page.waitForSelector('#learning-gate');
   if(touch){await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await touch.detach();assert.equal(await page.evaluate(()=>__worldRead().some(g=>Object.values(g.keys).some(Boolean))),false,'held controls cleared');}
   await page.waitForFunction(()=>__worldRead().every(g=>g.audio===null||g.audio==='suspended'));
   const frozen=await page.evaluate(()=>__worldRead());await page.waitForTimeout(250);assert.deepEqual(await page.evaluate(()=>__worldRead()),frozen,'frozen '+button);
   await solve(page);await page.waitForTimeout(120);
   assert.notDeepEqual(await page.evaluate(()=>__worldRead()),frozen,'resumed '+button);
   await page.waitForFunction(()=>__worldRead().find(g=>g.running).audio==='running');
   await page.locator('#global-sound-btn').click();
   await page.locator(button==='word-mode-button'?'#word-back-btn':button==='number-mode-button'?'#number-back-btn':'#hud-back-btn').click();
   await page.waitForSelector('#start-screen',{state:'visible'});
   console.log(button+': movement, challenge, audio and internal menu passed');
  }
  await page.evaluate(()=>navigator.serviceWorker.ready);await context.setOffline(true);await page.reload();await page.waitForSelector('#learning-gate');await solve(page);await page.waitForFunction(()=>typeof __worldRead==='function');
  await page.locator('#word-mode-button').click();await page.waitForFunction(()=>__worldRead().some(g=>g.running));
  assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);console.log('World of Joy '+await browser.version()+': four modes move, freeze/resume, internal menu, external home and offline gate passed.');
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
