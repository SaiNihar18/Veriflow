# DATA_CONTRACT.md - Veriflow Data Schema & Contract Specification

This document defines the schema, source files, and contracts for all datasets consumed and produced by the Veriflow intelligence platform.

---

## 1. Findings (`findings.json`)
Array of 7 validated findings sorted by absolute money impact:
- `id` (string): Unique finding identifier (`F1` to `F7`).
- `rank` (integer): Priority rank (1 to 7).
- `type` (string): Operational domain (`pricing`, `margin`, `orders`, `operations`, `campaign`, `inventory`).
- `title` (string): Descriptive finding headline.
- `money_impact` (float): Quantified financial impact.
- `confidence` (string): Statistical confidence classification.
- `verdict` (string): Classification (`REAL`, `NOISE`, `ASSUMPTION-DEPENDENT`).
- `evidence` (string[]): Numbered list of verifiable facts.
- `action` (string): Prescribed corrective action.
- `assumptions` (string): Caveats, baselines, and data scope constraints.
- `metrics` (object): Domain-specific metrics:
  - `F1`: `below_list`, `discount`, `gap_by_category`
  - `F2`: `loss_products`, `worst_products`
  - `F3` / `F4`: `model` (Model A evaluation: baseline, logistic, gradient boosting)
  - `F5`: `stale_orders`, `median_age_days`
  - `F6`: `model` (Model B isolation forest metrics)
  - `F7`: `top_risk` (8-15 products at stockout risk before supplier delivers)

---

## 2. Inventory Risk (`inventory_risk.csv`)
Columns:
- `product_id` (string): Product code (`PR0001` - `PR0250`)
- `category` (string): Product department
- `stock_on_hand` (integer): Current physical inventory level
- `days_of_cover` (float): Days until stock exhausts based on annual sales velocity
- `effective_lead_days` (float): Supplier lead time + mean supplier delay
- `shortfall_days` (float): `effective_lead_days - days_of_cover` (clipped at 0)
- `est_revenue_at_risk` (float): Financial revenue lost during stockout window
- `risk_label` (string): `STOCKOUT BEFORE RESTOCK` or `BELOW REORDER POINT`

---

## 3. Transactions (`scored_transactions.csv`)
Columns: `transaction_id`, `timestamp`, `region`, `category`, `channel`, `status`, `revenue`, `profit`, `below_cost`, `p_cancel`, `p_return`, `split`.

---

## 4. Campaigns (`campaigns_scored.csv`)
Columns: `campaign_id`, `date`, `channel`, `category`, `spend`, `impressions`, `clicks`, `conversions`, `ctr`, `conv_rate`, `cost_per_conv`, `anomaly_score`, `flagged`, `excess_spend`, `why_flagged`, `invalid_funnel`.

---

## 5. Model Metrics (`metrics.json`)
Keys:
- `split`: Train & test period dates
- `model_a_order_outcome`: Cancellation and return evaluation with permutation test results
- `model_b_campaign_anomaly`: Isolation forest precision, recall, and median cost per conversion
- `model_c_demand_forecast`: Rolling average demand alerts
- `model_d_customer_tiers`: Customer value tier clusters
- `inventory_risk`: Overall stockout counts and revenue at risk
- `significance_tests`: Benjamini-Hochberg correction results
- `data_caveats`: Known data quality limitations
- `file_manifest`: Complete manifest of generated analytical files
