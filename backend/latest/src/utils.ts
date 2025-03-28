import * as sqlQueries from './sqlQueries';
import {
  endOfDay,
  fromSqlDateTime,
  localDate,
  startOfDay,
} from '@common/utils';

export const periodDates = (periodId?: string | null) => {
  const defaultResult = {
    periodEndDate: new Date(),
    periodStartDate: new Date(),
  };
  if (!periodId) return defaultResult;

  const period = sqlQueries.datesForPeriod(periodId)[0];
  try {
    const periodEndDate = new Date(String(period?.end_date) || '');
    const periodStartDate = new Date(String(period?.start_date) || '');
    if ('setDate' in periodEndDate && 'setDate' in periodStartDate) {
      return { periodEndDate, periodStartDate };
    }
  } catch (e) {
    log(
      JSON.stringify({
        e,
        period,
        extra: 'period does not exist or date cannot be mapped',
      })
    );
  }

  return defaultResult;
};

export const itemLinkIdMap = (itemLinkIds: string[]) => {
  let ids = sqlQueries.itemLinkIds(itemLinkIds);
  const itemLinkToItem: { [itemLinkId: string]: string } = {};
  const itemToItemLink: { [itemId: string]: string } = {};

  ids.forEach(({ item_id, item_link_id }) => {
    itemLinkToItem[item_link_id] = item_id;
    itemToItemLink[item_id] = item_link_id;
  });

  return { itemLinkToItem, itemToItemLink };
};

export const calculateDates = (referenceDate: Date, storeId: string): Dates => {
  // In mSupply we default to "order_lookback" global pref, which is no available
  // in omSupply, make sure correct store preference is set
  const lookBackMonths =
    get_store_preferences(storeId).monthly_consumption_look_back_period;

  const periodStartDate = new Date(referenceDate);

  periodStartDate.setDate(periodStartDate.getDate() + 1);
  periodStartDate.setMonth(periodStartDate.getMonth() - lookBackMonths);

  return {
    periodEndDate: endOfDay(referenceDate),
    today: new Date(),
    periodStartDate: startOfDay(periodStartDate),
    lookBackMonths,
  };
};

const currentSOH = (storeId: string, itemIds: string[]) => {
  const sqlResult = sqlQueries.SOH(storeId, itemIds);

  const result: { [itemId: string]: number } = {};
  sqlResult.forEach(
    row => (result[String(row.item_id)] = Number(row.total_stock_on_hand))
  );

  return result;
};

export const ledgerInPeriod = ({ storeId, itemIds, dates }: CommonParams) => {
  const stockMovement = sqlQueries.stockMovement(storeId, itemIds, dates);
  const SOH = currentSOH(storeId, itemIds);

  const dailyStockMap: { [itemId: string]: number } = {};
  stockMovement.forEach(row => {
    const date = localDate(fromSqlDateTime(row.datetime));
    dailyStockMap[String(row.item_id) + date] =
      (dailyStockMap[String(row.item_id) + date] || 0) + Number(row.quantity);
  });

  const endStock: { [itemId: string]: number } = {};
  itemIds.forEach(itemId => (endStock[itemId] = SOH[itemId] || 0));

  const ledger = { [localDate(dates.today)]: endStock };

  const LIMIT = 10000; // Just in case
  let limitCounter = 0;

  let current = new Date(dates.today);

  while (limitCounter < LIMIT) {
    const currentSqlDate = localDate(current);

    const endStock: { [itemId: string]: number } = {};
    itemIds.forEach(
      itemId =>
        (endStock[itemId] =
          ledger[currentSqlDate][itemId] -
          (dailyStockMap[itemId + currentSqlDate] || 0))
    );

    current.setDate(current.getDate() - 1);

    ledger[localDate(current)] = endStock;

    if (current < dates.periodStartDate) {
      break;
    }

    limitCounter++;
  }

  return ledger;
};
