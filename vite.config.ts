import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// During dev, proxy /api to the Express server so the browser hits one origin.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true, // bind IPv4 + IPv6 so 127.0.0.1 and localhost both work
    proxy: {
      '/api': 'http://127.0.0.1:3001',
    },
  },
});
