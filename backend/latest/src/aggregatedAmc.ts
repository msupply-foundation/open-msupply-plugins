import { mapValues } from 'lodash';
import * as sqlQueries from './sqlQueries';
import groupBy from 'lodash/groupBy';
import values from 'lodash/values';
import sumBy from 'lodash/sumBy';
import maxBy from 'lodash/maxBy';

export const aggregateAmcCommon = (
  suppliedNameForItems: ReturnType<typeof sqlQueries.suppliedNamesForItems>,
  consumptions: ReturnType<typeof sqlQueries.latestResponseRequisitionLines>
) => {
  const itemToNameMap = groupBy(suppliedNameForItems, 'item_id');
  const summedNamesForItemMap = mapValues(itemToNameMap, names => names.length);
  const maxNumberOfSuppliersForItem = maxBy(values(summedNamesForItemMap)) || 0;

  log(
    JSON.stringify({
      itemToNameMap,
      summedNamesForItemMap,
      maxNumberOfSuppliersForItem,
    })
  );
  if (maxNumberOfSuppliersForItem <= 0) {
    return undefined;
  }

  if (consumptions.length <= 0) return {};

  const consumptionMap = mapValues(
    groupBy(consumptions, 'item_id'),
    itemRows => ({
      summedAMC: sumBy(itemRows, 'average_monthly_consumption'),
      summedStock: sumBy(itemRows, 'available_stock_on_hand'),
      numberOfCountedNames: itemRows.length,
    })
  );

  log(JSON.stringify(consumptionMap));

  const result = mapValues(
    consumptionMap,
    (
      { numberOfCountedNames, summedAMC, summedStock: aggregateStock },
      itemId
    ) => {
      // How many names that this store supplies, have this item visible
      let numberOfNamesForItem =
        summedNamesForItemMap[itemId] || numberOfCountedNames;

      log(
        JSON.stringify({ numberOfCountedNames, numberOfNamesForItem, itemId })
      );
      // If no items are visible for any suppliers, don't calculate
      if (!numberOfNamesForItem) {
        return;
      }

      // Number of names matches, don't need to apply average to missing AMC for name
      if (numberOfCountedNames >= numberOfNamesForItem) {
        return {
          average_monthly_consumption: summedAMC,
          aggregateStock,
        };
      }

      // Calculate average and apply to names that are missing AMC
      const averageAMC = summedAMC / numberOfCountedNames;

      return {
        average_monthly_consumption:
          numberOfCountedNames >= numberOfNamesForItem
            ? summedAMC
            : summedAMC +
              averageAMC * (numberOfNamesForItem - numberOfCountedNames),
        aggregateStock,
        averageAMC,
      };
    }
  );

  log(JSON.stringify(result));
  return result;
};

export const aggregatedAmc = ({
  storeId,
  dates,
  orderType,
  itemIds,
}: {
  storeId: string;
  dates: Dates;
  itemIds: string[];
  orderType?: string | null;
}) =>
  aggregateAmcCommon(
    sqlQueries.suppliedNamesForItems(storeId, itemIds),
    sqlQueries.latestResponseRequisitionLines(
      storeId,
      itemIds,
      dates,
      orderType
    )
  );
