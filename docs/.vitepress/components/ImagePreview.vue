<script setup lang="ts">
import { useData, useRoute } from 'vitepress'
import { computed, nextTick, onBeforeUnmount, onMounted, shallowRef, useTemplateRef, watch } from 'vue'
import type { WatchStopHandle } from 'vue'

interface PreviewImage {
  src: string
  alt: string
}

interface PageScroll {
  overflow: string
  scrollbarGutter: string
  x: number
  y: number
}

const route = useRoute()
const { lang } = useData()
const labels = computed(() => lang.value.startsWith('en')
  ? { title: 'Image preview', close: 'Close image preview', button: 'Close', image: 'Project screenshot', hint: 'Click outside the image or press Esc to close' }
  : { title: '图片预览', close: '关闭图片预览', button: '关闭', image: '项目截图', hint: '点击空白处或按 Esc 关闭' })
const dialog = useTemplateRef<HTMLDialogElement>('dialog')
const closeButton = useTemplateRef<HTMLButtonElement>('closeButton')
const selectedImage = shallowRef<PreviewImage | null>(null)
let previewTrigger: HTMLAnchorElement | null = null
let pageScroll: PageScroll | null = null
let stopRouteWatch: WatchStopHandle | undefined
let pressedBackdrop = false

function lockPageScroll() {
  const root = document.documentElement
  pageScroll = {
    overflow: root.style.overflow,
    scrollbarGutter: root.style.scrollbarGutter,
    x: window.scrollX,
    y: window.scrollY
  }
  root.style.scrollbarGutter = 'stable'
  root.style.overflow = 'hidden'
}

function closePreview(restorePosition = true) {
  const trigger = previewTrigger
  previewTrigger = null
  selectedImage.value = null
  pressedBackdrop = false
  if (dialog.value?.open) dialog.value.close()

  if (pageScroll) {
    const root = document.documentElement
    root.style.overflow = pageScroll.overflow
    root.style.scrollbarGutter = pageScroll.scrollbarGutter
    if (restorePosition) {
      window.scrollTo({ left: pageScroll.x, top: pageScroll.y, behavior: 'instant' })
    }
    pageScroll = null
  }

  if (restorePosition && trigger?.isConnected) trigger.focus({ preventScroll: true })
}

async function openPreview(link: HTMLAnchorElement, image: HTMLImageElement) {
  const preview = { src: link.href, alt: image.alt || labels.value.image }
  previewTrigger = link
  selectedImage.value = preview
  await nextTick()
  if (selectedImage.value !== preview || !dialog.value) return

  lockPageScroll()
  dialog.value.showModal()
  closeButton.value?.focus({ preventScroll: true })
}

function handleImageClick(event: MouseEvent) {
  if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey ||
      event.shiftKey || event.altKey || !(event.target instanceof Element)) return

  const link = event.target.closest<HTMLAnchorElement>('.project-intro .image-gallery a[href]')
  const image = link?.querySelector('img')
  if (!link || !image || link.hasAttribute('download') ||
      typeof dialog.value?.showModal !== 'function') return

  event.preventDefault()
  void openPreview(link, image)
}

function handleBackdropClick(event: MouseEvent) {
  if (pressedBackdrop && event.target === dialog.value) closePreview()
  pressedBackdrop = false
}

function handleDialogClose() {
  if (!dialog.value?.open) closePreview()
}

onMounted(() => {
  stopRouteWatch = watch(() => route.path, (path) => {
    closePreview(false)
    document.removeEventListener('click', handleImageClick)
    if (/\/guide\/getting-started\/projection(?:\.html)?\/?$/.test(path)) {
      document.addEventListener('click', handleImageClick)
    }
  }, { immediate: true, flush: 'sync' })
})

onBeforeUnmount(() => {
  stopRouteWatch?.()
  document.removeEventListener('click', handleImageClick)
  closePreview(false)
})
</script>

<template>
  <dialog
    ref="dialog"
    class="image-preview"
    :aria-label="labels.title"
    aria-describedby="image-preview-caption"
    @cancel.prevent="closePreview()"
    @close="handleDialogClose"
    @pointerdown="pressedBackdrop = $event.target === dialog"
    @click="handleBackdropClick"
  >
    <button
      ref="closeButton"
      type="button"
      class="image-preview-close"
      :aria-label="labels.close"
      autofocus
      @click="closePreview()"
    >
      <span aria-hidden="true">×</span>
      {{ labels.button }}
    </button>
    <figure v-if="selectedImage" class="image-preview-figure">
      <img class="image-preview-image" :src="selectedImage.src" :alt="selectedImage.alt" />
      <figcaption id="image-preview-caption" class="image-preview-caption">
        {{ selectedImage.alt }}
        <span class="image-preview-hint">{{ labels.hint }}</span>
      </figcaption>
    </figure>
  </dialog>
</template>

<style scoped>
.image-preview {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  max-width: none;
  max-height: none;
  margin: 0;
  border: 0;
  padding: 5rem 1.5rem 1.5rem;
  background: transparent;
  color: #fff;
  overscroll-behavior: contain;
}

.image-preview[open] {
  display: grid;
  place-items: center;
}

.image-preview::backdrop {
  background: rgb(15 23 42 / 88%);
}

.image-preview-close {
  position: fixed;
  top: 1rem;
  right: 1.5rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 2.75rem;
  padding: 0.5rem 1rem;
  border: 1px solid rgb(255 255 255 / 40%);
  border-radius: 0.5rem;
  background: #1e293b;
  color: #fff;
  font-size: 1rem;
  line-height: 1.5;
  cursor: pointer;
}

.image-preview-close:hover {
  background: #334155;
}

.image-preview-close:focus-visible {
  outline: 2px solid #fff;
  outline-offset: 3px;
}

.image-preview-figure {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  max-width: 100%;
  margin: 0;
}

.image-preview-image {
  display: block;
  max-width: 100%;
  max-height: calc(100vh - 12rem);
  max-height: calc(100dvh - 12rem);
  object-fit: contain;
  border-radius: 0.5rem;
}

.image-preview-caption {
  max-width: 60rem;
  font-size: 0.875rem;
  line-height: 1.5;
  text-align: center;
}

.image-preview-hint {
  display: block;
  margin-top: 0.25rem;
  color: #cbd5e1;
  font-size: 0.75rem;
}

@media (max-width: 640px) {
  .image-preview {
    padding-inline: 0.75rem;
  }

  .image-preview-close {
    right: 0.75rem;
  }
}
</style>
