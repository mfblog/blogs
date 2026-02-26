<template>
  <div v-if="lastUpdated" class="py-1 text-sm font-medium">
    📝 最后更新时间 : {{ lastUpdated }}
  </div>
  <div v-if="showPageCounter" class="py-1 text-sm font-medium">
    👀 本页访问：PV {{ formatCounter(pagePv) }} | UV {{ formatCounter(pageUv) }}
  </div>
</template>

<script setup lang="ts">
import { useData, useRoute } from "vitepress";
import { computed } from "vue";
import dayjs from "dayjs";
import {
  formatCounter,
  pagePv,
  pageUv,
  shouldShowPageCounter,
} from "../utils/openKounter.js";

const { frontmatter, page } = useData();
const route = useRoute();

const lastUpdated = computed(() => {
  // 禁用日期判定
  if (frontmatter.value.lastUpdated === false) return "";
  // 优先取博文前的自定义时间日期 `updateTime`
  else if (frontmatter.value.updateTime) return frontmatter.value.updateTime;
  // 取系统生成的 git 提交时间
  else return dayjs(page.value.lastUpdated).format("YYYY-MM-DD HH:mm") || "";
});

const showPageCounter = computed(() => shouldShowPageCounter(route.path));
</script>
