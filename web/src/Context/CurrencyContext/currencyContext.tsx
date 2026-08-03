import React, { createContext, useContext, useState } from "react";
import { SupportedCurrency } from "../../Utils/currencyConverter";

const CURRENCY_STORAGE_KEY = "displayCurrency";

const getStoredCurrency = (): SupportedCurrency => {
  const stored = localStorage.getItem(CURRENCY_STORAGE_KEY);
  return stored === "LAK" || stored === "USD" ? stored : "USD";
};

export const CurrencyContext = createContext({
  currency: "USD" as SupportedCurrency,
  setCurrency: (value: SupportedCurrency) => {},
});

export const CurrencyContextProvider = ({
  children,
}: React.PropsWithChildren) => {
  const [currency, setCurrencyState] = useState<SupportedCurrency>(
    getStoredCurrency()
  );

  const setCurrency = (value: SupportedCurrency) => {
    setCurrencyState(value);
    localStorage.setItem(CURRENCY_STORAGE_KEY, value);
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrencyContext = () => {
  return useContext(CurrencyContext);
};
