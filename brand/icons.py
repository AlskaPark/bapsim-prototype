S=1024
def wrap(inner,bg): return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {S} {S}" width="{S}" height="{S}"><rect width="{S}" height="{S}" fill="{bg}"/>{inner}</svg>'
I={}
# 입샷: shutter ring = mouth; lime ring with smile
I['ipshot']=wrap('<circle cx="512" cy="512" r="300" fill="none" stroke="#C6F432" stroke-width="64"/><path d="M372 548 Q512 676 652 548" fill="none" stroke="#C6F432" stroke-width="56" stroke-linecap="round"/><circle cx="690" cy="300" r="34" fill="#fff"/>','#0B0B0D')
# 대충끼: loose open bowl stroke on lime
I['daechung']=wrap('<path d="M250 470 C 262 700, 760 712, 776 470" fill="none" stroke="#0B0B0D" stroke-width="58" stroke-linecap="round"/><path d="M226 452 L 800 440" stroke="#0B0B0D" stroke-width="58" stroke-linecap="round"/><path d="M430 330 q 30 -60 0 -120 M560 330 q 30 -60 0 -120" fill="none" stroke="#0B0B0D" stroke-width="40" stroke-linecap="round"/>','#C6F432')
# 먹은김에: photo card with a bite out of corner
I['meogeun']=wrap('<defs><mask id="b"><rect width="1024" height="1024" fill="#fff"/><circle cx="742" cy="282" r="78" fill="#000"/><circle cx="812" cy="372" r="64" fill="#000"/><circle cx="660" cy="232" r="56" fill="#000"/></mask></defs><rect x="232" y="252" width="560" height="520" rx="96" fill="#0B0B0D" mask="url(#b)"/><circle cx="512" cy="530" r="120" fill="#C6F432"/>','#F4F5F7')
for k,v in I.items(): open(k+'.svg','w').write(v)
