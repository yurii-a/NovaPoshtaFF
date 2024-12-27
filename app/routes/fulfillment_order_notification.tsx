import { json, type ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { FulfillmentBroker } from "soap/FulfillmentBroker.server";
import { ShopifyAdminClient } from "soap/ShopifyAdminClient";

export async function action({request,}: ActionFunctionArgs) {
  const {admin, payload } = await authenticate.fulfillmentService(request);
  const adminClient = new ShopifyAdminClient(admin);
  const broker = new FulfillmentBroker(adminClient, process.env.NP_ORGANIZATION!);
  const kind = payload.kind;
  console.log('Received ' + kind +' request!');

  if (kind === "FULFILLMENT_REQUEST") {
    broker.processAssignedRequests();
  } else if (kind === "CANCELLATION_REQUEST") {
    broker.processCancelationRequests()
  } else {
    console.log('Received unknown kind of fullfilment!' + kind);
  }
  return json({ message: "Unknown request kind" }, { status: 200 });
 }

// Optional loader function for GET requests
export const loader = async () => {
  return json({
    message:
      "This endpoint handles POST requests for fulfillment and cancellations.",
  });
};


