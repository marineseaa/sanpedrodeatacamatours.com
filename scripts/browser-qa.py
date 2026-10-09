#!/usr/bin/env python3
"""Browser regression checks against the served production output; no purchases."""
from pathlib import Path
from urllib.parse import urlsplit,parse_qs
from playwright.sync_api import sync_playwright
import json,sys
S=Path(__file__).resolve().parents[1];base=sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:8765';paths=['/']+[e['path'] for e in json.loads((S/'research/site-inventory.json').read_text())]+['/about/','/privacy/','/terms/','/404.html'];errors=[];checks=0;shots=S/'research/qa/screenshots';shots.mkdir(exist_ok=True)
with sync_playwright() as p:
 b=p.chromium.launch(headless=True);ctx=b.new_context();ctx.route('**/*',lambda route:route.continue_() if urlsplit(route.request.url).hostname in ['127.0.0.1','localhost'] else route.abort());page=ctx.new_page();page.on('pageerror',lambda error:errors.append(str(error)))
 for width in [320,390,768,1024,1440]:
  page.set_viewport_size({'width':width,'height':900 if width==1440 else 844})
  for path in paths:
   r=page.goto(base+path,wait_until='load');checks+=1
   if not r or r.status!=200:errors.append([path,width,'HTTP status',r.status if r else None]);continue
   result=page.evaluate('''()=>{let h=document.querySelector('.hero'),band=document.querySelector('.hero .trust-band'),copy=document.querySelector('.hero-copy');return {overflow:document.documentElement.scrollWidth-innerWidth,bandBottom:band?.getBoundingClientRect().bottom,overlap:band&&copy?copy.getBoundingClientRect().bottom-band.getBoundingClientRect().top:0,facts:[...document.querySelectorAll('.trust-item')].map(e=>getComputedStyle(e).opacity),brokenImages:[...document.images].filter(e=>e.loading!=='lazy'&&(!e.complete||e.naturalWidth===0)).map(e=>e.src),affiliates:[...document.querySelectorAll('a[data-gyg-href]')].map(e=>e.href)}}''')
   if result['overflow']>1:errors.append([path,width,'horizontal overflow',result['overflow']])
   if result['overlap']>2:errors.append([path,width,'hero overlaps facts',result['overlap']])
   if width in [390,1440] and result['bandBottom'] and result['bandBottom']>(900 if width==1440 else 844)+1:errors.append([path,width,'facts below initial fold',result['bandBottom']])
   if any(float(x)<1 for x in result['facts']):errors.append([path,width,'hidden hero facts'])
   if result['brokenImages']:errors.append([path,width,'broken initial image',result['brokenImages']])
   for u in result['affiliates']:
    q=parse_qs(urlsplit(u).query)
    if q.get('partner_id')!=['1MSALBX'] or q.get('cmp')!=['sanpedrodeatacamatours']:errors.append([path,'runtime affiliate attribution',u])
   if path in ['/','/piedras-rojas-tours/','/best-time-to-visit/'] and width in [390,1440]:page.screenshot(path=str(shots/((path.strip('/').replace('/','-') or 'home')+f'-{width}.png')))
 page.set_viewport_size({'width':390,'height':844});page.goto(base+'/');page.locator('.menu-toggle').click();assert page.locator('#site-nav').is_visible();page.keyboard.press('Escape');assert not page.locator('#site-nav').is_visible()
 page.goto(base+'/best-time-to-visit/');results=[]
 for date in ['2026-01-03','2026-01-18','2026-07-15']:
  page.locator('#visit-date').fill(date);page.locator('#season-checker button').click();results.append({'date':date,'text':page.locator('#checker-output').inner_text(),'href':page.locator('#checker-cta').get_attribute('href')})
 if len(set(x['text'] for x in results))<3:errors.append('Date checker does not change its guidance')
 if results[0]['href']==results[2]['href']:errors.append('Seasonal CTA does not change destination')
 # JavaScript disabled: links still reach the real operator, FAQ stays usable, navigation is exposed.
 nojs=b.new_context(java_script_enabled=False);nojs.route('**/*',lambda route:route.continue_() if urlsplit(route.request.url).hostname=='127.0.0.1' else route.abort());np=nojs.new_page();np.set_viewport_size({'width':390,'height':844});np.goto(base+'/piedras-rojas-tours/')
 assert np.locator('#site-nav').is_visible();a=np.locator('a[data-gyg-href]').first.get_attribute('href');assert a.startswith('https://www.getyourguide.com/') and '?' not in a
 np.locator('details summary').first.click();assert np.locator('details').first.get_attribute('open') is not None
 b.close()
report={'result':'PASS' if not errors else 'FAIL','page_viewports':checks,'widths':[320,390,768,1024,1440],'menu':'PASS','no_js_fallbacks':'PASS','date_checker':results,'errors':errors};(S/'research/qa/browser-acceptance.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2));sys.exit(bool(errors))
