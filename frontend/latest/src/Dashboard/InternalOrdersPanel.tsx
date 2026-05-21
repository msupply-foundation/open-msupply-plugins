import React from 'react';
import {
  RouteBuilder,
  StatsPanel,
  useFormatNumber,
  useTranslation,
} from '@openmsupply-client/common';
import { ApiException, RequisitionNodeStatus } from '@common/types';
import { useDashboard } from './api';
import { AppRoute } from 'packages/config/src';

interface InternalOrderPanelsProps {
  widgetContext: string;
}

export const InternalOrdersPanel = ({
  widgetContext,
}: InternalOrderPanelsProps) => {
  const t = useTranslation('dashboard');
  const formatNumber = useFormatNumber();
  const panelContext = 'internal-orders';

  const {
    data: requisitionCount,
    isLoading: isRequisitionCountLoading,
    isError: isRequisitionCountError,
    error: requisitionCountError,
  } = useDashboard.statistics.requisitions();

  return (
    <>
      <StatsPanel
        error={requisitionCountError as ApiException}
        isError={isRequisitionCountError}
        isLoading={isRequisitionCountLoading}
        title={t('label.new-internal-order', { ns: 'app' })}
        panelContext={`${widgetContext}-${panelContext}`}
        stats={[
          {
            label: t('label.new'),
            value: formatNumber.round(requisitionCount?.request?.draft),
            link: RouteBuilder.create(AppRoute.Replenishment)
              .addPart(AppRoute.InternalOrder)
              .addQuery({ status: RequisitionNodeStatus.Draft })
              .build(),
            statContext: `${widgetContext}-${panelContext}-new`,
            alertFlag:
              !!requisitionCount?.request?.draft &&
              requisitionCount?.request?.draft > 0,
          },
        ]}
      />
    </>
  );
};
