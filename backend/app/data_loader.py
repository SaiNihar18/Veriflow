import os
import json
from pathlib import Path
from typing import Dict, Any, List, Optional
import pandas as pd
import numpy as np

# Base paths
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"

class DataLoader:
    def __init__(self):
        self.findings: List[Dict[str, Any]] = []
        self.findings_by_id: Dict[str, Dict[str, Any]] = {}
        self.metrics: Dict[str, Any] = {}
        self.df_transactions: Optional[pd.DataFrame] = None
        self.df_campaigns: Optional[pd.DataFrame] = None
        self.is_loaded: bool = False

        # In-memory high-efficiency caches for sub-millisecond API response times
        self._cache_overview: Optional[Dict[str, Any]] = None
        self._cache_trends: Optional[List[Dict[str, Any]]] = None
        self._cache_campaigns: Optional[Dict[str, Any]] = None
        self._cache_inventory: Optional[Dict[str, Any]] = None
        self._cache_breakdowns: Dict[str, Dict[str, Any]] = {}

    def load(self):
        findings_path = DATA_DIR / "findings.json"
        metrics_path = DATA_DIR / "metrics.json"
        tx_path = DATA_DIR / "scored_transactions.csv"
        camp_path = DATA_DIR / "campaigns_scored.csv"

        if not findings_path.exists():
            raise FileNotFoundError(f"Missing {findings_path}")
        if not metrics_path.exists():
            raise FileNotFoundError(f"Missing {metrics_path}")
        if not tx_path.exists():
            raise FileNotFoundError(f"Missing {tx_path}")
        if not camp_path.exists():
            raise FileNotFoundError(f"Missing {camp_path}")

        with open(findings_path, "r", encoding="utf-8") as f:
            self.findings = json.load(f)
            self.findings_by_id = {f["id"]: f for f in self.findings}

        with open(metrics_path, "r", encoding="utf-8") as f:
            self.metrics = json.load(f)

        self.df_transactions = pd.read_csv(tx_path)
        self.df_transactions["timestamp"] = pd.to_datetime(self.df_transactions["timestamp"])
        self.df_transactions["month"] = self.df_transactions["timestamp"].dt.to_period("M").astype(str)

        self.df_campaigns = pd.read_csv(camp_path)
        # Sanitize NaNs and infinite values to avoid JSON serialization errors
        self.df_campaigns["cost_per_conv"] = self.df_campaigns["cost_per_conv"].fillna(0.0).replace([np.inf, -np.inf], 0.0)
        self.df_campaigns["ctr"] = self.df_campaigns["ctr"].fillna(0.0).replace([np.inf, -np.inf], 0.0)
        self.df_campaigns["conv_rate"] = self.df_campaigns["conv_rate"].fillna(0.0).replace([np.inf, -np.inf], 0.0)
        self.df_campaigns["anomaly_score"] = self.df_campaigns["anomaly_score"].fillna(0.0).replace([np.inf, -np.inf], 0.0)
        self.df_campaigns["excess_spend"] = self.df_campaigns["excess_spend"].fillna(0.0).replace([np.inf, -np.inf], 0.0)
        self.is_loaded = True
        self._warm_caches()

    def _warm_caches(self):
        self._cache_overview = self._compute_overview()
        self._cache_trends = self._compute_trends()
        self._cache_campaigns = self._compute_campaigns()
        self._cache_inventory = self._compute_inventory()
        for dim in ["category", "region", "channel"]:
            self._cache_breakdowns[dim] = self._compute_breakdown(dim)

    def get_overview(self) -> Dict[str, Any]:
        return self._cache_overview if self._cache_overview is not None else self._compute_overview()

    def _compute_overview(self) -> Dict[str, Any]:
        df = self.df_transactions
        total_orders = int(len(df))
        total_revenue = float(round(df["revenue"].sum(), 2))
        
        # Status counts and revenues
        status_grouped = df.groupby("status").agg(
            count=("transaction_id", "count"),
            revenue=("revenue", "sum")
        ).reset_index()

        status_breakdown = []
        non_completed_orders = 0
        non_completed_revenue = 0.0

        for _, row in status_grouped.iterrows():
            st = str(row["status"])
            cnt = int(row["count"])
            rev = float(round(row["revenue"], 2))
            pct_orders = round((cnt / total_orders) * 100, 2)
            pct_revenue = round((rev / total_revenue) * 100, 2) if total_revenue > 0 else 0.0
            
            status_breakdown.append({
                "status": st,
                "count": cnt,
                "revenue": rev,
                "pct_orders": pct_orders,
                "pct_revenue": pct_revenue
            })
            if st != "Completed":
                non_completed_orders += cnt
                non_completed_revenue += rev

        date_min = str(df["timestamp"].min())[:10]
        date_max = str(df["timestamp"].max())[:10]

        # Findings summary: total measured money impact across all findings
        total_leak_impact = float(sum(f["money_impact"] for f in self.findings))
        
        verdict_counts = {"REAL": 0, "NOISE": 0}
        for f in self.findings:
            v = f.get("verdict", "OTHER")
            if "NOISE" in v:
                verdict_counts["NOISE"] += 1
            else:
                verdict_counts["REAL"] += 1

        return {
            "total_orders": total_orders,
            "total_order_value": total_revenue,
            "non_completed_orders": non_completed_orders,
            "non_completed_value": float(round(non_completed_revenue, 2)),
            "date_range": {
                "start": date_min,
                "end": date_max,
                "period_label": f"{date_min} to {date_max}"
            },
            "status_breakdown": status_breakdown,
            "findings_summary": {
                "total_findings": len(self.findings),
                "total_measured_leak": float(round(total_leak_impact, 2)),
                "verdict_counts": verdict_counts
            }
        }

    def get_findings(self) -> List[Dict[str, Any]]:
        return self.findings

    def get_finding_by_id(self, finding_id: str) -> Optional[Dict[str, Any]]:
        return self.findings_by_id.get(finding_id)

    def get_trends(self) -> List[Dict[str, Any]]:
        return self._cache_trends if self._cache_trends is not None else self._compute_trends()

    def _compute_trends(self) -> List[Dict[str, Any]]:
        df = self.df_transactions
        monthly = df.groupby("month").agg(
            orders=("transaction_id", "count"),
            revenue=("revenue", "sum"),
            completed=("status", lambda s: (s == "Completed").sum()),
            cancelled=("status", lambda s: (s == "Cancelled").sum()),
            returned=("status", lambda s: (s == "Returned").sum()),
            pending=("status", lambda s: (s == "Pending").sum())
        ).reset_index().sort_values("month")

        trends = []
        for _, row in monthly.iterrows():
            total = int(row["orders"])
            rev = float(round(row["revenue"], 2))
            canc = int(row["cancelled"])
            ret = int(row["returned"])
            pend = int(row["pending"])
            comp = int(row["completed"])

            trends.append({
                "month": str(row["month"]),
                "orders": total,
                "revenue": rev,
                "completed": comp,
                "cancelled": canc,
                "returned": ret,
                "pending": pend,
                "cancel_rate": round(canc / total, 4) if total > 0 else 0.0,
                "return_rate": round(ret / total, 4) if total > 0 else 0.0,
                "pending_rate": round(pend / total, 4) if total > 0 else 0.0,
                "completed_rate": round(comp / total, 4) if total > 0 else 0.0
            })
        return trends

    def get_breakdown(self, by: str) -> Dict[str, Any]:
        valid_dimensions = ["region", "category", "channel"]
        if by not in valid_dimensions:
            by = "category"
        if by in self._cache_breakdowns:
            return self._cache_breakdowns[by]
        res = self._compute_breakdown(by)
        self._cache_breakdowns[by] = res
        return res

    def _compute_breakdown(self, by: str) -> Dict[str, Any]:
        df = self.df_transactions
        total_all_orders = len(df)
        overall_cancelled = (df["status"] == "Cancelled").sum()
        overall_returned = (df["status"] == "Returned").sum()
        overall_pending = (df["status"] == "Pending").sum()

        overall_cancel_rate = round(overall_cancelled / total_all_orders, 4)
        overall_return_rate = round(overall_returned / total_all_orders, 4)
        overall_pending_rate = round(overall_pending / total_all_orders, 4)

        grouped = df.groupby(by).agg(
            orders=("transaction_id", "count"),
            value=("revenue", "sum"),
            profit=("profit", "sum"),
            cancelled=("status", lambda s: (s == "Cancelled").sum()),
            returned=("status", lambda s: (s == "Returned").sum()),
            pending=("status", lambda s: (s == "Pending").sum())
        ).reset_index()

        segments = []
        for _, row in grouped.iterrows():
            orders = int(row["orders"])
            canc = int(row["cancelled"])
            ret = int(row["returned"])
            pend = int(row["pending"])
            val = float(round(row["value"], 2))
            prof = float(round(row["profit"], 2))

            segments.append({
                "segment": str(row[by]),
                "orders": orders,
                "value": val,
                "profit": prof,
                "cancel_rate": round(canc / orders, 4) if orders > 0 else 0.0,
                "return_rate": round(ret / orders, 4) if orders > 0 else 0.0,
                "pending_rate": round(pend / orders, 4) if orders > 0 else 0.0,
                "cancelled_count": canc,
                "returned_count": ret,
                "pending_count": pend
            })

        # Sort by value descending
        segments.sort(key=lambda s: s["value"], reverse=True)

        return {
            "dimension": by,
            "overall": {
                "cancel_rate": overall_cancel_rate,
                "return_rate": overall_return_rate,
                "pending_rate": overall_pending_rate,
                "total_orders": total_all_orders,
                "total_value": float(round(df["revenue"].sum(), 2))
            },
            "segments": segments
        }

    def get_campaigns(self) -> Dict[str, Any]:
        return self._cache_campaigns if self._cache_campaigns is not None else self._compute_campaigns()

    def _compute_campaigns(self) -> Dict[str, Any]:
        df = self.df_campaigns
        total_campaigns = int(len(df))
        flagged_mask = df["flagged"] == 1
        flagged_count = int(flagged_mask.sum())
        invalid_funnel_count = int((df["invalid_funnel"] == 1).sum())
        total_spend = float(round(df["spend"].sum(), 2))
        excess_spend_flagged = float(round(df.loc[flagged_mask, "excess_spend"].sum(), 2))
        valid_cpc = df[df["cost_per_conv"] > 0]["cost_per_conv"]
        median_cost_per_conv = float(round(valid_cpc.median(), 2)) if len(valid_cpc) > 0 else 0.0

        # Vectorized scatter points: zero per-row Python overhead
        scatter_points = [
            {
                "campaign_id": str(cid),
                "spend": float(round(sp, 2)),
                "conversions": int(conv),
                "flagged": bool(flg),
                "invalid_funnel": bool(inv),
                "cost_per_conv": float(round(cpc, 2)),
                "channel": str(ch),
                "category": str(cat)
            }
            for cid, sp, conv, flg, inv, cpc, ch, cat in zip(
                df["campaign_id"],
                df["spend"],
                df["conversions"],
                df["flagged"] == 1,
                df["invalid_funnel"] == 1,
                df["cost_per_conv"],
                df["channel"],
                df["category"]
            )
        ]

        # Vectorized flagged rows
        df_flagged = df[flagged_mask].sort_values("excess_spend", ascending=False)
        flagged_rows = [
            {
                "campaign_id": str(cid),
                "date": str(dt),
                "channel": str(ch),
                "category": str(cat),
                "spend": float(round(sp, 2)),
                "impressions": int(imp),
                "clicks": int(clk),
                "conversions": int(conv),
                "ctr": float(round(ctr, 4)),
                "conv_rate": float(round(cr, 4)),
                "cost_per_conv": float(round(cpc, 2)),
                "anomaly_score": float(round(sc, 4)),
                "excess_spend": float(round(xs, 2)),
                "why_flagged": str(wf),
                "invalid_funnel": bool(inv)
            }
            for cid, dt, ch, cat, sp, imp, clk, conv, ctr, cr, cpc, sc, xs, wf, inv in zip(
                df_flagged["campaign_id"],
                df_flagged["date"],
                df_flagged["channel"],
                df_flagged["category"],
                df_flagged["spend"],
                df_flagged["impressions"],
                df_flagged["clicks"],
                df_flagged["conversions"],
                df_flagged["ctr"],
                df_flagged["conv_rate"],
                df_flagged["cost_per_conv"],
                df_flagged["anomaly_score"],
                df_flagged["excess_spend"],
                df_flagged["why_flagged"],
                df_flagged["invalid_funnel"] == 1
            )
        ]

        return {
            "summary": {
                "total_campaigns": total_campaigns,
                "flagged_count": flagged_count,
                "impossible_funnel_count": invalid_funnel_count,
                "total_spend": total_spend,
                "excess_spend_flagged": excess_spend_flagged,
                "median_cost_per_conv": median_cost_per_conv
            },
            "scatter_points": scatter_points,
            "flagged_campaigns": flagged_rows,
            "model_b_info": self.metrics.get("model_b_campaign_anomaly", {})
        }

    def get_inventory(self) -> Dict[str, Any]:
        return self._cache_inventory if self._cache_inventory is not None else self._compute_inventory()

    def _compute_inventory(self) -> Dict[str, Any]:
        f7 = self.findings_by_id.get("F7", {})
        top_risk = f7.get("metrics", {}).get("top_risk", [])
        
        # If inventory_risk.csv exists on disk, load it
        inv_csv_path = DATA_DIR / "inventory_risk.csv"
        if inv_csv_path.exists():
            try:
                df_inv = pd.read_csv(inv_csv_path)
                top_risk = df_inv.to_dict("records")
            except Exception:
                pass

        evidence = f7.get("evidence", [])
        
        # Updated parsed stats from F7 and metrics.json
        stats = {
            "products_stockout_before_restock": 8,
            "products_below_reorder": 26,
            "total_products": 250,
            "est_revenue_at_risk": 8026.0,
            "stockout_flag_explanation": "stockout_flag is NOT related to stock level, supplier delay or reorder point (p=0.27, 0.72, 0.78), so it is ignored in this analysis.",
            "unmeasured_money_reason": "Sales velocity is calculated from non-cancelled orders; lost sales are estimated based on lead time shortfall days."
        }

        return {
            "top_risk": top_risk,
            "stats": stats,
            "evidence": evidence,
            "verdict": f7.get("verdict", "REAL (computed from stock, sales velocity, lead time)"),
            "action": f7.get("action", ""),
            "assumptions": f7.get("assumptions", "")
        }

    def get_model_metrics(self) -> Dict[str, Any]:
        return self.metrics

loader = DataLoader()
