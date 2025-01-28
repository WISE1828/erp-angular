import { isNullOrUndefined } from 'util';
import { isNotNullOrUndefined } from 'codelyzer/util/isNotNullOrUndefined';

const valueOrDefault = (value: number) => (!isFinite(value) || isNaN(value) || isNullOrUndefined(value) ? 0 : value);

export const ROI = (income: number, expenses: number) => {
  return valueOrDefault((PROFIT(income, expenses) / expenses) * 100);
};

export const PROFIT = (incoming: number, expenses: number) => {
  return valueOrDefault(incoming - expenses);
};

//
export function consumableInRub({ consumables, consumablesUSD, usdRub }): number {
  const consumableRub = consumables;
  const consumableUsd = consumablesUSD * usdRub;
  return valueOrDefault(consumableRub + consumableUsd);
}
export function spentInRub({ spent, spentUSD, usdRub }): number {
  const spentRub = spent;
  const spentUsd = spentUSD * usdRub;
  return valueOrDefault(spentRub + spentUsd);
}
export function incomeInRub({ incomeRUB, incomeUSD, incomeEUR, usdRub, eurRub }): number {
  const incomingRub = incomeRUB;
  const incomingUsdAsRub = incomeUSD * usdRub;
  const incomingEurAsRub = incomeEUR * eurRub;
  return valueOrDefault(incomingRub + incomingUsdAsRub + incomingEurAsRub);
}
export function accountsInRub({ accountsTax = 0, accountsTaxUsd = 0, usdRub }): number {
  return accountsTax + accountsTaxUsd * usdRub;
}
export function comissionsInRub({ comissionTax = 0, comissionTaxUsd = 0, usdRub }): number {
  return comissionTax + comissionTaxUsd * usdRub;
}

export function checkNumber(n: number, defaultValue: number): number {
  return !isNaN(n) && isFinite(n) && isNotNullOrUndefined(n) ? n : defaultValue;
}
