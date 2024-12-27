import type {
  FulfillmentOrder,
  FulfillmentOrderLineItem,
  FulfillmentOrderLineItemEdge,
} from "~/types/admin.types";
import type {
  IAddress,
  IBranchAddress,
  ICreateUpdateOrdersRequest,
  IDoorAddress,
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

const IS_SANDBOX = process.env.NP_ENV === "sandbox";

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
      acc[attr.key] = attr.value ?? "";
      return acc;
    },
    {} as Record<string, string>,
  );

  const paymentConfig = mapPaymentConfig(customAttributes);
  const totalCost = order.order.totalPriceSet.presentmentMoney.amount;
  const isPrepaymentType = paymentConfig.type in [PaymentType.CARD, PaymentType.IBAN];
  const isOrderPaid = order.order.fullyPaid;
  // Контроль оплати for orders. 
  let returnPayment = isPrepaymentType && isOrderPaid || !IS_SANDBOX ? 0 : totalCost;
  if (IS_SANDBOX) {
    //Ignore this param as it's not supported in sandbox 
    returnPayment = undefined;
  }
  
  // Pass the latest message from merchant
  const merchantMessage = order.merchantRequests.edges[0].node?.message;
  const deliveryType = mapDeliveryType(customAttributes);
  const orderDescription = order.lineItems.edges[0].node.productTitle;
  const orderData: ICreateUpdateOrdersRequest = {
    Organization: organization,
    Orders: {
      MessageOrders: {
        HeadOrder: {
          ExternalNumber: order.orderName,
          // ExternalDate: "20241225044543",
          DestWarehouse: "KyivSkhid",
          Adress: mapAddress(customAttributes),
          PayType: paymentConfig.type,
          payer: paymentConfig.payer,
          Contactor: {
            rcptName: customAttributes["Recipient Name"],
            rcptContact: customAttributes["Recipient Name"],
            RecipientType: "PrivatePerson",
          },
          Description: orderDescription,
          AdditionalInfo: merchantMessage || "",
          Cost: totalCost,
          DeliveryAmount: returnPayment,
          DeliveryType: deliveryType,
          // AdditionalParams: "",
          OrderType: 0, //B2C by default
        },
        Items: mapItems(order.lineItems.edges),
      },
    },
  };
  return orderData;
}

function mapPaymentConfig(attributes: Record<string, string>): PaymentConfig {
  if(IS_SANDBOX) {
    // Only cash works in sandbox
    return {
      type: PaymentType.CASH,
      payer: Payer.Buyer,
    };
  }
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

function mapAddress(attributes: Record<string, string>): IBranchAddress | IDoorAddress {
  const { city, district, region } = parseAddress(attributes["City"]);

  const phoneNumber = attributes["Recipient Phone"];
  const branchAddress = attributes["Post Office"];
  const branchID = extractBranchId(branchAddress);

  if (branchID) {
    // Return a branch address
    return {
      Region: region + " область",
      City: city!,
      Phone: phoneNumber,
      NPWarehouse: branchID,
      District: district,
    };
  } else {
    // Return a door address
    return {
      Region: region + " область",
      City: city!,
      Street: "",
      House: "",
      Flat: null,
      Phone: phoneNumber,
      District: district,
    };
  }
}

enum UNITS_IN_PACK {
  MB30 = 4,
  MB31 = 4,
  LF105 = 16,
}

function mapItems(lineItemEdges: FulfillmentOrderLineItemEdge[]): IItems {
  const items = lineItemEdges.map((lineItemEdge) => {
    const lineItem = lineItemEdge.node;
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

