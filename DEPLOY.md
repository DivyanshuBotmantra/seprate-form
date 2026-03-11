# Azure Static Web Apps Deployment

This project is configured to deploy to Azure Static Web Apps using the SWA CLI.

## Prerequisites

1. Install Azure Static Web Apps CLI:
   ```bash
   npm install -g @azure/static-web-apps-cli
   ```

2. Build the application:
   ```bash
   npm run build
   ```

## Deployment

Deploy using the SWA CLI with your deployment token:

```bash
swa deploy --app-name bot-console-uat --deployment-token a136de951deb17abd2696840a16e8bd461221a65ebc001082a3a7aa6b9992f7303-e85c2a22-b2a8-4a58-a302-92ed2f72092f0002617057712100
```

Or use the npm script:

```bash
npm run deploy
```

## Environment Variables

Make sure to set your environment variables before building. You can create a `.env` file or set them in your build environment:

- `VITE_API_BASE_URL`
- `VITE_API_CORE_DEV_BASE_URL`
- `VITE_VALIDATE_USER_ENDPOINT`
- `VITE_GET_USER_DETAIL_ENDPOINT`
- `VITE_GET_TB_RECON_ENDPOINT`
- `VITE_CREATE_UUID_ENDPOINT`
- `VITE_UPLOAD_FILE_ENDPOINT`
- `VITE_CREATE_EXECUTION_LOG_ENDPOINT`
- `VITE_GET_BOT_CONFIG_API_URL`
- `VITE_CREATE_BOT_CONFIG_API_URL`
- `VITE_UPDATE_BOT_CONFIG_API_URL`
- `VITE_GET_LOV_MASTER_API_URL`

## Configuration

The `staticwebapp.config.json` file is configured to:
- Handle SPA routing (all routes fallback to `index.html`)
- Set appropriate cache headers for static assets
- Configure MIME types for various file formats

