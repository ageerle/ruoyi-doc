<template>
  <div class="contributors-section">

    <!-- 贡献者信息 -->
    <div class="contributors-container">
      <h2 class="contributors-title">
        <span class="title-icon">👥</span>
        项目贡献者
      </h2>

      <!-- 核心贡献者 -->
      <div class="contributor-group">
        <h3 class="group-title">
          <span class="group-icon">⭐</span>
          核心贡献者
        </h3>
        <div class="contributors-grid core-contributors-grid">
          <div
            v-for="contributor in coreContributors"
            :key="contributor.id"
            class="contributor-card"
          >
            <div
              class="contributor-avatar"
              @mouseenter="(e) => showTooltip(e, contributor)"
              @mouseleave="hideTooltip"
            >
              <img :src="contributor.avatar" :alt="contributor.name" />
              <div class="contributor-status"></div>
            </div>
            <div class="contributor-info">
              <h4 class="contributor-name">{{ contributor.name }}</h4>
              <p class="contributor-role">{{ contributor.role }}</p>
              <p class="contributor-bio" :title="contributor.bio">{{ contributor.bio }}</p>
              <div class="contributor-links">
                <a v-if="contributor.github" :href="contributor.github" target="_blank" class="link-item">
                  <svg viewBox="0 0 24 24" width="16" height="16">
                    <path fill="currentColor" d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  GitHub
                </a>
                <span v-if="contributor.wechat" class="link-item wechat-item">
                  <svg viewBox="0 0 24 24" width="16" height="16">
                    <path fill="currentColor" d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 4.882-1.932 7.621-.55-.302-2.676-2.476-4.81-5.722-6.04C10.85 2.462 9.78 2.188 8.691 2.188zm-2.46 2.982a.905.905 0 0 1 .902.903.905.905 0 0 1-.902.903.905.905 0 0 1-.903-.903c0-.5.403-.903.903-.903zm4.92 0a.905.905 0 0 1 .903.903.905.905 0 0 1-.903.903.905.905 0 0 1-.902-.903c0-.5.403-.903.902-.903z"/>
                    <path fill="currentColor" d="M15.293 8.824c-1.9 0-3.45 1.55-3.45 3.45s1.55 3.45 3.45 3.45 3.45-1.55 3.45-3.45-1.55-3.45-3.45-3.45zm-1.725 2.3a.575.575 0 0 1 .575-.575.575.575 0 0 1 .575.575.575.575 0 0 1-.575.575.575.575 0 0 1-.575-.575zm3.45 0a.575.575 0 0 1 .575-.575.575.575 0 0 1 .575.575.575.575 0 0 1-.575.575.575.575 0 0 1-.575-.575z"/>
                  </svg>
                  {{ contributor.wechat }}
                </span>
                <a v-if="contributor.website" :href="contributor.website" target="_blank" class="link-item">
                  <svg viewBox="0 0 24 24" width="16" height="16">
                    <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                  </svg>
                  个人博客
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 团队成员 -->
      <div class="contributor-group">
        <h3 class="group-title">
          <span class="group-icon">🤝</span>
          团队成员
        </h3>
        <div class="contributors-grid team-members-grid">
          <div
            v-for="member in teamMembers"
            :key="member.id"
            class="contributor-card"
          >
            <div
              class="contributor-avatar"
              @mouseenter="(e) => showTooltip(e, member)"
              @mouseleave="hideTooltip"
            >
              <img :src="member.avatar" :alt="member.name" />
              <div class="contributor-status"></div>
            </div>
            <div class="contributor-info">
              <h4 class="contributor-name">{{ member.name }}</h4>
              <p class="contributor-role">{{ member.role }}</p>
              <p class="contributor-bio" :title="member.bio">{{ member.bio }}</p>
              <div class="contributor-links">
                <a v-if="member.github" :href="member.github" target="_blank" class="link-item">
                  <svg viewBox="0 0 24 24" width="16" height="16">
                    <path fill="currentColor" d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.30.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  GitHub
                </a>
                <span v-if="member.wechat" class="link-item wechat-item">
                  <svg viewBox="0 0 24 24" width="16" height="16">
                    <path fill="currentColor" d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 4.882-1.932 7.621-.55-.302-2.676-2.476-4.81-5.722-6.04C10.85 2.462 9.78 2.188 8.691 2.188zm-2.46 2.982a.905.905 0 0 1 .902.903.905.905 0 0 1-.902.903.905.905 0 0 1-.903-.903c0-.5.403-.903.903-.903zm4.92 0a.905.905 0 0 1 .903.903.905.905 0 0 1-.903.903.905.905 0 0 1-.902-.903c0-.5.403-.903.902-.903z"/>
                    <path fill="currentColor" d="M15.293 8.824c-1.9 0-3.45 1.55-3.45 3.45s1.55 3.45 3.45 3.45 3.45-1.55 3.45-3.45-1.55-3.45-3.45-3.45zm-1.725 2.3a.575.575 0 0 1 .575-.575.575.575 0 0 1 .575.575.575.575 0 0 1-.575.575.575.575 0 0 1-.575-.575zm3.45 0a.575.575 0 0 1 .575-.575.575.575 0 0 1 .575.575.575.575 0 0 1-.575.575.575.575 0 0 1-.575-.575z"/>
                  </svg>
                  {{ member.wechat }}
                </span>
                <a v-if="member.website" :href="member.website" target="_blank" class="link-item">
                  <svg viewBox="0 0 24 24" width="16" height="16">
                    <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                  </svg>
                  个人博客
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 悬浮卡片 -->
    <div
      v-if="tooltipVisible"
      class="contributor-tooltip"
      :style="tooltipStyle"
    >
      <div class="tooltip-header">
        <img :src="currentContributor.avatar" :alt="currentContributor.name" class="tooltip-avatar" />
        <div class="tooltip-info">
          <h4>{{ currentContributor.name }}</h4>
          <p>{{ currentContributor.role }}</p>
        </div>
      </div>
      <div class="tooltip-content">
        <p class="tooltip-bio">{{ currentContributor.bio }}</p>
        <div class="tooltip-contact">
          <a
            :href="currentContributor.github"
            target="_blank"
            rel="noopener"
            class="contact-link github-link"
          >
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path fill="currentColor" d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            GitHub
          </a>
          <span
            class="contact-link wechat-link"
            :title="`微信: ${currentContributor.wechat}`"
          >
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path fill="currentColor" d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 4.882-1.932 7.621-.55-.302-2.676-2.476-4.81-5.722-6.04C10.85 2.462 9.78 2.188 8.691 2.188zm-2.46 2.982a.905.905 0 0 1 .902.903.905.905 0 0 1-.902.903.905.905 0 0 1-.903-.903c0-.5.403-.903.903-.903zm4.92 0a.905.905 0 0 1 .903.903.905.905 0 0 1-.903.903.905.905 0 0 1-.902-.903c0-.5.403-.903.902-.903z"/>
              <path fill="currentColor" d="M15.293 8.824c-1.9 0-3.45 1.55-3.45 3.45s1.55 3.45 3.45 3.45 3.45-1.55 3.45-3.45-1.55-3.45-3.45-3.45zm-1.725 2.3a.575.575 0 0 1 .575-.575.575.575 0 0 1 .575.575.575.575 0 0 1-.575.575.575.575 0 0 1-.575-.575zm3.45 0a.575.575 0 0 1 .575-.575.575.575 0 0 1 .575.575.575.575 0 0 1-.575.575.575.575 0 0 1-.575-.575z"/>
            </svg>
            微信: {{ currentContributor.wechat }}
          </span>
          <a
            :href="currentContributor.website"
            target="_blank"
            rel="noopener"
            class="contact-link website-link"
          >
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
            </svg>
            个人博客
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'

interface Contributor {
  id: string
  name: string
  role: string
  avatar: string
  bio: string
  github: string
  wechat: string
  website: string
}

const tooltipVisible = ref(false)
const tooltipStyle = reactive({
  left: '0px',
  top: '0px'
})
const currentContributor = ref<Contributor>({} as Contributor)

// 核心贡献者数据
const coreContributors: Contributor[] = [
  {
    id: '1',
    name: 'ageerle',
    role: '项目创始人',
    avatar: 'https://avatars.githubusercontent.com/u/32251822?s=96&v=4',
    bio: 'RuoYi AI 项目的创始人和主要维护者，专注于AI技术与企业级应用的结合。',
    github: 'https://github.com/ageerle',
    wechat: 'w193960194',
    website: 'https://blog.csdn.net/weixin_42416319'
  },
  {
    id: '2',
    name: '林大侠',
    role: '项目合伙人',
    avatar: 'https://avatars.githubusercontent.com/u/147299771?v=4',
    bio: '负责相关产品的战略设计和运营，参与项目的设计、开发。',
    github: 'https://github.com/lindaxiaproject',
    wechat: 'lindaxia-2019',
    website: 'https://blog.csdn.net/LINHONG_1994'
  },
  {
    id: '3',
    name: 'evo',
    role: 'Backend Developer',
    avatar: 'https://avatars.githubusercontent.com/u/59215838?s=96&v=4',
    bio: '负责后端服务开发，主要负责模型管理模块',
    github: 'https://github.com/MuSan-Li',
    wechat: 'Exotisch',
    website: 'http://exotisch.cn/'
  }
]

// 团队成员数据
const teamMembers: Contributor[] = [
  {
    id: '4',
    name: 'Albert Z',
    role: 'Backend Developer && Fullstacks',
    avatar: 'https://avatars.githubusercontent.com/u/6056349?v=4',
    bio: '负责后端服务开发，专精于业务功能设计、微服务架构、应用服务部署、熟悉使用aliyun，腾讯云',
    github: 'https://github.com/janzhou123',
    wechat: 'ZHOUWY123',
    website: 'https://zhouxiaoxiao.cn'
  },
  {
    id: '5',
    name: '請發財💰',
    role: 'Backend Developer',
    avatar: 'https://avatars.githubusercontent.com/u/51768077?s=400&u=f0943b9b353585ee59badce9bfa35fe895d9b47e&v=4',
    bio: '负责后端服务开发。',
    github: 'https://github.com/zhangpengxiang',
    wechat: 'LHZPXZYQ',
    website: 'https://blog.csdn.net/weixin_44550842?spm=1000.2115.3001.10640'
  },
  {
    id: '6',
    name: '颜AI',
    role: 'AI Backend Developer',
    avatar: 'https://avatars.githubusercontent.com/u/86051851?s=400&u=ecaf566ff91277d25a87de88b0b4b4b39ec508cd&v=4',
    bio: '负责AI后端服务开发，整合第三方AI服务应用',
    github: 'https://github.com/Cyclones-Y',
    wechat: 'ya10405',
    website: 'https://juejin.cn/user/1612303520767028'
  },
  {
    id: '7',
    name: 'WCS视频平台',
    role: 'Backend Developer',
    avatar: 'https://avatars.githubusercontent.com/u/53170533?v=4&size=64',
    bio: '负责后端服务开发，研发WCS视频平台。',
    github: 'https://github.com/WWTBNBWN',
    wechat: 'WYWZC888666',
    website: 'https://wzciot.site/'
  },
  {
  id: '8',
  name: '酒亦',
  role: 'Backend Developer',
  avatar: 'https://avatars.githubusercontent.com/u/68746373?s=400&u=6de3b3d1748ab8661afc59167b9ff258c31d973a&v=4',
  bio: '负责后端服务开发，热爱技术',
  github: 'https://github.com/Code-Mr-Jiu',
  wechat: 'zimu578665',
  website: ''
  },
  {
    id: '9',
    name: '瓢六六',
    role: 'Backend Developer',
    avatar: 'https://avatars.githubusercontent.com/u/19771955?s=96&v=4',
    bio: '负责后端服务开发，专精于微服务架构和数据库优化。',
    github: 'https://github.com/liudalian',
    wechat: 'LGF188888888888',
    website: 'https://blog.csdn.net/qq616138361?type=blog'
  },
  {
    id: '10',
    name: 'Jason',
    role: 'Fullstack Developer',
    avatar: 'https://avatars.githubusercontent.com/u/29836675?v=4',
    bio: '致力于全栈开发，专注技术创新与高效实践',
    github: 'https://github.com/xingjisen',
    wechat: 'JasonXing0806',
    "website": ""
  },
  {
    id: '11',
    name: 'Alan',
    role: 'Cloud Native Architect',
    avatar: 'https://avatars.githubusercontent.com/u/3273357?v=4',
    bio: '专精于云原生架构与平台部署优化。',
    github: 'https://github.com/alanpeng',
    wechat: 'BuddhistPath',
    website: ''
  },
]

const showTooltip = (event: MouseEvent, contributor: Contributor) => {
  currentContributor.value = contributor

  // 计算tooltip位置，确保不会超出视窗
  const tooltipWidth = 320 // tooltip最大宽度
  const tooltipHeight = 200 // 估算tooltip高度
  const margin = 15

  let left = event.pageX + margin
  let top = event.pageY - margin

  // 防止tooltip超出右边界
  if (left + tooltipWidth > window.innerWidth + window.scrollX) {
    left = event.pageX - tooltipWidth - margin
  }

  // 防止tooltip超出上边界
  if (top < window.scrollY) {
    top = event.pageY + margin
  }

  // 防止tooltip超出下边界
  if (top + tooltipHeight > window.innerHeight + window.scrollY) {
    top = event.pageY - tooltipHeight - margin
  }

  tooltipStyle.left = left + 'px'
  tooltipStyle.top = top + 'px'
  tooltipVisible.value = true
}

const hideTooltip = () => {
  tooltipVisible.value = false
}
</script>

<style scoped>
/* 贡献者区域样式 */
.contributors-section {
  margin-top: 4rem;
  padding: 2rem 0;
}



/* 贡献者容器 */
.contributors-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}




/* 贡献者组 */
.contributor-group {
  margin-bottom: 3rem;
}

.group-title {
  font-size: 1.8rem;
  font-weight: 600;
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--vp-c-text-1);
}

.group-icon {
  font-size: 1.5rem;
}

/* 贡献者网格基础样式 */
.contributors-grid {
  display: grid;
  gap: 1.5rem;
}

/* 核心贡献者网格 - 最多3列 */
.core-contributors-grid {
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}

@media (min-width: 1000px) {
  .core-contributors-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 700px) and (max-width: 999px) {
  .core-contributors-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 699px) {
  .core-contributors-grid {
    grid-template-columns: 1fr;
  }
}

/* 团队成员网格 - 最多4列，更紧凑 */
.team-members-grid {
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1.25rem;
}

/* 核心贡献者特殊样式 */
.core-contributors-grid .contributor-card {
  min-height: 320px;
  padding: 1.5rem;
}

.core-contributors-grid .contributor-bio {
  -webkit-line-clamp: 2; /* 核心贡献者简介显示2行 */
  max-height: calc(1.4em * 2);
}

/* 团队成员特殊样式 */
.team-members-grid .contributor-card {
  min-height: 280px; /* 团队成员卡片更紧凑 */
  padding: 1rem;
}

.team-members-grid .contributor-avatar {
  width: 60px;
  height: 60px;
  margin: 0 auto 0.5rem;
}

.team-members-grid .contributor-name {
  font-size: 1.1rem;
  margin-bottom: 0.25rem;
}

.team-members-grid .contributor-role {
  font-size: 0.85rem;
  margin-bottom: 0.5rem;
}

.team-members-grid .contributor-bio {
  -webkit-line-clamp: 1; /* 团队成员简介只显示1行 */
  max-height: calc(1.4em * 1);
  margin-bottom: 0.5rem;
  font-size: 0.8rem;
}



@media (min-width: 1200px) {
  .team-members-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (min-width: 900px) and (max-width: 1199px) {
  .team-members-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 600px) and (max-width: 899px) {
  .team-members-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 599px) {
  .team-members-grid {
    grid-template-columns: 1fr;
  }
}

/* 贡献者卡片 */
.contributor-card {
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-border);
  border-radius: 16px;
  padding: 1.25rem;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 300px; /* 使用最小高度而不是固定高度 */
}

.contributor-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.contributor-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  border-color: var(--vp-c-brand);
}

.contributor-card:hover::before {
  opacity: 1;
}

/* 头像区域 */
.contributor-avatar {
  position: relative;
  width: 80px;
  height: 80px;
  margin: 0 auto 1rem;
  cursor: pointer;
  transition: transform 0.3s ease;
}

.contributor-avatar:hover {
  transform: scale(1.05);
}

.contributor-avatar img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid var(--vp-c-brand);
  transition: transform 0.3s ease;
}

.contributor-status {
  position: absolute;
  bottom: 5px;
  right: 5px;
  width: 16px;
  height: 16px;
  background: #4ade80;
  border: 2px solid white;
  border-radius: 50%;
}

/* 贡献者信息 */
.contributor-info {
  text-align: center;
  position: relative;
  z-index: 1;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between; /* 确保内容分布均匀 */
  min-height: 0; /* 允许flex子项收缩 */
}

.contributor-name {
  margin: 0 0 0.5rem 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.contributor-role {
  margin: 0 0 0.75rem 0;
  font-size: 0.9rem;
  color: var(--vp-c-text-2);
  opacity: 0.8;
}

.contributor-bio {
  margin: 0;
  font-size: 0.85rem;
  line-height: 1.4;
  color: var(--vp-c-text-2);
  opacity: 0.9;
  text-align: center;
  padding: 0 0.25rem;

  /* 默认文本省略 - 最多显示2行 */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  max-height: calc(1.4em * 2);
  flex: 0 0 auto; /* 不占用额外空间 */
}

.contributor-links {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
  margin-top: auto; /* 推到底部 */
  padding-top: 0.5rem;
  flex-shrink: 0; /* 防止被压缩 */
}

/* 核心贡献者链接样式 */
.core-contributors-grid .contributor-links {
  gap: 0.5rem;
  padding-top: 0.75rem;
}

/* 团队成员链接样式 */
.team-members-grid .contributor-links {
  gap: 0.375rem;
  padding-top: 0.5rem;
}

.team-members-grid .link-item {
  font-size: 0.7rem;
  padding: 0.2rem 0.35rem;
}

.link-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: var(--vp-c-brand);
  text-decoration: none;
  padding: 0.3rem 0.5rem;
  border-radius: 6px;
  background: rgba(var(--vp-c-brand-rgb), 0.1);
  transition: all 0.2s ease;
  border: 1px solid transparent;
  white-space: nowrap; /* 防止文字换行 */
  flex-shrink: 0; /* 防止被压缩 */
}

.link-item:hover {
  background: var(--vp-c-brand);
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(var(--vp-c-brand-rgb), 0.3);
}

.link-item svg {
  flex-shrink: 0;
}

.wechat-item {
  cursor: default;
}

.wechat-item:hover {
  background: #07c160;
  color: white;
}

/* 悬浮提示卡片 */
.contributor-tooltip {
  position: fixed;
  z-index: 9999;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-border);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  max-width: 320px;
  pointer-events: none;
  backdrop-filter: blur(10px);
  opacity: 1;
  visibility: visible;
  transition: opacity 0.3s ease, visibility 0.3s ease;
}

.tooltip-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.tooltip-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--vp-c-brand);
}

.tooltip-info h4 {
  margin: 0 0 0.25rem 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.tooltip-info p {
  margin: 0;
  font-size: 0.9rem;
  color: var(--vp-c-text-2);
}

.tooltip-content {
  border-top: 1px solid var(--vp-c-border);
  padding-top: 1rem;
}

.tooltip-bio {
  font-size: 0.9rem;
  line-height: 1.5;
  color: var(--vp-c-text-2);
  margin: 0 0 1rem 0;
}

.tooltip-contact {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.contact-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: var(--vp-c-brand);
  text-decoration: none;
  transition: all 0.3s ease;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  background: rgba(var(--vp-c-brand-rgb), 0.1);
  border: 1px solid transparent;
  cursor: pointer;
}

.contact-link:hover {
  background: var(--vp-c-brand);
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(var(--vp-c-brand-rgb), 0.3);
}

.contact-link svg {
  flex-shrink: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .contributors-container {
    padding: 0 1rem;
  }

  .group-title {
    font-size: 1.5rem;
  }

  .contributor-tooltip {
    max-width: 280px;
    padding: 1rem;
  }
}
</style>
