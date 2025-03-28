// To upload to server (after adding submodule to openmsupply repo locally)
// cargo run --bin remote_server_cli -- generate-and-install-plugin-bundle -i '../client/packages/plugins/{plugin name}/backend' -u 'http://localhost:8000' --username 'test' --password 'pass'

import { BackendPlugins } from '@common/types';
import { RequisitionRow } from '@common/generated/RequisitionRow';
import { StorePreferenceRow } from '@common/generated/StorePreferenceRow';
import { normalAmcWithDOSadjustment } from './normalAmcWithDOSadjustment';
import { aggregatedAmc } from './aggregatedAmc';
import { calculateDates, itemLinkIdMap, periodDates } from './utils';
import { itemMovementsInPeriod } from './itemMovementsInPeriod';
import { aggregatedAmcInfo } from './aggregatedAmcInfo';

const plugins: BackendPlugins = {
  average_monthly_consumption: ({ store_id, item_ids }) => {
    // For normal AMC using current date
    let dates = calculateDates(new Date(), store_id);
    return normalAmcWithDOSadjustment({
      dates,
      itemIds: item_ids,
      storeId: store_id,
    });
  },
  transform_request_requisition_lines: ({ context, lines, requisition }) => {
    switch (context) {
      case 'InsertProgramRequestRequisition':
      case 'AddFromMasterList':
      case 'UpdateRequestRequisition':
      case 'InsertRequestRequisitionLine':
        // Can do for different actions or do exhaustive match here
        break;
      default:
        // Can also try/catch ignore this if you only want compilation to fail but plugin to still work when new variant is added
        assertUnreachable(context);
    }

    const { periodStartDate, periodEndDate } = periodDates(
      requisition.period_id
    );

    const dates = calculateDates(periodEndDate, requisition.store_id);
    const { itemLinkToItem } = itemLinkIdMap(
      lines.map(({ item_link_id }) => item_link_id)
    );

    const commonParams = {
      dates,
      itemIds: Object.values(itemLinkToItem),
      storeId: requisition.store_id,
    };

    const aggregateItemAMC = aggregatedAmc({
      ...commonParams,
      orderType: requisition.order_type,
    });

    const itemAmcs =
      aggregateItemAMC || normalAmcWithDOSadjustment(commonParams);

    const storePreferences = get_store_preferences(requisition.store_id);

    // For stock movements we use period start and end date
    const movements = itemMovementsInPeriod({
      ...commonParams,
      dates: { ...dates, periodStartDate, periodEndDate },
    });

    const defaultMovements = {
      initial_stock_on_hand_units: 0,
      incoming_units: 0,
      outgoing_units: 0,
      loss_in_units: 0,
      addition_in_units: 0,
      available_stock_on_hand: 0,
    };
    const mapMovements = (itemId: string): typeof defaultMovements => {
      const movement = movements[itemId];
      if (!movement) return defaultMovements;

      return {
        initial_stock_on_hand_units: movement.starting,
        incoming_units: movement.incoming,
        outgoing_units: movement.outgoing,
        loss_in_units: movement.adjustmentReduction,
        addition_in_units: movement.adjustmentAddition,
        available_stock_on_hand: movement.ending,
      };
    };

    const defaultAmc = { average_monthly_consumption: 0, days_out_of_stock: 0 };
    const mapAmc = (itemId: string): typeof defaultAmc => {
      const itemAmc = itemAmcs[itemId];
      if (!itemAmc) return defaultAmc;

      return {
        average_monthly_consumption: itemAmc.average_monthly_consumption,
        days_out_of_stock: 0,
      };
    };

    return {
      transformed_lines: lines.map(line => {
        const itemId = itemLinkToItem[line.item_link_id];

        const { average_monthly_consumption, days_out_of_stock } =
          mapAmc(itemId);

        const {
          initial_stock_on_hand_units,
          incoming_units,
          outgoing_units,
          loss_in_units,
          addition_in_units,
          available_stock_on_hand,
        } = mapMovements(itemId);

        const suggested_quantity = calculateSuggestedQuantity({
          requisition,
          available_stock_on_hand,
          average_monthly_consumption,
          storePreferences,
        });

        return {
          ...line,
          suggested_quantity,
          average_monthly_consumption,
          days_out_of_stock,
          initial_stock_on_hand_units,
          incoming_units,
          outgoing_units,
          loss_in_units,
          addition_in_units,
          available_stock_on_hand,
        };
      }),
    };
  },
  graphql_query: params => aggregatedAmcInfo(params),
};

const calculateSuggestedQuantity = ({
  requisition,
  available_stock_on_hand,
  average_monthly_consumption: amc,
  storePreferences,
}: {
  requisition: RequisitionRow;
  available_stock_on_hand: number;
  average_monthly_consumption: number;
  storePreferences: StorePreferenceRow;
}) => {
  if (amc <= 0) return 0;

  const currentMOS = available_stock_on_hand / amc;

  if (currentMOS > requisition.min_months_of_stock) return 0;

  const targetMOS =
    requisition.max_months_of_stock + storePreferences.months_lead_time;

  if (currentMOS > targetMOS) return 0;

  return (targetMOS - currentMOS) * amc;
};

function assertUnreachable(_: never): never {
  // TODO don't actually want to error, just want to handle all variants and do compilation error in tests
  throw new Error("Didn't expect to get here");
}

export { plugins };
