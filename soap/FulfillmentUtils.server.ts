import type { AdminApiContext } from "@shopify/shopify-app-remix/server";
import { fullfillWithNovaPoshta } from "./NovaPoshtaService.server";
import type { FulfillmentOrder } from "~/types/admin.types";

export async function processAssignedRequests(admin: AdminApiContext) {
  const assignedRequests = await fetchAssignedRequests(admin);
  assignedRequests.forEach(assignedRequest => {
    const fulfillmentOrder = assignedRequest.node;
    fulfill(admin, fulfillmentOrder);
  });
}

async function fetchAssignedRequests(admin: AdminApiContext) : Promise<[FulfillmentOrderEdge]> {
  // If you don't include the `assignmentStatus` argument, then you receive all assigned fulfillment orders.

  const response = await admin.graphql(
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

// async function logFulfillmentOrder(admin: AdminApiContext, fulfillmentOrder: FulfillmentOrderEdge) {
//   // Log the structured data
//       console.log("Fulfillment Order Node:", fulfillmentOrder.node);

//       const requestStatus = await acceptFulfillmentRequest(admin, fulfillmentOrder.node.id);
//       if(requestStatus === "ACCEPTED") {
//         const orderResponse = fullfillWithNovaPoshta(fulfillmentOrder.node);
//         console.log(orderResponse);
//       }

//       // Expand and log destination
//       if (fulfillmentOrder.node.destination) {
//         console.log("Destination:", fulfillmentOrder.node.destination);
//       }

//       // Expand and log line items
//       if (fulfillmentOrder.node.lineItems && fulfillmentOrder.node.lineItems.edges) {
//         fulfillmentOrder.node.lineItems.edges.forEach((lineItemEdge) => {
//           console.log("Line Item Node:", lineItemEdge.node);
//         });
//       }

//       if (fulfillmentOrder.node.order.customAttributes)  {
//         fulfillmentOrder.node.order.customAttributes.forEach(element => {
//           console.log("Attributes for order %{edge.node.id}: $" );
//         });
//       }
// }

async function fulfill(admin: AdminApiContext, fulfillmentOrder: FulfillmentOrder) {
  // Create a fulfillment request to Nova Poshta SOAP
  // If Nova Poshta accepts the request, then mark the fulfillment as accepted or rejected otherwise
  try {
    const fulfillResponse = await fullfillWithNovaPoshta(fulfillmentOrder);
    console.log(fulfillResponse);

    if(fulfillResponse.status=="success") {
        const acceptFulfillmentResponse = await acceptFulfillmentRequest(admin, fulfillmentOrder.id);
        //       if(requestStatus === "ACCEPTED") {
        //         const orderResponse = fullfillWithNovaPoshta(fulfillmentOrder.node);
        //         console.log(orderResponse);
        //       }
        createFulfillment(admin,fulfillmentOrder.id, fulfillResponse.waybill);
    }
    // const acceptFulfillmentResponse = await acceptFulfillmentRequest(admin, fulfillmentOrder.id);
//       if(requestStatus === "ACCEPTED") {
//         const orderResponse = fullfillWithNovaPoshta(fulfillmentOrder.node);
//         console.log(orderResponse);
//       }

  } catch(error) {
    console.error("Failed to fulfill " + fulfillmentOrder.orderName + ": " + error);
  }
}


async function acceptFulfillmentRequest(admin: AdminApiContext, id: string){
  const message = 'OK';
  const response = await admin.graphql(
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
        "id": id,
        "message": message,
      },
    },
  );

    // Destructure the response
    const body = await response.json();
    return body.data?.fulfillmentOrderAcceptFulfillmentRequest?.fulfillmentOrder?.requestStatus;
}

async function createFulfillment(admin: AdminApiContext, id: string, waybill: string) {
    const message = "OK!"
    const response = await admin.graphql(
        `#graphq
        mutation fulfillmentCreateV2($id: ID!, $waybill: String) {
            fulfillmentCreateV2(fulfillment: {
              notifyCustomer: true,
              trackingInfo: {
                company: "Нова Пошта",
                number: waybill,
                url: "https://novaposhta.ua/tracking/?cargo_number=" + waybill
              },
              # The `fulfillmentCreateV2` mutation accepts an array of `FulfillmentOrderLineItemsInputs`, which lets apps create a single fulfillment with one or many fulfillment orders.
              # All of the fulfillment orders need to be on the same order, and assigned to the same location.
              lineItemsByFulfillmentOrder: [
                {
                  fulfillmentOrderId: "gid://shopify/FulfillmentOrder/5018595819542",
                  # The array of `lineItemsByFulfillmentOrder.fulfillmentOrderLineItems` lets apps partially fulfill fulfillment orders.
                  # If no individual `lineItemsByFulfillmentOrder.fulfillmentOrderLineItems` are provided, then the app creates a fulfillment for all remaining line items.
                #   fulfillmentOrderLineItems: [
                #     {
                #       id: "gid://shopify/FulfillmentOrderLineItem/10926793228310",
                #       quantity: 3
                #     }
                #   ]
                }
              ]
            }) {
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
          }`,
        {
          variables: {
            "id": id,
            "waybill": waybill,
          },
        },
    });
    
        // Destructure the response
        const body = await response.json();
        return body.data?.fulfillmentOrderAcceptFulfillmentRequest?.fulfillmentOrder?.requestStatus;
    }



// Handle cancellation request
// async function processCancellationRequest(requestBody) {
//   // Logic for handling cancellation
//   console.log("Cancellation request:", requestBody);
//   return json({ message: "Cancellation request processed" }, { status: 200 });
// }

// Optional loader function for GET requests
export const loader = async () => {
  return Response.json({
    message:
      "This endpoint handles POST requests for fulfillment and cancellations.",
  });
};

function notifyFulfillmentError() {
  throw new Error("Function not implemented.");
}
function markFulfilmentAccepted() {
  console.log("Fulfillment has been accepted and marked as such.");
}

