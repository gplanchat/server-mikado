#!/usr/bin/env node

/**
 * Serveur MCP pour la méthode Mikado
 * Usage:
 *   node dist/index.js           # stdio (MCP Inspector, Cursor)
 *   node dist/index.js --http   # Streamable HTTP (MCP Apps)
 */

import { createServer } from './server.js';
import { runStdio } from './transports/stdio.js';
import { runHttp } from './transports/http.js';

const useHttp = process.argv.includes('--http');
const httpPort = parseInt(process.env.MIKADO_HTTP_PORT || '3000', 10);

async function main() {
  if (useHttp) {
    await runHttp(() => createServer(), httpPort);
  } else {
    const server = createServer();
    await runStdio(server);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
