/**
 * Transport Streamable HTTP pour MCP Apps
 * Mode stateless : un nouveau serveur par requête
 */

import express, { type Request, type Response } from 'express';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

const DEFAULT_PORT = 3000;

export type ServerFactory = () => McpServer;

export async function runHttp(
  serverOrFactory: McpServer | ServerFactory,
  port: number = DEFAULT_PORT
): Promise<void> {
  const getServer: ServerFactory =
    typeof serverOrFactory === 'function' ? serverOrFactory : () => serverOrFactory;

  const app = express();
  app.use(express.json());

  app.post('/mcp', async (req: Request, res: Response) => {
    const server = getServer();
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    try {
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      console.error('MCP request error:', error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: { code: -32603, message: 'Internal server error' },
          id: null,
        });
      }
    } finally {
      res.on('close', () => {
        transport.close();
        server.close();
      });
    }
  });

  app.listen(port, () => {
    console.error(`Mikado MCP server (Streamable HTTP) listening on http://localhost:${port}/mcp`);
  });
}
