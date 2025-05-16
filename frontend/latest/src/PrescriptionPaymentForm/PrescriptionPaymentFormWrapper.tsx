import React from 'react';
import {
  ArrayElement,
  Plugins,
  QueryClientProviderProxy,
  ThemeProviderProxy,
} from '@openmsupply-client/common';
import PrescriptionPaymentFormInner from './PrescriptionPaymentForm';

export type PrescriptionPaymentFormPlugin = NonNullable<
  ArrayElement<Plugins['prescriptionPaymentForm']>
>;

const PrescriptionPaymentForm: PrescriptionPaymentFormPlugin = ({
  prescriptionData,
  totalToBePaidByInsurance,
  totalToBePaidByPatient,
  events,
}) => (
  <ThemeProviderProxy>
    <QueryClientProviderProxy>
      <PrescriptionPaymentFormInner
        prescriptionData={prescriptionData}
        totalToBePaidByInsurance={totalToBePaidByInsurance}
        totalToBePaidByPatient={totalToBePaidByPatient}
        events={events}
      />
    </QueryClientProviderProxy>
  </ThemeProviderProxy>
);

export default PrescriptionPaymentForm;
