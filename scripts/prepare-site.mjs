import fs from 'node:fs/promises'
import path from 'node:path'
import {root,repo,modules,pages,bySource,url} from './site-data.mjs'
const site=path.join(root,'site')
const codeRepo=repo+'/blob/main/'
const rawRepo='https://raw.githubusercontent.com/a-persimmons/ai-infra-engineer-learning/main/'
const encode=p=>p.split('/').map(encodeURIComponent).join('/')
function destination(source,href,en,img){
 if(/^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(href))return href
 const at=href.indexOf('#'),file=at<0?href:href.slice(0,at),hash=at<0?'':href.slice(at)
 let decoded;try{decoded=decodeURIComponent(file)}catch{decoded=file}
 const target=path.posix.normalize(decoded.startsWith('/')?decoded.slice(1):path.posix.join(path.posix.dirname(source),decoded))
 const match=bySource.get(target)||bySource.get(target.replace(/\/$/,'')+'/README.md')||bySource.get(target+'.md')
 if(match)return url(match,en)+hash
 if(img)return rawRepo+encode(target)+hash
 return (decoded.endsWith('/')||!path.posix.extname(target)?repo+'/tree/main/':codeRepo)+encode(target)+hash
}
function transform(text,source,en){
 let fence=null
 return text.split(/\r?\n/).map(line=>{
  const mark=line.match(/^\s*((?:\x60{3,})|(?:~{3,}))/)
  if(mark){if(!fence)fence=mark[1];else if(mark[1][0]===fence[0]&&mark[1].length>=fence.length)fence=null;return line}
  if(fence||/^(?: {4}|\t)/.test(line))return line
  const inline=[]
  line=line.replace(/(\x60+)(.*?)\1/g,m=>{inline.push(m);return 'ZZINFRACODE'+(inline.length-1)+'ZZ'})
  line=line.replace(/(!?)\[([^\]\n]*)\]\((<?[^)\s>]+>?)([^)]*)\)/g,(_,img,label,href,tail)=>img+'['+label+']('+destination(source,href.replace(/^<|>$/g,''),en,Boolean(img))+tail+')')
  line=line.replace(/^(\s{0,3}\[[^\]]+\]:\s*)(<?[^>\s]+>?)(.*)$/g,(_,prefix,href,rest)=>prefix+destination(source,href.replace(/^<|>$/g,''),en,false)+rest)
  return line.replace(/ZZINFRACODE(\d+)ZZ/g,(_,n)=>inline[Number(n)])
 }).join('\n')
}
async function write(route,body){
 const dest=path.join(site,route.endsWith('/')?route+'index.md':route+'.md')
 await fs.mkdir(path.dirname(dest),{recursive:true});await fs.writeFile(dest,body)
}
const fm=data=>'---\n'+JSON.stringify(data,null,2)+'\n---\n\n'
const link=(p,en)=>'['+(en?p.en:p.zh).replace(/[\[\]]/g,'')+']('+url(p,en)+')'
const moduleIndex=()=>modules.map((m,i)=>'- '+String(i).padStart(2,'0')+' · '+link(bySource.get('lessons/'+m[0]+'/README.md'),false)+' — '+m[3]).join('\n')
for(const p of pages){
 const source=await fs.readFile(path.join(root,p.source),'utf8')
 let translated=null;try{translated=await fs.readFile(path.join(root,'translations/zh',p.source),'utf8')}catch(e){if(e.code!=='ENOENT')throw e}
 const sourceLink=codeRepo+encode(p.source)
 const front=en=>fm({title:en?p.en:p.zh,sourcePath:p.source,translationStatus:en?'original':translated?'translated':'guide'})
 await write('en/'+p.route,front(true)+'[中文导读]('+url(p,false)+') · [Source on GitHub]('+sourceLink+')\n\n'+transform(source,p.source,true))
 let body
 if(translated!==null){body='[English original]('+url(p,true)+') · [GitHub]('+sourceLink+')\n\n'+transform(translated,p.source,false)}
 else{
  body='# '+p.zh+'\n\n> **翻译状态：中文导读 / 英文原文。** 本页不是完整译文；英文原文包含完整技术细节、代码和练习。\n\n[阅读英文全文]('+url(p,true)+') · [查看仓库原文]('+sourceLink+')\n\n'
  if(p.note)body+='## 学习目标\n\n'+p.note+'\n\n'
  if(p.kind==='lecture'){const mod=modules.find(m=>m[0]===p.module);body+='## 学习定位\n\n本课属于「'+mod[1]+'」。建议结合原文示例，理解使用场景、复现操作，并记录输入、输出和验证方式。\n\n[返回模块目录]('+url(bySource.get('lessons/'+p.module+'/README.md'),false)+')\n\n'}
  if(p.kind==='module'||p.kind==='project'){const items=pages.filter(x=>x!==p&&(p.module?x.module===p.module:x.project===p.project));body+='## 本章目录\n\n'+items.map(x=>'- '+link(x,false)).join('\n')+'\n\n'}
  if(p.source==='README.md'||p.source==='CURRICULUM.md')body+='## 课程模块\n\n'+moduleIndex()+'\n\n'
  if(!p.note&&p.kind!=='lecture')body+='## 原始资料\n\n'+p.en+'\n\n此资料暂未提供完整中文译文，请通过上方链接阅读。'
 }
 await write(p.route,front(false)+body)
}
for(const en of [false,true]){
 const prefix=en?'en/':''
 const hero={name:'AI Infrastructure Engineering',text:en?'Build and operate AI systems':'从基础设施到生产级 AI 系统',tagline:en?'10 modules, labs, exercises and three hands-on projects.':'十个核心模块、实验、练习与三个综合项目。中文导读与英文原文对照阅读。',actions:[{theme:'brand',text:en?'Start learning':'开始学习',link:url(bySource.get('GETTING_STARTED.md'),en)},{theme:'alt',text:en?'Curriculum':'课程大纲',link:url(bySource.get('CURRICULUM.md'),en)},{theme:'alt',text:en?'简体中文':'English',link:en?'/':'/en/'}]}
 const features=modules.slice(1).map((m,i)=>({title:String(i+1).padStart(2,'0')+' · '+(en?m[2]:m[1]),details:en?m[2]:m[3],link:url(bySource.get('lessons/'+m[0]+'/README.md'),en)}))
 const body=en?'## About this site\n\nEnglish pages reproduce the repository curriculum. Chinese pages currently provide localized study guides and clearly marked links to the complete English source.':'## 阅读说明\n\n英文站保留仓库课程正文。中文站提供导航、模块导读和对应英文全文入口；尚未完整翻译的页面会明确标注。'
 await write(prefix+'index',fm({layout:'home',title:'AI Infrastructure Engineering',hero,features})+body+'\n\n'+(en?'[Repository]':'[原始仓库]')+'('+repo+')\n')
}
console.log('Prepared '+pages.length+' document pairs and two home pages.')
