import React, { useCallback, useEffect } from 'react';
import {
  BasicTextInput,
  Grid,
  InputWithLabelRow,
  InputWithLabelRowProps,
  Typography,
  useTranslation,
} from '@openmsupply-client/common';
import { PrescriptionPaymentFormPlugin } from './PrescriptionPaymentFormWrapper';
import { usePluginData } from './api';

const PrescriptionPaymentFormInner: PrescriptionPaymentFormPlugin = ({
  prescriptionData,
}) => {
  const t = useTranslation('common');
  const [cashReceived, setCashReceived] = React.useState<Number | undefined>();

  const { data: paymentData } = usePluginData.data(prescriptionData?.id ?? '');
  const data = paymentData?.[0];
  const { mutate } = data?.id ? usePluginData.update() : usePluginData.insert();

  const onSave = useCallback(async () => {
    mutate({
      id: data?.id,
      data: JSON.stringify(cashReceived),
      invoice_id: prescriptionData?.id,
      // relatedRecordId: prescriptionData?.id,
    });
  }, [cashReceived, data, mutate, data?.id]);

  // useEffect(() => {
  //   const unmountEvent = events.mountEvent(onSave);
  //   return unmountEvent;
  // }, [onSave]);

  // useEffect(() => {
  //   if (data !== undefined) setDonor(data?.data ?? '');
  // }, [data]);

  return (
    <>
      <Grid size={4}>
        <InputWithLabelRow
          label={t('label.sell-price')} // TODO: OBVIOUSLY WRONG
          Input={
            <BasicTextInput
              value={cashReceived}
              onChange={e => setCashReceived(Number(e.target.value))}
            />
          }
        />
      </Grid>
    </>
  );
};

export default PrescriptionPaymentFormInner;
