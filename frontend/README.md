# DDoS Intelligence System - Frontend

This is the React + Vite frontend for the DDoS Intelligence System.

## Development

```bash
npm install
npm run dev
```

## Deployment Configuration

When deploying this frontend (e.g., to Vercel), you **must** configure the following environment variable to point to your deployed backend WebSocket URL:

```env
VITE_WS_URL=wss://YOUR_RENDER_BACKEND_URL/ws/attacks
```

For example, if your backend on Render is at `https://ddos-backend-xyz.onrender.com`, the variable should be:

`VITE_WS_URL=wss://ddos-backend-xyz.onrender.com/ws/attacks`

If this variable is not provided, the frontend will be unable to stream live attack events from the backend engine.

## Build

To build the project for production:

```bash
npm run build
```

This will output the static bundle to the `dist` folder.
