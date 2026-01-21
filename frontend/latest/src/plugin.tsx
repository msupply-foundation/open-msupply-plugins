import { Plugins } from '@openmsupply-client/common';
import ShippingStatus from './ShippingStatus/ShippingStatus';
import SyncStatus from './Dashboard/SyncStatus';
import ReplenishmentPanels from './Dashboard/ReplenishmentPanels';
import * as OrderingStats from './Dashboard/InboundShipmentCustomStats';
import StockDonorEdit from './StockDonor/StockDonorEdit';
import * as stockDonor from './StockDonor/StockDonorColumn';
import * as aggregateAmc from './AggregateAmc/AggregateAmcColumn';
import { Info } from './AggregateAmc/AggregateAmcInfo';

const ReplenishmentAndSyncStatus: Plugins = {
  inboundShipmentAppBar: [ShippingStatus],
  dashboard: {
    widget: [SyncStatus],
    panel: [ReplenishmentPanels],
    statistic: [OrderingStats, { Component: () => null, hiddenStats: [] }],
  },
  stockLine: {
    tableStateLoader: [stockDonor.StateLoader],
    tableColumn: [stockDonor.StockDonorColumn],
    editViewField: [StockDonorEdit],
  },
  requestRequisitionLine: {
    tableStateLoader: [aggregateAmc.StateLoader],
    tableColumn: [aggregateAmc.AggregateAmcColumn],
    editViewField: [aggregateAmc.AggregateAmcEditView],
    editViewInfo: [Info],
  },
};

export default ReplenishmentAndSyncStatus;
