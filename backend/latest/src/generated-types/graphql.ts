import * as Types from '../../codegenTypes';

export type CreatePrescriptionMutationVariables = Types.Exact<{
  storeId: Types.Scalars['String']['input'];
  prescriptionId: Types.Scalars['String']['input'];
  patientId: Types.Scalars['String']['input'];
  stockLineId: Types.Scalars['String']['input'];
  prescriptionLineId: Types.Scalars['String']['input'];
}>;


export type CreatePrescriptionMutation = {
  __typename?: 'Mutations',
  batchPrescription: {
    __typename?: 'BatchPrescriptionResponse',
    insertPrescriptions?: Array<{
      __typename?: 'InsertPrescriptionResponseWithId',
      id: string,
      response: {
        __typename: 'InvoiceNode',
        id: string
      }
    }> | null,
    insertPrescriptionLines?: Array<{
      __typename?: 'InsertPrescriptionLineResponseWithId',
      response: {
        __typename: 'InsertPrescriptionLineError'
      } | {
        __typename: 'InvoiceLineNode',
        id: string
      }
    }> | null
  }
};

export type ItemsQueryVariables = Types.Exact<{
  storeId: Types.Scalars['String']['input'];
  itemId: Types.Scalars['String']['input'];
}>;


export type ItemsQuery = {
  __typename?: 'Queries',
  items: {
    __typename?: 'ItemConnector',
    nodes: Array<{
      __typename?: 'ItemNode',
      availableBatches: {
        __typename?: 'StockLineConnector',
        nodes: Array<{
          __typename?: 'StockLineNode',
          availableNumberOfPacks: number,
          batch?: string | null,
          id: string
        }>
      }
    }>
  }
};
