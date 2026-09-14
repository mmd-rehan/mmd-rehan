"""Render the original profile pixel animation without network or font assets.
Regenerate: python -m pip install Pillow==12.3.0
            python scripts/render-bug-runner.py
The committed GIF requires no runtime or external service.
"""
from pathlib import Path
from PIL import Image, ImageDraw
ROOT = Path(__file__).resolve().parents[1]
C = dict(bg='#F8F9F5', ink='#19252D', blue='#193EE8', muted='#687783', faint='#E2E7E8', sky='#D9E3EA', light='#E9EFFF', red='#CE594B', skin='#DDA678', hair='#342B29', shirt='#9DBFE4', shoe='#253C51')
# Each glyph is seven five-bit rows, encoded as hexadecimal pairs.
RAW = {
'A':'0e11111f111111','B':'1e11111e11111e','C':'0f10101010100f','D':'1e11111111111e','E':'1f10101e10101f','F':'1f10101e101010','G':'0f10101711110f','H':'1111111f111111','I':'1f04040404041f','J':'0702020212120c','K':'11121418141211','L':'1010101010101f','M':'111b1515111111','N':'11191513111111','O':'0e11111111110e','P':'1e11111e101010','Q':'0e11111115120d','R':'1e11111e141211','S':'0f10100e01011e','T':'1f040404040404','U':'1111111111110e','V':'11111111110a04','W':'1111111515150a','X':'11110a040a1111','Y':'11110a04040404','Z':'1f01020408101f',
'0':'0e11131519110e','1':'040c040404040e','2':'0e11010204081f','3':'1e01010e01011e','4':'02060a121f0202','5':'1f10101e01011e','6':'0e10101e11110e','7':'1f010204080808','8':'0e11110e11110e','9':'0e11110f01010e','.':'00000000000606','-':'0000001f000000','+':'0004041f040400','/':'01010204081010',' ':'00000000000000'}
G = {c: bytes.fromhex(v) for c,v in RAW.items()}
def box(d,x,y,w,h,c):
    x,y=round(x),round(y)
    d.rectangle((x,y,x+w-1,y+h-1),fill=C.get(c,c))
def text(d,s,x,y,c='ink',z=1):
    for i,ch in enumerate(s):
        for row,bits in enumerate(G[ch]):
            for col in range(5):
                if bits & (1<<(4-col)): box(d,x+(i*6+col)*z,y+row*z,z,z,c)
def skyline(d):
    for x,w,h in [(22,30,28),(63,25,42),(131,25,32),(169,19,48),(218,26,35),(269,23,52),(336,27,37),(378,26,49),(427,35,28)]:
        d.rectangle((x,166-h,x+w,165),outline=C['sky'])
        for yy in range(171-h,160,8):
            for xx in range(x+5,x+w-3,7): box(d,xx,yy,2,2,'sky')
    for x,y,w,h in [(309,112,20,54),(312,100,14,12),(315,88,8,12),(318,78,2,10)]:
        d.rectangle((x,y,x+w-1,y+h-1),outline=C['sky'])
    for yy in range(116,162,6): box(d,313,yy,12,1,'sky')
def player(d,t,lift):
    x,y=91,round(126-lift)
    # Swept dark hair, beard, and blue shirt based on the repository portrait.
    for dx,dy,w,h,c in [(3,0,11,3,'hair'),(1,3,15,4,'hair'),(3,7,13,10,'skin'),(1,5,4,9,'hair'),(15,9,3,4,'skin'),(12,8,2,2,'ink'),(4,13,3,5,'hair'),(7,15,9,4,'hair'),(9,13,5,2,'skin'),(6,19,6,3,'skin'),(1,21,14,12,'shirt'),(1,30,14,3,'blue'),(10,22,1,7,'blue')]: box(d,x+dx,y+dy,w,h,c)
    if lift>3:
        parts=[(-3,23,5,5,'shirt'),(-6,20,4,5,'skin'),(14,21,4,6,'shirt'),(17,18,4,5,'skin'),(2,33,5,5,'shoe'),(-2,35,7,3,'shoe'),(10,33,7,3,'shoe'),(14,34,4,4,'shoe'),(-3,38,6,2,'ink'),(14,38,7,2,'ink')]
    else:
        dx=[-3,0,3,0][int(t*10)%4]
        parts=[(-2,23,4,7,'shirt'),(-3+dx,29,5,3,'skin'),(14,23,4,6,'shirt'),(15-dx,28,5,3,'skin'),(2,33,5,4,'shoe'),(2-dx,36,4,3,'shoe'),(10,33,5,4,'shoe'),(10+dx,36,4,3,'shoe'),(-dx,39,7,1,'ink'),(10+dx,39,7,1,'ink')]
    for dx,dy,w,h,c in parts: box(d,x+dx,y+dy,w,h,c)
def bug(d,x,t,label):
    y=150
    for dx,dy,w,h,c in [(-6,3,13,9,'red'),(-4,0,9,3,'red'),(-3,3,2,2,'bg'),(2,3,2,2,'bg'),(0,7,1,4,'bg')]: box(d,x+dx,y+dy,w,h,c)
    for side in [-1,1]:
        for dx,dy,w,h in [(side*8-1,4,3,2),(side*9-1,8,3,2),(side*(7+int(t*8)%2)-1,12,3,3),(side*5-1,-3,2,3)]: box(d,x+dx,y+dy,w,h,'red')
    text(d,label,x-(len(label)*6-1)//2,y-16,'red')
EVENTS=[1,3,5,7,9,11]
def render(t):
    im=Image.new('RGB',(480,220),C['bg']); d=ImageDraw.Draw(im)
    box(d,0,0,480,3,'blue'); text(d,'BUG RUNNER',18,16,'blue')
    text(d,'MUHAMMAD REHAN',18,32,z=2); text(d,'FULL-STACK ENGINEER / DUBAI',18,53,'muted')
    text(d,'PLAYER 01',366,16,'muted'); text(d,'STILL SHIPPING',366,32,'blue')
    box(d,456,53,5,7,'blue' if int(t*2)%2==0 else 'light')
    skyline(d)
    for start,cy in [(53,87),(236,74),(414,95)]:
        cx=(start-t*40)%480
        for xx in [cx,cx-480]:
            for dx,dy,w,h in [(0,0,22,1),(4,-4,13,1),(3,-3,1,3),(17,-3,1,3)]: box(d,xx+dx,cy+dy,w,h,'faint')
    box(d,18,166,444,1,'ink')
    for n in range(22): box(d,18+(n*20-t*110)%440,171+(n%2)*2,4 if n%2 else 8,1,'faint')
    nearest=min(abs(t-event) for event in EVENTS)
    lift=49*max(0,1-(nearest/.58)**2)
    box(d,87+round(lift/12),165,29-round(lift/6),1,'faint')
    for event,label in zip(EVENTS,['BUG','CORS','500','NULL','MERGE','BUG']):
        # Periodic world: incoming obstacles at the end match the first frame.
        for cycle in [-12,0,12]:
            x=100+(event+cycle-t)*132
            if -30<x<510: bug(d,round(x),t,label)
    player(d,t,lift)
    for event in EVENTS:
        elapsed=t-event
        if .3<elapsed<.85: text(d,'+1',115,round(116-elapsed*8),'blue')
    box(d,0,66,18,112,'bg'); box(d,462,66,18,112,'bg')
    box(d,18,184,444,1,'faint')
    text(d,'BUILD. DEBUG. REPEAT.',18,194,'blue')
    text(d,'REACT / TYPESCRIPT / NODE / SQL',282,194,'muted')
    return im.resize((960,440),Image.Resampling.NEAREST)
def main():
    out=ROOT/'assets'; out.mkdir(exist_ok=True)
    frames=[render(n/20) for n in range(240)]
    palette=Image.new('P',(1,1))
    colors=[int(color[i:i+2],16) for color in C.values() for i in (1,3,5)]
    palette.putpalette(colors+[0]*(768-len(colors)))
    frames=[f.quantize(palette=palette,dither=Image.Dither.NONE) for f in frames]
    dest=out/'bug-runner.gif'
    frames[0].save(dest,save_all=True,append_images=frames[1:],duration=50,loop=0,optimize=True,disposal=1)
    render(1).save(out/'bug-runner-still.png')
    print(f'{dest.name}: {dest.stat().st_size:,} bytes, {len(frames)} frames')
if __name__=='__main__': main()
