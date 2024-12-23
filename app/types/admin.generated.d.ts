/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable eslint-comments/no-unlimited-disable */
/* eslint-disable */
import type * as AdminTypes from './admin.types';

export type FulfillmentServiceCreateMutationVariables = AdminTypes.Exact<{
  name: AdminTypes.Scalars['String']['input'];
  callbackUrl: AdminTypes.Scalars['URL']['input'];
}>;


export type FulfillmentServiceCreateMutation = { fulfillmentServiceCreate?: AdminTypes.Maybe<{ fulfillmentService?: AdminTypes.Maybe<Pick<AdminTypes.FulfillmentService, 'id' | 'serviceName' | 'callbackUrl'>>, userErrors: Array<Pick<AdminTypes.UserError, 'field' | 'message'>> }> };

export type AssignedFulfillmentOrdersQueryVariables = AdminTypes.Exact<{ [key: string]: never; }>;


export type AssignedFulfillmentOrdersQuery = { assignedFulfillmentOrders: { edges: Array<{ node: (
        Pick<AdminTypes.FulfillmentOrder, 'id'>
        & { destination?: AdminTypes.Maybe<Pick<AdminTypes.FulfillmentOrderDestination, 'firstName' | 'lastName' | 'address1' | 'city' | 'province' | 'zip' | 'countryCode' | 'phone'>>, lineItems: { edges: Array<{ node: Pick<AdminTypes.FulfillmentOrderLineItem, 'id' | 'productTitle' | 'sku' | 'remainingQuantity'> }> }, order: { customAttributes: Array<Pick<AdminTypes.Attribute, 'key' | 'value'>> }, merchantRequests: { edges: Array<{ node: Pick<AdminTypes.FulfillmentOrderMerchantRequest, 'message'> }> } }
      ) }> } };

export type FulfillmentOrderAcceptFulfillmentRequestMutationVariables = AdminTypes.Exact<{
  id: AdminTypes.Scalars['ID']['input'];
  message?: AdminTypes.InputMaybe<AdminTypes.Scalars['String']['input']>;
}>;


export type FulfillmentOrderAcceptFulfillmentRequestMutation = { fulfillmentOrderAcceptFulfillmentRequest?: AdminTypes.Maybe<{ fulfillmentOrder?: AdminTypes.Maybe<Pick<AdminTypes.FulfillmentOrder, 'id' | 'status' | 'requestStatus'>>, userErrors: Array<Pick<AdminTypes.UserError, 'field' | 'message'>> }> };

interface GeneratedQueryTypes {
  "#graphql\n    query assignedFulfillmentOrders {\n        assignedFulfillmentOrders(first: 10, assignmentStatus: FULFILLMENT_REQUESTED) {\n          edges {\n            node {\n              id\n              destination {\n                firstName\n                lastName\n                address1\n                city\n                province\n                zip\n                countryCode\n                phone\n              }\n              lineItems(first: 10) {\n                edges {\n                  node {\n                    id\n                    productTitle\n                    sku\n                    remainingQuantity\n                  }\n                }\n              }\n              order {\n                customAttributes {\n                  key\n                  value\n                }\n              }\n              merchantRequests(first: 10, kind: FULFILLMENT_REQUEST) {\n                edges {\n                  node {\n                    message\n                  }\n                }\n              }\n            }\n          }\n        }\n      }\n    ": {return: AssignedFulfillmentOrdersQuery, variables: AssignedFulfillmentOrdersQueryVariables},
}

interface GeneratedMutationTypes {
  "#graphql \n    mutation fulfillmentServiceCreate($name: String!, $callbackUrl: URL!) {\n      fulfillmentServiceCreate(name: $name, callbackUrl: $callbackUrl) {\n        fulfillmentService {\n          id\n          serviceName\n          callbackUrl\n        }\n        userErrors {\n          field\n          message\n        }\n      }\n    }": {return: FulfillmentServiceCreateMutation, variables: FulfillmentServiceCreateMutationVariables},
  "#graphql\n    mutation fulfillmentOrderAcceptFulfillmentRequest($id: ID!, $message: String) {\n      fulfillmentOrderAcceptFulfillmentRequest(id: $id, message: $message) {\n        fulfillmentOrder {\n          id\n          status\n          requestStatus\n\n        }\n        userErrors {\n          field\n          message\n        }\n      }\n    }": {return: FulfillmentOrderAcceptFulfillmentRequestMutation, variables: FulfillmentOrderAcceptFulfillmentRequestMutationVariables},
}
declare module '@shopify/admin-api-client' {
  type InputMaybe<T> = AdminTypes.InputMaybe<T>;
  interface AdminQueries extends GeneratedQueryTypes {}
  interface AdminMutations extends GeneratedMutationTypes {}
}
