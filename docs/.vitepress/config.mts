import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "RuoYi AI",
  description: "快速搭建属于自己的 AI 助手平台",
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['meta', { name: 'theme-color', content: '#3c8772' }]
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
            { text: 'MCP协议', link: '/guide/introduction/mcp' },
            { text: '本地知识库', link: '/guide/introduction/knowledge' },
            { text: '模型集成', link: '/guide/introduction/model' },
            { text: 'Dify集成', link: '/guide/introduction/dify' },
            { text: 'Coze集成', link: '/guide/introduction/coze' },
            { text: 'FastGPT集成', link: '/guide/introduction/fastgpt' }
          ]
        },
        {
          text: '扩展功能',
          items: [
            { text: '接口文档', link: '/guide/introduction/doc' },
            { text: '企微集成', link: '/guide/introduction/weixin' },
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
