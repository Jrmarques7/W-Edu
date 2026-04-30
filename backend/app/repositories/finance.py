from sqlalchemy.orm import Session

from app.models.finance import BillingPlan, Subscription, Charge


class BillingPlanRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, plan_id: int) -> BillingPlan | None:
        return self.db.get(BillingPlan, plan_id)

    def list_all(self) -> list[BillingPlan]:
        return self.db.query(BillingPlan).order_by(BillingPlan.name).all()

    def create(self, plan: BillingPlan) -> BillingPlan:
        self.db.add(plan)
        self.db.commit()
        self.db.refresh(plan)
        return plan

    def update(self, plan: BillingPlan) -> BillingPlan:
        self.db.commit()
        self.db.refresh(plan)
        return plan


class SubscriptionRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, subscription_id: int) -> Subscription | None:
        return self.db.get(Subscription, subscription_id)

    def list_all(self) -> list[Subscription]:
        return self.db.query(Subscription).order_by(Subscription.created_at.desc()).all()

    def list_by_student(self, student_id: int) -> list[Subscription]:
        return self.db.query(Subscription).filter(Subscription.student_id == student_id).order_by(Subscription.created_at.desc()).all()

    def list_by_organization(self, organization_id: int) -> list[Subscription]:
        return self.db.query(Subscription).filter(Subscription.organization_id == organization_id).order_by(Subscription.created_at.desc()).all()

    def create(self, subscription: Subscription) -> Subscription:
        self.db.add(subscription)
        self.db.commit()
        self.db.refresh(subscription)
        return subscription

    def update(self, subscription: Subscription) -> Subscription:
        self.db.commit()
        self.db.refresh(subscription)
        return subscription


class ChargeRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, charge_id: int) -> Charge | None:
        return self.db.get(Charge, charge_id)

    def list_all(self) -> list[Charge]:
        return self.db.query(Charge).order_by(Charge.created_at.desc()).all()

    def list_by_student(self, student_id: int) -> list[Charge]:
        return self.db.query(Charge).filter(Charge.student_id == student_id).order_by(Charge.created_at.desc()).all()

    def list_by_organization(self, organization_id: int) -> list[Charge]:
        return self.db.query(Charge).filter(Charge.organization_id == organization_id).order_by(Charge.created_at.desc()).all()

    def create(self, charge: Charge) -> Charge:
        self.db.add(charge)
        self.db.commit()
        self.db.refresh(charge)
        return charge

    def update(self, charge: Charge) -> Charge:
        self.db.commit()
        self.db.refresh(charge)
        return charge
