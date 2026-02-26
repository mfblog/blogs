<template>
  <footer
    class="relative px-6 pt-8 pb-4 text-center border-t dark:border-zinc-800 sm:pt-8 text-black/40 dark:text-zinc-300/60"
  >
    <p class="text-sm font-medium">{{ footer.copyright }}</p>
    <p class="text-sm font-medium">
      访问统计：PV {{ formatCounter(sitePv) }} | UV {{ formatCounter(siteUv) }}
    </p>
    <p class="text-sm font-medium">
      Github |
      <a href="https://github.com/mfblog/blogs">茶茶吖笔记</a>
    </p>
  </footer>
</template>

<script setup lang="ts">
import { useData } from "vitepress";
import { formatCounter, sitePv, siteUv } from "../utils/openKounter.js";

const { theme } = useData();
const { footer } = theme.value;
</script>
