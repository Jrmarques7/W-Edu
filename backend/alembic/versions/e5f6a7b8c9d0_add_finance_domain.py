"""add finance domain

Revision ID: e5f6a7b8c9d0
Revises: d4e5f6a7b8c9
Create Date: 2026-04-30 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "e5f6a7b8c9d0"
down_revision = "d4e5f6a7b8c9"
branch_labels = None
depends_on = None


billing_period = sa.Enum("one_time", "monthly", "quarterly", "yearly", name="billingperiod")
subscription_status = sa.Enum("active", "paused", "cancelled", "overdue", "completed", name="subscriptionstatus")
payment_method = sa.Enum("pix", "card", "boleto", "manual", name="paymentmethod")
charge_status = sa.Enum("pending", "paid", "failed", "cancelled", "refunded", name="chargestatus")


def upgrade() -> None:
    op.create_table(
        "billing_plans",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=200), nullable=False, index=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("price_cents", sa.Integer(), nullable=False),
        sa.Column("currency", sa.String(length=10), nullable=False, server_default="BRL"),
        sa.Column("billing_period", billing_period, nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("name"),
    )

    op.create_table(
        "subscriptions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("billing_plan_id", sa.Integer(), sa.ForeignKey("billing_plans.id"), nullable=False, index=True),
        sa.Column("student_id", sa.Integer(), sa.ForeignKey("students.id"), nullable=True, index=True),
        sa.Column("organization_id", sa.Integer(), sa.ForeignKey("organizations.id"), nullable=True, index=True),
        sa.Column("status", subscription_status, nullable=False),
        sa.Column("start_date", sa.DateTime(timezone=True), nullable=False),
        sa.Column("current_period_start", sa.DateTime(timezone=True), nullable=False),
        sa.Column("current_period_end", sa.DateTime(timezone=True), nullable=False),
        sa.Column("next_billing_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("gateway_name", sa.String(length=50), nullable=True),
        sa.Column("gateway_customer_id", sa.String(length=120), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("student_id IS NOT NULL OR organization_id IS NOT NULL", name="subscription_customer_check"),
        sa.UniqueConstraint("billing_plan_id", "student_id"),
        sa.UniqueConstraint("billing_plan_id", "organization_id"),
    )

    op.create_table(
        "charges",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("billing_plan_id", sa.Integer(), sa.ForeignKey("billing_plans.id"), nullable=True, index=True),
        sa.Column("subscription_id", sa.Integer(), sa.ForeignKey("subscriptions.id"), nullable=True, index=True),
        sa.Column("student_id", sa.Integer(), sa.ForeignKey("students.id"), nullable=True, index=True),
        sa.Column("organization_id", sa.Integer(), sa.ForeignKey("organizations.id"), nullable=True, index=True),
        sa.Column("course_id", sa.Integer(), sa.ForeignKey("courses.id"), nullable=True, index=True),
        sa.Column("class_offering_id", sa.Integer(), sa.ForeignKey("class_offerings.id"), nullable=True, index=True),
        sa.Column("amount_cents", sa.Integer(), nullable=False),
        sa.Column("currency", sa.String(length=10), nullable=False, server_default="BRL"),
        sa.Column("payment_method", payment_method, nullable=False),
        sa.Column("status", charge_status, nullable=False),
        sa.Column("gateway_name", sa.String(length=50), nullable=True),
        sa.Column("gateway_reference", sa.String(length=120), nullable=True, index=True),
        sa.Column("due_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("paid_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("charges")
    op.drop_table("subscriptions")
    op.drop_table("billing_plans")
