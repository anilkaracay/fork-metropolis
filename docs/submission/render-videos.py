"""Render the editable timeline from genuine local Chrome captures.
Requires Pillow and ffmpeg; raw captures remain local until publication approval.
"""
from pathlib import Path
import json,subprocess,textwrap
from PIL import Image,ImageDraw,ImageFont
ROOT=Path(__file__).resolve().parents[2]
plan=json.loads((ROOT/'docs/submission/timeline.json').read_text())
raw=ROOT/plan['rawRoot'];out=ROOT/plan['exportsRoot'];out.mkdir(parents=True,exist_ok=True)
font='/System/Library/Fonts/Supplemental/Arial.ttf'
titleFont=ImageFont.truetype(font,42);captionFont=ImageFont.truetype(font,34);labelFont=ImageFont.truetype(font,20)
for name in ['technical-demo','founder-pitch']:
 scenes=plan[name];frames=out/name;frames.mkdir(exist_ok=True);playlist=[];total=sum(s['duration']for s in scenes);elapsed=0
 for i,scene in enumerate(scenes):
  sources=list(range(scene['firstFrame'],scene['lastFrame']+1));dt=scene['duration']/len(sources)
  for j,k in enumerate(sources):
   shot=Image.open(raw/scene['clip']/f'{k:04}.png').convert('RGB');shot.thumbnail((1880,860),Image.Resampling.LANCZOS)
   canvas=Image.new('RGB',(1920,1080),'#0B0D10');draw=ImageDraw.Draw(canvas);x=(1920-shot.width)//2;y=42+(860-shot.height)//2;canvas.paste(shot,(x,y))
   draw.rectangle((x-1,y-1,x+shot.width,y+shot.height),outline='#303840')
   draw.text((x,12),'FORK / '+('TECHNICAL PRODUCT DEMO'if name=='technical-demo'else'FOUNDER PITCH'),font=labelFont,fill='#B1D6AC')
   draw.text((x,920),scene['title'],font=titleFont,fill='#F2F4F2')
   lines=[];current=''
   for word in scene['caption'].split():
    candidate=(current+' '+word).strip()
    if draw.textlength(candidate,font=captionFont)>1920-2*x and current:lines.append(current);current=word
    else:current=candidate
   if current:lines.append(current)
   assert len(lines)<=2,scene['caption']
   for q,line in enumerate(lines):draw.text((x,980+q*41),line,font=captionFont,fill='#CDD2D6')
   draw.rectangle((0,1076,int(1920*(elapsed+j*dt)/total),1079),fill='#B1D6AC')
   dest=frames/f'{i:02}-{j:02}.jpg';canvas.save(dest,quality=95,subsampling=0);playlist += [f"file '{dest}'",f'duration {dt:.9f}']
  elapsed+=scene['duration']
 playlist.append(f"file '{dest}'");manifest=frames/'concat.txt';manifest.write_text('\n'.join(playlist)+'\n')
 result=subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-f','concat','-safe','0','-i',str(manifest),'-t',str(total),'-r','30','-c:v','libx264','-preset','medium','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart','-an',str(out/(name+'.mp4'))],check=True)
 print(json.dumps({'video':name,'seconds':total,'resolution':'1920x1080','audio':'none; English captions burned in','actualSourceClips':len(set(s['clip']for s in scenes))}),flush=True)
