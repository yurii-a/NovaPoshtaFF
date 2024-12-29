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
import { getAuthToken, postProcessXml } from "./SoapUtils";
import { mapCreateOrdersRequest } from "./OrderMapper";
import type { FulfillmentOrder } from "~/types/admin.types";
import { json } from "@remix-run/node";

export class SoapService {
  private soapClient: any | null = null; // Cache the client instance
  private readonly username: string;
  private readonly password: string;
  private readonly url: string;

  constructor() {
    this.username = process.env.NP_USERNAME!;
    this.password = process.env.NP_PASSWORD!;
    this.url = process.env.SANDBOX_URL!;
  }

  async getSoapClient(): Promise<any> {
    if (!this.soapClient) {
      this.soapClient = this.createSoapClient(); // Create the client only if it doesn't exist
    }
    return this.soapClient;
  }

  async createSoapClient() {
    const wsdlUrl = `${this.url}?wsdl`;

    const options: soap.IOptions = {
      wsdl_headers: {
        Authorization: getAuthToken(this.username, this.password),
      },
      wsdl_options: {
        rejectUnauthorized: false, // Only for testing purposes if SSL issues arise
      },
      endpoint: this.url,
    };

    const client = await soap.createClientAsync(wsdlUrl, options);
    // Set security options if needed
    client.setSecurity(
      new soap.BasicAuthSecurity(this.username, this.password),
    );
    return client;
  }

  async createOrders(
    orders: ICreateUpdateOrdersRequest,
  ): Promise<UpdateOrdersResult> {
    try {
      const client = await this.getSoapClient();
      try {
        const [result] = (await client.CreateUpdateOrdersAsync(orders, {
          postProcess: (xml: string) => postProcessXml(xml),
        })) as [CreateUpdateOrdersResponse];

        const soapMessage = result.return.MessageOrdersER[0];
        return this.mapCreateOrdersResult(soapMessage);
      } catch (err) {
        throw new Error("SOAP request error:" + err);
      }
    } catch (clientErr) {
      throw new Error("Error creating client:" + clientErr);
    }
  }

  async cancelOrders(body: IUndoOrderRequest): Promise<UpdateOrdersResult> {
    try {
      const client = await this.getSoapClient();
      try {
        const [result] = (await client.CreateUpdateOrdersAsync(body, {
          postProcess: (xml: string) => postProcessXml(xml),
        })) as [CreateUpdateOrdersResponse];

        const soapMessage = result.return.MessageOrdersER[0];
        return this.mapCreateOrdersResult(soapMessage);
      } catch (err) {
        throw new Error("SOAP request error:" + err);
      }
    } catch (clientErr) {
      throw new Error("Error creating client:" + clientErr);
    }
  }

  async getCurrentRemains(body: IGetCurrentRemainsRequest) {
    try {
      const client = await this.getSoapClient();
      try {
        const [result] = (await client.GetCurrentRemainsAsync(body, {
          postProcess: (xml: string) => postProcessXml(xml),
        })) as [CreateUpdateOrdersResponse];
        const soapMessage = result.return.MessageOrdersER[0];
        return this.mapCreateOrdersResult(soapMessage);
      } catch (err) {
        throw new Error("SOAP error:" + err);
      }
    } catch (clientErr) {
      throw new Error("SOAP client error:" + clientErr);
    }
  }

  private mapCreateOrdersResult(
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

    console.log(
      "Info:",
      message.ExternalNumber + message.Info.Descr.join(", "),
    );
    return {
      status: ResponseStatus.OK,
      waybill: message.WaybilNumber,
      orderNumber: message.ExternalNumber,
      errors: [],
    };
  }

  async fulfill(order: FulfillmentOrder) {
    // console.log("Map Shopify orders: " + JSON.stringify(order, null, 2));
    const ordersRequest = mapCreateOrdersRequest(order);
    return await this.createOrders(ordersRequest);
  }
}
