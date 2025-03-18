import * as sqlQueries from './sqlQueries';
import { localDate } from './sqlUtils';
import { ledgerInPeriod } from './utils';

export const normalAmcWithDOSadjustment = (params: CommonParams) => {
  const { storeId, itemIds, dates } = params;
  const sqlResult = sqlQueries.consumption(storeId, itemIds, dates);

  // Fill all item_ids with default
  const result: {
    [itemId: string]: { average_monthly_consumption: number; dos: number };
  } = {};

  // Only calculate DOS for items with consumption
  const dosItemIds = sqlResult.map(({ item_id }) => String(item_id));
  // Not using numberOfDays but actually using 30 * lookback months as per mSupply
  const { dosMap, numberOfDays: _ } = getDOS({
    ...params,
    itemIds: dosItemIds,
  });

  const numberOfDays = 30 * dates.lookBackMonths;

  sqlResult.forEach(({ item_id, consumption }) => {
    const actualDos = dosMap[item_id] || 0;
    const dos = actualDos >= numberOfDays ? numberOfDays - 1 : actualDos;

    const dosAdjustment = numberOfDays / (numberOfDays - dos);

    result[item_id] = {
      average_monthly_consumption:
        (consumption / dates.lookBackMonths) * dosAdjustment,
      dos: actualDos,
    };
  });

  return result;
};

const getDOS = (params: CommonParams) => {
  const { dates, itemIds } = params;
  const ledger = ledgerInPeriod(params);
  // Should be [{itemId: stockOnDate }]
  const ledgerArray = Object.entries(ledger)
    .filter(
      ([date]) =>
        date <= localDate(dates.periodEndDate) &&
        date <= localDate(dates.periodStartDate)
    )
    .map(([_, value]) => value); /* endDate would already be restricted */

  const dosMap: { [itemId: string]: number } = {};
  itemIds.forEach(itemId => (dosMap[itemId] = 0));

  ledgerArray.forEach(itemStockOnDay => {
    itemIds.forEach(itemId => {
      dosMap[itemId] = dosMap[itemId] + (itemStockOnDay[itemId] > 0 ? 0 : 1);
    });
  });

  return { dosMap, numberOfDays: ledgerArray.length };
};
