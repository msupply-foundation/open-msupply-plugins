import React, { useCallback, useEffect, useState } from 'react';
import {
  CurrencyInput,
  Grid,
  InputWithLabelRow,
  Select,
  useTranslation,
} from '@openmsupply-client/common';
import { PrescriptionPaymentFormPlugin } from './PrescriptionPaymentFormWrapper';
import { usePluginData } from './api';

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
  const [draft, setDraft] = useState<PrescriptionPaymentData | undefined>();

  const stillToPay = totalToBePaidByPatient - (draft?.amountPaid ?? 0);
  const changeValue = stillToPay < 0 ? Math.abs(stillToPay) : 0;
  const amountOutstanding = stillToPay < 0 ? 0 : stillToPay;

  const { data: paymentData } = usePluginData.data(prescriptionData?.id ?? '');
  const data = paymentData?.[0];
  const { mutate } = data?.id ? usePluginData.update() : usePluginData.insert();

  const onSave = useCallback(async () => {
    if (amountOutstanding > 0)
      throw new Error(t('error.plugin-payment-amount-outstanding'));

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

  // NOTE: Key hack below, this is a workaround for the CurrencyInput component not updating as expected
  // internally value is mapping to defaultValue, so the component is not updating when the value prop changes
  // If the input if fixed, or we can switch to something like CurrencyDisplayInput, this can be removed

  return (
    <>
      <Grid size={{ xs: 12, sm: 6 }}>
        <InputWithLabelRow
          label={t('label.payment-amount-to-be-paid')}
          Input={
            <CurrencyInput
              key={`totalToBePaidByPatient${totalToBePaidByPatient}`}
              value={totalToBePaidByPatient}
              decimalsLimit={2}
              onChangeNumber={() => {}}
              style={{ borderRadius: 4, pointerEvents: 'none' }}
            />
          }
        />
        <InputWithLabelRow
          label={t('label.payment-amount-paid')}
          Input={
            <CurrencyInput
              key={`amountPaid`}
              value={draft?.amountPaid ?? 0}
              onChangeNumber={e => setDraft({ ...draft, amountPaid: e })}
              style={{ borderRadius: 4 }}
            />
          }
          sx={{ pt: 1 }}
        />
        <InputWithLabelRow
          label={t('label.payment-change')}
          Input={
            <CurrencyInput
              key={`changeValue${changeValue}`}
              value={changeValue}
              decimalsLimit={2}
              onChangeNumber={() => {}}
              style={{ borderRadius: 4, pointerEvents: 'none' }}
            />
          }
          sx={{ pt: 1 }}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <InputWithLabelRow
          label={t('label.payment-type')}
          Input={
            <Select
              fullWidth
              options={Object.values(PaymentMethod).map(value => ({
                value,
                label: value,
              }))}
              value={
                draft?.paymentMethod
                  ? t(`paymentMethod.${draft?.paymentMethod}`)
                  : PaymentMethod.CASH
              }
              onChange={e =>
                setDraft({
                  ...draft,
                  paymentMethod: e.target.value as PaymentMethod,
                })
              }
              sx={{
                width: 0,
                flexGrow: 1,
                marginRight: 2,
                '& .MuiInputBase-root': { borderRadius: 1 },
              }}
            />
          }
        />
        <InputWithLabelRow
          key={'amountOutstanding-row'}
          label={t('label.payment-amount-outstanding')}
          Input={
            <CurrencyInput
              key={`amountOutstanding-${amountOutstanding}`}
              value={amountOutstanding}
              decimalsLimit={2}
              onChangeNumber={() => {}}
              style={{ borderRadius: 4, pointerEvents: 'none' }}
            />
          }
          sx={{ pt: 1 }}
        />
      </Grid>
    </>
  );
};

export default PrescriptionPaymentFormInner;
