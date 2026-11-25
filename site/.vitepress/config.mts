import { defineConfig } from 'vitepress'
import { base,repo,sidebar } from '../../scripts/site-data.mjs'
function locale(en:boolean){
 const p=en?'/en/':'/'
 return {label:en?'English':'简体中文',lang:en?'en-US':'zh-CN',title:en?'AI Infrastructure Engineering':'AI 基础设施工程师',description:en?'Hands-on AI infrastructure curriculum':'AI 基础设施工程学习路线',themeConfig:{
  nav:[{text:en?'Home':'首页',link:p},{text:en?'Curriculum':'课程大纲',link:p+'guide/curriculum'},{text:en?'Start':'快速开始',link:p+'guide/getting_started'},{text:en?'Projects':'综合项目',items:[{text:en?'Model serving':'模型服务',link:p+'projects/project-101-basic-model-serving/'},{text:en?'MLOps pipeline':'MLOps 管道',link:p+'projects/project-102-mlops-pipeline/'},{text:en?'LLM deployment':'LLM 部署',link:p+'projects/project-103-llm-deployment/'}]}],
  sidebar:sidebar(en),outline:{level:[2,3] as [number,number],label:en?'On this page':'本页目录'},docFooter:{prev:en?'Previous':'上一篇',next:en?'Next':'下一篇'},sidebarMenuLabel:en?'Course contents':'课程目录',returnToTopLabel:en?'Back to top':'返回顶部',langMenuLabel:en?'Change language':'切换语言',darkModeSwitchLabel:en?'Appearance':'外观',skipToContentLabel:en?'Skip to content':'跳转到正文',
  editLink:{pattern:(page:any)=>repo+'/blob/main/'+(page.frontmatter.sourcePath??'SITE.md'),text:en?'View source on GitHub':'在 GitHub 查看原文'},
  footer:{message:en?'Open-source educational material · MIT License':'开源学习资料 · MIT 许可',copyright:'AI Infrastructure Engineer Learning'}
 }}
}
export default defineConfig({
 base,cleanUrls:false,locales:{root:locale(false),en:locale(true)},
 markdown:{html:false,config(md){
  // Markdown includes Jinja, shell templates and other literal mustaches.
  // Encode braces in code output before Vue parses the generated SFC.
  for(const rule of ['fence','code_block','code_inline']){
   const original=md.renderer.rules[rule]
   if(original)md.renderer.rules[rule]=(...args:any[])=>original(...args).replace(/\{/g,'&#123;').replace(/\}/g,'&#125;')
  }
  const originalRender=md.render.bind(md)
  md.render=(src,env)=>originalRender(src,env).replace(/<[^>]+>/g,tag=>{
   let seen=false
   return tag.replace(/\s+v-pre(?=\s|\/?>)/g,match=>{if(seen)return '';seen=true;return match})
  })
  const render=md.renderer.rules.text
  md.renderer.rules.text=(tokens,idx,options,env,self)=>(render?render(tokens,idx,options,env,self):md.utils.escapeHtml(tokens[idx].content)).replace(/\{/g,'&#123;').replace(/\}/g,'&#125;')
 }},
 themeConfig:{socialLinks:[{icon:'github',link:repo}],search:{provider:'local'}}
})
