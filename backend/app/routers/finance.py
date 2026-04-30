from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies import get_current_admin, get_current_admin_or_company_manager, get_current_student
from app.models.student import Student, UserRole
from app.schemas.finance import (
    BillingPlanCreate,
    BillingPlanOut,
    BillingPlanUpdate,
    ChargeCreate,
    ChargeOut,
    ChargeUpdate,
    SubscriptionCreate,
    SubscriptionOut,
    SubscriptionUpdate,
)
from app.services.finance import FinanceService

router = APIRouter()


@router.get("/plans", response_model=list[BillingPlanOut])
def list_plans(db: Session = Depends(get_db), _: Student = Depends(get_current_student)):
    return FinanceService(db).list_plans()


@router.post("/plans", response_model=BillingPlanOut, status_code=201)
def create_plan(data: BillingPlanCreate, db: Session = Depends(get_db), _: Student = Depends(get_current_admin)):
    return FinanceService(db).create_plan(data)


@router.patch("/plans/{plan_id}", response_model=BillingPlanOut)
def update_plan(plan_id: int, data: BillingPlanUpdate, db: Session = Depends(get_db), _: Student = Depends(get_current_admin)):
    return FinanceService(db).update_plan(plan_id, data)


@router.get("/subscriptions", response_model=list[SubscriptionOut])
def list_subscriptions(db: Session = Depends(get_db), current: Student = Depends(get_current_admin_or_company_manager)):
    service = FinanceService(db)
    if current.role == UserRole.admin:
        return service.list_subscriptions()
    return service.list_my_subscriptions(current)


@router.post("/subscriptions", response_model=SubscriptionOut, status_code=201)
def create_subscription(data: SubscriptionCreate, db: Session = Depends(get_db), _: Student = Depends(get_current_admin)):
    return FinanceService(db).create_subscription(data)


@router.patch("/subscriptions/{subscription_id}", response_model=SubscriptionOut)
def update_subscription(subscription_id: int, data: SubscriptionUpdate, db: Session = Depends(get_db), _: Student = Depends(get_current_admin)):
    return FinanceService(db).update_subscription(subscription_id, data)


@router.get("/charges", response_model=list[ChargeOut])
def list_charges(db: Session = Depends(get_db), current: Student = Depends(get_current_admin_or_company_manager)):
    service = FinanceService(db)
    if current.role == UserRole.admin:
        return service.list_charges()
    return service.list_my_charges(current)


@router.post("/charges", response_model=ChargeOut, status_code=201)
def create_charge(data: ChargeCreate, db: Session = Depends(get_db), _: Student = Depends(get_current_admin)):
    return FinanceService(db).create_charge(data)


@router.patch("/charges/{charge_id}", response_model=ChargeOut)
def update_charge(charge_id: int, data: ChargeUpdate, db: Session = Depends(get_db), _: Student = Depends(get_current_admin)):
    return FinanceService(db).update_charge(charge_id, data)


@router.post("/charges/{charge_id}/paid", response_model=ChargeOut)
def mark_paid(charge_id: int, db: Session = Depends(get_db), _: Student = Depends(get_current_admin)):
    return FinanceService(db).mark_paid(charge_id)


@router.post("/charges/{charge_id}/failed", response_model=ChargeOut)
def mark_failed(charge_id: int, db: Session = Depends(get_db), _: Student = Depends(get_current_admin)):
    return FinanceService(db).mark_failed(charge_id)
