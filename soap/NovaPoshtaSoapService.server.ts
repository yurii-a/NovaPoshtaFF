import * as soap from "soap";
import {
  type CreateOrdersResponse as CreateUpdateOrdersResponse,
  type FulfillOrdersResult as UpdateOrdersResult,
  type ICreateUpdateOrdersRequest,
  type IGetCurrentRemainsRequest,
  type IUndoOrderRequest,
  type MessageOrder,
  ResponseStatus,
} from "soap/types";
import { getAuthToken, postProcessXml } from "./utils";
import { mapCreateOrdersRequest } from "./OrderMapper";
import type { FulfillmentOrder } from "~/types/admin.types";
import { json } from "@remix-run/node";

let soapClient: any | null = null; // Cache the client instance

async function getSoapClient(): Promise<any> {
  if (!soapClient) {
    soapClient = await createSoapClient(); // Create the client only if it doesn't exist
  }
  return soapClient;
}

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
  return json({ errors: error }, { status: 500 });
}

export async function createOrders(orders: ICreateUpdateOrdersRequest): Promise<UpdateOrdersResult> {
  try {
    const client = await getSoapClient();
    try {
      const [result] = (await client.CreateUpdateOrdersAsync(orders, {
        postProcess: (xml: string) => postProcessXml(xml),
      })) as [CreateUpdateOrdersResponse];

      const soapMessage = result.return.MessageOrdersER[0];
      return mapCreateOrdersResponseToShopify(soapMessage);
    } catch (err) {
      throw new Error("SOAP request error:" + err);
    }
  } catch (clientErr) {
    throw new Error("Error creating client:" + clientErr);
  }
}

export async function cancelOrders(body: IUndoOrderRequest): Promise<UpdateOrdersResult> {
  try {
    const client = await getSoapClient();
    try {
      const [result] = (await client.CreateUpdateOrdersAsync(body, {
        postProcess: (xml: string) => postProcessXml(xml),
      })) as [CreateUpdateOrdersResponse];

      const soapMessage = result.return.MessageOrdersER[0];
      return mapCreateOrdersResponseToShopify(soapMessage);
    } catch (err) {
      throw new Error("SOAP request error:" + err);
    }
  } catch (clientErr) {
    throw new Error("Error creating client:" + clientErr);
  }
}

export async function getCurrentRemains(orders: IGetCurrentRemainsRequest) {
  try {
    const client = await createSoapClient();
    try {
      const [result] = (await client.GetCurrentRemainsAsync(orders, {
        postProcess: (xml: string) => postProcessXml(xml),
      })) as [CreateUpdateOrdersResponse];

      const soapMessage = result.return.MessageOrdersER[0];
      return mapCreateOrdersResponseToShopify(soapMessage);
    } catch (err) {
      throw new Error("SOAP error:" + err);
    }
  } catch (clientErr) {
    throw new Error("SOAP client error:" + clientErr);
  }
}

function mapCreateOrdersResponseToShopify(
  message: MessageOrder,
): UpdateOrdersResult {
  // You can further process the responseMessage here
  if (message.Errors != null) {
    return {
      status: ResponseStatus.FAILURE,
      waybill: null,
      orderNumber: message.ExternalNumber,
      errors: [JSON.stringify(message.Errors)],
    };
  }

  console.log("Info:", message.ExternalNumber + message.Info.Descr.join(", "));
  return {
    status: ResponseStatus.OK,
    waybill: message.WaybilNumber,
    orderNumber: message.ExternalNumber,
    errors: [],
  };
}

export async function fullfillWithNovaPoshta(order: FulfillmentOrder) {
  // console.log("Map Shopify orders: " + JSON.stringify(order, null, 2));
  const ordersRequest = mapCreateOrdersRequest(order);
  return await createOrders(ordersRequest);
}
