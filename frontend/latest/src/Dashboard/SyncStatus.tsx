import React from 'react';
import {
  QueryClientProviderProxy,
  ThemeProviderProxy,
} from '@openmsupply-client/common';
import SyncStatusWidget from './SyncStatusWidget';

export interface SyncWidgetProps {
  widgetContext: string;
}

export const Component = () => {
  return (
    <ThemeProviderProxy>
      <QueryClientProviderProxy>
        <SyncStatusWidget />
      </QueryClientProviderProxy>
    </ThemeProviderProxy>
  );
};

// Optional: Static property defines the core widgets to hide when this plugin is active
export const hiddenWidgets = ['stock'];
