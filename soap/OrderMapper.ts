import type {
  FulfillmentOrder,
  FulfillmentOrderLineItem,
} from "~/types/admin.types";
import type {
  IAddress,
  ICreateUpdateOrdersRequest,
  IItem,
  IItems,
} from "./types";

enum PaymentType {
  CASH = 1,
  IBAN = 2,
  CARD = 3,
}

enum Payer {
  Buyer = 1,
  Shop = 3,
}

enum DeliveryType {
  Branch = 0,
  Door = 1,
}

interface PaymentConfig {
  type: PaymentType;
  payer: Payer;
}

/**
 * Creates CreateUpdateOrders request body from Shopify order
 * @param order Shopify order
 * @returns SOAP request compatible with NovaPoshta in json
 */
export function mapCreateOrdersRequest(
  order: FulfillmentOrder,
): ICreateUpdateOrdersRequest {
  const organization = process.env.NP_ORGANIZATION!;
  const customAttributes = order.order.customAttributes.reduce(
    (acc, attr) => {
      acc[attr.key] = attr.value!;
      return acc;
    },
    {} as Record<string, string>,
  );

  const paymentConfig = mapPaymentConfig(customAttributes);
  const totalCost = order.order.totalPriceSet.presentmentMoney.amount;
  const isPrepaymentType = paymentConfig.type in [PaymentType.CARD, PaymentType.IBAN];
  const isOrderPaid = order.order.fullyPaid;
  // Контоль оплати for orders
  const paymentControl = isPrepaymentType && isOrderPaid ? 0 : totalCost;
  const orderData: ICreateUpdateOrdersRequest = {
    Organization: organization,
    Orders: {
      MessageOrders: {
        HeadOrder: {
          ExternalNumber: order.orderName,
          ExternalDate: "20241225044543",
          DestWarehouse: "KyivSkhid",
          Adress: mapAddress(customAttributes),
          PayType: paymentConfig.type,
          payer: paymentConfig.payer,
          Contactor: {
            rcptName: customAttributes["Recipient Name"],
            rcptContact: customAttributes["Recipient Name"],
            RecipientType: "PrivatePerson",
          },
          Description: order.lineItems.nodes[0].productTitle,
          AdditionalInfo: order.merchantRequests.nodes.pop()?.message || null,
          Cost: totalCost,
          DeliveryAmount: paymentControl,
          DeliveryType: mapDeliveryType(customAttributes),
          AdditionalParams: "",
          OrderType: 0, //B2C by default
        },
        Items: mapItems(order.lineItems.nodes),
      },
    },
  };
  return orderData;
}

function mapPaymentConfig(attributes: Record<string, string>): PaymentConfig {
  const freeShippingForCashless = process.env.FREE_SHIPPING_FOR_CASHLESS;
  if (attributes["Payment"] == "IBAN") {
    return {
      type: PaymentType.IBAN,
      payer: freeShippingForCashless ? Payer.Shop : Payer.Buyer,
    };
  } else {
    return {
      type: PaymentType.CASH,
      payer: Payer.Buyer,
    };
  }
}

function mapDeliveryType(attributes: Record<string, string>): DeliveryType {
  const hasBranchDetails = attributes["Post Office"]?.startsWith("Відділення");
  return hasBranchDetails ? DeliveryType.Branch : DeliveryType.Door;
}

function extractBranchId(input: string): string | null {
  const match = input.match(/№(\d+)/)!;
  return match ? match[1] : null;
}

function parseAddress(address: string) {
  // Remove "м." or "с." at the beginning of the string
  const cleanedAddress = address.replace(/^(м\.|с\.)\s*/, "");

  // Split the string by commas to extract components
  const parts = cleanedAddress.split(",").map((part) => part.trim());

  const city = parts[0] || null;
  const district = parts.length > 2 ? parts[1] : null;
  const region = parts.length > 1 ? parts[parts.length - 1] : null;

  return { city, district, region };
}

function mapAddress(attributes: Record<string, string>): IAddress {
  const { city, district, region } = parseAddress(attributes["City"]);

  const phoneNumber = attributes["Recipient Phone"];
  const branchAddress = attributes["Post Office"];
  const branchID = extractBranchId(branchAddress);
  if(branchID) {
    return IBranchAddress({
      Region: region + " область",
      City: city!,
      Phone: phoneNumber,
      NPWarehouse: branchID,
      District: district,
    });
  } else {
    throw new Error("Адресна доставка ще не інтегрована. Прохання додати логіку");
    return IDoorAddress({
      Region: region + " область",
      City: city!,
      Street: "",
      House: "",
      Flat: "",
      Phone: phoneNumber,
      NPWarehouse: branchID,
      District: district,
    });
  }
}

enum UNITS_IN_PACK {
  MB30 = 4,
  MB31 = 4,
  LF105 = 16,
}

function mapItems(lineItems: FulfillmentOrderLineItem[]): IItems {
  const items = lineItems.map((lineItem) => {
    //TODO pass pack size for each line item via customAttributes field
    const packSize = lineItem.sku == "100330" ? UNITS_IN_PACK.MB30 : 1;

    const unitQty = lineItem.financialSummaries[0].quantity;
    const packQty = unitQty / packSize;
    const unitPrice = lineItem.financialSummaries[0]
      .approximateDiscountedUnitPriceSet
      .presentmentMoney.amount;
    const packPrice = unitPrice * packSize;
    const sum = packPrice * packQty;
    return {
      Item: {
        Sku: lineItem.sku!,
        Qty: packQty,
        Price: packPrice,
        Sum: sum,
        MeasureUnit: "уп.",
      },
    };
  });
  return items;
}
function IDoorAddress(arg0: { Region: string; City: string; Street: string; House: string; Flat: string; Phone: string; NPWarehouse: string | null; District: string | null; }): IAddress {
  throw new Error("Function not implemented.");
}

