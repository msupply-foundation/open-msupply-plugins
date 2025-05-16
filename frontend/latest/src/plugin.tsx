import { Plugins } from '@openmsupply-client/common';
import PrescriptionPaymentForm from './PrescriptionPaymentForm/PrescriptionPaymentFormWrapper';
import { ItemInformationView } from './AggregateAmcInfo/AggregateAmcInfo';
import * as stockDonor from './ForecastQuantity/ForecastQuantityColumn';

const CIVPlugins: Plugins = {
  prescriptionPaymentForm: [PrescriptionPaymentForm],
  requestRequisitionLine: {
    tableStateLoader: [stockDonor.StateLoader],
    tableColumn: [stockDonor.ForecastQuantityColumn],
    editViewField: [],
    editViewInfo: [ItemInformationView],
  },
};

export default CIVPlugins;
