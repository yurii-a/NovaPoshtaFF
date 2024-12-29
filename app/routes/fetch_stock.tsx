import { json, type ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { FulfillmentBroker } from "soap/FulfillmentBroker.server";
import { ShopifyAdminClient } from "soap/ShopifyAdminClient";
import { SoapService } from "soap/NovaPoshtaSoapService.server";

export async function action({ request }: ActionFunctionArgs) {
  const { admin, payload } = await authenticate.fulfillmentService(request);
  const adminClient = new ShopifyAdminClient(admin);
  const soapService = new SoapService();
  const broker = new FulfillmentBroker(
    adminClient,
    soapService,
    process.env.NP_ORGANIZATION!,
  );

  const stockResult = await broker.fetchStock();

  return json(stockResult, { status: 200 });
}
