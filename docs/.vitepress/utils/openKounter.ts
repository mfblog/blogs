import { ref } from "vue";
import { openKounterConfig } from "../userConfig/openKounter.js";

type BatchRequest = { target: string };

type CounterRecord = {
  objectId?: string;
  time: number;
};

export const sitePv = ref<number | null>(null);
export const siteUv = ref<number | null>(null);
export const pagePv = ref<number | null>(null);
export const pageUv = ref<number | null>(null);

let lastTrackedPath = "";
const UV_CACHE_KEY = "openkounter:uv:last-ts";
const UV_EXPIRE_MS = 24 * 60 * 60 * 1000;

function normalizePath(rawPath: string) {
  const path = rawPath.split("?")[0].split("#")[0] || "/";
  return path;
}

function normalizePageTarget(rawPath: string) {
  const path = normalizePath(rawPath);
  // 与官方 adapter.js 保持一致，统一为以 / 结尾的路径
  return decodeURI(path.replace(/\/*(index\.html)?$/, "/"));
}

function withTimeout(ms: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return {
    signal: controller.signal,
    clear: () => clearTimeout(timer),
  };
}

async function fetchBatchCounter(requests: BatchRequest[]) {
  const { signal, clear } = withTimeout(openKounterConfig.timeout);
  try {
    const response = await fetch(`${openKounterConfig.apiBaseUrl}/api/counter`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal,
      body: JSON.stringify({
        action: "batch_inc",
        requests,
      }),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const payload = await response.json().catch(() => null);
    if (payload && typeof payload === "object" && "code" in payload && payload.code !== 0) {
      throw new Error(`API code ${payload.code}`);
    }
  } finally {
    clear();
  }
}

async function getRecord(target: string): Promise<CounterRecord> {
  const { signal, clear } = withTimeout(openKounterConfig.timeout);
  try {
    const url = `${openKounterConfig.apiBaseUrl}/api/counter?target=${encodeURIComponent(target)}`;
    const response = await fetch(url, { signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const payload = await response.json().catch(() => null);
    if (!payload || typeof payload !== "object") return { time: 0 };

    // 兼容不同返回格式：{code:0,data:{...}} / {result:{...}} / {...}
    const data = (payload as any).data ?? (payload as any).result ?? payload;
    const time = Number(data?.time ?? data?.value ?? 0);
    return {
      objectId: data?.objectId,
      time: Number.isFinite(time) ? time : 0,
    };
  } finally {
    clear();
  }
}

function buildTargets(path: string) {
  return {
    sitePv: "site-pv",
    siteUv: "site-uv",
    pagePv: `${path}#pv`,
    pageUv: `${path}#uv`,
  };
}

function isArticlePath(path: string) {
  return path.startsWith("/Notes/") && path !== "/Notes/" && path !== "/Notes/index";
}

function shouldIncUv() {
  if (typeof window === "undefined") return false;
  try {
    const lastTs = Number(window.localStorage.getItem(UV_CACHE_KEY) || 0);
    const now = Date.now();
    if (!Number.isFinite(lastTs) || now - lastTs >= UV_EXPIRE_MS) {
      window.localStorage.setItem(UV_CACHE_KEY, String(now));
      return true;
    }
    return false;
  } catch {
    // localStorage 被禁用时，退化为每次都计 UV
    return true;
  }
}

export function shouldShowPageCounter(path: string) {
  return isArticlePath(normalizePath(path));
}

export function formatCounter(value: number | null) {
  return value === null ? "--" : String(value);
}

export async function syncOpenKounter(routePath: string) {
  if (typeof window === "undefined") return;
  if (!openKounterConfig.enabled || !openKounterConfig.apiBaseUrl) return;

  const path = normalizePath(routePath);
  const pageTarget = normalizePageTarget(routePath);
  const targets = buildTargets(path);
  const requests: BatchRequest[] = [{ target: targets.sitePv }];

  if (isArticlePath(path)) {
    // 兼容 openKounter 默认统计键，同时保留自定义键给页面 UV 展示
    requests.push({ target: pageTarget });
    requests.push({ target: targets.pagePv });
  }
  if (shouldIncUv()) {
    requests.push({ target: targets.siteUv });
    if (isArticlePath(path)) requests.push({ target: targets.pageUv });
  }

  try {
    if (path !== lastTrackedPath) {
      await fetchBatchCounter(requests);
      lastTrackedPath = path;
    }
  } catch (error) {
    console.warn("[openKounter] increment failed:", error);
  }

  try {
    const [sitePvRecord, siteUvRecord, pagePvRecord, pageUvRecord] = await Promise.all([
      getRecord(targets.sitePv),
      getRecord(targets.siteUv),
      getRecord(targets.pagePv),
      getRecord(targets.pageUv),
    ]);

    sitePv.value = sitePvRecord.time;
    siteUv.value = siteUvRecord.time;
    pagePv.value = isArticlePath(path) ? pagePvRecord.time : null;
    pageUv.value = isArticlePath(path) ? pageUvRecord.time : null;
  } catch (error) {
    console.warn("[openKounter] query failed:", error);
  }
}
