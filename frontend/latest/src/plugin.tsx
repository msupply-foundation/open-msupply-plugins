import { Plugins } from '@openmsupply-client/common';
import PrescriptionPaymentForm from './PrescriptionPaymentForm/PrescriptionPaymentFormWrapper';

const CIVPlugins: Plugins = {
  prescriptionPaymentForm: [PrescriptionPaymentForm],
};

export default CIVPlugins;
