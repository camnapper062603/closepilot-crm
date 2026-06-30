import { handleBusinessEnrichmentRequest } from "../business-enrichment-service.js";

export default function handler(request, response) {
  return handleBusinessEnrichmentRequest(request, response);
}
