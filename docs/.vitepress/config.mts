import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "RuoYi AI",
  description: "快速搭建属于自己的 AI 助手平台",
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['meta', { name: 'theme-color', content: '#3c8772' }]
  ],
  ignoreDeadLinks: [
    // 忽略本地开发环境的链接
    'http://localhost:5666/operate/model',
    'http://localhost:1002'
  ],
  themeConfig: {
    logo: '/logo.png',
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: '主页', link: '/' },
      { text: '快速开始', link: '/guide/introduction/projection' }
    ],

    sidebar: {
      '/guide/introduction/': [
        {
          text: '快速开始',
          items: [
            { text: '项目介绍', link: '/guide/introduction/projection' },
            { text: '本地安装', link: '/guide/introduction/install' },
            { text: '宝塔部署', link: '/guide/introduction/deploy' },
            { text: 'docker部署', link: '/guide/introduction/docker' }
          ]
        },
        {
          text: '核心功能',
          items: [
            { text: '模型与平台集成', link: '/guide/introduction/models-platforms-integration' },
            { text: '使用知识库', link: '/guide/introduction/knowledge' },
            { text: 'MCP协议', link: '/guide/introduction/mcp' },
          ]
        },
        {
          text: 'AI编程',
          items: [
            { text: 'Claude Code使用教程-入门篇', link: '/guide/introduction/claude-code-beginner' },
            { text: 'Claude Code使用教程-进阶篇', link: '/guide/introduction/claude-code-advanced' },
          ]
        },
        {
          text: '扩展功能',
          items: [
            { text: '接口文档', link: '/guide/introduction/doc' },
            { text: '企微集成', link: '/guide/introduction/weixin' },
          ]
        },
        {
          text: '更新日志',
          items: [
            { text: '2025-08', link: '/guide/introduction/202508_changeLog' },
            { text: '2025-07', link: '/guide/introduction/202507_changeLog' },
            { text: '2025-06', link: '/guide/introduction/202506_changeLog' },
            { text: '2025-05', link: '/guide/introduction/202505_changeLog' },
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
})
