from datetime import datetime, timezone

import httpx
from fastapi import HTTPException, status

from app.core.config import settings
from app.models.finance import Charge, PaymentMethod


class AsaasGateway:
    def __init__(self):
        self.base_url = settings.ASAAS_API_URL.rstrip("/")
        self.token = settings.ASAAS_API_TOKEN

    def create_charge(self, charge: Charge) -> dict:
        if not self.token:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="ASAAS_API_TOKEN não configurado")
        customer_id = charge.gateway_customer_id
        if not customer_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Informe gateway_customer_id do cliente Asaas")
        if not charge.due_at:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Informe vencimento da cobrança")

        billing_type = self._billing_type(charge.payment_method)
        payload = {
            "customer": customer_id,
            "billingType": billing_type,
            "value": round(charge.amount_cents / 100, 2),
            "dueDate": charge.due_at.date().isoformat(),
            "description": charge.description or f"Cobrança W-Edu #{charge.id}",
            "externalReference": f"w-edu-charge-{charge.id}",
        }
        response = self._request("POST", "/payments", json=payload)
        pix = self._pix_qr_code(response["id"]) if billing_type == "PIX" else {}
        return {
            "gateway_name": "asaas",
            "gateway_reference": response.get("id"),
            "gateway_status": response.get("status"),
            "checkout_url": response.get("invoiceUrl"),
            "bank_slip_url": response.get("bankSlipUrl"),
            "pix_qr_code_payload": pix.get("payload"),
            "pix_qr_code_image": pix.get("encodedImage"),
        }

    def _pix_qr_code(self, payment_id: str) -> dict:
        try:
            return self._request("GET", f"/payments/{payment_id}/pixQrCode")
        except HTTPException:
            return {}

    def _request(self, method: str, path: str, **kwargs) -> dict:
        try:
            with httpx.Client(timeout=15) as client:
                response = client.request(
                    method,
                    f"{self.base_url}{path}",
                    headers={"access_token": self.token, "Content-Type": "application/json"},
                    **kwargs,
                )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as exc:
            detail = exc.response.text
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Asaas recusou a cobrança: {detail}")
        except httpx.HTTPError as exc:
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Erro ao acessar Asaas: {exc}")

    def _billing_type(self, method: PaymentMethod) -> str:
        if method == PaymentMethod.pix:
            return "PIX"
        if method == PaymentMethod.boleto:
            return "BOLETO"
        if method == PaymentMethod.card:
            return "CREDIT_CARD"
        return "UNDEFINED"


def apply_gateway_payload(charge: Charge, payload: dict) -> Charge:
    for field, value in payload.items():
        setattr(charge, field, value)
    return charge
