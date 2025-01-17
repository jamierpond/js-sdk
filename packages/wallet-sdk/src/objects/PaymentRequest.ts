// Copyright ©, 2023-present, Lightspark Group, Inc. - All Rights Reserved

import { LightsparkException, Query } from "@lightsparkdev/core";
import { CurrencyAmountFromJson } from "./CurrencyAmount.js";
import Entity from "./Entity.js";
import Invoice from "./Invoice.js";
import { InvoiceDataFromJson } from "./InvoiceData.js";
import PaymentRequestData from "./PaymentRequestData.js";
import PaymentRequestStatus from "./PaymentRequestStatus.js";

type PaymentRequest = Entity & {
  /**
   * The unique identifier of this entity across all Lightspark systems. Should be treated as an opaque
   * string.
   **/
  id: string;

  /** The date and time when the entity was first created. **/
  createdAt: string;

  /** The date and time when the entity was last updated. **/
  updatedAt: string;

  /** The details of the payment request. **/
  data: PaymentRequestData;

  /** The status of the payment request. **/
  status: PaymentRequestStatus;

  /** The typename of the object **/
  typename: string;
};

export const PaymentRequestFromJson = (obj: any): PaymentRequest => {
  if (obj["__typename"] == "Invoice") {
    return {
      id: obj["invoice_id"],
      createdAt: obj["invoice_created_at"],
      updatedAt: obj["invoice_updated_at"],
      data: InvoiceDataFromJson(obj["invoice_data"]),
      status:
        PaymentRequestStatus[obj["invoice_status"]] ??
        PaymentRequestStatus.FUTURE_VALUE,
      typename: "Invoice",
      amountPaid: !!obj["invoice_amount_paid"]
        ? CurrencyAmountFromJson(obj["invoice_amount_paid"])
        : undefined,
    } as Invoice;
  }
  throw new LightsparkException(
    "DeserializationError",
    `Couldn't find a concrete type for interface PaymentRequest corresponding to the typename=${obj["__typename"]}`
  );
};

export const FRAGMENT = `
fragment PaymentRequestFragment on PaymentRequest {
    __typename
    ... on Invoice {
        __typename
        invoice_id: id
        invoice_created_at: created_at
        invoice_updated_at: updated_at
        invoice_data: data {
            __typename
            invoice_data_encoded_payment_request: encoded_payment_request
            invoice_data_bitcoin_network: bitcoin_network
            invoice_data_payment_hash: payment_hash
            invoice_data_amount: amount {
                __typename
                currency_amount_original_value: original_value
                currency_amount_original_unit: original_unit
                currency_amount_preferred_currency_unit: preferred_currency_unit
                currency_amount_preferred_currency_value_rounded: preferred_currency_value_rounded
                currency_amount_preferred_currency_value_approx: preferred_currency_value_approx
            }
            invoice_data_created_at: created_at
            invoice_data_expires_at: expires_at
            invoice_data_memo: memo
        }
        invoice_status: status
        invoice_amount_paid: amount_paid {
            __typename
            currency_amount_original_value: original_value
            currency_amount_original_unit: original_unit
            currency_amount_preferred_currency_unit: preferred_currency_unit
            currency_amount_preferred_currency_value_rounded: preferred_currency_value_rounded
            currency_amount_preferred_currency_value_approx: preferred_currency_value_approx
        }
    }
}`;

export const getPaymentRequestQuery = (id: string): Query<PaymentRequest> => {
  return {
    queryPayload: `
query GetPaymentRequest($id: ID!) {
    entity(id: $id) {
        ... on PaymentRequest {
            ...PaymentRequestFragment
        }
    }
}

${FRAGMENT}    
`,
    variables: { id },
    constructObject: (data: any) => PaymentRequestFromJson(data.entity),
  };
};

export default PaymentRequest;
