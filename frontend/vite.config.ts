import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const alvo = env.API_PROXY_TARGET || 'http://localhost:3000';

  // Proxy: o cookie fica no mesmo site do frontend, então não precisa de CORS.
  const proxy = {
    '/api': {
      target: alvo,
      rewrite: (caminho: string) => caminho.replace(/^\/api/, ''),
    },
  };

  return {
    plugins: [react(), tailwindcss()],
    server: { port: 5173, strictPort: true, proxy },
    preview: { port: 5173, strictPort: true, proxy },
    test: { environment: 'node' },
  };
});
