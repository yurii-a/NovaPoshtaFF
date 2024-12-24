import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { processAssignedRequests } from "soap/FulfillmentUtils.server";

export async function action({request,}: ActionFunctionArgs) {
  const {admin, payload } = await authenticate.fulfillmentService(request);
  const kind = payload.kind;
  console.log('Received ' + kind +' request!');

  // Step 3: Process the request based on the 'kind'
  if (kind === "FULFILLMENT_REQUEST") {
    await processAssignedRequests(admin);
  } else if (kind === "CANCELLATION_REQUEST") {
    // await submitCancellationRequest();
  } else {
    console.log('Received unknown kind of fullfilment!' + kind);
  }
  return Response.json({ message: "Unknown request kind" }, { status: 200 });
 }

// async function processAssignedRequests(admin: AdminApiContext) {
//   const assignedRequests = await fetchAssignedRequests(admin);
//   assignedRequests.forEach(assignedRequest => {
//     const fulfillmentOrder = assignedRequest.node;
//     fulfill(admin, fulfillmentOrder);
//   });
// }

// async function fetchAssignedRequests(admin: AdminApiContext) : Promise<[FulfillmentOrderEdge]> {
//   // If you don't include the `assignmentStatus` argument, then you receive all assigned fulfillment orders.

//   const response = await admin.graphql(
//     `#graphql
//     query assignedFulfillmentOrders {
//         assignedFulfillmentOrders(first: 10, assignmentStatus: FULFILLMENT_REQUESTED) {
//           edges {
//             node {
//               id
//               destination {
//                 firstName
//                 lastName
//                 address1
//                 city
//                 province
//                 zip
//                 countryCode
//                 phone
//               }
//               lineItems(first: 10) {
//                 edges {
//                   node {
//                     id
//                     productTitle
//                     sku
//                     remainingQuantity
//                   }
//                 }
//               }
//               order {
//                 customAttributes {
//                   key
//                   value
//                 }
//               }
//               merchantRequests(first: 10, kind: FULFILLMENT_REQUEST) {
//                 edges {
//                   node {
//                     message
//                   }
//                 }
//               }
//             }
//           }
//         }
//       }
//     `,
//   );
  
//   // Destructure the response
//   const body = await response.json();
//   const { assignedFulfillmentOrders } = body.data;
//   return assignedFulfillmentOrders.edges;
// }

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

// async function fulfill(admin: AdminApiContext, fulfillmentOrder: FulfillmentOrder) {
//   // Create a fulfillment request to Nova Poshta SOAP
//   // If Nova Poshta accepts the request, then mark the fulfillment as accepted or rejected otherwise
//   const response = await fullfillWithNovaPoshta(fulfillmentOrder);

//   console.log(response.json());

// }


// async function acceptFulfillmentRequest(admin: AdminApiContext, id: string){
//   const message = 'OK';
//   const response = await admin.graphql(
//     `#graphql
//     mutation fulfillmentOrderAcceptFulfillmentRequest($id: ID!, $message: String) {
//       fulfillmentOrderAcceptFulfillmentRequest(id: $id, message: $message) {
//         fulfillmentOrder {
//           id
//           status
//           requestStatus

//         }
//         userErrors {
//           field
//           message
//         }
//       }
//     }`,
//     {
//       variables: {
//         "id": id,
//         "message": message
//       },
//     },
//   );

//     // Destructure the response
//     const body = await response.json();
//     return body.data?.fulfillmentOrderAcceptFulfillmentRequest?.fulfillmentOrder?.requestStatus;
// }


// // Handle cancellation request
// // async function processCancellationRequest(requestBody) {
// //   // Logic for handling cancellation
// //   console.log("Cancellation request:", requestBody);
// //   return json({ message: "Cancellation request processed" }, { status: 200 });
// // }

// Optional loader function for GET requests
export const loader = async () => {
  return json({
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

