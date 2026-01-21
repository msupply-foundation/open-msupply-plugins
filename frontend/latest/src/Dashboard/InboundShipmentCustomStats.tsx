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

export const Component = ({ panelContext }: { panelContext: string }) => {
  // Only render in the replenishment widget + inbound shipments panel
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

// Optional: Static property defines the core statistics to hide when this plugin is active
// Will only hide stats in the defined widget and panel context
export const hiddenStats = [
  'replenishment-inbound-shipments-today',
  'replenishment-inbound-shipments-this-week',
];
