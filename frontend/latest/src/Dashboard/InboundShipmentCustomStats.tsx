import React from 'react';
import {
  QueryClientProviderProxy,
  Statistic,
  ThemeProviderProxy,
  useFormatNumber,
  useTranslation,
} from '@openmsupply-client/common';
import { useDashboard } from './api';

const StatisticsPanel = ({ panelContext }: { panelContext: string }) => {
  const t = useTranslation('dashboard');
  const formatNumber = useFormatNumber();

  const { data, isLoading, isError } = useDashboard.statistics.inbound();

  return !isLoading && !isError ? (
    <>
      <Statistic
        label={t('label.active', { ns: 'dashboard' })}
        value={formatNumber.round(data?.today)}
        statContext={`${panelContext}-active`}
      />
      <Statistic
        label={t('label.inactive', { ns: 'dashboard' })}
        value={formatNumber.round(data?.notDelivered)}
        statContext={`${panelContext}-inactive`}
      />
      {/* Add more statistics here */}
    </>
  ) : null;
};

interface OrderingStatsProps {
  panelContext: string;
}

export const OrderingStats = ({ panelContext }: OrderingStatsProps) => {
  // determine both the widget and panel context to render the stat in the correct place
  // can be a plugin or core dashboard widget/panel
  if (panelContext !== 'replenishment-inbound-shipments') {
    return null;
  }

  return (
    <ThemeProviderProxy>
      <QueryClientProviderProxy>
        <StatisticsPanel panelContext={panelContext} />
      </QueryClientProviderProxy>
    </ThemeProviderProxy>
  );
};

export default OrderingStats;
