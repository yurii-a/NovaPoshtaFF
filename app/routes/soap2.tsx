import * as soap from "soap";
import type {
  CreateOrdersResponse,
  ICreateUpdateOrdersRequest,
} from "soap/types";
import { createOrders } from "soap/NovaPoshtaService";

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

export async function loader() {
  return await createOrders(orderData);
}
