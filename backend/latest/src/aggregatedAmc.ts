import * as sqlQueries from './sqlQueries';

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
}) => {
  const numberOfSuppliedNamesForItems = sqlQueries.supplierNamesForItems(
    storeId,
    itemIds
  );

  const maxNumberOfSuppliersForItem = numberOfSuppliedNamesForItems.reduce(
    (acc, { number_of_names }) =>
      acc > number_of_names ? acc : number_of_names,
    0
  );

  if (maxNumberOfSuppliersForItem <= 0) {
    return undefined;
  }

  const consumptions = sqlQueries.latestResponseRequisitionLines(
    storeId,
    itemIds,
    dates,
    orderType
  );

  if (consumptions.length <= 0) return {};
  const consumptionDefault = {
    summedStock: 0,
    summedAMC: 0,
    numberOfNames: 0,
    itemId: '',
  };

  const consumptionMap: { [itemLinkId: string]: typeof consumptionDefault } =
    {};
  consumptions.forEach(c => {
    const current = consumptionMap[c.item_id] || { ...consumptionDefault };
    current.summedAMC += c.average_monthly_consumption;
    current.summedStock += c.available_stock_on_hand;
    current.numberOfNames += 1;
    current.itemId = c.item_id;

    consumptionMap[c.item_id] = current;
  });

  const result: {
    [itemLinkId: string]: {
      // aggregate monthly consumption, to match return of AMC
      average_monthly_consumption: number;
      aggregateStock: number;
    };
  } = {};

  // aggregateStock is actually filtered by requisition_lines with AMC > 0, this is how it is in mSupply
  // technically should be latest line with stock, even if AMC = 0
  Object.entries(consumptionMap).forEach(
    ([
      itemLinkId,
      { numberOfNames, summedAMC, summedStock: aggregateStock, itemId },
    ]) => {
      // How many names that this store supplies, have this item visible
      let numberOfNamesForItem =
        numberOfSuppliedNamesForItems.find(({ item_id }) => item_id === itemId)
          ?.number_of_names || numberOfNames;
      // If no items are visible for any suppliers, don't calculate
      if (!numberOfNamesForItem) {
        return;
      }
      // Number of names matches,don't need to apply average to missing AMC for name
      if (numberOfNames >= numberOfNamesForItem) {
        result[itemLinkId] = {
          average_monthly_consumption: summedAMC,
          aggregateStock,
        };
        return;
      }

      // Calculate average and apply to names that are missing AMC
      const averageAMC = summedAMC / numberOfNames;
      const average_monthly_consumption =
        summedAMC + averageAMC * (numberOfNamesForItem - numberOfNames);
      result[itemLinkId] = { average_monthly_consumption, aggregateStock };
    }
  );

  return result;
};
