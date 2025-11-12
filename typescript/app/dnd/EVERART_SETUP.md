# EverArt API Setup

The monster creator now uses the EverArt API directly (not MCP) for image generation.

## Configuration

1. **Get your EverArt API Key**
   - Sign up or log in to your EverArt account
   - Navigate to API settings to generate or retrieve your API key

2. **Set Environment Variable**
   Add the following to your `.env` file in the project root:
   ```
   EVERART_API_KEY=your_everart_api_key_here
   ```

3. **API Endpoint**
   The current implementation uses `https://api.everart.ai/v1/generate` as the endpoint.
   If EverArt uses a different endpoint, update the `apiUrl` in `/app/api/generate-image/route.ts`.

## Usage

1. Navigate to `/dnd/monster-test` or use the Monster Creator component
2. Enter a prompt describing your monster
3. Select a model (FLUX1.1, SD3.5, etc.)
4. Click "Generate Image" to create an image using EverArt API
5. Once the image is generated, click "Create Monster" to process it

## API Response Format

The implementation handles multiple response formats:
- `{ image_url: string }`
- `{ images: [{ url: string }] }`
- `{ url: string }`
- Direct string URL

If you encounter issues, check the API response format and adjust the parsing logic in `/app/api/generate-image/route.ts` if needed.

## Troubleshooting

- **"EverArt API key not configured"**: Make sure `EVERART_API_KEY` is set in your `.env` file
- **"EverArt API error"**: Check that your API key is valid and the endpoint URL is correct
- **"Unexpected response format"**: The API response structure may differ - check the console logs for the actual response format

