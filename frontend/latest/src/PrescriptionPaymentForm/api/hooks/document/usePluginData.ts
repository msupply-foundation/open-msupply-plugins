import { useQuery } from '@openmsupply-client/common';
import { usePluginApi } from '../utils/usePluginApi';

export const usePluginData = (invoiceId: string) => {
  const api = usePluginApi();

  return useQuery(
    api.keys.data(invoiceId),
    async () => api.get.pluginData(invoiceId),
    {
      retry: false,
      onError: () => {},
    }
  );
};
