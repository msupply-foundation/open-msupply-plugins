import { UpdatePluginDataInput } from '@common/types';
import { getSdk } from './operations.generated';
import { FnUtils } from '@common/utils';
import { PLUGIN_CODE, PRESCRIPTION_PAYMENT_IDENTIFIER } from './hooks';

export type Sdk = ReturnType<typeof getSdk>;

export type PluginData = { id?: string; data: string; invoice_id: string };

const pluginParsers = {
  toUpdate: (input: PluginData): UpdatePluginDataInput => ({
    id: input.id ?? '',
    data: input.data,
    pluginCode: PLUGIN_CODE,
    relatedRecordId: input.invoice_id,
    dataIdentifier: PRESCRIPTION_PAYMENT_IDENTIFIER,
  }),
};

export const getPluginQueries = (sdk: Sdk, storeId: string) => ({
  get: {
    pluginData: async (invoiceId: string) => {
      const result = await sdk.pluginData({
        storeId,
        invoiceId,
        pluginCode: PLUGIN_CODE,
        dataId: PRESCRIPTION_PAYMENT_IDENTIFIER,
      });

      const { pluginData } = result;

      if (pluginData?.__typename === 'PluginDataConnector') {
        return pluginData.nodes;
      }
      return undefined;
    },
  },
  update: async (input: PluginData) => {
    const result =
      (await sdk.updatePluginData({
        storeId,
        input: pluginParsers.toUpdate(input),
      })) || {};

    const { updatePluginData } = result;

    if (updatePluginData?.__typename === 'PluginDataNode') {
      return input;
    }

    throw new Error('Unable to update plugin data');
  },
  insert: async (input: PluginData) => {
    const result = await sdk.insertPluginData({
      storeId,
      input: {
        data: input.data,
        id: FnUtils.generateUUID(),
        pluginCode: PLUGIN_CODE,
        relatedRecordId: input.invoice_id,
        dataIdentifier: PRESCRIPTION_PAYMENT_IDENTIFIER,
      },
    });

    const { insertPluginData } = result;

    if (insertPluginData?.__typename === 'PluginDataNode') {
      return input;
    }

    throw new Error('Unable to insert plugin data');
  },
});
