import React, { useCallback, useEffect } from 'react';
import {
  BasicTextInput,
  Grid,
  InputWithLabelRow,
  NumericTextInput,
  Select,
  useTranslation,
} from '@openmsupply-client/common';
import { PrescriptionPaymentFormPlugin } from './PrescriptionPaymentFormWrapper';
import { usePluginData } from './api';

// TODO: Translate?
enum PaymentMethod {
  CASH = 'Cash',
  CARD = 'Card',
  CHEQUE = 'Cheque',
}

type PrescriptionPaymentData = {
  id?: string;
  invoice_id?: string;
  paymentMethod?: PaymentMethod;
  amountPaid?: number;
  change?: number;
};

const PrescriptionPaymentFormInner: PrescriptionPaymentFormPlugin = ({
  prescriptionData,
  totalToBePaidByPatient,
  events,
}) => {
  const t = useTranslation('common');
  const [draft, setDraft] = React.useState<
    PrescriptionPaymentData | undefined
  >();

  const { data: paymentData } = usePluginData.data(prescriptionData?.id ?? '');
  const data = paymentData?.[0];
  const { mutate } = data?.id ? usePluginData.update() : usePluginData.insert();

  const onSave = useCallback(async () => {
    mutate({
      id: data?.id,
      data: JSON.stringify(draft),
      invoice_id: prescriptionData?.id,
    });
  }, [draft, data, mutate, data?.id]);

  useEffect(() => {
    const unmountEvent = events.mountEvent(onSave);
    return unmountEvent;
  }, [onSave]);

  useEffect(() => {
    if (data !== undefined) {
      const parsed = JSON.parse(data.data);
      setDraft(parsed);
    }
  }, [data]);

  const changeValue =
    (draft?.amountPaid ?? 0 - totalToBePaidByPatient > 0)
      ? (draft?.amountPaid ?? 0 - totalToBePaidByPatient)
      : undefined;

  return (
    <>
      <Grid spacing={2}>
        <InputWithLabelRow
          label={t('label.payment-amount-outstanding')}
          Input={
            <BasicTextInput
              disabled={true}
              value={totalToBePaidByPatient.toFixed(2)}
            />
          }
        />
        <InputWithLabelRow
          label={t('label.payment-type')}
          Input={
            <Select
              fullWidth
              options={Object.values(PaymentMethod).map(value => ({
                value,
                label: value,
              }))}
              value={draft?.paymentMethod}
              onChange={e =>
                setDraft({
                  ...draft,
                  paymentMethod: e.target.value as PaymentMethod,
                })
              }
            />
          }
        />
        <InputWithLabelRow
          label={t('label.payment-amount-paid')}
          Input={
            <NumericTextInput
              fullWidth
              value={draft?.amountPaid}
              decimalLimit={2}
              onChange={e => setDraft({ ...draft, amountPaid: e })}
            />
          }
        />
        <InputWithLabelRow
          label={t('label.payment-change')}
          Input={<BasicTextInput disabled={true} value={changeValue} />}
        />
      </Grid>
    </>
  );
};

export default PrescriptionPaymentFormInner;
