export interface StatusBreakdown {
  status: 'Completed' | 'Cancelled' | 'Returned' | 'Pending' | string;
  count: number;
  revenue: number;
  pct_orders: number;
  pct_revenue: number;
}

export interface OverviewData {
  total_orders: number;
  total_order_value: number;
  non_completed_orders: number;
  non_completed_value: number;
  date_range: {
    start: string;
    end: string;
    period_label: string;
  };
  status_breakdown: StatusBreakdown[];
  findings_summary: {
    total_findings: number;
    total_measured_leak: number;
    verdict_counts: Record<string, number>;
  };
}

export interface ModelAOutcomeMetrics {
  roc_auc: number;
  auc_95ci: [number, number];
  pr_auc: number;
  lift_top10pct: number;
}

export interface ModelAEvaluation {
  test_rows: number;
  test_positive_rate: number;
  baseline_category_rate: ModelAOutcomeMetrics;
  logistic_regression: ModelAOutcomeMetrics;
  gradient_boosting: ModelAOutcomeMetrics;
  reliable_signal: boolean;
  verdict: string;
}

export interface InventoryRiskItem {
  product_id: string;
  category: string;
  stock_on_hand: number;
  days_of_cover: number;
  effective_lead_days: number;
  shortfall_days: number;
  est_revenue_at_risk: number;
  risk_label?: string;
  reorder_threshold?: number;
}

export interface FindingMetrics {
  // F1
  below_list?: number;
  discount?: number;
  gap_by_category?: Record<string, number>;
  // F2
  loss_products?: number;
  worst_products?: Record<string, number>;
  // F3 / F4
  model?: ModelAEvaluation | ModelBMetrics;
  // F5
  stale_orders?: number;
  median_age_days?: number;
  // F7 (Cell 3 updated)
  top_risk?: InventoryRiskItem[];
  watchlist?: InventoryRiskItem[];
}

export interface Finding {
  id: string;
  rank: number;
  type: 'pricing' | 'margin' | 'orders' | 'operations' | 'campaign' | 'inventory' | string;
  title: string;
  money_impact: number;
  confidence: string;
  verdict: string;
  evidence: string[];
  action: string;
  assumptions: string;
  metrics: FindingMetrics;
}

export interface MonthlyTrend {
  month: string;
  orders: number;
  revenue: number;
  completed: number;
  cancelled: number;
  returned: number;
  pending: number;
  cancel_rate: number;
  return_rate: number;
  pending_rate: number;
  completed_rate: number;
}

export interface SegmentBreakdown {
  segment: string;
  orders: number;
  value: number;
  profit: number;
  cancel_rate: number;
  return_rate: number;
  pending_rate: number;
  cancelled_count: number;
  returned_count: number;
  pending_count: number;
}

export interface BreakdownData {
  dimension: 'region' | 'category' | 'channel';
  overall: {
    cancel_rate: number;
    return_rate: number;
    pending_rate: number;
    total_orders: number;
    total_value: number;
  };
  segments: SegmentBreakdown[];
}

export interface CampaignScatterPoint {
  campaign_id: string;
  spend: number;
  conversions: number;
  flagged: boolean;
  invalid_funnel: boolean;
  cost_per_conv: number;
  channel: string;
  category: string;
}

export interface FlaggedCampaign {
  campaign_id: string;
  date: string;
  channel: string;
  category: string;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  conv_rate: number;
  cost_per_conv: number;
  anomaly_score: number;
  excess_spend: number;
  why_flagged: string;
  invalid_funnel: boolean;
}

export interface ModelBMetrics {
  campaigns: number;
  flagged: number;
  impossible_funnel_rows: number;
  impossible_rows_caught: number;
  recall_on_impossible_rows: number;
  precision_on_impossible_rows: number;
  median_cost_per_conversion: number;
  note: string;
}

export interface CampaignsData {
  summary: {
    total_campaigns: number;
    flagged_count: number;
    impossible_funnel_count: number;
    total_spend: number;
    excess_spend_flagged: number;
    median_cost_per_conv: number;
  };
  scatter_points: CampaignScatterPoint[];
  flagged_campaigns: FlaggedCampaign[];
  model_b_info: ModelBMetrics;
}

export interface InventoryStats {
  products_stockout_before_restock?: number;
  products_below_reorder?: number;
  total_products: number;
  est_revenue_at_risk?: number;
  stockout_flag_explanation?: string;
  unmeasured_money_reason?: string;
}

export interface InventoryData {
  top_risk: InventoryRiskItem[];
  stats: InventoryStats;
  evidence: string[];
  verdict: string;
  action: string;
  assumptions?: string;
}

export interface ModelTrustData {
  split: {
    train: string;
    test: string;
    type: string;
  };
  model_a_order_outcome: {
    cancel: ModelAEvaluation;
    return: ModelAEvaluation;
  };
  model_b_campaign_anomaly: ModelBMetrics;
  significance_tests: {
    n_tests: number;
    sig_before_correction: number;
    sig_after_correction: number;
    method: string;
  };
  data_caveats: string[];
  disclosure: {
    libraries: string[];
    pretrained_models: string;
    external_apis: string;
    external_data: string;
  };
}

export interface ProductOption {
  product_id: string;
  category: string;
  list_price: number;
  unit_cost: number;
  supplier_lead_days: number;
}

export interface OptionsData {
  options: {
    channel: string[];
    payment_method: string[];
    region: string[];
    customer_segment: string[];
    preferred_channel: string[];
    category: string[];
  };
  products: ProductOption[];
}

export interface OrderScorePayload {
  product_id: string;
  quantity: number;
  unit_price: number;
  discount_pct: number;
  hour: number;
  dow: number;
  tenure_days: number;
  channel: string;
  payment_method: string;
  region: string;
  customer_segment: string;
  preferred_channel: string;
}

export interface OrderScoreResult {
  cancel: {
    prob: number;
    reasons: string[];
    reliable: boolean;
  };
  return: {
    prob: number;
    reasons: string[];
    reliable: boolean;
  };
  margin: number;
  below_cost: boolean;
  warning: string;
  list_price: number;
  unit_cost: number;
  category: string;
  supplier_lead_days: number;
}
