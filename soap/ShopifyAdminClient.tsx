import type { AdminApiContext } from "@shopify/shopify-app-remix/server";
import { authenticate } from "~/shopify.server";
import type {
  FulfillmentOrder,
  FulfillmentOrderEdge,
} from "~/types/admin.types";

export class ShopifyAdminClient {
  private admin: AdminApiContext;

  constructor(admin: AdminApiContext) {
    this.admin = admin;
  }

  async fetchAssignedRequests(): Promise<[FulfillmentOrderEdge]> {
    // If you don't include the `assignmentStatus` argument, then you receive all assigned fulfillment orders.

    const response = await this.admin.graphql(
      `#graphql
      query assignedFulfillmentOrders {
          assignedFulfillmentOrders(first: 10, assignmentStatus: FULFILLMENT_REQUESTED) {
            edges {
              node {
                id
                orderName
                destination {
                  firstName
                  lastName
                  address1
                  city
                  province
                  zip
                  countryCode
                  phone
                }
                lineItems(first: 10) {
                  edges {
                    node {
                      financialSummaries {
                          approximateDiscountedUnitPriceSet {
                              presentmentMoney { amount }
                          }
                          discountAllocations{
                              approximateAllocatedAmountPerItem{
                                  presentmentMoney { amount }}
                          }
                          originalUnitPriceSet{
                              presentmentMoney { amount }
                          }
                          quantity
                      }
                      id
                      productTitle
                      sku
                      remainingQuantity
                    }
                  }
                }
                order {
                  id
                  fullyPaid
                  customAttributes {
                    key
                    value
                  }
                  totalPriceSet {
                      presentmentMoney {
                          amount
                      }
                  }
                }
                merchantRequests(first: 10, kind: FULFILLMENT_REQUEST) {
                  edges {
                    node {
                      message
                    }
                  }
                }
              }
            }
          }
        }
      `,
    );

    // Destructure the response
    const body = await response.json();
    const { assignedFulfillmentOrders } = body.data;
    return assignedFulfillmentOrders.edges;
  }

  async fetchCancelRequests(): Promise<[FulfillmentOrderEdge]> {
    // If you don't include the `assignmentStatus` argument, then you receive all assigned fulfillment orders.
    const response = await this.admin.graphql(
      `#graphql
      query assignedFulfillmentOrders {
        assignedFulfillmentOrders(first: 10, assignmentStatus: CANCELLATION_REQUESTED) {
          edges {
              node {
                id
                orderName
                merchantRequests(first: 10, kind: CANCELLATION_REQUEST) {
                  edges {
                    node {
                      message
                    }
                  }
                }
              }
            }
          }
        }
      `,
    );

    // Destructure the response
    const body = await response.json();
    const { assignedFulfillmentOrders } = body.data;
    return assignedFulfillmentOrders.edges;
  }

  async createFulfillment(order: FulfillmentOrder, waybill: string) {
    const mutation = `#graphql
          mutation fulfillmentCreate($fulfillment: FulfillmentInput!) {
            fulfillmentCreate(fulfillment: $fulfillment) {
              fulfillment {
                id
                status
                trackingInfo {
                  company
                  number
                  url
                }
              }
              userErrors {
                field
                message
              }
            }
          }
        `;
    try {
      const lineItemsByFulfillmentOrder = [
        {
          fulfillmentOrderId: order.id,
          fulfillmentOrderLineItems: order.lineItems.edges.map((edge) => ({
            id: edge.node.id,
            quantity: edge.node.remainingQuantity,
          })),
        },
      ];

      const variables = {
        fulfillment: {
          notifyCustomer: true,
          trackingInfo: {
            company: "Нова Пошта",
            number: waybill,
            // numbers: [waybill],
            url: `https://novaposhta.ua/tracking/?cargo_number=${waybill}`,
            // urls: [`https://novaposhta.ua/tracking/?cargo_number=${waybill}`],
          },
          lineItemsByFulfillmentOrder,
        },
        // message: "<add message coming from Nova Poshta>",
      };
      const response = await this.admin.graphql(mutation, { variables });
      console.log("Fulfillment Create Response:", response);
    } catch (error) {
      console.error("Error creating fulfillment:", error);
    }
  }

  async acceptFulfillmentRequest(id: string) {
    const message = "OK";
    const response = await this.admin.graphql(
      `#graphql
      mutation fulfillmentOrderAcceptFulfillmentRequest($id: ID!, $message: String) {
        fulfillmentOrderAcceptFulfillmentRequest(id: $id, message: $message) {
          fulfillmentOrder {
            id
            status
            requestStatus
          }
          userErrors {
            field
            message
          }
        }
      }`,
      {
        variables: {
          id: id,
          message: message,
        },
      },
    );

    // Destructure the response
    const body = await response.json();
    return body.data?.fulfillmentOrderAcceptFulfillmentRequest?.fulfillmentOrder
      ?.requestStatus;
  }

  async acceptCancelation(id: any) {
    const response = await this.admin.graphql(
      `#graphql
      mutation fulfillmentOrderAcceptCancellationRequest($id: ID!, $message: String) {
        fulfillmentOrderAcceptCancellationRequest(id: $id, message: $message) {
          fulfillmentOrder {
            id
            status
            requestStatus
          }
          userErrors {
            field
            message
          }
        }
      }`,
      {
        variables: {
          id: id,
          message: "Fragile",
        },
      },
    );

    const data = await response.json();
    return data;
  }

  async rejectCancelation(id: string, message: string) {
    const response = await this.admin.graphql(
      `#graphql
  mutation fulfillmentOrderRejectCancellationRequest($id: ID!, $message: String) {
    fulfillmentOrderRejectCancellationRequest(id: $id, message: $message) {
      fulfillmentOrder {
        id
        status
        requestStatus
      }
      userErrors {
        field
        message
      }
    }
  }`,
      {
        variables: {
          id: id,
          message: message,
        },
      },
    );

    const data = await response.json();
    return data;
  }
}
