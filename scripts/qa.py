#!/usr/bin/env python3
"""Local acceptance checks for this tour-selection hub. Run after Hugo builds."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit,unquote
import json,re,sys,tomllib
S=Path(__file__).resolve().parents[1];P=S/'public';cfg=tomllib.loads((S/'hugo.toml').read_text());params=cfg['params'];errors=[];counts={'pages':0,'affiliate_fallbacks':0,'widgets':0,'images':0}
def check(condition,message):
 if not condition:errors.append(message)
class Doc(HTMLParser):
 def __init__(self,text):
  super().__init__(convert_charrefs=True);self.tags=[];self.ids=set();self.json=[];self.in_json=False;self.buf='';self.text=[];self.feed(text)
 def handle_starttag(self,tag,attrs):
  a=dict(attrs);self.tags.append((tag,a));
  if 'id' in a:self.ids.add(a['id'])
  if tag=='script' and a.get('type')=='application/ld+json':self.in_json=True;self.buf=''
 def handle_data(self,data):
  if self.in_json:self.buf+=data
  else:self.text.append(data)
 def handle_endtag(self,tag):
  if tag=='script' and self.in_json:
   try:self.json.append(json.loads(self.buf))
   except Exception as e:errors.append('Malformed JSON-LD '+str(e))
   self.in_json=False
 def find(self,tag=None,attr=None,value=None):return [a for t,a in self.tags if (tag is None or tag==t) and (attr is None or attr in a) and (value is None or a.get(attr)==value)]
def target(path):
 p=P/unquote(path).lstrip('/');return p/'index.html' if p.is_dir() or path.endswith('/') else p
files=list(P.rglob('*.html'));docs={f:Doc(f.read_text()) for f in files};titles=[]
for f,d in docs.items():
 name=str(f.relative_to(P));h=f.read_text();counts['pages']+=1
 check(len(d.find('h1'))==1,name+': one H1 required')
 check(len(d.find('link','rel','canonical'))==1,name+': canonical missing/duplicate')
 check(len(d.find('meta','name','description'))==1,name+': description missing')
 title=re.search(r'<title>(.*?)</title>',h,re.S);check(bool(title),name+': missing title')
 if title:titles.append(title[1])
 loader=d.find('script','src','https://widget.getyourguide.com/dist/pa.umd.production.min.js')
 check(len(loader)==1 and loader[0].get('data-gyg-partner-id')==params['gygPartnerID'],name+': analytics loader mismatch')
 check(h.index('pa.umd.production.min.js')<h.index('</head>'),name+': loader outside head')
 body=d.find('body')[0];check(body.get('data-partner')==params['gygPartnerID'] and body.get('data-campaign')==params['gygCampaign'],name+': runtime config mismatch')
 for tag,a in d.tags:
  for field in ['href','src']:
   u=a.get(field,'')
   if not u or u.startswith(('data:','mailto:','tel:')):continue
   v=urlsplit(u)
   if v.netloc and v.netloc!=urlsplit(cfg['baseURL']).netloc:continue
   if field=='href' and tag=='link' and a.get('rel')=='canonical':continue
   dest=target(v.path) if v.path.startswith('/') else (f if not v.path else f.parent/v.path)
   if dest.is_dir():dest=dest/'index.html'
   check(dest.is_file(),f'{name}: missing {field} {u}')
   if v.fragment and dest in docs:check(unquote(v.fragment) in docs[dest].ids,f'{name}: dead anchor {u}')
  if 'srcset' in a:
   for candidate in a['srcset'].split(','):check(target(candidate.strip().split()[0]).is_file(),f'{name}: missing srcset {candidate}')
  if tag=='a' and 'data-gyg-href' in a:
   counts['affiliate_fallbacks']+=1;u=urlsplit(a.get('href',''));check(u.scheme=='https' and u.netloc=='www.getyourguide.com' and not u.query and a['href']==a['data-gyg-href'],name+': invalid bare affiliate fallback');check('sponsored' in a.get('rel',''),name+': affiliate missing sponsored')
  if 'data-gyg-widget' in a:
   counts['widgets']+=1;check(a.get('data-gyg-partner-id')==params['gygPartnerID'] and a.get('data-gyg-cmp')==params['gygCampaign'],name+': widget attribution mismatch')
  if tag=='img':
   counts['images']+=1;check(bool(a.get('alt')),name+': image alt missing');check('width' in a and 'height' in a,name+': image dimensions missing');check(a.get('fetchpriority')=='high' or a.get('loading')=='lazy',name+': below-fold image not lazy')
 for a in d.find('meta','property','og:image'):check(target(urlsplit(a['content']).path).is_file(),name+': missing OG image')
 faq=d.find('details');schemas=[j for j in d.json if j.get('@type')=='FAQPage'];check(not faq or (len(schemas)==1 and len(schemas[0]['mainEntity'])==len(faq)),name+': FAQ/schema mismatch')
 if name!='index.html' and d.find('section','id','availability'):
  check(h.index('page-intro')<h.index('id=availability')<h.index('id=guide'),name+': booking placement')
check(len(titles)==len(set(titles)),'Duplicate page titles')
home=docs[P/'index.html'];html=(P/'index.html').read_text();hub=html.split('id=explore',1)[1].split('</section>',1)[0];hubdoc=Doc(hub)
inventory=json.loads((S/'research/site-inventory.json').read_text())
for entry in inventory:
 check(target(entry['path']).is_file(),'Inventory page missing '+entry['path']);check(sum(a.get('href')==entry['path'] for a in hubdoc.find('a'))==1,'Explore hub must include exactly once: '+entry['path'])
sequence=['hero','experiences','comparison','timeline','availability','how-it-works','guide','gallery','reviews','planning','faq','explore'];positions=[]
for id in sequence:
 matches=list(re.finditer(r'\bid=(?:"'+id+'"|'+id+r'(?=[ >]))',html));check(bool(matches),'Home section missing '+id);positions.append(matches[0].start() if matches else -1)
check(positions==sorted(positions),'Homepage order differs from approved tour-selection plan')
check(len(home.find('article','class','category-card'))==6,'Home needs six category cards')
offers=json.loads((S/'data/offers.json').read_text())
for o in offers:
 d=docs[target(o['detailPath'])];products=[j for j in d.json if j.get('@type')=='Product'];check(len(products)==1,o['detailPath']+': Product schema required')
 if products:
  pr=products[0];check(float(pr['offers']['price'])==float(o['startingPrice']),o['detailPath']+': source price mismatch');check(pr['aggregateRating']['reviewCount']==o['reviewCount'],o['detailPath']+': review count mismatch')
 check(len([a for a in d.find('img') if '/gallery/' in a.get('src','')])>=5,o['detailPath']+': gallery depth')
 text=' '.join(d.text);check('From US$' in text,o['detailPath']+': price not visible')
report={'counts':counts,'inventory':len(inventory),'products':len(offers),'result':'PASS' if not errors else 'FAIL','errors':errors};(S/'research/qa/local-acceptance.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2));sys.exit(bool(errors))
