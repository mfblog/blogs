---
layout: page
sidebar: false

hero:
  title: "Document"
  subTitle: "📚 欢迎来到茶茶的笔记"

types:
  - name: "Alpine 笔记"
    desc: "最新发布"
    link: "/Notes/Alpine/"
    icon: "📄"
  # - name: "Linux 笔记"
  #   desc: "Click to Watch"
  #   link: "/Notes/Linux/Linux"
  #   icon: "🐧"
  # - name: "面经分享"
  #   desc: "interview experiences"
  #   link: "/Notes/Interviews/"
  #   icon: "🏃"
  #flow: true
---

<!-- markdownlint-disable MD033 -->
<script setup>
import { computed } from 'vue'
import { useData } from 'vitepress'
import BlogArchive from '../../.vitepress/views/BlogArchive.vue'
import { data as posts } from '../../.vitepress/utils/article.data.js'

const { frontmatter } = useData()

const latestLink = computed(() =>
  posts.length > 0 ? posts[0].url.replace(/\.html$/, '') : '/Notes/Alpine/'
)

if (frontmatter.value.types && frontmatter.value.types.length > 0) {
  frontmatter.value.types[0] = {
    ...frontmatter.value.types[0],
    link: latestLink.value,
  }
}
</script>

<BlogArchive/>
<!-- markdownlint-enable MD033 -->
