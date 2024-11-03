import * as soap from "soap";
import type {
  CreateOrdersResponse,
} from "soap/types";
import { json } from "@remix-run/node";
import { getAuthToken, postProcessXml } from "./utils";
import { mapCreateOrdersRequest } from "./OrderMapper";


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
    return json({ errors: error }, {status:  500});
  }
  
export async function createOrders(orders: any) {
    try {
      const client = await createSoapClient();
      try {
        const [result] = (await client.CreateUpdateOrdersAsync(
          orders,
          {
            postProcess: (xml: string) => postProcessXml(xml),
          },
        )) as [CreateOrdersResponse];
  
        const responseMessage = result.return.MessageOrdersER[0];
        // You can further process the responseMessage here
        if (responseMessage.Errors === null) {
          console.log("Info:", responseMessage.ExternalNumber + responseMessage.Info.Descr.join(", "));
          return json({
            status: 'success',
            waybill: responseMessage.WaybilNumber,
            orderNumber: responseMessage.ExternalNumber,
          }, {
            status: 200});
        } else {
          return json({ errors: responseMessage.Errors });
        }
      } catch (err) {
        return renderError("SOAP request error:"+ err);
      }
    } catch (clientErr) {
      return renderError("Error creating client:" + clientErr);
    }
  }

  export async function fullfill(orders: any) {
    console.log("Map Shopify orders" + orders);
    const ordersRequest = mapCreateOrdersRequest(orders);
    return await createOrders(ordersRequest);
  }