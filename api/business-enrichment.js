import { handleBusinessEnrichmentRequest } from "../business-enrichment-service.js";

export default function handler(request, response) {
  handleBusinessEnrichmentRequest(request, response);
}
