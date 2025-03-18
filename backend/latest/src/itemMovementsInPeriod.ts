import * as sqlQueries from './sqlQueries';
import { ledgerInPeriod } from './utils';

export const itemMovementsInPeriod = (params: CommonParams) => {
  const { storeId, itemIds, dates } = params;
  const ledger = ledgerInPeriod(params);
  const lastDateEntry = Object.values(ledger);
  if (lastDateEntry.length === 0) return {};

  const movements = sqlQueries.periodStockMovements(storeId, itemIds, dates);

  const defaultMovement = {
    incoming: 0,
    outgoing: 0,
    adjustmentAddition: 0,
    adjustmentReduction: 0,
  };
  const movementMap: { [itemId: string]: typeof defaultMovement } = {};

  movements.forEach(
    row =>
      (movementMap[row.item_id] = {
        ...row,
        adjustmentReduction: row.adjustment_reduction,
        adjustmentAddition: row.adjustment_addition,
      })
  );

  const result: {
    [itemId: string]: {
      starting: number;
      ending: number;
    } & typeof defaultMovement;
  } = {};

  const startingStockForItems = lastDateEntry[lastDateEntry.length - 1];

  itemIds.forEach(itemId => {
    const starting = startingStockForItems[itemId] || 0;
    const movement = movementMap[itemId] || defaultMovement;

    result[itemId] = {
      starting,
      incoming: movement.incoming || 0,
      outgoing: movement.outgoing || 0,
      adjustmentAddition: movement.adjustmentAddition || 0,
      adjustmentReduction: movement.adjustmentReduction || 0,
      ending:
        starting +
        (movement.incoming || 0) +
        (movement.outgoing || 0) +
        (movement.adjustmentAddition || 0) +
        (movement.adjustmentReduction || 0),
    };
  });

  return result;
};
