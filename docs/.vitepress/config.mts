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
          { text: '私有知识库配置', link: '/guide/introduction/knowledge' },
          { text: '接入企业/个人微信', link: '/guide/introduction/weixin' },
          { text: 'springai-mcp使用教程', link: '/guide/introduction/springai-mcp' },
          // { text: '安装文档', link: '/guide/introduction/index' },
          // { text: '部署文档', link: '/guide/introduction/deploy' },
          // { text: 'deepseek微调', link: '/guide/introduction/finetuning' },
          // { text: 'ollama调用本地模型', link: '/guide/introduction/roadmap' },
          // { text: '微信/易支付/Stripe配置', link: '/guide/introduction/roadmap' },
          // { text: 'AI翻唱/语音克隆/AIPPT配置', link: '/guide/introduction/roadmap' },
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
