<script setup>
import { useRouter } from 'vitepress'

const router = useRouter()
// 页面加载后立即跳转
router.go('/Notes/Alpine/Alpine')
</script>


<!-- pnpm run docs:dev 开发模式启动-->
<!-- pnpm run docs:build 打包-->
<!-- pnpm run docs:preview 生产模式预览 -->