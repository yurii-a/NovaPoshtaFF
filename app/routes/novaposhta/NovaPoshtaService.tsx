import { json } from "@remix-run/node";
import soap from "soap";

const wsdlUrl =
  "https://api-nps.np.work/wms_test/ws/depositorExchane.1cws?wsdl";
const login = "web";
const password = "web";

export async function initiateNovaPoshtaFulfillment(order: any) {
  // Parse the request body to extract order details and adapt it to your SOAP API's expected format
  const soapData = {
    CreateUpdateOrders: {
      Organization: "NPL_A1",
      Orders: {
        MessageOrders: {
          HeadOrder: {
            ExternalNumber: order.id, // Use Shopify fulfillment order ID
            ExternalDate: new Date()
              .toISOString()
              .replace(/T/, " ")
              .replace(/\..+/, ""),
            DestWarehouse: "",
            Adress: {
              Region: order.destination.province,
              City: order.destination.city,
              Street: order.destination.address1,
              House: order.destination.address2 || "",
              Flat: order.destination.zip,
              Phone: order.destination.phone,
              NPWarehouse: "1",
              District: "",
            },
            PayType: "1", // Customize as needed
            payer: "1",
            Contactor: {
              rcptName: order.destination.name,
              rcptContact: order.destination.name,
              RecipientType: "PrivatePerson",
            },
            Description: order.line_items[0].name,
            Cost: order.line_items[0].price,
            DeliveryType: "0",
            AdditionalParams: {},
            OrderType: "0",
          },
          Items: {
            Item: order.line_items.map((item) => ({
              Sku: item.sku,
              Qty: item.quantity,
              Price: item.price,
              Sum: item.quantity * item.price,
              MeasureUnit: "шт.",
            })),
          },
        },
      },
    },
  };

  return new Promise((resolve, reject) => {
    soap.createClient(wsdlUrl, (err, client) => {
      if (err) {
        console.error("Error creating SOAP client:", err);
        return reject(json({ message: "SOAP client error" }, { status: 500 }));
      }

  

      client.CreateUpdateOrders(soapData, (err, result) => {

      client.addSoapHeader({
        soapAction: 'https://api-nps.np.work/wms_test/ws/depositorExchane.1cws#OM_depositorExchane:CreateUpdateGoods'
      });
      
        if (err) {
          console.error("Error sending SOAP request:", err);
          return reject(
            json({ message: "SOAP request error" }, { status: 500 }),
          );
        }

        // Handle SOAP response
        console.log("SOAP Response:", result);
        resolve(
          json(
            { message: "Fulfillment request processed successfully" },
            { status: 200 },
          ),
        );
      });
    });
  });
}

export async function loader() {
  try {
    // Створення SOAP-клієнта
    var auth =
      "Basic " + Buffer.from(login + ":" + password).toString("base64");
    const client = await new Promise((resolve, reject) => {
      soap.createClient(
        wsdlUrl,
        { wsdl_headers: { Authorization: auth } },
        (err, client) => {
          if (err) {
            reject(err);
          } else {
            resolve(client);
          }
        },
      );
    });

    // Визначення даних для SOAP-запиту
    const requestData = {
      Organization: "NPL_A1",
      Goods: {
        MessageGoods: {
          Sku: "LU-01480",
          GoodsUnitName: "1,5*4,0*1,2 сталь/ сепаратор Torlon",
          GoodsUnitFullName: "1,5*4,0*1,2 сталь/ сепаратор Torlon",
          BaseMeasureUnit: {
            BarCode: "00452",
            MeasureUnitName: "шт.",
            Weight: 0.01,
            Length: 1,
            Height: 1,
            Width: 1,
          },
          ExpirationDateSign: 0,
          Price: 9,
        },
      },
    };

    // Виклик функції CreateUpdateGoods
    const result = await new Promise((resolve, reject) => {
      client.CreateUpdateGoods(requestData, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });

    console.log("SOAP Response:", result);

    // Обробка відповіді
    const response = result.CreateUpdateGoodsResponse?.MessageGoodsER;

    if (response && response.Errors) {
      console.error("Помилка:", response.Errors);
      return new Response(JSON.stringify({ error: response.Errors }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Якщо все ок
    const successMessage = response?.Info?.Descr || "Успішно додано";
    return new Response(JSON.stringify({ message: successMessage }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("SOAP Error:", error);
    return new Response(
      JSON.stringify({ error: "Помилка виклику SOAP сервісу" }),
      {
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
