import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "RuoYi AI",
  description: "a",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: '主页', link: '/' },
      { text: '项目文档', link: '/guide/introduction/index' },
      // { text: '用户端文档', link: '/markdown-examples' },
      // { text: '管理端文档', link: '/markdown-examples' },
      // { text: '小程序文档', link: '/markdown-examples' }
    ],

    sidebar: [
      {
        text: '项目文档',
        items: [
          { text: '安装文档', link: '/guide/introduction/index' },
          { text: '模型集成', link: '/guide/introduction/model' },
          { text: '宝塔部署', link: '/guide/introduction/deploy' },
          { text: '知识库配置', link: '/guide/introduction/knowledge' },
          { text: 'MCP教程', link: '/guide/introduction/mcp' },
          { text: '接入企业微信', link: '/guide/introduction/weixin' },
          { text: '支付配置', link: '/guide/introduction/pay' },
          { text: '接口文档', link: '/guide/introduction/doc' },
          { text: '项目扩展', link: '/guide/introduction/expansion' },
        ]
      }
    ],
    outline: {
      label: '页面导航',
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/ageerle/ruoyi-ai' },
      { icon: 'gitee', link: 'https://gitee.com/ageerle/ruoyi-ai' }
    ]
  }
})
