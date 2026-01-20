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
        widgetContext={widgetContext}
        panelContext={'internal-orders'}
        stats={[
          {
            label: t('label.new'),
            value: formatNumber.round(requisitionCount?.request?.draft),
            link: RouteBuilder.create(AppRoute.Replenishment)
              .addPart(AppRoute.InternalOrder)
              .addQuery({ status: RequisitionNodeStatus.Draft })
              .build(),
            alertFlag:
              !!requisitionCount?.request?.draft &&
              requisitionCount?.request?.draft > 0,
          },
        ]}
      />
    </>
  );
};

// const StockPanel = ({ widgetContext }: InternalOrderPanelsProps) => {
//   // will render only in widgets with context 'replenishment'
//   if (widgetContext !== 'replenishment') return null;

//   return (
//     <ThemeProviderProxy>
//       <QueryClientProviderProxy>
//         {/* Can also add multiple panels here if needed */}
//         <InternalOrderPanels widgetContext={widgetContext} />
//       </QueryClientProviderProxy>
//     </ThemeProviderProxy>
//   );
// };

// export default StockPanel;
