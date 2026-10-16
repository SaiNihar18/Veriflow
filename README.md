<p align="center">
  <img src="docs/screenshots/Veriflow_Logo.jpeg" alt="Veriflow Logo" width="120" height="120" style="border-radius:16px;" />
</p>

<h1 align="center">Veriflow - Retail Loss Intelligence & Decision Support</h1>

<p align="center">
  <strong>Datathon 2026 · Track: "The Money Leak"</strong><br/>
  <em>"See where your money leaks - and why."</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Backend-FastAPI-009688?style=flat-square&logo=fastapi" />
  <img src="https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite-61DAFB?style=flat-square&logo=react" />
  <img src="https://img.shields.io/badge/ML-Scikit--learn%20%7C%20IsolationForest-F7931E?style=flat-square&logo=scikit-learn" />
  <img src="https://img.shields.io/badge/Python-3.10%2B-3776AB?style=flat-square&logo=python" />
  <img src="https://img.shields.io/badge/TypeScript-Strict-3178C6?style=flat-square&logo=typescript" />
</p>

---

## 📌 What is Veriflow?

Veriflow is a full-stack decision-support tool for **retail business managers**. It ingests the Datathon dataset (18,000 orders, 1,200 campaigns, product inventory) and answers three core questions:

| # | Question | Module |
|---|---|---|
| 1 | **What is going wrong?** | Leak Ledger - 7 ranked findings with dollar impact |
| 2 | **What evidence supports it?** | Model & Data Trust - AUC CIs, permutation tests, BH correction |
| 3 | **What action should be taken?** | Check Order / Investigate - live scoring & segment drilldowns |

Its defining principle is **honesty**: every finding carries a definitive **REAL** or **NOISE** verdict backed by empirical data and Benjamini-Hochberg multiple hypothesis correction. If data shows no reliable signal, Veriflow says so explicitly - rather than surfacing spurious correlations.

---

## 🚀 Quickstart

### Prerequisites

| Tool | Version |
|---|---|
| Python | 3.10+ (tested on 3.12) |
| Node.js | 18+ |
| npm | 9+ |

### 1 · Backend

```bash
pip install -r requirements.txt
cd backend
uvicorn app.main:app --reload
```

> The backend loads all dataset files on startup and warms in-memory caches for sub-millisecond API responses.

### 2 · Frontend

```bash
npm run dev
```

> Frontend runs at `http://localhost:5173`. All `/api` requests are auto-proxied to `http://127.0.0.1:8000` via Vite config.

---

## 🖼️ Product Screenshots

### Leak Ledger - Executive Dashboard & Honesty Tally
![Leak Ledger](docs/screenshots/leak_ledger.png)
*7 ranked financial leaks by dollar impact with REAL/NOISE statistical verdicts.*

### Marketing Funnel Anomaly Detection
![Marketing Campaigns](docs/screenshots/campaigns.png)
*Spend vs. Conversions scatter identifying 171 impossible funnel records and 180 anomalous campaigns.*

### Order Risk & Margin Protection Checker
![Order Risk Checker](docs/screenshots/check_order.png)
*Live pre-confirmation simulator with unit economics warnings and interactive discount slider.*

### Segment Breakdown & 12-Month Trends
![Investigate & Breakdown](docs/screenshots/investigate.png)
*Dual-axis monthly volume trends and categorical failure benchmarks vs. store-wide baseline.*

### Inventory Stockout Risk Watchlist
![Inventory Watchlist](docs/screenshots/inventory.png)
*34 products below reorder threshold ranked by lead-time shortfall risk.*

### Model & Data Trust Center
![Model & Data Trust](docs/screenshots/model_trust.png)
*Full AUC disclosure, train/test split, permutation test p-values, and BH correction logs.*

---

## 📂 Project Architecture

```
.
├── README.md
├── package.json                      # Root npm proxy (npm run dev launches both servers)
├── requirements.txt                  # Python backend dependencies
├── backend/
│   ├── app/
│   │   ├── main.py                   # FastAPI routes, CORS, startup cache-warm
│   │   ├── data_loader.py            # Aggregator, calculations, NaN-safe JSON export
│   │   └── schemas.py                # Pydantic models for all request/response types
│   ├── data/
│   │   ├── findings.json             # 7 ranked findings with proofs and verdicts
│   │   ├── metrics.json              # AUC CI, permutation test, BH correction results
│   │   ├── scored_transactions.csv   # 18,000 orders with margin, risk, revenue columns
│   │   └── campaigns_scored.csv      # 1,200 campaigns with anomaly flags
│   └── ml/
│       ├── train.py                  # Full reproducible training pipeline
│       ├── model_training_pipeline.ipynb  # Jupyter walkthrough of all 4 models
│       ├── predict.py                # Inference: score_order() for real-time margin risk
│       └── leaklens_model.joblib     # Serialized pipelines + product cost table
└── frontend/
    ├── vite.config.ts                # /api proxy to FastAPI backend
    ├── tailwind.config.js            # Custom SaaS color tokens and dark mode
    └── src/
        ├── lib/api.ts                # Typed fetch client (all 10 endpoints)
        ├── components/               # Layout, Sidebar, MetricCard, VerdictBadge, MoneyBar
        └── pages/
            ├── LeakLedger.tsx
            ├── FindingDetail.tsx
            ├── Investigate.tsx
            ├── CheckOrder.tsx
            ├── Inventory.tsx
            ├── Campaigns.tsx
            └── ModelTrust.tsx
```

---

## 📡 API Reference

| Method | Endpoint | Response Summary |
|---|---|---|
| `GET` | `/api/overview` | Total volume ($9.39M), non-completed ($2.09M), status splits |
| `GET` | `/api/findings` | All 7 ranked findings with verdicts and dollar impacts |
| `GET` | `/api/findings/{id}` | Evidence, numbered steps, recommended actions (F1-F7) |
| `GET` | `/api/trends` | Monthly order value + cancel/return/pending rates |
| `GET` | `/api/breakdown?by=category\|region\|channel` | Segment volumes vs baseline |
| `GET` | `/api/campaigns` | 1,200 scatter points, 180 anomaly flags |
| `GET` | `/api/inventory` | 34 products below reorder + stockout flag audit |
| `GET` | `/api/model` | AUC CIs, permutation p-values, BH correction log |
| `GET` | `/api/options` | Product catalog & dropdowns for order simulation |
| `POST` | `/api/score-order` | Validates order → score_order() → margin & risk scores |

---

## 🔍 The 7 Core Findings

| Rank | ID | Finding | Impact | Verdict |
|---|---|---|---|---|
| 1 | F1 | **Stacked Pricing Gap** - discounts on top of below-list prices | $1,689,465 | ✅ REAL |
| 2 | F2 | **Sales Below Unit Cost** - 38% of orders net a loss; 94 loss products | $1,214,116 | ✅ REAL |
| 3 | F3 | **Cancelled Orders** - AUC 0.524, CI spans 0.50; no segment survives BH | $861,850 | ❌ NOISE |
| 4 | F4 | **Returned Orders** - AUC 0.490 (sub-random); zero segments survive correction | $760,322 | ❌ NOISE |
| 5 | F5 | **Stale Pending Orders** - 824 orders frozen >30 days; median age 180 days | $417,527 | ✅ REAL |
| 6 | F6 | **Marketing Anomalies** - 171 impossible funnels; spend vs. conv. correlation ≈ 0 | $197,854 | ✅ REAL |
| 7 | F7 | **Stockout Risk** - 34 products below reorder; stockout_flag 0/10 accuracy | $8,026 | ✅ REAL |

> **Honesty Rule**: F3 and F4 are NOISE - no actionable driver exists. Spending resources on them is worse than doing nothing.

---

## 🎯 Target Users

| Role | Pain Point Solved |
|---|---|
| **Retail General Manager** | Prioritize operational fires by true financial damage ($) |
| **Merchandising & Pricing Planner** | Guardrails preventing stacked discounting and below-cost sales |
| **Marketing Director** | Identify and halt ad budget leakage from corrupted funnels |
| **Inventory & Supply Chain Lead** | Early-warning alerts before stockout occurs |

---

## 🧠 Machine Learning Pipeline

| File | Purpose |
|---|---|
| `backend/ml/train.py` | Full Python training script - run to retrain all models |
| `backend/ml/model_training_pipeline.ipynb` | Step-by-step Jupyter walkthrough |
| `backend/ml/predict.py` | `score_order()` for live margin & cancellation risk |
| `backend/ml/leaklens_model.joblib` | Serialized pipelines + product cost table |

### Models

| Model | Algorithm | Dataset | Key Result |
|---|---|---|---|
| **A - Order Failure Risk** | Logistic Regression + GBDT (70/30 time-split) | `scored_transactions.csv` | AUC 0.524, p=0.139 → noise |
| **B - Marketing Anomaly** | Isolation Forest + funnel rules | `campaigns_scored.csv` | 171 impossible funnels |
| **C - Revenue Forecast** | Time-series demand runway | `scored_transactions.csv` | 30-day forward + 95% CI |
| **D - Customer RFM** | K-Means RFM segmentation | `scored_transactions.csv` | Gold / Silver / Bronze tiers |

---

## 🛡️ Honesty-First Design

| Principle | Implementation |
|---|---|
| No spurious correlations | AUC with no signal → "NO RELIABLE SIGNAL" NOISE badge in UI |
| Full statistical disclosure | BH correction, permutation p-values, and CI bounds on Model Trust page |
| Live what-if simulation | Order Checker: adjust price/discount in real-time before submitting |
| Zero mock data | All endpoints load and cache real CSV/JSON files at startup |

---

## ⚡ Performance

- **Startup cache warming**: `DataLoader._warm_caches()` pre-loads all aggregated views on boot
- **Sub-millisecond responses**: All GET endpoints return from memory - no repeated disk I/O
- **NaN-safe JSON**: All `inf`/`NaN` values sanitized to `null` before serialization

---

*Built for Datathon 2026 · Track: "The Money Leak" · Team Veriflow*
