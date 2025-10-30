import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    server: {
      allowedHosts: ['.ngrok-free.app'],
      proxy: {
        // Proxy backend API requests for Sigma conversion
        '/api/v1': {
          target: 'http://localhost:8080',
          changeOrigin: true,
          secure: false
        },
        // Proxy OpenSearch requests to configured server
        '/api/opensearch': {
          target: env.VITE_OPENSEARCH_URL || 'http://localhost:9200',
          changeOrigin: true,
          secure: false,
          ws: false,
          rewrite: (path) => path.replace(/^\/api\/opensearch/, ''),
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, _res) => {
              console.log('OpenSearch proxy error:', err);
            });
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              console.log('Proxying to OpenSearch:', req.method, req.url);
              // Fix keep-alive issues
              proxyReq.setHeader('Connection', 'close');
              // Remove problematic headers
              proxyReq.removeHeader('accept-encoding');
            });
            proxy.on('proxyRes', (proxyRes, req, _res) => {
              console.log('OpenSearch response:', proxyRes.statusCode, req.url);
            });
          }
        }
      }
    }
  }
})
