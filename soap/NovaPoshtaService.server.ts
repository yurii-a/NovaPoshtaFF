import * as soap from "soap";
import type {
  CreateOrdersResponse,
  FulfillOrdersResult,
  ICreateUpdateOrdersRequest,
  MessageOrder,
} from "soap/types";
import { getAuthToken, postProcessXml } from "./utils";
import { mapCreateOrdersRequest } from "./OrderMapper";
import type { FulfillmentOrder } from "~/types/admin.types";

async function createSoapClient() {
  const username = process.env.NP_USERNAME!;
  const password = process.env.NP_PASSWORD!;
  const url = process.env.SANDBOX_URL;
  const wsdlUrl = `${url}?wsdl`;

  const options: soap.IOptions = {
    wsdl_headers: {
      Authorization: getAuthToken(username, password),
    },
    wsdl_options: {
      rejectUnauthorized: false, // Only for testing purposes if SSL issues arise
    },
    endpoint: url,
  };

  const client = await soap.createClientAsync(wsdlUrl, options);
  // Set security options if needed
  client.setSecurity(new soap.BasicAuthSecurity(username, password));
  return client;
}

function renderError(error: String) {
  console.error(error);
  return Response.json({ errors: error }, { status: 500 });
}

export async function createOrders(orders: ICreateUpdateOrdersRequest) {
  try {
    const client = await createSoapClient();
    try {
      const [result] = (await client.CreateUpdateOrdersAsync(orders, {
        postProcess: (xml: string) => postProcessXml(xml),
      })) as [CreateOrdersResponse];

      const soapMessage = result.return.MessageOrdersER[0];
      return mapCreateOrdersResponseToShopify(soapMessage);
    } catch (err) {
      throw new Error("SOAP request error:" + err);
    }
  } catch (clientErr) {
    throw new Error("Error creating client:" + clientErr);
  }
}

export async function GetCurrentRemains(orders: ICreateUpdateOrdersRequest) {
  try {
    const client = await createSoapClient();
    try {
      const [result] = (await client.GetCurrentRemainsAsync(orders, {
        postProcess: (xml: string) => postProcessXml(xml),
      })) as [CreateOrdersResponse];

      const soapMessage = result.return.MessageOrdersER[0];
      return mapCreateOrdersResponseToShopify(soapMessage);
    } catch (err) {
      throw new Error("SOAP request error:" + err);
    }
  } catch (clientErr) {
    throw new Error("Error creating client:" + clientErr);
  }
}

function mapCreateOrdersResponseToShopify(
  message: MessageOrder,
): FulfillOrdersResult {
  // You can further process the responseMessage here
  if (message.Errors != null) {
    return {
      status: "FAILURE",
      waybill: null,
      orderNumber: message.ExternalNumber,
      errors: [message.Errors],
    };
  }

  console.log("Info:", message.ExternalNumber + message.Info.Descr.join(", "));
  return {
    status: "OK",
    waybill: message.WaybilNumber,
    orderNumber: message.ExternalNumber,
    errors: [],
  };
}

export async function fullfillWithNovaPoshta(order: FulfillmentOrder) {
  console.log("Map Shopify orders: " + JSON.stringify(order, null, 2));
  const ordersRequest = mapCreateOrdersRequest(order);
  return await createOrders(ordersRequest);
}
