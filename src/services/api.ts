import {
  HISTORICAL_CHANGE_DATA,
  MONITORED_SITES,
  SATELLITE_TELEMETRY,
  SIMULATED_ALERTS,
} from '../data/mockData';
import type { MiningSite, MonthlyChangePoint, SatelliteAlert } from '../types';

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1';

export type SatelliteTelemetry = typeof SATELLITE_TELEMETRY;

export type DashboardKpis = {
  totalSites: number;
  activeAlerts: number;
  criticalAlerts: number;
  totalNewExcavationHa: number;
  averageConfidence: number;
  boundaryBreaches: number;
  averageNdviDrop: number;
};

export type AnalysisJob = {
  jobId: string;
  siteId: string;
  status: 'QUEUED' | 'RUNNING' | 'DONE' | 'FAILED';
  progress: number;
  error: string | null;
  result: MiningSite | null;
};

/** Sync seeds so the UI can paint before fetch completes (also used when the API is down). */
export const fallbackSites = MONITORED_SITES;
export const fallbackAlerts = SIMULATED_ALERTS;
export const fallbackHistory = HISTORICAL_CHANGE_DATA;
export const fallbackTelemetry = SATELLITE_TELEMETRY;
export const fallbackKpis: DashboardKpis = {
  totalSites: 12,
  activeAlerts: 3,
  criticalAlerts: 2,
  totalNewExcavationHa: 9.3,
  averageConfidence: 91.5,
  boundaryBreaches: 2,
  averageNdviDrop: 0.31,
};

let authToken: string | undefined;

/** Optional Supabase access token for admin write routes. */
export function setApiAuthToken(token: string | undefined) {
  authToken = token;
}

async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = (await res.json()) as { message?: string };
      if (body.message) message = body.message;
    } catch {
      /* ignore non-JSON error bodies */
    }
    throw new Error(message);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export async function fetchSites(): Promise<MiningSite[]> {
  try {
    return await api<MiningSite[]>('/sites');
  } catch {
    return fallbackSites;
  }
}

export async function fetchAlerts(): Promise<SatelliteAlert[]> {
  try {
    return await api<SatelliteAlert[]>('/alerts');
  } catch {
    return fallbackAlerts;
  }
}

export async function fetchSiteHistory(siteId: string): Promise<MonthlyChangePoint[]> {
  try {
    return await api<MonthlyChangePoint[]>(`/sites/${encodeURIComponent(siteId)}/history`);
  } catch {
    return fallbackHistory;
  }
}

export async function fetchTelemetry(): Promise<SatelliteTelemetry> {
  try {
    return await api<SatelliteTelemetry>('/telemetry');
  } catch {
    return fallbackTelemetry;
  }
}

export async function fetchKpis(): Promise<DashboardKpis> {
  try {
    return await api<DashboardKpis>('/dashboard/kpis');
  } catch {
    return fallbackKpis;
  }
}

export async function dismissAlert(alertId: string): Promise<SatelliteAlert | null> {
  try {
    return await api<SatelliteAlert>(`/alerts/${encodeURIComponent(alertId)}/dismiss`, {
      method: 'PATCH',
    });
  } catch {
    return null;
  }
}

export async function resetAlerts(): Promise<SatelliteAlert[] | null> {
  try {
    return await api<SatelliteAlert[]>('/alerts/reset', { method: 'POST' });
  } catch {
    return null;
  }
}

export async function startAnalysis(input: {
  siteId: string;
  baselineDate: string;
  currentImageDate: string;
}): Promise<AnalysisJob> {
  return api<AnalysisJob>('/analysis', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function fetchAnalysisJob(jobId: string): Promise<AnalysisJob> {
  return api<AnalysisJob>(`/analysis/${encodeURIComponent(jobId)}`);
}

/** Poll until DONE/FAILED or timeout; returns final job. */
export async function pollAnalysisJob(
  jobId: string,
  opts: { intervalMs?: number; timeoutMs?: number; onProgress?: (job: AnalysisJob) => void } = {},
): Promise<AnalysisJob> {
  const intervalMs = opts.intervalMs ?? 3000;
  const timeoutMs = opts.timeoutMs ?? 180_000;
  const started = Date.now();
  for (;;) {
    const job = await fetchAnalysisJob(jobId);
    opts.onProgress?.(job);
    if (job.status === 'DONE' || job.status === 'FAILED') return job;
    if (Date.now() - started > timeoutMs) {
      throw new Error('Analysis timed out');
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}
