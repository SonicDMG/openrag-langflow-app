#!/usr/bin/env node

const { spawn } = require('child_process');
const net = require('net');

/**
 * Check if a port is available
 */
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.listen(port, () => {
      server.once('close', () => {
        resolve(true);
      });
      server.close();
    });
    
    server.on('error', () => {
      resolve(false);
    });
  });
}

/**
 * Find the next available port starting from the given port
 */
async function findAvailablePort(startPort = 3000) {
  let port = startPort;
  const maxPort = startPort + 100; // Try up to 100 ports ahead
  
  while (port <= maxPort) {
    if (await isPortAvailable(port)) {
      return port;
    }
    port++;
  }
  
  throw new Error(`Could not find an available port between ${startPort} and ${maxPort}`);
}

/**
 * Main function
 */
async function main() {
  const defaultPort = 3000;
  const port = await findAvailablePort(defaultPort);
  
  if (port !== defaultPort) {
    console.log(`Port ${defaultPort} is already in use. Using port ${port} instead.`);
  } else {
    console.log(`Starting server on port ${port}...`);
  }
  
  // Start Next.js with the specified port using -p flag
  const nextStart = spawn('npx', ['next', 'start', '-p', port.toString()], {
    stdio: 'inherit',
    shell: true,
  });
  
  nextStart.on('error', (error) => {
    console.error('Error starting Next.js:', error);
    process.exit(1);
  });
  
  nextStart.on('exit', (code) => {
    process.exit(code || 0);
  });
}

main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

