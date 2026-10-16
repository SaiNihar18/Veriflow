import sys
import os
from pathlib import Path
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

# Ensure parent directory is in sys.path for robust imports
BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

try:
    from backend.ml.predict import score_order, _B
except ImportError:
    from ml.predict import score_order, _B

from app.data_loader import loader
from app.schemas import OrderScoreRequest, OrderScoreResponse

app = FastAPI(
    title="Veriflow API",
    description="Backend API for Veriflow Decision-Support Retail Loss Intelligence",
    version="1.0.0"
)

# Enable CORS for frontend development and production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    loader.load()

@app.get("/api/health")
def health_check():
    return {"status": "ok", "app": "Veriflow", "data_loaded": loader.is_loaded}

@app.get("/api/overview")
def get_overview():
    try:
        return loader.get_overview()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/findings")
def get_findings():
    try:
        return loader.get_findings()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/findings/{finding_id}")
def get_finding(finding_id: str):
    finding = loader.get_finding_by_id(finding_id.upper())
    if not finding:
        raise HTTPException(status_code=404, detail=f"Finding '{finding_id}' not found")
    return finding

@app.get("/api/trends")
def get_trends():
    try:
        return loader.get_trends()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/breakdown")
def get_breakdown(by: str = Query("category", pattern="^(region|category|channel)$")):
    try:
        return loader.get_breakdown(by=by)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/campaigns")
def get_campaigns():
    try:
        return loader.get_campaigns()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/inventory")
def get_inventory():
    try:
        return loader.get_inventory()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/model")
def get_model_metrics():
    try:
        return loader.get_model_metrics()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/options")
def get_options():
    try:
        # Extract options from _B['cols']
        options = {
            "channel": [],
            "payment_method": [],
            "region": [],
            "customer_segment": [],
            "preferred_channel": [],
            "category": []
        }
        for col in _B["cols"]:
            for prefix in options.keys():
                if col.startswith(f"{prefix}_"):
                    val = col[len(prefix) + 1:]
                    options[prefix].append(val)

        # Products list
        products = []
        for pid, pdata in _B.get("products", {}).items():
            products.append({
                "product_id": pid,
                "category": pdata.get("category", ""),
                "list_price": round(float(pdata.get("list_price", 0)), 2),
                "unit_cost": round(float(pdata.get("unit_cost", 0)), 2),
                "supplier_lead_days": int(pdata.get("supplier_lead_days", 0))
            })
        
        # Sort products
        products.sort(key=lambda x: x["product_id"])

        return {
            "options": options,
            "products": products
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/score-order")
def score_order_endpoint(request: OrderScoreRequest):
    try:
        order_dict = request.model_dump()
        result = score_order(order_dict)

        # Attach product specifics
        prod_id = request.product_id
        prod_meta = _B.get("products", {}).get(prod_id, {})
        
        list_price = prod_meta.get("list_price", request.unit_price)
        unit_cost = prod_meta.get("unit_cost", 0.0)
        category = prod_meta.get("category", "")
        supplier_lead_days = prod_meta.get("supplier_lead_days", 0)

        response_data = {
            "cancel": result["cancel"],
            "return": result["return"],
            "margin": result["margin"],
            "below_cost": result["below_cost"],
            "warning": result["warning"],
            "list_price": list_price,
            "unit_cost": unit_cost,
            "category": category,
            "supplier_lead_days": supplier_lead_days
        }
        return response_data
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Scoring error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
