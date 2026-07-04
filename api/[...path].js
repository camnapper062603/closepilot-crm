import { handleClosePilotApiRequest } from "../api-handlers.js";
import { handleBusinessEnrichmentRequest } from "../business-enrichment-service.js";

export default function handler(request, response) {
  if ((request.url || "").startsWith("/api/business-enrichment")) {
    handleBusinessEnrichmentRequest(request, response);
    return;
  }

  handleClosePilotApiRequest(request, response);
}
