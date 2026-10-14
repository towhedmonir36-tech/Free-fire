(()=>{'use strict';
const canvas=document.getElementById('game'),ctx=canvas.getContext('2d'),mini=document.getElementById('minimap'),mctx=mini.getContext('2d');
const $=id=>document.getElementById(id);
let W=0,H=0,dpr=1,last=0,running=false,ended=false,worldSize=2200,camera={x:0,y:0},player,bots=[],bullets=[],loot=[],decor=[],zone,elapsed=0,kills=0,ammo=30,reserve=120,reloadTimer=0,fireCooldown=0,joy={x:0,y:0},fireHeld=false,aimMode=false,notice='',noticeT=0,keys={};
const rand=(a,b)=>a+Math.random()*(b-a),dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function resize(){dpr=Math.min(devicePixelRatio||1,2);W=innerWidth;H=innerHeight;canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);ctx.setTransform(dpr,0,0,dpr,0,0)}
addEventListener('resize',resize);resize();
function reset(){player={x:worldSize/2+rand(-90,90),y:worldSize/2+rand(-90,90),r:13,angle:0,hp:100,speed:225,inv:0};bots=[];bullets=[];loot=[];decor=[];elapsed=0;kills=0;ammo=30;reserve=120;reloadTimer=0;fireCooldown=0;ended=false;zone={x:worldSize/2,y:worldSize/2,r:1000,startR:1000,minR:105,t:0,duration:190};for(let i=0;i<12;i++){let p=randomPointFar(player,260);bots.push({x:p.x,y:p.y,r:12,hp:100,angle:rand(0,6.28),speed:rand(72,106),think:rand(.2,2),shoot:rand(.4,1.8),alive:true,flash:0})}for(let i=0;i<38;i++){const p={x:rand(70,worldSize-70),y:rand(70,worldSize-70)};loot.push({...p,type:Math.random()<.45?'ammo':Math.random()<.5?'med':'ammo',r:9})}for(let i=0;i<250;i++)decor.push({x:rand(0,worldSize),y:rand(0,worldSize),type:Math.random()<.76?'tree':'rock',s:rand(.65,1.5),rot:rand(0,6.28)});camera.x=player.x-W/2;camera.y=player.y-H/2;running=true;$('overlay').style.display='none';noticeMsg('Find supplies. Stay in the zone!');}
function randomPointFar(p,min){let q;do{q={x:rand(80,worldSize-80),y:rand(80,worldSize-80)}}while(dist(p,q)<min);return q}
function noticeMsg(s){notice=s;noticeT=2.5}
function finish(win){if(ended)return;ended=true;running=false;$('title').textContent=win?'BOOYAH!':'ELIMINATED';$('desc').textContent=win?'You are the last survivor. Total eliminations: '+kills+'.':'You were eliminated. Eliminations: '+kills+'. Ready for another drop?';$('start').textContent='PLAY AGAIN';$('overlay').style.display='flex'}
$('start').addEventListener('click',reset);
function reload(){if(reloadTimer<=0&&ammo<30&&reserve>0){reloadTimer=1.15;noticeMsg('Reloading…')}}
$('reload').addEventListener('pointerdown',e=>{e.preventDefault();reload()});
$('aim').addEventListener('pointerdown',e=>{e.preventDefault();aimMode=!aimMode;$('aim').style.borderColor=aimMode?'#b8f34a':'#ffffff66';noticeMsg(aimMode?'Aim assist on':'Aim assist off')});
const joybase=$('joybase'),joyknob=$('joy');let joyPointer=null;
function setJoy(e){const r=joybase.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,dx=e.clientX-cx,dy=e.clientY-cy,max=42,len=Math.hypot(dx,dy)||1,k=Math.min(1,max/len);joy.x=dx/len*k;joy.y=dy/len*k;joyknob.style.transform='translate('+joy.x*max+'px,'+joy.y*max+'px)'}
joybase.addEventListener('pointerdown',e=>{e.preventDefault();joyPointer=e.pointerId;joybase.setPointerCapture(e.pointerId);setJoy(e)});
joybase.addEventListener('pointermove',e=>{if(e.pointerId===joyPointer)setJoy(e)});
function releaseJoy(e){if(e.pointerId!==joyPointer)return;joyPointer=null;joy.x=joy.y=0;joyknob.style.transform='translate(0,0)'}
joybase.addEventListener('pointerup',releaseJoy);joybase.addEventListener('pointercancel',releaseJoy);
const fireBtn=$('fire');fireBtn.addEventListener('pointerdown',e=>{e.preventDefault();fireHeld=true;fireBtn.setPointerCapture(e.pointerId);if(!running){return}});['pointerup','pointercancel','lostpointercapture'].forEach(ev=>fireBtn.addEventListener(ev,()=>fireHeld=false));
addEventListener('keydown',e=>{keys[e.key.toLowerCase()]=true;if([' ','arrowup','arrowdown','arrowleft','arrowright'].includes(e.key.toLowerCase()))e.preventDefault();if(e.key.toLowerCase()==='r')reload();if(e.key.toLowerCase()===' ')fireHeld=true});
addEventListener('keyup',e=>{keys[e.key.toLowerCase()]=false;if(e.key===' ')fireHeld=false});
canvas.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&running){const w=screenToWorld(e.clientX,e.clientY);player.angle=Math.atan2(w.y-player.y,w.x-player.x);fireHeld=true}});
canvas.addEventListener('pointerup',e=>{if(e.pointerType==='mouse')fireHeld=false});
function screenToWorld(x,y){return{x:x+camera.x,y:y+camera.y}}
function nearestEnemy(){let best=null,bd=Infinity;for(const b of bots){if(!b.alive)continue;let d=dist(player,b);if(d<bd){best=b;bd=d}}return best}
function shoot(){if(ammo<=0){reload();return}const target=nearestEnemy();if(aimMode&&target)player.angle=Math.atan2(target.y-player.y,target.x-player.x);ammo--;fireCooldown=.16;const spread=aimMode?.035:.105,ang=player.angle+rand(-spread,spread);bullets.push({x:player.x+Math.cos(ang)*19,y:player.y+Math.sin(ang)*19,vx:Math.cos(ang)*680,vy:Math.sin(ang)*680,life:1.15,owner:'p',damage:34});}
function botShoot(b){const a=Math.atan2(player.y-b.y,player.x-b.x)+rand(-.13,.13);bullets.push({x:b.x+Math.cos(a)*16,y:b.y+Math.sin(a)*16,vx:Math.cos(a)*400,vy:Math.sin(a)*400,life:1.5,owner:'b',damage:7})}
function update(dt){elapsed+=dt;player.inv=Math.max(0,player.inv-dt);fireCooldown-=dt;if(reloadTimer>0){reloadTimer-=dt;if(reloadTimer<=0){let n=Math.min(30-ammo,reserve);ammo+=n;reserve-=n;noticeMsg('Reload complete')}}zone.t=Math.min(1,elapsed/zone.duration);zone.r=zone.startR+(zone.minR-zone.startR)*zone.t;zone.r=Math.max(zone.minR,zone.r);
let mx=joy.x+(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0),my=joy.y+(keys.s||keys.arrowdown?1:0)-(keys.w||keys.arrowup?1:0),ml=Math.hypot(mx,my);if(ml>1){mx/=ml;my/=ml}
if(mx||my){player.x+=mx*player.speed*dt;player.y+=my*player.speed*dt;if(!aimMode)player.angle=Math.atan2(my,mx)}
player.x=clamp(player.x,18,worldSize-18);player.y=clamp(player.y,18,worldSize-18);
if(fireHeld&&fireCooldown<=0&&reloadTimer<=0)shoot();
if(noticeT>0)noticeT-=dt;
for(const b of bots){if(!b.alive)continue;b.think-=dt;b.shoot-=dt;b.flash=Math.max(0,b.flash-dt);let d=dist(player,b),inZone=Math.hypot(b.x-zone.x,b.y-zone.y)<zone.r;
if(b.think<=0){b.think=rand(.45,1.4);if(d<480){b.angle=Math.atan2(player.y-b.y,player.x-b.x)+rand(-1.1,1.1)}else b.angle=rand(0,6.28)}
let sp=b.speed;if(d<230){b.x-=Math.cos(b.angle)*sp*.45*dt;b.y-=Math.sin(b.angle)*sp*.45*dt}else{b.x+=Math.cos(b.angle)*sp*dt;b.y+=Math.sin(b.angle)*sp*dt}
b.x=clamp(b.x,20,worldSize-20);b.y=clamp(b.y,20,worldSize-20);
if(d<430&&b.shoot<=0){botShoot(b);b.shoot=rand(.9,1.9)}
if(!inZone)b.hp-=5*dt;
if(b.hp<=0){b.alive=false;kills++;if(Math.random()<.6)loot.push({x:b.x,y:b.y,type:'ammo',r:9})}
}
for(let i=bullets.length-1;i>=0;i--){const z=bullets[i];z.x+=z.vx*dt;z.y+=z.vy*dt;z.life-=dt;let hit=false;if(z.owner==='p'){for(const b of bots){if(!b.alive)continue;if(Math.hypot(z.x-b.x,z.y-b.y)<b.r+4){b.hp-=z.damage;b.flash=.1;hit=true;if(b.hp<=0){b.alive=false;kills++;if(Math.random()<.7)loot.push({x:b.x,y:b.y,type:'ammo',r:9})}break}}}else if(Math.hypot(z.x-player.x,z.y-player.y)<player.r+4){player.hp-=z.damage;hit=true}
if(hit||z.life<=0||z.x<0||z.y<0||z.x>worldSize||z.y>worldSize)bullets.splice(i,1)}
for(let i=loot.length-1;i>=0;i--){const l=loot[i];if(dist(player,l)<28){if(l.type==='med'){if(player.hp<100){player.hp=Math.min(100,player.hp+30);noticeMsg('+30 HEALTH')}else continue}else{reserve+=30;noticeMsg('+30 AMMO')}loot.splice(i,1)}}
if(Math.hypot(player.x-zone.x,player.y-zone.y)>zone.r){player.hp-=8*dt;if(Math.random()<dt*.6)noticeMsg('WARNING: OUTSIDE SAFE ZONE!')}
if(player.hp<=0){player.hp=0;finish(false)}
if(bots.filter(b=>b.alive).length===0&&!ended)finish(true);
camera.x=clamp(player.x-W/2,0,worldSize-W);camera.y=clamp(player.y-H/2,0,worldSize-H);
$('alive').textContent=bots.filter(b=>b.alive).length+(player.hp>0?1:0);$('kills').textContent=kills;$('healthnum').textContent=Math.ceil(player.hp)+' / 100';$('healthfill').style.width=player.hp+'%';$('ammoNum').textContent=ammo;$('reserve').textContent=reserve;$('zone').textContent=zone.t<1?'CLOSING':'FINAL';$('hint').textContent=noticeT>0?notice:(reloadTimer>0?'RELOADING…':'');
}
function drawGround(){ctx.fillStyle='#526e48';ctx.fillRect(0,0,worldSize,worldSize);ctx.strokeStyle='#ffffff0b';ctx.lineWidth=1;for(let x=0;x<=worldSize;x+=100){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,worldSize);ctx.stroke()}for(let y=0;y<=worldSize;y+=100){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(worldSize,y);ctx.stroke()}
ctx.fillStyle='#b2a17c';ctx.beginPath();ctx.moveTo(130,480);ctx.bezierCurveTo(420,350,470,780,800,720);ctx.bezierCurveTo(1120,650,1210,950,1470,1000);ctx.bezierCurveTo(1700,1050,1840,1350,2200,1280);ctx.lineTo(2200,1360);ctx.bezierCurveTo(1800,1440,1670,1130,1440,1080);ctx.bezierCurveTo(1170,1020,1090,730,810,790);ctx.bezierCurveTo(470,860,390,420,150,550);ctx.closePath();ctx.fill();
ctx.fillStyle='#7b9060';ctx.fillRect(330,190,300,170);ctx.fillRect(1560,300,300,240);ctx.fillStyle='#a5a879';ctx.fillRect(370,220,220,110);ctx.fillRect(1600,340,220,150);
for(const d of decor){if(d.x<camera.x-35||d.x>camera.x+W+35||d.y<camera.y-35||d.y>camera.y+H+35)continue;ctx.save();ctx.translate(d.x,d.y);ctx.rotate(d.rot);if(d.type==='tree'){ctx.fillStyle='#324e35';ctx.beginPath();ctx.arc(2,5,13*d.s,0,Math.PI*2);ctx.fill();ctx.fillStyle='#3f7040';ctx.beginPath();ctx.arc(-3,-2,12*d.s,0,Math.PI*2);ctx.fill();ctx.fillStyle='#578447';ctx.beginPath();ctx.arc(-6,-5,7*d.s,0,Math.PI*2);ctx.fill()}else{ctx.fillStyle='#777c6b';ctx.beginPath();ctx.ellipse(0,0,9*d.s,6*d.s,0,0,Math.PI*2);ctx.fill()}ctx.restore()}}
function circle(x,y,r,fill,stroke){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke()}}
function drawActor(a,isPlayer){ctx.save();ctx.translate(a.x,a.y);ctx.rotate(a.angle);ctx.fillStyle='#0005';ctx.beginPath();ctx.ellipse(2,6,a.r*1.25,a.r*.9,0,0,Math.PI*2);ctx.fill();circle(0,0,a.r,isPlayer?'#e9bd72':(a.flash>0?'#fff':'#d35b4b'),isPlayer?'#fff0b5':'#632b2b');ctx.fillStyle=isPlayer?'#294c7b':'#5a3030';ctx.fillRect(-a.r*.4,-a.r*.75,a.r*1.05,a.r*1.5);ctx.fillStyle='#252a2d';ctx.fillRect(2,-3,a.r+11,6);ctx.fillStyle='#ddd';ctx.fillRect(a.r+8,-2,5,4);ctx.restore();if(!isPlayer&&a.hp<100){ctx.fillStyle='#222';ctx.fillRect(a.x-13,a.y-21,26,4);ctx.fillStyle='#e25c4c';ctx.fillRect(a.x-13,a.y-21,26*Math.max(0,a.hp)/100,4)}}
function render(){ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,W,H);ctx.save();ctx.translate(-camera.x,-camera.y);drawGround();
ctx.save();ctx.fillStyle='#3b86b866';ctx.beginPath();ctx.rect(0,0,worldSize,worldSize);ctx.arc(zone.x,zone.y,zone.r,0,Math.PI*2,true);ctx.fill('evenodd');ctx.restore();ctx.strokeStyle='#a9e9ff';ctx.lineWidth=4;ctx.setLineDash([15,9]);ctx.beginPath();ctx.arc(zone.x,zone.y,zone.r,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
for(const l of loot){circle(l.x,l.y,13,l.type==='med'?'#49cf8a':'#f4cf58','#fff');ctx.fillStyle='#202b25';ctx.font='bold 13px system-ui';ctx.textAlign='center';ctx.fillText(l.type==='med'?'+':'A',l.x,l.y+5)}
for(const b of bullets){circle(b.x,b.y,3.5,b.owner==='p'?'#fff19a':'#ff7867')}
for(const b of bots)if(b.alive)drawActor(b,false);drawActor(player,true);
ctx.restore();drawMini();if(!running&&!ended){ctx.fillStyle='#0002';ctx.fillRect(0,0,W,H)}}
function drawMini(){const w=mini.width,h=mini.height;mctx.clearRect(0,0,w,h);mctx.fillStyle='#4f6d4c';mctx.fillRect(0,0,w,h);mctx.fillStyle='#7b9060';mctx.fillRect(w*.15,h*.12,w*.22,h*.16);mctx.fillRect(w*.67,h*.42,w*.2,h*.2);mctx.strokeStyle='#c0eeff';mctx.lineWidth=3;mctx.beginPath();mctx.arc(zone.x/worldSize*w,zone.y/worldSize*h,zone.r/worldSize*w,0,Math.PI*2);mctx.stroke();for(const b of bots)if(b.alive){mctx.fillStyle='#ff6759';mctx.fillRect(b.x/worldSize*w-2,b.y/worldSize*h-2,4,4)}if(player){mctx.fillStyle='#fff';mctx.beginPath();mctx.arc(player.x/worldSize*w,player.y/worldSize*h,4,0,Math.PI*2);mctx.fill()}}
function loop(t){const dt=Math.min(.035,(t-last)/1000||0);last=t;if(running)update(dt);if(player)render();requestAnimationFrame(loop)}
requestAnimationFrame(loop);
})();
