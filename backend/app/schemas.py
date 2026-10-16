from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class OrderScoreRequest(BaseModel):
    product_id: str = Field(..., description="Selected product ID, e.g. PR0001")
    quantity: int = Field(..., ge=1, description="Order quantity")
    unit_price: float = Field(..., gt=0, description="Unit selling price")
    discount_pct: float = Field(..., ge=0.0, le=0.25, description="Discount percentage between 0 and 0.25")
    hour: int = Field(..., ge=0, le=23, description="Hour of the day (0-23)")
    dow: int = Field(..., ge=0, le=6, description="Day of the week (0=Mon .. 6=Sun)")
    tenure_days: int = Field(..., ge=0, description="Customer tenure in days")
    channel: str = Field(..., description="Sales channel (e.g. Web, App, Store)")
    payment_method: str = Field(..., description="Payment method (e.g. Card, Cash, UPI, NetBanking, Wallet)")
    region: str = Field(..., description="Region (e.g. North, South, East, West, Central)")
    customer_segment: str = Field(..., description="Customer segment (e.g. New, Returning, Loyal, At-risk)")
    preferred_channel: str = Field(..., description="Customer preferred channel")

class ProbOutcome(BaseModel):
    prob: float
    reasons: List[str]
    reliable: bool

class OrderScoreResponse(BaseModel):
    cancel: ProbOutcome
    return_outcome: ProbOutcome = Field(..., alias="return")
    margin: float
    below_cost: bool
    warning: str
    list_price: float
    unit_cost: float
    category: str
    supplier_lead_days: int

    class Config:
        populate_by_name = True
