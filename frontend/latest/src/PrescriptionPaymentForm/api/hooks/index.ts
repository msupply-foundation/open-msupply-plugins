import { Utils } from './utils';
import { Document } from './document';

export const PLUGIN_CODE = 'civ-plugin';
export const PRESCRIPTION_PAYMENT_IDENTIFIER = 'prescription-payment';

export const usePluginData = {
  api: Utils.usePluginApi,
  data: Document.usePluginData,
  insert: Document.useInsertPluginData,
  update: Document.useUpdatePluginData,
};
