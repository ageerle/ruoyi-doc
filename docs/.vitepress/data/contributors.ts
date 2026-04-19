export type LocaleKey = 'zh' | 'en'

export interface LocalizedText {
  zh: string
  en: string
}

export interface Contributor {
  id: string
  name: string
  role: string | LocalizedText
  avatar: string
  bio: string | LocalizedText
  github: string
  wechat: string
  website: string
}

export function getLocalizedText(
  field: string | LocalizedText,
  locale: LocaleKey = 'zh'
): string {
  if (typeof field === 'string') return field
  return field[locale] || field.zh
}

export const coreContributors: Contributor[] = [
  {
    id: '1',
    name: 'ageerle',
    role: { zh: '项目创始人', en: 'Project Founder' },
    avatar: 'https://avatars.githubusercontent.com/u/32251822?s=96&v=4',
    bio: {
      zh: 'RuoYi AI 项目的创始人和主要维护者,专注于AI技术与企业级应用的结合。',
      en: 'Founder and primary maintainer of the RuoYi AI project, focused on combining AI technology with enterprise applications.'
    },
    github: 'https://github.com/ageerle',
    wechat: 'w193960194',
    website: 'https://blog.csdn.net/weixin_42416319'
  },
  {
    id: '2',
    name: '林大侠',
    role: { zh: '项目合伙人', en: 'Project Partner' },
    avatar: 'https://avatars.githubusercontent.com/u/147299771?v=4',
    bio: {
      zh: '负责相关产品的战略设计和运营,参与项目的设计、开发。',
      en: 'Responsible for product strategy design and operations, participating in project design and development.'
    },
    github: 'https://github.com/lindaxiaproject',
    wechat: 'lindaxia-2019',
    website: 'https://blog.csdn.net/LINHONG_1994'
  },
  {
    id: '3',
    name: 'evo',
    role: { zh: '后端开发', en: 'Backend Developer' },
    avatar: 'https://avatars.githubusercontent.com/u/59215838?s=96&v=4',
    bio: {
      zh: '负责后端服务开发,主要负责模型管理模块',
      en: 'Responsible for backend service development, mainly in charge of the model management module.'
    },
    github: 'https://github.com/MuSan-Li',
    wechat: 'Exotisch',
    website: 'http://exotisch.cn/'
  },
  {
    id: '4',
    name: '龙猫',
    role: { zh: '全栈开发', en: 'Full Stack Developer' },
    avatar: 'https://avatars.githubusercontent.com/u/169354264?v=4',
    bio: {
      zh: '负责前后端服务开发，主要负责工作流编排模块开发',
      en: 'Responsible for full-stack development, mainly in charge of the workflow orchestration module.'
    },
    github: 'https://github.com/LM20230311/LM20230311',
    wechat: 'LikW-041006',
    website: 'https://blog.csdn.net/muzi_longren'
  },
]

export const teamMembers: Contributor[] = [
  {
    id: '5',
    name: 'Robust_H',
    role: { zh: '后端开发（全栈）', en: 'Backend Developer (Full Stack)' },
    avatar: 'https://avatars.githubusercontent.com/u/77924758?v=4',
    bio: {
      zh: '负责大模型集成与知识库搭建',
      en: 'Responsible for LLM integration and knowledge base setup.'
    },
    github: 'https://github.com/RobustH',
    wechat: 'Robust_H',
    website: ''
  },
  {
    id: '6',
    name: 'better',
    role: { zh: '全栈开发', en: 'Fullstack Developer' },
    avatar: 'https://avatars.githubusercontent.com/u/37090582?v=4',
    bio: {
      zh: '负责全栈开发,专注技术创新与高效实践',
      en: 'Responsible for full-stack development, focused on technical innovation and efficient practices.'
    },
    github: 'https://github.com/xiaonieli7',
    wechat: 'L0724YYN',
    website: ''
  },
  {
    id: '7',
    name: '颜AI',
    role: { zh: 'AI后端开发', en: 'AI Backend Developer' },
    avatar: 'https://avatars.githubusercontent.com/u/86051851?s=400&u=ecaf566ff91277d25a87de88b0b4b4b39ec508cd&v=4',
    bio: {
      zh: '负责AI后端服务开发,整合第三方AI服务应用',
      en: 'Responsible for AI backend development, integrating third-party AI service applications.'
    },
    github: 'https://github.com/Cyclones-Y',
    wechat: 'ya10405',
    website: 'https://juejin.cn/user/1612303520767028'
  },
]

export const otherContributors: Contributor[] = [
  {
    id: '8',
    name: 'Albert Z',
    role: { zh: '后端/全栈开发', en: 'Backend Developer & Fullstack' },
    avatar: 'https://avatars.githubusercontent.com/u/6056349?v=4',
    bio: {
      zh: '负责后端服务开发,专精于业务功能设计、微服务架构、应用服务部署',
      en: 'Responsible for backend development, specializing in business design, microservice architecture, and deployment.'
    },
    github: 'https://github.com/janzhou123',
    wechat: 'ZHOUWY123',
    website: 'https://zhouxiaoxiao.cn'
  },
  {
    id: '9',
    name: '請發財',
    role: { zh: '后端开发', en: 'Backend Developer' },
    avatar: 'https://avatars.githubusercontent.com/u/51768077?s=400&u=f0943b9b353585ee59badce9bfa35fe895d9b47e&v=4',
    bio: {
      zh: '负责后端服务开发。',
      en: 'Responsible for backend service development.'
    },
    github: 'https://github.com/zhangpengxiang',
    wechat: 'LHZPXZYQ',
    website: 'https://blog.csdn.net/weixin_44550842?spm=1000.2115.3001.10640'
  },
  {
    id: '10',
    name: 'WCS视频平台',
    role: { zh: '后端开发', en: 'Backend Developer' },
    avatar: 'https://avatars.githubusercontent.com/u/53170533?v=4&size=64',
    bio: {
      zh: '负责后端服务开发,研发WCS视频平台。',
      en: 'Responsible for backend development, developing the WCS video platform.'
    },
    github: 'https://github.com/WWTBNBWN',
    wechat: 'WYWZC888666',
    website: 'https://wzciot.site/'
  },
  {
    id: '11',
    name: '酒亦',
    role: { zh: '后端开发', en: 'Backend Developer' },
    avatar: 'https://avatars.githubusercontent.com/u/68746373?s=400&u=6de3b3d1748ab8661afc59167b9ff258c31d973a&v=4',
    bio: {
      zh: '负责后端服务开发,热爱技术',
      en: 'Responsible for backend development, passionate about technology.'
    },
    github: 'https://github.com/Code-Mr-Jiu',
    wechat: 'zimu578665',
    website: ''
  },
  {
    id: '12',
    name: '瓢六六',
    role: { zh: '后端开发', en: 'Backend Developer' },
    avatar: 'https://avatars.githubusercontent.com/u/19771955?s=96&v=4',
    bio: {
      zh: '负责后端服务开发,专精于微服务架构和数据库优化。',
      en: 'Responsible for backend development, specializing in microservice architecture and database optimization.'
    },
    github: 'https://github.com/liudalian',
    wechat: 'LGF188888888888',
    website: 'https://blog.csdn.net/qq616138361?type=blog'
  },
  {
    id: '13',
    name: 'Jason',
    role: { zh: '全栈开发', en: 'Fullstack Developer' },
    avatar: 'https://avatars.githubusercontent.com/u/29836675?v=4',
    bio: {
      zh: '致力于全栈开发,专注技术创新与高效实践',
      en: 'Dedicated to full-stack development, focused on technical innovation and efficient practices.'
    },
    github: 'https://github.com/xingjisen',
    wechat: 'JasonXing0806',
    website: ''
  },
  {
    id: '14',
    name: 'Alan',
    role: { zh: '云原生架构师', en: 'Cloud Native Architect' },
    avatar: 'https://avatars.githubusercontent.com/u/3273357?v=4',
    bio: {
      zh: '专精于云原生架构与平台部署优化。',
      en: 'Specializing in cloud-native architecture and platform deployment optimization.'
    },
    github: 'https://github.com/alanpeng',
    wechat: 'BuddhistPath',
    website: ''
  },
  {
    id: '15',
    name: 'Stageluo',
    role: { zh: '后端开发', en: 'Backend Developer' },
    avatar: 'https://avatars.githubusercontent.com/u/56993330?v=4',
    bio: {
      zh: '主要负责Ai智能体工作流相关工作开发。',
      en: 'Mainly responsible for AI agent workflow development.'
    },
    github: 'https://github.com/stageluo',
    wechat: 'Stageluo1213',
    website: ''
  }
]
