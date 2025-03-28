import { sqlDateTime, sqlList, sqlQuery } from '@common/utils';

export const datesForPeriod = (periodId: string) =>
  sqlQuery(
    ['end_date', 'start_date'],
    `       
        SELECT end_date, start_date FROM period WHERE id = "${periodId}"
    `
  );

export const consumption = (storeId: string, itemIds: string[], dates: Dates) =>
  sqlQuery(
    ['item_id', 'consumption'],
    `       
        SELECT item_id, sum(quantity) AS consumption FROM consumption 
        WHERE store_id = "${storeId}" 
        AND item_id in ${sqlList(itemIds)} 
        AND date >= "${sqlDateTime(dates.periodStartDate)}"
        GROUP BY item_id
    `
  );

export const SOH = (storeId: string, itemIds: string[]) =>
  sqlQuery(
    ['item_id', 'total_stock_on_hand'],
    `
        SELECT item_id, total_stock_on_hand from stock_on_hand
        WHERE store_id = "${storeId}" AND item_id in ${sqlList(itemIds)}
    `
  );

export const stockMovement = (
  storeId: string,
  itemIds: string[],
  dates: Dates
) =>
  sqlQuery(
    ['item_id', 'datetime', 'quantity'],
    `  
      SELECT item_id, datetime, quantity
      FROM stock_movement WHERE 
      store_id = "${storeId}" 
      AND item_id IN ${sqlList(itemIds)}
      AND datetime >= "${sqlDateTime(dates.periodStartDate)}"
    `
  );

export const itemLinkIds = (itemLinkIds: string[]) =>
  sqlQuery(
    ['item_id', 'item_link_id'],
    `
          SELECT item_id, id as item_link_id
          FROM item_link
          WHERE item_link.id IN ${sqlList(itemLinkIds)}
    `
  );

export const periodStockMovements = (
  storeId: string,
  itemIds: string[],
  dates: Dates
) =>
  sqlQuery(
    [
      'item_id',
      'incoming',
      'outgoing',
      'adjustment_addition',
      'adjustment_reduction',
    ],
    `
        SELECT item_id, 
            sum(quantity) FILTER(WHERE quantity > 0 AND invoice_type != 'INVENTORY_ADDITION') as incoming,
            sum(quantity) FILTER(WHERE quantity < 0 AND invoice_type != 'INVENTORY_REDUCTION') as outgoing,
            sum(quantity) FILTER(WHERE invoice_type = 'INVENTORY_ADDITION') as adjustment_addition,
            sum(quantity) FILTER(WHERE invoice_type = 'INVENTORY_REDUCTION') as adjustment_reduction
        FROM stock_movement WHERE 
        store_id = "${storeId}" 
        AND item_id in ${sqlList(itemIds)}
        AND datetime >= "${sqlDateTime(dates.periodStartDate)}"
        AND datetime <= "${sqlDateTime(dates.periodEndDate)}"
        GROUP BY item_id
  `
  );

export const suppliedNamesForItems = (storeId: string, itemIds: string[]) =>
  sqlQuery(
    ['item_id', 'name'],
    `
        SELECT il.item_id as item_id, n.name as name
        FROM name as n
        JOIN name_link as nl on nl.name_id = n.id
        JOIN master_list_name_join as mlnj on mlnj.name_link_id = nl.id
        JOIN master_list_line as mll on mll.master_list_id = mlnj.master_list_id
        JOIN master_list as ml on ml.id = mlnj.master_list_id
        JOIN item_link as il on il.id = mll.item_link_id
        WHERE n.supplying_store_id = '${storeId}'
        AND ml.is_active = true
        AND il.item_id IN ${sqlList(itemIds)}
    `
  );

export const latestResponseRequisitionLines = (
  storeId: string,
  itemIds: string[],
  dates: Dates,
  orderType?: string | null
) =>
  sqlQuery(
    [
      'item_id',
      'name',
      'average_monthly_consumption',
      'available_stock_on_hand',
      'datetime',
    ],
    `
    WITH 
      rl_all AS (
      SELECT 
        rl.average_monthly_consumption,
        rl.available_stock_on_hand,
        il.item_id,
        nl.name_id,
        p.end_date as datetime 
      FROM requisition_line as rl
      JOIN item_link as il ON rl.item_link_id = il.id
      JOIN requisition as r ON rl.requisition_id = r.id
      JOIN period as p ON p.id = r.period_id
      JOIN name_link as nl ON r.name_link_id = nl.id
      WHERE r.type = 'RESPONSE'
      AND average_monthly_consumption > 0
      AND store_id = '${storeId}'
      AND p.end_date <= '${sqlDateTime(dates.periodEndDate)}'
      AND p.start_date >= '${sqlDateTime(dates.periodStartDate)}'
      AND il.item_id IN ${sqlList(itemIds)}
      ${!!orderType ? `AND r.order_type = 'Ordinaire'` : ''}
      ),
      latest_created_datetime AS (
      SELECT
        item_id,
        name_id,
        max(datetime ) as max_datetime
      FROM rl_all GROUP BY 1,2
      ),
      rl_latest AS (
      SELECT 
        average_monthly_consumption,
		    datetime,
        available_stock_on_hand,
        latest.name_id as name_id,
        rl_all.item_id
      FROM rl_all
      INNER JOIN latest_created_datetime as latest ON 
        rl_all.item_id = latest.item_id AND
        rl_all.name_id = latest.name_id AND
        rl_all.datetime = latest.max_datetime 
      )
      SELECT 
        rl_latest.item_id,
        name,
        average_monthly_consumption,
        available_stock_on_hand,
        datetime
      FROM rl_latest
      JOIN name as n on n.id = rl_latest.name_id
    `
  );
