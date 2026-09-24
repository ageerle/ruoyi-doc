import { defineConfig } from 'vitepress'

// 新月份放在最前；导航指向最新一期，侧栏始终最多展示 5 期。
const changelogMonths = [
  '2026-09', '2026-08', '2026-07', '2026-06', '2026-05',
  '2026-04', '2026-03', '2026-02', '2026-01',
  '2025-12', '2025-11', '2025-10', '2025-09',
  '2025-08', '2025-07', '2025-06', '2025-05',
]
const changelogLink = (month: string, prefix = '') =>
  `${prefix}/guide/changelog/${month.replace('-', '')}_changeLog`
const recentChangelogs = (prefix = '') => changelogMonths.slice(0, 5).map(month => ({
  text: month,
  link: changelogLink(month, prefix),
}))

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "RuoYi AI",
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['meta', { name: 'theme-color', content: '#3c8772' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }],
    ['link', { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+SC:wght@400;500;600;700&display=swap' }],
  ],
  markdown: {
    image: {
      lazyLoading: true
    }
  },
  ignoreDeadLinks: [
    'http://localhost:5666/operate/model',
    'http://localhost:1002',
    'http://localhost:19500',
    /localhost:\d+/
  ],

  locales: {
    root: {
      label: '简体中文',
      lang: 'zh-CN',
      title: 'RuoYi AI',
      description: '快速搭建属于自己的 AI 助手平台',
      themeConfig: {
        logo: '/logo.png',
        nav: [
          { text: '主页', link: '/' },
          { text: '快速开始', link: '/guide/getting-started/projection' },
          { text: '核心功能', link: '/guide/features/model', activeMatch: '/guide/features/' },
          { text: '扩展功能', link: '/guide/extensions/doc' },
          { text: '商业版', link: '/guide/commercial/', activeMatch: '/guide/commercial/' },
          { text: '更新日志', link: changelogLink(changelogMonths[0]) },
        ],
        search: {
          provider: 'local',
          options: {
            translations: {
              button: { buttonText: '搜索', buttonAriaLabel: '搜索' },
              modal: {
                noResultsText: '无法找到相关结果',
                resetButtonTitle: '清除查询条件',
                footer: { selectText: '选择', navigateText: '切换' }
              }
            }
          }
        },
        lastUpdated: {
          text: '最后更新于',
        },
        editLink: {
          pattern: 'https://github.com/ageerle/ruoyi-doc/edit/main/docs/:path',
          text: '在 GitHub 上编辑此页'
        },
        sidebar: {
          '/guide/': [
            {
              text: '商业版',
              items: [
                { text: '商业版发布与价格', link: '/guide/commercial/' },
              ]
            },
            {
              text: '快速开始',
              items: [
                { text: '项目介绍', link: '/guide/getting-started/projection' },
                { text: '本地安装', link: '/guide/getting-started/install' },
                { text: '宝塔部署', link: '/guide/getting-started/deploy' },
                { text: 'docker部署', link: '/guide/getting-started/docker' }
              ]
            },
            {
              text: '核心功能',
              items: [
                { text: '模型管理', link: '/guide/features/model' },
                { text: '平台接入', link: '/guide/features/models-platforms-integration' },
                { text: '多模态接口', link: '/guide/features/multimodal' },
                { text: '知识管理', link: '/guide/features/knowledge' },
                { text: '工具管理', link: '/guide/features/tools' },
                { text: 'MCP 管理', link: '/guide/features/mcp' },
                { text: '技能管理', link: '/guide/features/skills' },
                { text: '上下文管理', link: '/guide/features/context' },
                { text: '智能体管理', link: '/guide/features/agent' },
                { text: '流程编排', link: '/guide/features/orchestration' },
              ]
            },
            {
              text: '扩展功能',
              items: [
                { text: '接口文档', link: '/guide/extensions/doc' },
                { text: '企微集成', link: '/guide/extensions/weixin' },
                { text: '资源管理', link: '/guide/extensions/resources' },
                { text: 'AI编程', link: '/guide/ai-coding/ai-programming' },
              ]
            },
            {
              text: '更新日志',
              items: recentChangelogs(),
            }
          ]
        },
        outline: {
          label: '页面导航',
        },
        socialLinks: [
          { icon: 'github', link: 'https://github.com/ageerle/ruoyi-ai' },
          { icon: 'gitee', link: 'https://gitee.com/ageerle/ruoyi-ai' }
        ]
      }
    },
    en: {
      label: 'English',
      lang: 'en',
      title: 'RuoYi AI',
      description: 'Build your own AI assistant platform',
      themeConfig: {
        logo: '/logo.png',
        nav: [
          { text: 'Home', link: '/en/' },
          { text: 'Getting Started', link: '/en/guide/getting-started/projection' },
          { text: 'Core Features', link: '/en/guide/features/model', activeMatch: '/en/guide/features/' },
          { text: 'Extensions', link: '/en/guide/extensions/doc' },
          { text: 'Changelog', link: changelogLink(changelogMonths[0], '/en') },
        ],
        search: {
          provider: 'local',
          options: {
            translations: {
              button: { buttonText: 'Search', buttonAriaLabel: 'Search' },
              modal: {
                noResultsText: 'No results found',
                resetButtonTitle: 'Clear query',
                footer: { selectText: 'Select', navigateText: 'Switch' }
              }
            }
          }
        },
        lastUpdated: {
          text: 'Last updated',
        },
        editLink: {
          pattern: 'https://github.com/ageerle/ruoyi-doc/edit/main/docs/:path',
          text: 'Edit this page on GitHub'
        },
        sidebar: {
          '/en/guide/': [
            {
              text: 'Getting Started',
              items: [
                { text: 'Introduction', link: '/en/guide/getting-started/projection' },
                { text: 'Local Installation', link: '/en/guide/getting-started/install' },
                { text: 'Baota Deployment', link: '/en/guide/getting-started/deploy' },
                { text: 'Docker Deployment', link: '/en/guide/getting-started/docker' }
              ]
            },
            {
              text: 'Core Features',
              items: [
                { text: 'Model Management', link: '/en/guide/features/model' },
                { text: 'Platform Integration', link: '/en/guide/features/models-platforms-integration' },
                { text: 'Multimodal & Media', link: '/en/guide/features/multimodal' },
                { text: 'Knowledge Base (RAG)', link: '/en/guide/features/knowledge' },
                { text: 'Tool Management', link: '/en/guide/features/tools' },
                { text: 'MCP Management', link: '/en/guide/features/mcp' },
                { text: 'Skills', link: '/en/guide/features/skills' },
                { text: 'Context Management', link: '/en/guide/features/context' },
                { text: 'Agents', link: '/en/guide/features/agent' },
                { text: 'Workflow Orchestration', link: '/en/guide/features/orchestration' },
              ]
            },
            {
              text: 'Extensions',
              items: [
                { text: 'API Documentation', link: '/en/guide/extensions/doc' },
                { text: 'WeCom Integration', link: '/en/guide/extensions/weixin' },
                { text: 'Resource Management', link: '/en/guide/extensions/resources' },
                { text: 'AI Coding', link: '/en/guide/ai-coding/ai-programming' },
              ]
            },
            {
              text: 'Changelog',
              items: recentChangelogs('/en'),
            }
          ]
        },
        outline: {
          label: 'On this page',
        },
        socialLinks: [
          { icon: 'github', link: 'https://github.com/ageerle/ruoyi-ai' },
          { icon: 'gitee', link: 'https://gitee.com/ageerle/ruoyi-ai' }
        ]
      }
    }
  }
})
