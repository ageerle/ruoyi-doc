<template>
  <div class="contributors-section">
    <div class="contributors-container">
      <h2 class="contributors-title">
        <span class="title-icon"></span>
        {{ t.title }}
      </h2>

      <!-- 核心贡献者 -->
      <div class="contributor-group">
        <h3 class="group-title">
          <span class="group-icon"></span>
          {{ t.coreTitle }}
        </h3>
        <div class="contributors-grid core-contributors-grid">
          <ContributorCard
            v-for="c in coreContributors"
            :key="c.id"
            :contributor="c"
            :locale="locale"
            size="core"
            @hover="showTooltip"
            @leave="hideTooltip"
          />
        </div>
      </div>

      <!-- 团队成员 -->
      <div class="contributor-group">
        <h3 class="group-title">
          <span class="group-icon"></span>
          {{ t.teamTitle }}
        </h3>
        <div class="contributors-grid team-members-grid">
          <ContributorCard
            v-for="m in teamMembers"
            :key="m.id"
            :contributor="m"
            :locale="locale"
            size="team"
            @hover="showTooltip"
            @leave="hideTooltip"
          />
        </div>
      </div>

      <!-- 其他贡献者 -->
      <div class="contributor-group">
        <h3 class="group-title">
          <span class="group-icon"></span>
          {{ t.otherTitle }}
        </h3>
        <div class="other-contributors-grid">
          <div
            v-for="other in otherContributors"
            :key="other.id"
            class="other-contributor-item"
            @mouseenter="(e) => showTooltip(e, other)"
            @mouseleave="hideTooltip"
            :title="other.name"
          >
            <img :src="other.avatar" :alt="other.name" class="other-contributor-avatar" />
          </div>
        </div>
      </div>
    </div>

    <ContributorTooltip
      v-if="tooltipVisible"
      :contributor="currentContributor"
      :locale="locale"
      :style="tooltipStyle"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useData } from 'vitepress'
import { coreContributors, teamMembers, otherContributors } from '../data/contributors'
import type { Contributor, LocaleKey } from '../data/contributors'
import ContributorCard from './ContributorCard.vue'
import ContributorTooltip from './ContributorTooltip.vue'

const { localeIndex } = useData()
const locale = computed<LocaleKey>(() =>
  localeIndex.value === 'en' ? 'en' : 'zh'
)

const translations: Record<LocaleKey, Record<string, string>> = {
  zh: {
    title: '项目贡献者',
    coreTitle: '核心贡献者',
    teamTitle: '团队成员',
    otherTitle: '贡献者',
  },
  en: {
    title: 'Contributors',
    coreTitle: 'Core Contributors',
    teamTitle: 'Team Members',
    otherTitle: 'Contributors',
  }
}

const t = computed(() => translations[locale.value])

const tooltipVisible = ref(false)
const tooltipStyle = reactive({
  left: '0px',
  top: '0px'
})
const currentContributor = ref<Contributor>({} as Contributor)

const showTooltip = (event: MouseEvent, contributor: Contributor) => {
  currentContributor.value = contributor

  const tooltipWidth = 320
  const tooltipHeight = 200
  const margin = 15

  let left = event.clientX + margin
  let top = event.clientY + margin

  if (left + tooltipWidth > window.innerWidth) {
    left = event.clientX - tooltipWidth - margin
  }
  if (top + tooltipHeight > window.innerHeight) {
    top = event.clientY - tooltipHeight - margin
  }
  if (top < 0) {
    top = margin
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
.contributors-section {
  margin-top: 4rem;
  padding: 2rem 0;
}

.contributors-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

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

.contributors-grid {
  display: grid;
  gap: 1.5rem;
}

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

.team-members-grid {
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1.25rem;
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

.other-contributors-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: flex-start;
  align-items: center;
}

.other-contributor-item {
  position: relative;
  cursor: pointer;
  transition: all 0.3s ease;
}

.other-contributor-item:hover {
  transform: translateY(-4px) scale(1.1);
}

.other-contributor-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--vp-c-brand);
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.other-contributor-item:hover .other-contributor-avatar {
  border-width: 3px;
  box-shadow: 0 4px 12px rgba(var(--vp-c-brand-rgb, 99, 102, 241), 0.4);
}

@media (max-width: 768px) {
  .contributors-container {
    padding: 0 1rem;
  }

  .group-title {
    font-size: 1.5rem;
  }

  .other-contributor-avatar {
    width: 45px;
    height: 45px;
  }
}
</style>
