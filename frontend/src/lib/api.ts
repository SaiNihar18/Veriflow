import {
  OverviewData,
  Finding,
  MonthlyTrend,
  BreakdownData,
  CampaignsData,
  InventoryData,
  ModelTrustData,
  OptionsData,
  OrderScorePayload,
  OrderScoreResult,
} from '../types';

const API_BASE = '/api';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorText = await res.text();
    let errorMessage = `API Error (${res.status}): ${res.statusText}`;
    try {
      const parsed = JSON.parse(errorText);
      if (parsed.detail) errorMessage = parsed.detail;
    } catch {
      if (errorText) errorMessage = errorText;
    }
    throw new Error(errorMessage);
  }
  return res.json();
}

export async function fetchOverview(): Promise<OverviewData> {
  const res = await fetch(`${API_BASE}/overview`);
  return handleResponse<OverviewData>(res);
}

export async function fetchFindings(): Promise<Finding[]> {
  const res = await fetch(`${API_BASE}/findings`);
  return handleResponse<Finding[]>(res);
}

export async function fetchFinding(id: string): Promise<Finding> {
  const res = await fetch(`${API_BASE}/findings/${id}`);
  return handleResponse<Finding>(res);
}

export async function fetchTrends(): Promise<MonthlyTrend[]> {
  const res = await fetch(`${API_BASE}/trends`);
  return handleResponse<MonthlyTrend[]>(res);
}

export async function fetchBreakdown(by: 'region' | 'category' | 'channel'): Promise<BreakdownData> {
  const res = await fetch(`${API_BASE}/breakdown?by=${by}`);
  return handleResponse<BreakdownData>(res);
}

export async function fetchCampaigns(): Promise<CampaignsData> {
  const res = await fetch(`${API_BASE}/campaigns`);
  return handleResponse<CampaignsData>(res);
}

export async function fetchInventory(): Promise<InventoryData> {
  const res = await fetch(`${API_BASE}/inventory`);
  return handleResponse<InventoryData>(res);
}

export async function fetchModelTrust(): Promise<ModelTrustData> {
  const res = await fetch(`${API_BASE}/model`);
  return handleResponse<ModelTrustData>(res);
}

export async function fetchOptions(): Promise<OptionsData> {
  const res = await fetch(`${API_BASE}/options`);
  return handleResponse<OptionsData>(res);
}

export async function scoreOrder(order: OrderScorePayload): Promise<OrderScoreResult> {
  const res = await fetch(`${API_BASE}/score-order`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(order),
  });
  return handleResponse<OrderScoreResult>(res);
}
