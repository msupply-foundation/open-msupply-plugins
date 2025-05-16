import { Plugins } from '@openmsupply-client/common';
import * as forecastQuantity from './ForecastQuantity/ForecastQuantityColumn';

const ForecastingPlugins: Plugins = {
  requestRequisitionLine: {
    tableStateLoader: [forecastQuantity.StateLoader],
    tableColumn: [forecastQuantity.ForecastQuantityColumn],
    editViewField: [],
    editViewInfo: [],
  },
};

export default ForecastingPlugins;
