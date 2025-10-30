#!/usr/bin/env node

import { spawn } from 'child_process';
import axios from 'axios';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';

// Load environment variables
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BACKEND_URL = process.env.VITE_BACKEND_URL || 'http://localhost:8080';
const BACKEND_SCRIPT = join(__dirname, '..', 'external', 'backend.py');

/**
 * Check if the backend is already running
 */
async function isBackendRunning() {
  try {
    await axios.get(`${BACKEND_URL}/api/v1/targets`, { timeout: 1000 });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Start the Python backend server
 */
function startBackendProcess() {
  return new Promise((resolve, reject) => {
    console.log('Starting Python backend server...');

    const backend = spawn('python', [BACKEND_SCRIPT], {
      stdio: 'pipe',
      detached: false
    });

    backend.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(`[Backend] ${output}`);

      // Check if backend is ready
      if (output.includes('Running on') || output.includes('Serving on')) {
        resolve(backend);
      }
    });

    backend.stderr.on('data', (data) => {
      console.error(`[Backend Error] ${data.toString()}`);
    });

    backend.on('error', (error) => {
      reject(new Error(`Failed to start backend: ${error.message}`));
    });

    backend.on('exit', (code) => {
      if (code !== 0 && code !== null) {
        reject(new Error(`Backend exited with code ${code}`));
      }
    });

    // Timeout after 10 seconds
    setTimeout(() => {
      resolve(backend);
    }, 10000);
  });
}

/**
 * Wait for backend to be ready
 */
async function waitForBackend(maxAttempts = 30, delayMs = 500) {
  for (let i = 0; i < maxAttempts; i++) {
    if (await isBackendRunning()) {
      console.log('Backend is ready!');
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
  return false;
}

/**
 * Main function to ensure backend is running
 */
export async function ensureBackend() {
  if (await isBackendRunning()) {
    console.log('Backend is already running.');
    return null;
  }

  const backendProcess = await startBackendProcess();
  const ready = await waitForBackend();

  if (!ready) {
    backendProcess?.kill();
    throw new Error('Backend failed to start within timeout period');
  }

  return backendProcess;
}

/**
 * Stop the backend process
 */
export function stopBackend(backendProcess) {
  if (backendProcess) {
    console.log('Stopping backend...');
    backendProcess.kill();
  }
}

// Run directly if called as script
if (import.meta.url === `file://${process.argv[1]}`) {
  ensureBackend()
    .then(() => {
      console.log('Backend started successfully. Press Ctrl+C to stop.');
    })
    .catch((error) => {
      console.error('Error:', error.message);
      process.exit(1);
    });
}
