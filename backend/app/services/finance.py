from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.finance import BillingPeriod, BillingPlan, Charge, ChargeStatus, PaymentMethod, Subscription, SubscriptionStatus
from app.models.student import Student
from app.repositories.finance import BillingPlanRepository, ChargeRepository, SubscriptionRepository
from app.repositories.student import OrganizationRepository, StudentRepository
from app.schemas.finance import BillingPlanCreate, BillingPlanUpdate, ChargeCreate, ChargeUpdate, SubscriptionCreate, SubscriptionUpdate
from app.services.payment_gateways import AsaasGateway, apply_gateway_payload


class FinanceService:
    def __init__(self, db: Session):
        self.db = db
        self.plan_repo = BillingPlanRepository(db)
        self.subscription_repo = SubscriptionRepository(db)
        self.charge_repo = ChargeRepository(db)
        self.student_repo = StudentRepository(db)
        self.organization_repo = OrganizationRepository(db)

    def list_plans(self) -> list[BillingPlan]:
        return self.plan_repo.list_all()

    def create_plan(self, data: BillingPlanCreate) -> BillingPlan:
        return self.plan_repo.create(BillingPlan(**data.model_dump()))

    def update_plan(self, plan_id: int, data: BillingPlanUpdate) -> BillingPlan:
        plan = self._get_plan_or_404(plan_id)
        for field, value in data.model_dump(exclude_none=True).items():
            setattr(plan, field, value)
        return self.plan_repo.update(plan)

    def list_subscriptions(self) -> list[Subscription]:
        return self.subscription_repo.list_all()

    def list_my_subscriptions(self, current: Student) -> list[Subscription]:
        if current.organization_id:
            return self.subscription_repo.list_by_organization(current.organization_id)
        return self.subscription_repo.list_by_student(current.id)

    def create_subscription(self, data: SubscriptionCreate) -> Subscription:
        self._validate_subscription_target(data.student_id, data.organization_id)
        plan = self._get_plan_or_404(data.billing_plan_id)
        current = datetime.now(timezone.utc)
        next_billing = self._next_billing_date(plan.billing_period, current)
        subscription = Subscription(
            billing_plan_id=plan.id,
            student_id=data.student_id,
            organization_id=data.organization_id,
            status=SubscriptionStatus.active,
            start_date=current,
            current_period_start=current,
            current_period_end=next_billing,
            next_billing_at=next_billing,
            gateway_name=data.gateway_name,
            gateway_customer_id=data.gateway_customer_id,
        )
        return self.subscription_repo.create(subscription)

    def update_subscription(self, subscription_id: int, data: SubscriptionUpdate) -> Subscription:
        subscription = self._get_subscription_or_404(subscription_id)
        for field, value in data.model_dump(exclude_none=True).items():
            setattr(subscription, field, value)
        return self.subscription_repo.update(subscription)

    def list_charges(self) -> list[Charge]:
        return self.charge_repo.list_all()

    def list_my_charges(self, current: Student) -> list[Charge]:
        if current.organization_id:
            return self.charge_repo.list_by_organization(current.organization_id)
        return self.charge_repo.list_by_student(current.id)

    def create_charge(self, data: ChargeCreate) -> Charge:
        self._validate_charge_target(data.student_id, data.organization_id, data.subscription_id)
        payload = data.model_dump()
        if data.subscription_id:
            subscription = self._get_subscription_or_404(data.subscription_id)
            if not payload.get("billing_plan_id"):
                payload["billing_plan_id"] = subscription.billing_plan_id
            if not payload.get("student_id"):
                payload["student_id"] = subscription.student_id
            if not payload.get("organization_id"):
                payload["organization_id"] = subscription.organization_id
            if not payload.get("gateway_customer_id"):
                payload["gateway_customer_id"] = subscription.gateway_customer_id
        charge = self.charge_repo.create(Charge(**payload))
        if charge.gateway_name == "asaas" and not charge.gateway_reference:
            charge = apply_gateway_payload(charge, AsaasGateway().create_charge(charge))
            charge = self.charge_repo.update(charge)
        return charge

    def sync_charge_gateway(self, charge_id: int) -> Charge:
        charge = self._get_charge_or_404(charge_id)
        if charge.gateway_name != "asaas":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cobrança não usa gateway Asaas")
        if charge.gateway_reference:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cobrança já enviada ao Asaas")
        charge = apply_gateway_payload(charge, AsaasGateway().create_charge(charge))
        return self.charge_repo.update(charge)

    def update_charge(self, charge_id: int, data: ChargeUpdate) -> Charge:
        charge = self._get_charge_or_404(charge_id)
        for field, value in data.model_dump(exclude_none=True).items():
            setattr(charge, field, value)
        return self.charge_repo.update(charge)

    def mark_paid(self, charge_id: int, method: PaymentMethod = PaymentMethod.manual) -> Charge:
        charge = self._get_charge_or_404(charge_id)
        charge.status = ChargeStatus.paid
        charge.payment_method = method
        charge.paid_at = datetime.now(timezone.utc)
        return self.charge_repo.update(charge)

    def mark_failed(self, charge_id: int) -> Charge:
        charge = self._get_charge_or_404(charge_id)
        charge.status = ChargeStatus.failed
        return self.charge_repo.update(charge)

    def _get_plan_or_404(self, plan_id: int) -> BillingPlan:
        plan = self.plan_repo.get_by_id(plan_id)
        if not plan:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plano não encontrado")
        return plan

    def _get_subscription_or_404(self, subscription_id: int) -> Subscription:
        subscription = self.subscription_repo.get_by_id(subscription_id)
        if not subscription:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assinatura não encontrada")
        return subscription

    def _get_charge_or_404(self, charge_id: int) -> Charge:
        charge = self.charge_repo.get_by_id(charge_id)
        if not charge:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cobrança não encontrada")
        return charge

    def _validate_subscription_target(self, student_id: int | None, organization_id: int | None) -> None:
        if not student_id and not organization_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Informe aluno ou empresa")
        if student_id and not self.student_repo.get_by_id(student_id):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Aluno não encontrado")
        if organization_id and not self.organization_repo.get_by_id(organization_id):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Empresa não encontrada")

    def _validate_charge_target(self, student_id: int | None, organization_id: int | None, subscription_id: int | None) -> None:
        if not subscription_id and not student_id and not organization_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Informe assinatura, aluno ou empresa")
        if student_id and not self.student_repo.get_by_id(student_id):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Aluno não encontrado")
        if organization_id and not self.organization_repo.get_by_id(organization_id):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Empresa não encontrada")

    def _next_billing_date(self, period: BillingPeriod, start_at: datetime) -> datetime:
        if period == BillingPeriod.one_time:
            return start_at
        if period == BillingPeriod.monthly:
            return start_at + timedelta(days=30)
        if period == BillingPeriod.quarterly:
            return start_at + timedelta(days=90)
        return start_at + timedelta(days=365)
