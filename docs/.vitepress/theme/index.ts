import DefaultTheme from 'vitepress/theme'
import VbenContributors from '../components/VbenContributors.vue'
import './variables.css'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('VbenContributors', VbenContributors)
  }
}
