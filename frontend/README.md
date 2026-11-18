# Frontend: Sistema de Reservas

Interface em React, TypeScript e Tailwind CSS, ligada à API em [`../backend`](../backend). O guia completo está no [README principal](../README.md).

Com a API e o MongoDB rodando:

```bash
npm install
cp .env.example .env
npm run dev
```

Abra `http://localhost:5173`. O Vite repassa as chamadas de `/api` para a API, então o cookie de sessão funciona sem CORS.

Comandos: `npm run build` (confere os tipos e gera o build), `npm run lint`, `npm test`.
