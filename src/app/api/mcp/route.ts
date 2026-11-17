import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { errorResponse } from "@/lib/errors";
import { createMcpServer } from "@/lib/mcp/server";
import { authenticateRequest } from "@/lib/services/api-keys";

/**
 * Stateless Streamable HTTP MCP endpoint. Each request authenticates its API key
 * and gets a fresh server + transport bound to that principal.
 */
async function handle(req: Request): Promise<Response> {
  let principal;
  try {
    principal = await authenticateRequest(req);
  } catch (err) {
    return errorResponse(err);
  }
  const server = createMcpServer(principal);
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  await server.connect(transport);
  return transport.handleRequest(req);
}

export { handle as GET, handle as POST, handle as DELETE };
