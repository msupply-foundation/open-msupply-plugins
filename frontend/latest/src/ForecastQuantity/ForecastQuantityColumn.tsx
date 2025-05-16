import React, { useEffect } from 'react';
import {
  ArrayElement,
  BasicCellLayout,
  CellProps,
  ColumnDefinition,
  create,
  PluginDataStore,
  Plugins,
  QueryClientProviderProxy,
} from '@openmsupply-client/common';
import { RequestLineFragment } from '@openmsupply-client/system';
import { usePluginData } from './api';

const useColumnStore = create<PluginDataStore<RequestLineFragment, string>>(
  (set, get) => ({
    data: [],
    set: data => set(state => ({ ...state, data })),
    getById: row =>
      get().data.find(({ relatedRecordId }) => relatedRecordId == row.id),
  })
);

type ForecastQuantityColumn = NonNullable<
  ArrayElement<Plugins['requestRequisitionLine']>
>;

export const StateLoader: ArrayElement<
  ForecastQuantityColumn['tableStateLoader']
> = props => {
  console.log('StateLoader', props);
  console.log(
    'IDs',
    props.requestLines.map(({ id }) => id)
  );
  const { set } = useColumnStore();
  const { data } = usePluginData.data(props.requestLines.map(({ id }) => id));

  useEffect(() => {
    if (!!data) {
      set(data);
    }
  }, [data]);

  console.log('data', data);

  return <></>;
};

const ForecastColumn = ({ rowData }: CellProps<RequestLineFragment>) => {
  const { getById } = useColumnStore();

  console.log('ForecastColumn', rowData);

  let value = '';

  try {
    const parsed = JSON.parse(getById(rowData)?.data || '{}');
    value = parsed?.forecastTotal
      ? String(Math.ceil(parsed?.forecastTotal))
      : '';
  } catch {}

  return <BasicCellLayout>{value}</BasicCellLayout>;
};

const Column = (props: CellProps<RequestLineFragment>) => (
  <QueryClientProviderProxy>
    <ForecastColumn {...props} />
  </QueryClientProviderProxy>
);

export const ForecastQuantityColumn: ColumnDefinition<RequestLineFragment> = {
  Cell: Column,
  key: 'forecast-quantity',
  label: 'Forecast',
  maxWidth: 150,
  sortable: false,
  order: 111,
};
