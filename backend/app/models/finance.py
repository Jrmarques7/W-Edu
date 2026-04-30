from datetime import datetime, timezone
import enum

from sqlalchemy import Boolean, CheckConstraint, DateTime, Enum as SAEnum, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class BillingPeriod(str, enum.Enum):
    one_time = "one_time"
    monthly = "monthly"
    quarterly = "quarterly"
    yearly = "yearly"


class SubscriptionStatus(str, enum.Enum):
    active = "active"
    paused = "paused"
    cancelled = "cancelled"
    overdue = "overdue"
    completed = "completed"


class PaymentMethod(str, enum.Enum):
    pix = "pix"
    card = "card"
    boleto = "boleto"
    manual = "manual"


class ChargeStatus(str, enum.Enum):
    pending = "pending"
    paid = "paid"
    failed = "failed"
    cancelled = "cancelled"
    refunded = "refunded"


class BillingPlan(Base):
    __tablename__ = "billing_plans"
    __table_args__ = (UniqueConstraint("name"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200), index=True)
    description: Mapped[str | None] = mapped_column(Text)
    price_cents: Mapped[int] = mapped_column(Integer)
    currency: Mapped[str] = mapped_column(String(10), default="BRL")
    billing_period: Mapped[BillingPeriod] = mapped_column(SAEnum(BillingPeriod), default=BillingPeriod.monthly)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    subscriptions: Mapped[list["Subscription"]] = relationship(back_populates="billing_plan")
    charges: Mapped[list["Charge"]] = relationship(back_populates="billing_plan")


class Subscription(Base):
    __tablename__ = "subscriptions"
    __table_args__ = (
        UniqueConstraint("billing_plan_id", "student_id"),
        UniqueConstraint("billing_plan_id", "organization_id"),
        CheckConstraint("student_id IS NOT NULL OR organization_id IS NOT NULL", name="subscription_customer_check"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    billing_plan_id: Mapped[int] = mapped_column(ForeignKey("billing_plans.id"), index=True)
    student_id: Mapped[int | None] = mapped_column(ForeignKey("students.id"), nullable=True, index=True)
    organization_id: Mapped[int | None] = mapped_column(ForeignKey("organizations.id"), nullable=True, index=True)
    status: Mapped[SubscriptionStatus] = mapped_column(SAEnum(SubscriptionStatus), default=SubscriptionStatus.active)
    start_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    current_period_start: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    current_period_end: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    next_billing_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    gateway_name: Mapped[str | None] = mapped_column(String(50))
    gateway_customer_id: Mapped[str | None] = mapped_column(String(120))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    billing_plan: Mapped["BillingPlan"] = relationship(back_populates="subscriptions")
    student: Mapped["Student | None"] = relationship(back_populates="subscriptions")
    organization: Mapped["Organization | None"] = relationship(back_populates="subscriptions")
    charges: Mapped[list["Charge"]] = relationship(back_populates="subscription")


class Charge(Base):
    __tablename__ = "charges"

    id: Mapped[int] = mapped_column(primary_key=True)
    billing_plan_id: Mapped[int | None] = mapped_column(ForeignKey("billing_plans.id"), nullable=True, index=True)
    subscription_id: Mapped[int | None] = mapped_column(ForeignKey("subscriptions.id"), nullable=True, index=True)
    student_id: Mapped[int | None] = mapped_column(ForeignKey("students.id"), nullable=True, index=True)
    organization_id: Mapped[int | None] = mapped_column(ForeignKey("organizations.id"), nullable=True, index=True)
    course_id: Mapped[int | None] = mapped_column(ForeignKey("courses.id"), nullable=True, index=True)
    class_offering_id: Mapped[int | None] = mapped_column(ForeignKey("class_offerings.id"), nullable=True, index=True)
    amount_cents: Mapped[int] = mapped_column(Integer)
    currency: Mapped[str] = mapped_column(String(10), default="BRL")
    payment_method: Mapped[PaymentMethod] = mapped_column(SAEnum(PaymentMethod), default=PaymentMethod.manual)
    status: Mapped[ChargeStatus] = mapped_column(SAEnum(ChargeStatus), default=ChargeStatus.pending)
    gateway_name: Mapped[str | None] = mapped_column(String(50))
    gateway_reference: Mapped[str | None] = mapped_column(String(120), index=True)
    due_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    description: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    billing_plan: Mapped["BillingPlan | None"] = relationship(back_populates="charges")
    subscription: Mapped["Subscription | None"] = relationship(back_populates="charges")
    student: Mapped["Student | None"] = relationship(back_populates="charges")
    organization: Mapped["Organization | None"] = relationship(back_populates="charges")
    course: Mapped["Course | None"] = relationship(back_populates="charges")
    class_offering: Mapped["ClassOffering | None"] = relationship(back_populates="charges")
