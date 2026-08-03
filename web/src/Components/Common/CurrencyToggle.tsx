import React, { FC } from "react";
import { Select } from "antd";
import { useCurrencyContext } from "../../Context/CurrencyContext/currencyContext";
import { SupportedCurrency } from "../../Utils/currencyConverter";

export interface CurrencyToggleProps {
  className?: string;
}

/**
 * Small dropdown letting the user pick which currency carbon credit values
 * are DISPLAYED in (USD or LAK). This is purely a UI presentation choice -
 * it never changes the underlying USD values stored in or sent to the
 * backend. See web/src/Utils/currencyConverter.ts for the conversion logic
 * and the caveat about the static exchange rate used.
 */
export const CurrencyToggle: FC<CurrencyToggleProps> = ({ className }) => {
  const { currency, setCurrency } = useCurrencyContext();

  const handleChange = (value: SupportedCurrency) => {
    setCurrency(value);
  };

  return (
    <Select
      className={className}
      value={currency}
      onChange={handleChange}
      style={{ width: 110 }}
      options={[
        { value: "USD", label: "USD ($)" },
        { value: "LAK", label: "LAK (₭)" },
      ]}
    />
  );
};

export default CurrencyToggle;
