import { ArrayElement, BackendPlugins } from '@common/types';
import { PluginGraphql } from '../../../shared/types';
import { THIS_STORE } from '../../../shared/constants';
import * as sqlQueries from './sqlQueries';
import { calculateDates, periodDates } from './utils';
import { aggregateAmcCommon } from './aggregatedAmc';
import uniqBy from 'lodash/uniqBy';
import sortBy from 'lodash/sortBy';

type StatType = ArrayElement<PluginGraphql['output']['result']>['stats'];

export const aggregatedAmcInfo: NonNullable<
  BackendPlugins['graphql_query']
> = ({ store_id, input: inputUntyped }): PluginGraphql['output'] => {
  const { itemIds, periodId, orderType } =
    inputUntyped as PluginGraphql['input'];

  const itemNames = sqlQueries.suppliedNamesForItems(store_id, itemIds);
  const { periodEndDate } = periodDates(periodId);
  const dates = calculateDates(periodEndDate, store_id);

  const consumption = sqlQueries.latestResponseRequisitionLines(
    store_id,
    itemIds,
    dates,
    orderType
  );

  const calculatedConsumpion = aggregateAmcCommon(itemNames, consumption);

  const getStatsForItemName = (itemId: string, name: string): StatType => {
    let stat = consumption.find(r => itemId == r.item_id && name == r.name);
    if (!stat) {
      const averageAmc = calculatedConsumpion?.[itemId]?.averageAMC ?? null;
      return {
        amc: averageAmc,
        stock: null,
        periodEndDate: averageAmc ? { type: 'Average' } : null,
      };
    } else
      return {
        amc: stat.average_monthly_consumption,
        stock: stat.available_stock_on_hand,
        periodEndDate: {
          type: 'PeriodEnd',
          date: new Date(stat.datetime).toJSON(),
        },
      };
  };

  const thisStoreStats = uniqBy(itemNames, 'item_id').map(({ item_id }) => {
    const stats: StatType = {
      amc: calculatedConsumpion?.[item_id]?.average_monthly_consumption || 0,
      stock: calculatedConsumpion?.[item_id]?.aggregateStock || 0,
      periodEndDate: {
        type: 'PeriodEnd',
        date: periodEndDate.toJSON(),
      },
    };
    return {
      itemId: item_id,
      name: THIS_STORE,
      stats,
    };
  });

  const result = sortBy(
    itemNames.map(({ item_id, name }) => ({
      itemId: item_id,
      name,
      stats: getStatsForItemName(item_id, name),
    })),
    [rows => rows.stats.periodEndDate?.type, rows => rows.stats.amc]
  ).reverse();

  return {
    type: 'aggregateAmcInfo',
    result: [...thisStoreStats, ...result],
  };
};
