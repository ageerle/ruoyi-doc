<template>
  <div class="contributor-card" :class="[`size-${size}`]">
    <div
      class="contributor-avatar"
      @mouseenter="(e) => $emit('hover', e, contributor)"
      @mouseleave="$emit('leave')"
    >
      <img :src="contributor.avatar" :alt="contributor.name" />
    </div>
    <div class="contributor-info">
      <h4 class="contributor-name">{{ contributor.name }}</h4>
      <p class="contributor-role">{{ localizedRole }}</p>
      <p class="contributor-bio" :title="localizedBio">{{ localizedBio }}</p>
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
          {{ locale === 'en' ? 'Blog' : '个人博客' }}
        </a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Contributor, LocaleKey } from '../data/contributors'
import { getLocalizedText } from '../data/contributors'

const props = defineProps<{
  contributor: Contributor
  size?: 'core' | 'team'
  locale?: LocaleKey
}>()

defineEmits<{
  hover: [e: MouseEvent, contributor: Contributor]
  leave: []
}>()

const locale = computed(() => props.locale || 'zh')
const localizedRole = computed(() => getLocalizedText(props.contributor.role, locale.value))
const localizedBio = computed(() => getLocalizedText(props.contributor.bio, locale.value))
</script>

<style scoped>
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
}

.contributor-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.02) 0%, rgba(0, 0, 0, 0.01) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.contributor-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  border-color: var(--brand-border);
}

.contributor-card:hover::before {
  opacity: 1;
}

/* core size */
.size-core {
  min-height: 320px;
  padding: 1.5rem;
}

/* team size */
.size-team {
  min-height: 280px;
  padding: 1rem;
}

/* 头像 */
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

.size-team .contributor-avatar {
  width: 60px;
  height: 60px;
  margin-bottom: 0.5rem;
}

.contributor-avatar img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid var(--vp-c-brand);
  transition: transform 0.3s ease;
}


/* 信息 */
.contributor-info {
  text-align: center;
  position: relative;
  z-index: 1;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 0;
}

.contributor-name {
  margin: 0 0 0.5rem 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.size-team .contributor-name {
  font-size: 1.1rem;
  margin-bottom: 0.25rem;
}

.contributor-role {
  margin: 0 0 0.75rem 0;
  font-size: 0.9rem;
  color: var(--vp-c-text-2);
  opacity: 0.8;
}

.size-team .contributor-role {
  font-size: 0.85rem;
  margin-bottom: 0.5rem;
}

.contributor-bio {
  margin: 0;
  font-size: 0.85rem;
  line-height: 1.4;
  color: var(--vp-c-text-2);
  opacity: 0.9;
  text-align: center;
  padding: 0 0.25rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  max-height: calc(1.4em * 2);
  flex: 0 0 auto;
}

.size-team .contributor-bio {
  -webkit-line-clamp: 1;
  max-height: calc(1.4em * 1);
  margin-bottom: 0.5rem;
  font-size: 0.8rem;
}

/* 链接 */
.contributor-links {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
  margin-top: auto;
  padding-top: 0.5rem;
  flex-shrink: 0;
}

.size-team .contributor-links {
  gap: 0.375rem;
  padding-top: 0.5rem;
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
  white-space: nowrap;
  flex-shrink: 0;
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

.size-team .link-item {
  font-size: 0.7rem;
  padding: 0.2rem 0.35rem;
}

.wechat-item {
  cursor: default;
}

.wechat-item:hover {
  background: #07c160;
  color: white;
}

@media (max-width: 768px) {
  .size-core {
    min-height: auto;
  }
  .size-team {
    min-height: auto;
  }
}
</style>
