import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
export const root=fileURLToPath(new URL('../',import.meta.url))
export const repo='https://github.com/a-persimmons/ai-infra-engineer-learning'
export const base='/ai-infra-engineer-learning/'
export const modules=[
 ['00-your-relationship-to-the-model','你与模型的关系','Your relationship to the model','明确基础设施工程师与模型、应用、训练团队的职责边界。'],
 ['mod-101-foundations','基础知识','Foundations','建立 Python、ML 框架、云平台、模型服务、Docker 与 API 开发基础。'],
 ['mod-102-cloud-computing','云计算','Cloud computing','理解计算、存储、网络和托管机器学习服务，比较多云成本与可靠性。'],
 ['mod-103-containerization','容器化与 Docker','Containerization & Docker','掌握 Dockerfile、镜像优化、网络、卷、Compose、GPU 容器与安全。'],
 ['mod-104-kubernetes','Kubernetes','Kubernetes','掌握 Pod、Deployment、Service、Ingress、持久化、Helm、GPU 调度和故障排查。'],
 ['mod-105-data-pipelines','数据管道','Data pipelines','使用 Airflow、DVC、Spark、Kafka，建立数据质量和故障恢复机制。'],
 ['mod-106-mlops','MLOps','MLOps','构建实验追踪、模型注册、特征存储、CI/CD、灰度发布、A/B 测试和治理。'],
 ['mod-107-gpu-computing','GPU 计算与加速','GPU computing','理解 CUDA、显存、PyTorch、分布式训练、数据与模型并行和性能分析。'],
 ['mod-108-monitoring-observability','监控与可观测性','Monitoring & observability','建立指标、日志、链路追踪、告警与 SLO，分析服务及模型问题。'],
 ['mod-109-infrastructure-as-code','基础设施即代码','Infrastructure as code','用 Terraform、Pulumi、GitOps 管理基础设施，理解状态、密钥、策略及漂移。'],
 ['mod-110-llm-infrastructure','LLM 基础设施','LLM infrastructure','部署 vLLM，构建 RAG、向量检索，优化吞吐、延迟和显存，设计评估与安全防护。']
]
const guides={
 'README.md':['课程概览','Course overview','通过课程、实验、练习与三个综合项目学习 AI/ML 系统的设计、部署和运营。'],
 'CURRICULUM.md':['课程大纲','Curriculum','原课程规划约 500+ 小时，十个核心模块循序推进。以原文的实际进度说明为准。'],
 'GETTING_STARTED.md':['快速开始','Getting started','检查环境和依赖，选择学习节奏，从导入模块与基础模块开始。'],
 'PREREQUISITES.md':['前置知识','Prerequisites','准备 Python、Linux、Git、网络和机器学习基础；云端和 GPU 实验应先核对成本。'],
 'JOB_REQUIREMENTS.md':['岗位能力要求','Job requirements','从系统工程、云与容器、ML 部署、可靠性和成本等维度理解岗位要求。'],
 'VERSIONS.md':['技术版本指南','Technology versions','实验优先遵循仓库指定版本，实际部署另行核对兼容性与安全更新。'],
 'COMPLETENESS_MATRIX.md':['内容完成度','Completeness matrix','查看原始课程、实验和练习的实际完成情况。'],
 'CONTRIBUTING.md':['贡献指南','Contributing','参照英文贡献指南提交勘误及改进。'],
 'CODE_OF_CONDUCT.md':['社区行为准则','Code of conduct','阅读原始社区规范。']
}
const lectureTitles=[
 [],
 ['AI 基础设施工程导论','开发环境配置','机器学习基础设施','机器学习框架','云平台入门','模型服务基础','Docker 基础','API 开发'],
 ['云架构','AWS 机器学习基础设施','GCP 机器学习基础设施','Azure 机器学习基础设施','云存储','云网络','托管机器学习服务','多云成本优化'],
 ['Docker 入门','机器学习应用 Dockerfile','镜像优化','Docker 网络与数据卷','Docker Compose','容器镜像仓库','GPU 容器','生产容器最佳实践'],
 ['Kubernetes 入门','Kubernetes 架构','核心资源','Deployment 与 Service','网络与 Ingress','存储与持久化','Helm 包管理','GPU 调度','监控与故障排查'],
 ['数据管道架构','Apache Airflow 基础','Airflow 在 ML 中的进阶应用','DVC 数据版本管理','Spark 数据处理','Kafka 流式数据','数据质量验证','管道监控与异常处理'],
 ['MLOps 导论','MLflow 实验追踪','模型注册与版本管理','特征存储工程','机器学习 CI/CD','模型部署策略','A/B 测试与实验','最佳实践与治理'],
 ['GPU 计算导论','CUDA 编程基础','PyTorch GPU 加速','分布式训练基础','多 GPU 训练策略','模型流水线并行','GPU 显存管理','GPU 高级优化'],
 ['可观测性导论','Prometheus 指标','Grafana 可视化','ELK 与 Loki 日志','分布式追踪','告警策略','模型可观测性','最佳实践与工程文化'],
 ['IaC 导论','Terraform 基础','Terraform 状态管理','使用 Terraform 构建 AI 基础设施','Pulumi 基础设施即软件','IaC 高级模式','GitOps 与 IaC CI/CD','安全最佳实践'],
 ['LLM 基础设施导论','vLLM 部署','RAG 系统','向量数据库','LLM 微调基础设施','LLM 服务优化','LLM 平台架构','生产 LLM 最佳实践']
]
const projects={
 'project-101-basic-model-serving':['基础模型服务','Basic model serving','封装模型 API，使用容器部署，并验证健康检查、监控和扩缩容。'],
 'project-102-mlops-pipeline':['MLOps 管道','MLOps pipeline','串联训练、实验追踪、模型注册、持续交付和监控。'],
 'project-103-llm-deployment':['生产级 LLM 部署','Production LLM deployment','结合推理、RAG、缓存与监控完成端到端部署。']
}
export const labels={exercises:'练习',labs:'实验',quizzes:'测验',resources:'参考资料',assessments:'能力评估',projects:'综合项目',community:'社区',curriculum:'课程资料',docs:'技术文档','answer-keys':'参考答案','cheat-sheets':'速查表','reading-lists':'阅读清单',notebooks:'Notebook',prompts:'提示词','coding-challenges':'编程挑战','practical-exams':'实践考试',rubrics:'评分标准'}
function walk(dir=''){
 return fs.readdirSync(path.join(root,dir),{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name,'en')).flatMap(e=>{
  if(e.name.startsWith('.')||['site','scripts','node_modules','translations'].includes(e.name))return []
  const p=path.posix.join(dir,e.name)
  return e.isDirectory()?walk(p):e.isFile()&&p.endsWith('.md')&&p!=='SITE.md'?[p]:[]
 })
}
const human=s=>s.replace(/\.md$/i,'').replace(/[-_]/g,' ').replace(/\b[a-z]/g,x=>x.toUpperCase())
function routeFor(s){if(s==='README.md')return 'guide/overview';if(!s.includes('/'))return 'guide/'+s.replace(/\.md$/,'').toLowerCase();return s.replace(/\/README\.md$/,'/').replace(/\.md$/,'')}
export const pages=walk().map(source=>{
 const parts=source.split('/'),file=parts.at(-1),mi=modules.findIndex(m=>m[0]===parts[1]),mod=modules[mi],project=projects[parts[1]]
 const original=fs.readFileSync(path.join(root,source),'utf8')
 const title=(original.match(/^#\s+(.+)$/m)?.[1]||human(file)).replace(/[\x60*]/g,'').trim()
 const guide=guides[source],lecture=mod&&parts.length===3&&file.match(/^(\d\d)-/)
 let en=title,zh=title,note='',kind='reference'
 if(guide){[zh,en,note]=guide;kind='guide'}
 else if(mod&&parts.length===3&&file==='README.md'){[,zh,en,note]=mod;kind='module'}
 else if(lecture){zh=lecture[1]+' · '+(lectureTitles[mi]?.[Number(lecture[1])-1]||human(file));en=lecture[1]+' · '+human(file.replace(/^\d\d-/,''));kind='lecture'}
 else if(project&&parts.length===3&&file==='README.md'){[zh,en,note]=project;kind='project'}
 else{const category=parts.slice(0,-1).reverse().find(x=>labels[x]);zh=(labels[category]||'原文')+' · '+(file==='README.md'?human(parts.at(-2)):human(file));if(file==='resources.md')zh='参考资料'}
 return {source,route:routeFor(source),en,zh,note,kind,module:mod?.[0],project:project?parts[1]:null}
})
export const bySource=new Map(pages.map(p=>[p.source,p]))
export const url=(p,en=false)=>'/'+(en?'en/':'')+p.route
const item=(p,en)=>({text:en?p.en:p.zh,link:url(p,en)})
const group=(text,items)=>({text,collapsed:true,items})
export function sidebar(en){
 const top=['README.md','GETTING_STARTED.md','PREREQUISITES.md','CURRICULUM.md','JOB_REQUIREMENTS.md','COMPLETENESS_MATRIX.md','VERSIONS.md']
 const result=[{text:en?'Start here':'开始学习',items:top.map(x=>bySource.get(x)).filter(Boolean).map(p=>item(p,en))}]
 for(const [i,[id,zh,name]] of modules.entries()){
  const all=pages.filter(p=>p.module===id)
  const direct=all.filter(p=>p.source.split('/').length===3).sort((a,b)=>Number(b.kind==='module')-Number(a.kind==='module')||a.source.localeCompare(b.source))
  const children=direct.map(p=>item(p,en))
  for(const dir of ['exercises','labs','quizzes']){const sub=all.filter(p=>p.source.split('/')[2]===dir);if(sub.length)children.push(group(en?human(dir):labels[dir],sub.map(p=>item(p,en))))}
  const other=all.filter(p=>!direct.includes(p)&&!['exercises','labs','quizzes'].includes(p.source.split('/')[2]))
  if(other.length)children.push(group(en?'Other':'其他',other.map(p=>item(p,en))))
  if(children.length)result.push(group(String(i).padStart(2,'0')+' · '+(en?name:zh),children))
 }
 for(const [id,[zh,name]] of Object.entries(projects)){const sub=pages.filter(p=>p.project===id).sort((a,b)=>Number(b.kind==='project')-Number(a.kind==='project')||a.source.localeCompare(b.source));if(sub.length)result.push(group(en?name:zh,sub.map(p=>item(p,en))))}
 for(const dir of ['assessments','resources','community','curriculum']){const sub=pages.filter(p=>p.source.startsWith(dir+'/'));if(sub.length)result.push(group(en?human(dir):labels[dir],sub.map(p=>item(p,en))))}
 const other=pages.filter(p=>!p.module&&!p.project&&!top.includes(p.source)&&!['assessments','resources','community','curriculum'].includes(p.source.split('/')[0]))
 if(other.length)result.push(group(en?'Other documents':'其他文档',other.map(p=>item(p,en))))
 return result
}
