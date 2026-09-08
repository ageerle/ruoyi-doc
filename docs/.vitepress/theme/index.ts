import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import { h } from 'vue'
import ImagePreview from '../components/ImagePreview.vue'
import VbenContributors from '../components/VbenContributors.vue'
import './variables.css'
import './custom.css'

export default {
  extends: DefaultTheme,
  Layout: () => h(DefaultTheme.Layout, null, {
    'layout-bottom': () => h(ImagePreview)
  }),
  enhanceApp({ app }) {
    app.component('VbenContributors', VbenContributors)
  }
} satisfies Theme
