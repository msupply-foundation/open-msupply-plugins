import React from 'react';
import {
  QueryClientProviderProxy,
  StatsPanel,
  ThemeProviderProxy,
  useFormatNumber,
  useTranslation,
} from '@openmsupply-client/common';
import { ApiException } from '@common/types';
import { useDashboard } from './api';
import { InternalOrdersPanel } from './InternalOrdersPanel';

interface ReplenishmentPanelsProps {
  widgetContext: string;
}

const ShipmentsPanel = ({ widgetContext }: ReplenishmentPanelsProps) => {
  const t = useTranslation('dashboard');
  const formatNumber = useFormatNumber();
  const { data, isLoading, isError, error } = useDashboard.statistics.inbound();

  const panelContext = 'ordering';

  return (
    <StatsPanel
      error={error as ApiException}
      isError={isError}
      isLoading={isLoading}
      title={t('label.shipments', { ns: 'app' })}
      panelContext={`${widgetContext}-${panelContext}`}
      stats={[
        {
          label: t('label.this-week'),
          value: formatNumber.round(data?.thisWeek),
          statContext: `${widgetContext}-${panelContext}-this-week`,
        },
        {
          label: t('label.inbound-not-delivered'),
          value: formatNumber.round(data?.notDelivered),
          statContext: `${widgetContext}-${panelContext}-not-delivered`,
        },
      ]}
    />
  );
};

const ReplenishmentPanels = ({ widgetContext }: ReplenishmentPanelsProps) => {
  // defines the widget the component will render into
  // will render only in widgets with context 'replenishment'
  if (widgetContext !== 'replenishment') return null;

  return (
    <ThemeProviderProxy>
      <QueryClientProviderProxy>
        <ShipmentsPanel widgetContext={widgetContext} />
        <InternalOrdersPanel widgetContext={widgetContext} />
      </QueryClientProviderProxy>
    </ThemeProviderProxy>
  );
};

export default ReplenishmentPanels;
