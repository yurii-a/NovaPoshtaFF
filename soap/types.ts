// Define the main interface for the CreateUpdateOrders request
export interface ICreateUpdateOrdersRequest {
  Organization: string;
  Orders: IOrders;
}

export interface IUndoOrderRequest {
  UndoOrder: {
    Organization: string;
    ExternalNumbers: {
      MessageExternalNumbers: {
        ExternalNumber: string;
      };
    };
  };
}

export interface IGetCurrentRemainsRequest {
  GetCurrentRemains: {
    Organization: string;
    SKU?: string;
    Warehouse?: string;
    RemainDate?: string;
    AdditionalParam?: string;
    batchId?: string;
  };
}

// Define the interface for Orders
export interface IOrders {
  MessageOrders: IMessageOrders;
}

// Define the interface for MessageOrders
export interface IMessageOrders {
  HeadOrder: IHeadOrder;
  Items: IItems;
}

// Define the interface for HeadOrder
export interface IHeadOrder {
  ExternalNumber: string;
  ExternalDate: string;
  DestWarehouse: string;
  Adress: IAddress;
  PayType: number;
  payer: number;
  Contactor: IContactor;
  Description: string;
  AdditionalInfo: string | null;
  Cost: string;
  DeliveryAmount: number;
  DeliveryType: number;
  AdditionalParams: string;
  OrderType: number;
}

// Define the interface for Adress
export interface IAddress {
  Region: string;
  City: string;
}

export interface IBranchAddress extends IAddress {
  // TODO Uncomment in case if SOAP xml is incorrect
  // Region: string;
  // City: string;
  Phone: string;
  NPWarehouse: string;
  District: string | null;
}

export interface IDoorAddress extends IAddress {
  // TODO Uncomment in case if SOAP xml is incorrect
  // Region: string;
  // City: string;
  Street: string;
  House: string;
  Flat: string | null;
  Phone: string;
  District: string | null;
}

// Define the interface for Items
export interface IItems {
  Item: IItem[]; // This could be an array if there can be multiple items
}

// Define the interface for Item
export interface IItem {
  Sku: string;
  Qty: number;
  Price: number;
  Sum: number;
  MeasureUnit: string;
}

// Define the interface for Contactor
export interface IContactor {
  rcptName: string;
  rcptContact: string;
  RecipientType: string; // e.g., 'PrivatePerson' or other types
}

// CreateUpdateOrders types
export interface CreateOrdersResponse {
  return: MessageOrdersERResponse;
}

export interface MessageOrdersERResponse {
  MessageOrdersER: MessageOrder[];
}

export interface MessageOrder {
  ExternalNumber: string;
  Errors: string | null; // Assuming Errors can be a string or null
  Info: Info;
  GUID: string;
  WaybilNumber: string;
}

export interface Info {
  Descr: string[];
}

export enum ResponseStatus {
  OK = "OK",
  FAILURE = "FAILURE"
}

export interface FulfillOrdersResult {
  status: ResponseStatus.OK | ResponseStatus.FAILURE;
  waybill: string | null;
  orderNumber: string | null;
  errors: string[];
}