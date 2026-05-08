from datetime import datetime
from pydantic import BaseModel, Field

from app.models.finance import BillingPeriod, ChargeStatus, PaymentMethod, SubscriptionStatus


class BillingPlanCreate(BaseModel):
    name: str
    description: str | None = None
    price_cents: int = Field(ge=0)
    currency: str = "BRL"
    billing_period: BillingPeriod = BillingPeriod.monthly


class BillingPlanUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    price_cents: int | None = Field(default=None, ge=0)
    currency: str | None = None
    billing_period: BillingPeriod | None = None
    is_active: bool | None = None


class BillingPlanOut(BaseModel):
    id: int
    name: str
    description: str | None
    price_cents: int
    currency: str
    billing_period: BillingPeriod
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class SubscriptionCreate(BaseModel):
    billing_plan_id: int
    student_id: int | None = None
    organization_id: int | None = None
    gateway_name: str | None = None
    gateway_customer_id: str | None = None


class SubscriptionUpdate(BaseModel):
    status: SubscriptionStatus | None = None
    next_billing_at: datetime | None = None
    gateway_name: str | None = None
    gateway_customer_id: str | None = None


class SubscriptionOut(BaseModel):
    id: int
    billing_plan_id: int
    student_id: int | None
    organization_id: int | None
    status: SubscriptionStatus
    start_date: datetime
    current_period_start: datetime
    current_period_end: datetime
    next_billing_at: datetime | None
    gateway_name: str | None
    gateway_customer_id: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class ChargeCreate(BaseModel):
    billing_plan_id: int | None = None
    subscription_id: int | None = None
    student_id: int | None = None
    organization_id: int | None = None
    course_id: int | None = None
    class_offering_id: int | None = None
    amount_cents: int = Field(ge=0)
    currency: str = "BRL"
    payment_method: PaymentMethod = PaymentMethod.manual
    gateway_name: str | None = None
    gateway_customer_id: str | None = None
    gateway_reference: str | None = None
    due_at: datetime | None = None
    description: str | None = None


class ChargeUpdate(BaseModel):
    status: ChargeStatus | None = None
    paid_at: datetime | None = None
    gateway_name: str | None = None
    gateway_customer_id: str | None = None
    gateway_reference: str | None = None
    gateway_status: str | None = None
    checkout_url: str | None = None
    bank_slip_url: str | None = None
    pix_qr_code_payload: str | None = None
    pix_qr_code_image: str | None = None
    due_at: datetime | None = None
    description: str | None = None


class ChargeOut(BaseModel):
    id: int
    billing_plan_id: int | None
    subscription_id: int | None
    student_id: int | None
    organization_id: int | None
    course_id: int | None
    class_offering_id: int | None
    amount_cents: int
    currency: str
    payment_method: PaymentMethod
    status: ChargeStatus
    gateway_name: str | None
    gateway_customer_id: str | None
    gateway_reference: str | None
    gateway_status: str | None
    checkout_url: str | None
    bank_slip_url: str | None
    pix_qr_code_payload: str | None
    pix_qr_code_image: str | None
    due_at: datetime | None
    paid_at: datetime | None
    description: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
