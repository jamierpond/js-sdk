// Copyright  ©, 2022, Lightspark Group, Inc. - All Rights Reserved
import React from "react";
import styled from "@emotion/styled/macro";
import type { Maybe } from "../common/types";
import { CurrencyUnit } from "@lightspark/js-sdk/generated/graphql";

type Props = {
  value: Maybe<number>;
  unit: Maybe<CurrencyUnit>;
  shortUnit?: boolean;
  symbol?: boolean;
  shortNumber?: boolean;
  useLocaleString?: boolean;
  maximumSignificantDigits?: number;
  maximumFractionDigits?: number;
  minimumFractionDigits?: number;
};

const CurrencyAmountRaw = (props: Props) => {
  const symbol = () => {
    switch (props.unit) {
      case CurrencyUnit.Satoshi:
        return <Satoshi />;
    }
    return "?";
  };

  const text = getAsText(props);
  return (
    <Amount>
      {symbol()}
      {text}
    </Amount>
  );
};

export const getAsText = (props: Props): string => {
  const {
    value,
    unit,
    shortUnit,
    symbol,
    shortNumber,
    useLocaleString,
    maximumSignificantDigits,
    maximumFractionDigits,
    minimumFractionDigits,
  } = props;

  if (value === undefined || value === null) {
    return "ERROR";
  }
  let number = value.toString();
  if (shortNumber) {
    const abs_val = Math.abs(value);
    if (abs_val >= 1_000_000_000) {
      const newValue = value / 1_000_000_000;
      number = newValue.toFixed(newValue >= 100 ? 0 : 1) + "B";
    } else if (abs_val >= 1_000_000) {
      const newValue = value / 1_000_000;
      number = newValue.toFixed(newValue >= 100 ? 0 : 1) + "M";
    } else if (abs_val >= 1_000) {
      const newValue = value / 1_000;
      number = (value / 1_000).toFixed(newValue >= 100 ? 0 : 1) + "K";
    } else {
      number = value.toFixed(2);
    }
  } else if (useLocaleString) {
    const options: Intl.NumberFormatOptions = {};
    if (maximumSignificantDigits !== undefined) {
      options.maximumSignificantDigits = maximumSignificantDigits;
    }
    if (maximumFractionDigits !== undefined) {
      options.maximumFractionDigits = maximumFractionDigits;
    }
    if (minimumFractionDigits !== undefined) {
      options.minimumFractionDigits = minimumFractionDigits;
    }
    number = Number(number).toLocaleString(undefined, options);
  }
  if (!unit || symbol) {
    return number;
  }
  if (shortUnit) {
    return number + " " + shorttext(unit);
  }
  const isPlural = value > 1;
  const unitText = isPlural ? plural(unit) : singular(unit);
  return number + " " + unitText;
};

const singular = (unit: CurrencyUnit) => {
  switch (unit) {
    case CurrencyUnit.Bitcoin:
      return "Bitcoin";
    case CurrencyUnit.Millibitcoin:
      return "Millibitcoin";
    case CurrencyUnit.Microbitcoin:
      return "Microbitcoin";
    case CurrencyUnit.Nanobitcoin:
      return "Nanobitcoin";
    case CurrencyUnit.Satoshi:
      return "Satoshi";
    case CurrencyUnit.Millisatoshi:
      return "Millisatoshi";
  }
  return unit;
};

const plural = (unit: CurrencyUnit) => {
  switch (unit) {
    case CurrencyUnit.Bitcoin:
      return "Bitcoins";
    case CurrencyUnit.Millibitcoin:
      return "Millibitcoins";
    case CurrencyUnit.Microbitcoin:
      return "Microbitcoins";
    case CurrencyUnit.Nanobitcoin:
      return "Nanobitcoins";
    case CurrencyUnit.Satoshi:
      return "Satoshis";
    case CurrencyUnit.Millisatoshi:
      return "Millisatoshis";
  }
  return unit;
};

const shorttext = (unit: CurrencyUnit) => {
  switch (unit) {
    case CurrencyUnit.Bitcoin:
      return "BTC";
    case CurrencyUnit.Millibitcoin:
      return "mBTC";
    case CurrencyUnit.Microbitcoin:
      return "μBTC";
    case CurrencyUnit.Satoshi:
      return "sat";
    case CurrencyUnit.Millisatoshi:
      return "msat";
  }
  return unit;
};

// This is a squared-off version that is compatible with Montserrat.
type SatProps = {
  color?: string;
  offset?: number;
  size?: number;
};

const Satoshi = (props: SatProps) => (
  <svg
    width="0.675em"
    height="0.9em"
    style={{ transform: "translate(-0.05em, 0.1em)" }}
    viewBox="0 0 26 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect y="8.88867" width="25.9994" height="4.44434" fill="currentColor" />
    <rect y="17.7788" width="25.9994" height="4.44434" fill="currentColor" />
    <rect y="26.6685" width="25.9994" height="4.44434" fill="currentColor" />
    <rect
      x="15.4753"
      y="34.6748"
      width="5.32497"
      height="4.95226"
      transform="rotate(90 15.4753 34.6748)"
      fill="currentColor"
    />
    <rect
      x="15.4753"
      width="5.33322"
      height="4.95226"
      transform="rotate(90 15.4753 0)"
      fill="currentColor"
    />
  </svg>
);

const Amount = styled.span`
  color: inherit !important;
  white-space: nowrap;
  font-feature-settings: "tnum" on, "lnum" on;
`;

export default CurrencyAmountRaw;
