import {
  ArrayElement,
  Box,
  ColumnAlign,
  createTableStore,
  DataTable,
  noOtherVariants,
  Plugins,
  QueryClientProviderProxy,
  RecordWithId,
  TableProvider,
  ThemeProviderProxy,
  TooltipTextCell,
  useColumns,
  useFormatDateTime,
  usePluginGraphql,
} from '@openmsupply-client/common';
import { PluginGraphql } from '../../../../shared/types';
import { THIS_STORE } from '../../../../shared/constants';
import { name as pluginCode } from '../../package.json';
import React from 'react';
import { PackQuantityCell } from '@openmsupply-client/system';

type RequestLineEditInfo = ArrayElement<
  NonNullable<Plugins['requestRequisitionLine']>['editViewInfo']
>;

type Stat = ArrayElement<PluginGraphql['output']['result']>;

type ColumnData = Stat & RecordWithId;

const ItemInformationTable: RequestLineEditInfo = ({ line, requisition }) => {
  const { localisedDate } = useFormatDateTime();

  const { data } = usePluginGraphql<
    PluginGraphql['input'],
    PluginGraphql['output']
  >(line.id, pluginCode, {
    type: 'aggregateAmcInfo',
    itemIds: [line.itemId],
    periodId: requisition.period?.id || '',
    orderType: requisition.orderType || null,
  });

  const columns = useColumns<ColumnData>([
    {
      key: 'name',
      label: 'Structure',
      accessor: ({ rowData }) =>
        rowData.name === THIS_STORE ? 'This Store' : rowData.name,
      width: 240,
      Cell: TooltipTextCell,
    },
    {
      key: 'amc',
      label: 'label.amc',
      accessor: ({ rowData }) => rowData.stats.amc,
      width: 100,
      Cell: PackQuantityCell,
      align: ColumnAlign.Right,
    },
    {
      key: 'stock',
      label: 'Stock',
      accessor: ({ rowData }) => rowData.stats.stock || '',
      width: 100,
      Cell: TooltipTextCell,
      align: ColumnAlign.Right,
    },
    {
      key: 'date',
      label: 'Plage de dates',
      accessor: ({ rowData }) => {
        if (!rowData.stats.periodEndDate) return '';

        switch (rowData.stats.periodEndDate.type) {
          case 'PeriodEnd':
            return localisedDate(rowData.stats.periodEndDate.date);
          case 'Average':
            return 'Utilise la moyenne';
          default:
            noOtherVariants(rowData.stats.periodEndDate);
        }
      },
      width: 130,
      Cell: TooltipTextCell,
      align: ColumnAlign.Right,
    },
  ]);

  const tableData = (data?.result ?? []).map(row => ({ ...row, id: row.name }));

  return (
    <DataTable id="item-information" columns={columns} data={tableData} dense />
  );
};

export const ItemInformationView: RequestLineEditInfo = props => (
  <ThemeProviderProxy>
    <QueryClientProviderProxy>
      <Box
        width="100%"
        borderRadius={3}
        sx={{
          display: 'flex',
          flex: '1 1 0%',
          overflowY: 'auto',
        }}
      >
        <TableProvider createStore={createTableStore}>
          <ItemInformationTable {...props} />
        </TableProvider>
      </Box>
    </QueryClientProviderProxy>
  </ThemeProviderProxy>
);
