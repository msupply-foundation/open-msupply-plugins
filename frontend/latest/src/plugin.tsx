import { Plugins } from '@openmsupply-client/common';
import PrescriptionPaymentForm from './PrescriptionPaymentForm/PrescriptionPaymentFormWrapper';
import { ItemInformationView } from './AggregateAmcInfo/AggregateAmcInfo';

const CIVPlugins: Plugins = {
  prescriptionPaymentForm: [PrescriptionPaymentForm],
  requestRequisitionLine: {
    tableStateLoader: [],
    tableColumn: [],
    editViewField: [],
    editViewInfo: [ItemInformationView],
  },
};

export default CIVPlugins;
