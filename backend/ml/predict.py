import os, joblib, pandas as pd, numpy as np
_B = joblib.load(os.path.join(os.path.dirname(os.path.abspath(__file__)), "leaklens_model.joblib"))
_NAMES = {"quantity":"order quantity","unit_price":"unit price","discount_pct":"discount","hour":"hour of day","dow":"day of week","tenure_days":"customer tenure",
          "supplier_lead_days":"supplier lead time","unit_cost":"unit cost","list_price":"list price","price_ratio":"price vs list price","below_cost":"sold below cost"}
def score_order(order: dict) -> dict:
    """order needs: quantity, unit_price, discount_pct, hour, dow, tenure_days, channel, payment_method, region,
    customer_segment, preferred_channel, plus product_id (or category, unit_cost, list_price, supplier_lead_days)."""
    o = dict(order)
    if "product_id" in o and o["product_id"] in _B["products"]:
        for k, v in _B["products"][o["product_id"]].items(): o.setdefault(k, v)
    o.setdefault("list_price", o.get("unit_price", 10.0))
    o.setdefault("unit_cost", 0.0)
    o.setdefault("supplier_lead_days", 7)
    o.setdefault("category", "General")
    list_price = float(o.get("list_price") or o.get("unit_price") or 1.0)
    o["price_ratio"] = float(o["unit_price"]) / max(list_price, 0.001)
    o["below_cost"] = int(o["unit_price"] * (1 - o["discount_pct"]) < o["unit_cost"])
    df = pd.DataFrame([o]); X = pd.concat([df[_B["feat_num"]], pd.get_dummies(df[_B["feat_cat"]], dtype=int)], axis=1).reindex(columns=_B["cols"], fill_value=0)
    out = {}
    for key in ["cancel", "return"]:
        pipe = _B[key]; sc, lr = pipe.steps[0][1], pipe.steps[1][1]
        zs = sc.transform(X)[0]; contrib = zs * lr.coef_[0]
        top = [i for i in np.argsort(-np.abs(contrib)) if _B["cols"][i] in _NAMES][:3]
        reasons = [f"{_NAMES[_B['cols'][i]]} {'raises' if contrib[i] > 0 else 'lowers'} risk" for i in top]
        out[key] = {"prob": round(float(pipe.predict_proba(X)[0, 1]), 4), "reasons": reasons, "reliable": bool(_B["reliable"][key])}
    out["margin"] = round(o["unit_price"] * (1 - o["discount_pct"]) - o["unit_cost"], 2)
    out["below_cost"] = bool(o["below_cost"]); out["warning"] = "Risk scores are low-confidence: models show no reliable predictive signal on this benchmark dataset." if not all(_B["reliable"].values()) else ""
    return out
