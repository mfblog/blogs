<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vitepress'
import { data as posts } from '../.vitepress/utils/article.data.js'

const router = useRouter()

const latestUrl =
  posts.length > 0
    ? posts[0].url.replace(/\.html$/, '')
    : '/Notes/Alpine/'

onMounted(() => {
  router.go(latestUrl)
})
</script>
