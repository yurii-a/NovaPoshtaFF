import * as fs from "fs";
import handlebars from "handlebars";
import * as path from "path";
import { fileURLToPath } from "url";

export function getAuthToken(username: string, password: string): string {
  return "Basic " + Buffer.from(`${username}:${password}`).toString("base64");
}

export function logRequestToFile(xml: string) {
  // Save XML to the current directory
  const currentDir = process.cwd(); // Get the current working directory
  const fileName = `soap_request_body.xml`; // Create a unique file name
  const filePath = path.join(currentDir, fileName); // Construct the file path

  fs.writeFile(filePath, xml, (err) => {
    if (err) {
      console.error("Error writing XML to file:", err);
    } else {
      console.log(`SOAP request saved to: ${filePath}`);
    }
  });
}

const NP_ENVELOPE = `<soap:Envelope
xmlns:soap="http://www.w3.org/2003/05/soap-envelope"
xmlns:wms="http://npl-dev.omnic.solutions/wms">`;

/**
 *  Fix wns not defined issue by replacing a generated envelope
 */
export function postProcessXml(_xml: string): string {
  return _xml.replace(/<soap:Envelope[^>]*>/, NP_ENVELOPE);
}


export function isSuccessful(response: any): boolean {
    const messageOrdersER = response.return?.MessageOrdersER;
  
    if (!messageOrdersER || !Array.isArray(messageOrdersER)) {
      // If the expected data structure is missing or incorrect, treat it as unsuccessful
      return false;
    }
  
    // Loop through each order's response to check for success
    for (const order of messageOrdersER) {
      const hasNoErrors = order.Errors === null;
      const description = order.Info?.Descr?.[0] || "";
      const isSuccessMessage = description.includes("All is OK");
  
      if (hasNoErrors && isSuccessMessage) {
        return true;
      }
    }
  
    // If no orders match the success criteria, return false
    return false;
  }