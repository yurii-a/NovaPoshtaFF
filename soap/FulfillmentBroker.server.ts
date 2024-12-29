import type { FulfillmentOrder } from "~/types/admin.types";
import type { ShopifyAdminClient } from "./ShopifyAdminClient";
import type {
  IGetCurrentRemainsRequest as IGetStockRequest,
  IUndoOrderRequest,
} from "./types";
import { ResponseStatus as SoapStatus } from "./types";
import type { SoapService } from "./NovaPoshtaSoapService.server";

export class FulfillmentBroker {
  private adminClient: ShopifyAdminClient;
  private soapService: SoapService;
  private organization: string;

  constructor(
    adminClient: ShopifyAdminClient,
    soapService: SoapService,
    organization: string,
  ) {
    this.adminClient = adminClient;
    this.soapService = soapService;
    this.organization = organization;
  }

  async processAssignedRequests() {
    const assignedRequests = await this.adminClient.fetchAssignedRequests();
    assignedRequests.forEach((assignedRequest) => {
      const fulfillmentOrder = assignedRequest.node;
      this.fulfill(fulfillmentOrder);
    });
  }

  async processCancelationRequests() {
    const assignedRequests = await this.adminClient.fetchCancelRequests();
    assignedRequests.forEach((assignedRequest) => {
      const fulfillmentOrder = assignedRequest.node;
      this.cancelFulfillment(fulfillmentOrder);
    });
  }

  async fulfill(fulfillmentOrder: FulfillmentOrder) {
    // Create a fulfillment request to Nova Poshta SOAP
    // If Nova Poshta accepts the request, then mark the fulfillment as accepted or rejected otherwise
    try {
      const result = await this.soapService.fulfill(fulfillmentOrder);
      console.log(result);

      if (result.status == SoapStatus.OK) {
        const acceptResponse = await this.adminClient.acceptFulfillmentRequest(
          fulfillmentOrder.id,
        );
        console.log(acceptResponse);
        await this.adminClient.createFulfillment(
          fulfillmentOrder,
          result.waybill!,
        );
      }
    } catch (error) {
      console.error(
        "Failed to fulfill " + fulfillmentOrder.orderName + ": " + error,
      );
    }
  }

  // Handle cancellation request
  async cancelFulfillment(fulfillmentOrder: FulfillmentOrder) {
    const orderName = fulfillmentOrder.orderName;
    const id = fulfillmentOrder.id;
    try {
      const body: IUndoOrderRequest = {
        UndoOrder: {
          Organization: this.organization,
          ExternalNumbers: {
            MessageExternalNumbers: {
              ExternalNumber: orderName,
            },
          },
        },
      };
      const cancelResult = await this.soapService.cancelOrders(body);
      console.log(cancelResult);

      if (cancelResult.status == SoapStatus.OK) {
        const acceptResponse = await this.adminClient.acceptCancelation(id);
        console.log("Cancellation accepted", acceptResponse);
      } else if (cancelResult.status == SoapStatus.FAILURE) {
        const message = cancelResult.errors.join(",");
        const rejectResponse = await this.adminClient.rejectCancelation(
          id,
          message,
        );
        console.log("Cancellation rejected", rejectResponse);
      }
    } catch (error) {
      console.error("Cancel fulfillment error: ", error);
    }
  }

  async fetchStock() { // fulfillmentOrder: FulfillmentOrder,
    // const orderName = fulfillmentOrder.orderName;
    // const id = fulfillmentOrder.id;
    try {
      const body: IGetStockRequest = {
        GetCurrentRemains: {
          Organization: this.organization,
          // SKU?: string;
          // Warehouse?: string;
          // RemainDate?: string;
          // AdditionalParam?: string;
          // batchId?: string;
        },
      };
      const cancelResult = await this.soapService.getCurrentRemains(body);
      console.log(cancelResult);
    } catch (error) {
      console.error("Fetch stock error: ", error);
    }
  }
}
