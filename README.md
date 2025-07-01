# Kitchen Backend

This is the backend for the Cloud Kitchen project. It handles all Supabase calls and exposes REST API endpoints for the frontend apps (`cloud_kitchen` and `kitchen_client`).

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create a `.env` file in the root of `kitchen_backend` with the following content:**
   ```env
   SUPABASE_URL=your_supabase_url
   SUPABASE_API_KEY=your_supabase_api_key
   PORT=4000
   ```
   Replace `your_supabase_url` and `your_supabase_api_key` with your actual Supabase credentials.

3. **Run the server:**
   ```bash
   node index.js
   ```

## Example Endpoint

- `GET /api/website/:userId` — Returns website data for a given userId from Supabase.

## Next Steps
- Move all Supabase logic from the frontend to this backend.
- Add more endpoints as needed for authentication, menu items, etc. 