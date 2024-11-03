import type { ICreateUpdateOrdersRequest } from "./types";

/**
 * Creates CreateUpdateOrders request body from Shopify order
 * @param order Shopify order
 * @returns SOAP request compatible with NovaPoshta in json
 */
export function mapCreateOrdersRequest(order): ICreateUpdateOrdersRequest {
    const organization = process.env.NP_ORGANIZATION!;
    const orderData: ICreateUpdateOrdersRequest = {
        Organization: organization,
        Orders: {
          MessageOrders: {
            HeadOrder: {
              ExternalNumber: "240999MO0F4FA261111232",
              ExternalDate: "20240116044543",
              DestWarehouse: "",
              Adress: {
                Region: "Харківська область",
                City: "Харків",
                Street: "",
                House: "",
                Flat: "",
                Phone: "+380677777777",
                NPWarehouse: "1",
                District: "",
              },
              PayType: "1",
              payer: "1",
              Contactor: {
                rcptName: "Петров Петро Петрович",
                rcptContact: "Петров Петро Петрович",
                RecipientType: "PrivatePerson",
              },
              Description: "Картка для виплат GOLD",
              Cost: "300",
              DeliveryType: "0",
              AdditionalParams: "",
              OrderType: "0",
            },
            Items: {
              Item: {
                Sku: "LU-01480",
                Qty: "1",
                Price: "300",
                Sum: "300",
                MeasureUnit: "шт.",
              },
            },
          },
        },
      };
    return orderData;
}