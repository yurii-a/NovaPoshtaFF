import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import type { AdminApiContext } from "node_modules/@shopify/shopify-app-remix/dist/ts/server/clients";
import { fullfill } from "soap/NovaPoshtaService";

export async function action({
  request,
}: ActionFunctionArgs) {
  const {admin, payload } = await authenticate.fulfillmentService(request);
  const kind = payload.kind;
  console.log('Received ' + kind +' request!');

  // Step 3: Process the request based on the 'kind'
  if (kind === "FULFILLMENT_REQUEST") {
    await fetchAssignedRequests(admin);
  } else if (kind === "CANCELLATION_REQUEST") {
    // await submitCancellationRequest();
  } else {
    console.log('Received unknown kind of fullfilment!' + kind);
  }
  return json({ message: "Unknown request kind" }, { status: 200 });
}

async function fetchAssignedRequests(admin: AdminApiContext) {
  // If you don't include the `assignmentStatus` argument, then you receive all assigned fulfillment orders.

  const response = await admin.graphql(
    `#graphql
    query assignedFulfillmentOrders {
        assignedFulfillmentOrders(first: 10, assignmentStatus: FULFILLMENT_REQUESTED) {
          edges {
            node {
              id
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
                    id
                    productTitle
                    sku
                    remainingQuantity
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
    }`,
  );
  // Destructure the response
  const body = await response.json();
  const { assignedFulfillmentOrders } = body.data;

  // Log the structured data
  console.log("Assigned Fulfillment Orders:", assignedFulfillmentOrders.edges);
  assignedFulfillmentOrders.edges.forEach(
    async (edge: { node: { id: any; destination: any; lineItems: { edges: any[] } } }) => {
      console.log("Fulfillment Order Node:", edge.node);

      const requestStatus = await acceptFulfillmentRequest(admin, edge.node.id);
      if(requestStatus === "ACCEPTED") {
        const orderResponse = fullfill(edge.node);
        console.log(orderResponse);
      }

      // Expand and log destination
      if (edge.node.destination) {
        console.log("Destination:", edge.node.destination);
      }

      // Expand and log line items
      if (edge.node.lineItems && edge.node.lineItems.edges) {
        edge.node.lineItems.edges.forEach((lineItemEdge) => {
          console.log("Line Item Node:", lineItemEdge.node);
        });
      }
    },
  );
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
        "message": message
      },
    },
  );

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
  return json({
    message:
      "This endpoint handles POST requests for fulfillment and cancellations.",
  });
};
