import React from 'react';
import {
  QueryClientProviderProxy,
  Statistic,
  ThemeProviderProxy,
  useFormatNumber,
  useTranslation,
} from '@openmsupply-client/common';
import { useDashboard } from './api';

const StatisticsPanel = () => {
  const t = useTranslation('dashboard');
  const formatNumber = useFormatNumber();

  const { data, isLoading, isError } = useDashboard.statistics.inbound();

  return !isLoading && !isError ? (
    <>
      <Statistic
        label={t('label.today', { ns: 'dashboard' })}
        value={formatNumber.round(data?.today)}
      />
      {/* Add more statistics here */}
    </>
  ) : null;
};

const OrderingStats: React.FC<{
  widgetContext: string;
  panelContext: string;
}> = ({ widgetContext, panelContext }) => {
  // determine both the widget and panel context to render the stat in the correct place
  // can be a plugin or core dashboard widget/panel
  if (panelContext !== 'ordering' || widgetContext !== 'replenishment') {
    return null;
  }

  return (
    <ThemeProviderProxy>
      <QueryClientProviderProxy>
        <StatisticsPanel />
      </QueryClientProviderProxy>
    </ThemeProviderProxy>
  );
};

export default OrderingStats;
