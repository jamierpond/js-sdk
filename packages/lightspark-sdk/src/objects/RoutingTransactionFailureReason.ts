// Copyright ©, 2023-present, Lightspark Group, Inc. - All Rights Reserved

export enum RoutingTransactionFailureReason {
  /**
   * This is an enum value that represents values that could be added in the future.
   * Clients should support unknown values as more of them could be added without notice.
   */
  FUTURE_VALUE = "FUTURE_VALUE",

  INCOMING_LINK_FAILURE = "INCOMING_LINK_FAILURE",

  OUTGOING_LINK_FAILURE = "OUTGOING_LINK_FAILURE",

  FORWARDING_FAILURE = "FORWARDING_FAILURE",
}

export default RoutingTransactionFailureReason;