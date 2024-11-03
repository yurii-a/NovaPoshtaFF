// Define the main interface for the CreateUpdateOrders request
export interface ICreateUpdateOrdersRequest {
  Organization: string;
  Orders: IOrders;
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
  Adress: IAdress;
  PayType: string;
  payer: string;
  Contactor: IContactor;
  Description: string;
  Cost: string;
  DeliveryType: string;
  AdditionalParams: string;
  OrderType: string;
}

// Define the interface for Adress
export interface IAdress {
  Region: string;
  City: string;
  Street: string;
  House: string;
  Flat: string;
  Phone: string;
  NPWarehouse: string;
  District: string;
}

// Define the interface for Items
export interface IItems {
  Item: IItem; // This could be an array if there can be multiple items
}

// Define the interface for Item
export interface IItem {
  Sku: string;
  Qty: string;
  Price: string;
  Sum: string;
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
