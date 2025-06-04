// To upload to server (after adding submodule to openmsupply repo locally)
// cargo run --bin remote_server_cli -- generate-and-install-plugin-bundle -i '../client/packages/plugins/{plugin name}/backend' -u 'http://localhost:8000' --username 'test' --password 'pass'

import { BackendPlugins } from '@common/types';
import { ProcessorInput } from '@common/generated/ProcessorInput';
import { ChangelogFilter } from '@common/generated/ChangelogFilter';
import { toNaiveDateTime } from '@common/utils';
import {
  ItemsQueryVariables,
  ItemsQuery,
  CreatePrescriptionMutation,
  CreatePrescriptionMutationVariables,
} from './generated-types/graphql';
import itemsQueryText from './items.graphql';
import createPrescriptionText from './createPrescription.graphql';
import { uuidv7 } from 'uuidv7';
import { SyncMessageRow } from '@common/generated/SyncMessageRow';

const MESSAGE_TYPE = 'createPrescription';
const ERROR_MESSAGE_TYPE = 'createPrescriptionError';

type CreatePrescriptionBody = {
  itemId: string;
  patientId: string;
};

const itemsQuery = (variables: ItemsQueryVariables): ItemsQuery => {
  return use_graphql({ query: itemsQueryText, variables }) as ItemsQuery;
};

const createPrescription = (
  variables: CreatePrescriptionMutationVariables
): CreatePrescriptionMutation => {
  return use_graphql({
    query: createPrescriptionText,
    variables,
  }) as CreatePrescriptionMutation;
};

const process = ({
  record_id,
}: Extract<ProcessorInput, { t: 'Process' }>['v']) => {
  const messageResult = use_repository({
    t: 'GetSyncMessageById',
    v: record_id,
  });

  log({ t: 'Message', messageResult });

  if (messageResult.t !== 'GetSyncMessageById') {
    throw new Error('Failed to get message');
  }

  const message = messageResult.v;

  if (message?.type !== MESSAGE_TYPE || message?.status !== 'New') {
    log({ t: 'Skipping message', message });
    return 'Skipping message';
  }

  if (!message.to_store_id) {
    log({ t: 'No store ID found in message', message });
    return 'No store ID found in message';
  }

  // In real case should check that store is is active on site

  const { itemId, patientId } = JSON.parse(
    message.body
  ) as CreatePrescriptionBody;

  log({ t: 'callingGraphql' });
  const itemQueryResult = itemsQuery({ storeId: message.to_store_id, itemId });
  log({ itemQueryResult });

  const batch = itemQueryResult.items.nodes[0]?.availableBatches.nodes.find(
    b => b.availableNumberOfPacks > 0
  );

  if (!batch) {
    log({ t: 'No batch with available quantity found' });

    errorMessage(
      message,
      'No stock with available quantity found',
      message.to_store_id
    );

    return 'No batch with available quantity found';
  }

  const input = {
    storeId: message.to_store_id,
    prescriptionId: uuidv7(),
    patientId,
    stockLineId: batch.id,
    prescriptionLineId: uuidv7(),
  };

  log({ t: 'Input compiled' });

  const createPrescriptionResult = createPrescription(input);

  log({ t: 'Prescription called' });

  if (
    createPrescriptionResult.batchPrescription.insertPrescriptions?.[0].response
      .__typename === 'InvoiceNode' &&
    createPrescriptionResult.batchPrescription.insertPrescriptionLines?.[0]
      .response.__typename === 'InvoiceLineNode'
  ) {
    log({ t: 'Prescription created', createPrescriptionResult });
    use_repository({
      t: 'UpsertSyncMessage',
      v: { ...message, status: 'Processed' },
    });
    return 'success';
  }

  log({ t: 'Failed to create prescription', createPrescriptionResult });

  errorMessage(message, 'Failed to create prescription', message.to_store_id);

  return 'Failed to create prescription';
};

const errorMessage = (
  currentMessage: SyncMessageRow,
  error: string,
  from_store_id: string
) => {
  use_repository({
    t: 'UpsertSyncMessage',
    v: { ...currentMessage, status: 'Processed' },
  });
  use_repository({
    t: 'UpsertSyncMessage',
    v: {
      id: uuidv7(),
      type: ERROR_MESSAGE_TYPE,
      status: 'New',
      body: JSON.stringify({ error }),
      created_datetime: toNaiveDateTime(new Date()),
      from_store_id,
      to_store_id: null,
      error_message: 'Failed to create prescription',
    },
  });
};

type Graphql = {
  input: { type: 'echo'; echo: string } | { type: 'doubleEcho'; echo: string };
  output: { type: 'echo'; echo: string } | { type: 'doubleEcho'; echo: string };
};

const plugins: BackendPlugins = {
  processor: input => {
    switch (input.t) {
      case 'Filter': {
        const filter: ChangelogFilter = {
          table_name: { equal_to: 'SyncMessage' },
          // Only process messages that have just arrived via sync to avoid
          // infinite processing since message will be updated
          is_sync_update: { equal_to: true },
        };
        return { t: 'Filter', v: filter };
      }
      case 'SkipOnError': {
        return { t: 'SkipOnError', v: true };
      }
      case 'Process': {
        log({ t: 'Processing', changeLog: input.v });

        return { t: 'Process', v: process(input.v) };
      }

      default:
        assertUnreachable(input);
    }
  },
  graphql_query: ({ store_id, input: inputUntyped }): Graphql['output'] => {
    const input = inputUntyped as Graphql['input'];

    switch (input.type) {
      case 'echo':
        return { type: 'echo', echo: input.echo };
      case 'doubleEcho':
        use_graphql({
          query: `
            query MyQuery($input: JSON = "", $pluginCode: String = "", $storeId: String = "") {
              pluginGraphqlQuery(input: $input, pluginCode: $pluginCode, storeId: $storeId)
            }
        `,
          variables: {
            storeId: store_id,
            input: { type: 'echo', echo: 'yow' },
            pluginCode: 'plugin_examples',
          },
        });
        return {
          type: 'doubleEcho',
          echo: input.echo,
        };
    }
  },
};

function assertUnreachable(_: never): never {
  throw new Error("Didn't expect to get here");
}

export { plugins };
