import { defineConfig } from 'vitepress'

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
          { text: '扩展功能', link: '/guide/extensions/doc' },
          { text: '更新日志', link: '/guide/changelog/202508_changeLog' },
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
                { text: '知识管理', link: '/guide/features/knowledge' },
                { text: '工具管理', link: '/guide/features/tools' },
                { text: '记忆管理', link: '/guide/features/memory' },
                { text: '技能管理', link: '/guide/features/skills' },
                { text: '智能体管理', link: '/guide/features/agent' },
                { text: '提示词管理', link: '/guide/features/prompt-engineering' },
                { text: '编排管理', link: '/guide/features/orchestration' },
              ]
            },
            {
              text: '系统管理',
              items: [
                { text: '资源管理', link: '/guide/system/resources' },
              ]
            },
            {
              text: '扩展功能',
              items: [
                { text: '接口文档', link: '/guide/extensions/doc' },
                { text: '企微集成', link: '/guide/extensions/weixin' },
                { text: 'Dify 集成', link: '/guide/extensions/dify' },
                { text: 'Coze 集成', link: '/guide/extensions/coze' },
                { text: 'Claude Code 入门篇', link: '/guide/ai-coding/claude-code-beginner' },
                { text: 'Claude Code 进阶篇', link: '/guide/ai-coding/claude-code-advanced' },
              ]
            },
            {
              text: '更新日志',
              items: [
                { text: '2025-08', link: '/guide/changelog/202508_changeLog' },
                { text: '2025-07', link: '/guide/changelog/202507_changeLog' },
                { text: '2025-06', link: '/guide/changelog/202506_changeLog' },
                { text: '2025-05', link: '/guide/changelog/202505_changeLog' },
              ]
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
          { text: 'AI Coding', link: '/en/guide/ai-coding/claude-code-beginner' },
          { text: 'Changelog', link: '/en/guide/changelog/202508_changeLog' },
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
                { text: 'Model & Platform Integration', link: '/en/guide/features/models-platforms-integration' },
                { text: 'Model Integration', link: '/en/guide/features/model' },
                { text: 'Knowledge Base (RAG)', link: '/en/guide/features/knowledge' },
                { text: 'MCP Protocol', link: '/en/guide/features/mcp' },
              ]
            },
            {
              text: 'AI Coding',
              items: [
                { text: 'Claude Code Tutorial - Beginner', link: '/en/guide/ai-coding/claude-code-beginner' },
                { text: 'Claude Code Tutorial - Advanced', link: '/en/guide/ai-coding/claude-code-advanced' },
              ]
            },
            {
              text: 'Extensions',
              items: [
                { text: 'API Documentation', link: '/en/guide/extensions/doc' },
                { text: 'WeChat Integration', link: '/en/guide/extensions/weixin' },
              ]
            },
            {
              text: 'Changelog',
              items: [
                { text: '2025-08', link: '/en/guide/changelog/202508_changeLog' },
                { text: '2025-07', link: '/en/guide/changelog/202507_changeLog' },
                { text: '2025-06', link: '/en/guide/changelog/202506_changeLog' },
                { text: '2025-05', link: '/en/guide/changelog/202505_changeLog' },
              ]
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
