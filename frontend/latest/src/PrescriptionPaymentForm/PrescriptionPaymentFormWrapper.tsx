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
}) => (
  <ThemeProviderProxy>
    <QueryClientProviderProxy>
      <PrescriptionPaymentFormInner prescriptionData={prescriptionData} />
    </QueryClientProviderProxy>
  </ThemeProviderProxy>
);

export default PrescriptionPaymentForm;
