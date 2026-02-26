import { ref } from "vue";
import { openKounterConfig } from "../userConfig/openKounter.js";

type CounterAction = "inc_pv" | "inc_uv";
type BatchRequest = {
  target: string;
  action: CounterAction;
};

type CounterResult = Record<string, number>;

export const sitePv = ref<number | null>(null);
export const siteUv = ref<number | null>(null);
export const pagePv = ref<number | null>(null);
export const pageUv = ref<number | null>(null);

let lastTrackedPath = "";

function normalizePath(rawPath: string) {
  const path = rawPath.split("?")[0].split("#")[0] || "/";
  return path;
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
  } finally {
    clear();
  }
}

async function fetchCounter(targets: string[]) {
  const { signal, clear } = withTimeout(openKounterConfig.timeout);
  try {
    const response = await fetch(`${openKounterConfig.apiBaseUrl}/api/counter`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal,
      body: JSON.stringify({
        action: "get_counter",
        targets,
      }),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (!data?.success || !data?.result) return {};
    return data.result as CounterResult;
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
  const targets = buildTargets(path);
  const requests: BatchRequest[] = [
    { target: targets.sitePv, action: "inc_pv" },
    { target: targets.siteUv, action: "inc_uv" },
  ];

  if (isArticlePath(path)) {
    requests.push(
      { target: targets.pagePv, action: "inc_pv" },
      { target: targets.pageUv, action: "inc_uv" }
    );
  }

  try {
    if (path !== lastTrackedPath) {
      await fetchBatchCounter(requests);
      lastTrackedPath = path;
    }

    const result = await fetchCounter([
      targets.sitePv,
      targets.siteUv,
      targets.pagePv,
      targets.pageUv,
    ]);

    sitePv.value = result[targets.sitePv] ?? null;
    siteUv.value = result[targets.siteUv] ?? null;
    pagePv.value = isArticlePath(path) ? (result[targets.pagePv] ?? 0) : null;
    pageUv.value = isArticlePath(path) ? (result[targets.pageUv] ?? 0) : null;
  } catch (error) {
    console.warn("[openKounter] sync failed:", error);
  }
}

