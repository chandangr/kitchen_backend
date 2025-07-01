import express, { Request, Response } from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import multer from 'multer';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer();

const supabase = createClient(
  process.env.SUPABASE_URL ?? "https://qvkgwzkfbsahxyooshan.supabase.co" as string,
  process.env.SUPABASE_API_KEY ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2a2d3emtmYnNhaHh5b29zaGFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE1ODUyMDIsImV4cCI6MjA1NzE2MTIwMn0.on4OutbcDoj4bb1vDOc2ZmX1LwJYLqvt9QrUTz-zdsA" as string
);

// Authorization middleware
async function authorize(req: Request, res: Response, next: Function) {
  // Exclude public endpoints
  const publicPaths = [
    '/api/auth/signin',
    '/api/auth/signup',
    '/api/auth/signout',
    '/api/public/website/'
  ];
  console.log('req.path', req.path)
  if (publicPaths.includes(req.path) || req.path.includes('/public/')) {
    return next();
  }
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }
  const token = authHeader.split(' ')[1];
  try {
    // Validate JWT with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    // Attach user info to request
    (req as any).user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

// Apply authorization middleware globally (after express.json, before routes)
app.use(authorize);

// Public endpoint: Get website data by userId (no auth)
app.get('/api/public/website/:userId', async (req: Request, res: Response) => {
  const { userId } = req.params;
  if (!userId) {
    res.status(400).json({ error: 'No user found' });
    return;
  }
  try {
    const { data, error } = await supabase
      .from('cloud_kitchen_website')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (error) { res.status(400).json({ error: error.message }); return; }
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Public endpoint: Get restaurant menu items by userId (no auth)
app.get('/api/public/restaurant/:userId/menu', async (req: Request, res: Response) => {
  const { userId } = req.params;
  if (!userId) {
    res.status(400).json({ error: 'No user found' });
    return;
  }
  try {
    const { data, error } = await supabase
      .from('dish_item')
      .select('*')
      .eq('user_id', userId);
    if (error) { res.status(400).json({ error: error.message }); return; }
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Sample endpoint: Get website data by userId
app.get('/api/website/:userId', async (req: Request, res: Response) => {
  const { userId } = req.params;
  try {
    const { data, error } = await supabase
      .from('cloud_kitchen_website')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (error) { res.status(400).json({ error: error.message }); return; }
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all restaurants
app.get('/api/restaurants', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('cloud_kitchen_website')
      .select('id, user_id, website_name, description, website_logo, created_at');
    if (error) { res.status(400).json({ error: error.message }); return; }
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get restaurant by userId
app.get('/api/restaurant/:userId', async (req: Request, res: Response) => {
  const { userId } = req.params;
  try {
    const { data, error } = await supabase
      .from('cloud_kitchen_website')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (error) { res.status(400).json({ error: error.message }); return; }
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get menu items for a restaurant
app.get('/api/restaurant/:userId/menu', async (req: Request, res: Response) => {
  const { userId } = req.params;
  try {
    const { data, error } = await supabase
      .from('dish_item')
      .select('*')
      .eq('user_id', userId);
    if (error) { res.status(400).json({ error: error.message }); return; }
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Auth: signup
app.post('/api/auth/signup', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) { res.status(400).json({ error: error.message }); return; }
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a new website (from kitchen_client)
app.post('/api/website', async (req: Request, res: Response) => {
  const {
    website_name,
    website_subtitle,
    about_us,
    description,
    user_id,
    website_logo,
    website_data
  } = req.body;
  try {
    const { data, error } = await supabase
      .from('cloud_kitchen_website')
      .insert([
        {
          website_name,
          website_subtitle,
          about_us,
          description,
          user_id,
          website_logo,
          website_data
        }
      ])
      .select();
    if (error) { res.status(400).json({ error: error.message }); return; }
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update website data by userId
app.put('/api/website/:userId', async (req: Request, res: Response) => {
  const { userId } = req.params;
  const websiteData = req.body;
  try {
    const { data, error } = await supabase
      .from('cloud_kitchen_website')
      .update(websiteData)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) { res.status(400).json({ error: error.message }); return; }
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Auth: signin
app.post('/api/auth/signin', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { res.status(400).json({ error: error.message }); return; }
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Auth: signout (stub, as Supabase handles this client-side)
app.post('/api/auth/signout', (req: Request, res: Response) => {
  // Supabase signout is client-side; just return success
  res.json({ message: 'Signed out' });
});

// File upload (logo) - uploads to Supabase storage and returns public URL
app.post('/api/upload/logo', upload.single('logo'), async (req: Request, res: Response): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ error: 'No file uploaded' });
    return;
  }
  const file = req.file;
  const filePath = `website-icons/${Date.now()}-${file.originalname}`;
  try {
    // Upload to Supabase storage
    const { error } = await supabase.storage
      .from('website-builder-images')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype
      });
    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }
    // Get public URL
    const { data } = supabase.storage
      .from('website-builder-images')
      .getPublicUrl(filePath);
    res.json({ url: data.publicUrl });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Insert dish item
app.post('/api/dish', async (req: Request, res: Response) => {
  const { user_id, ...dishData } = req.body;
  if (!user_id) {
    res.status(400).json({ error: 'user_id is required' });
    return;
  }
  const { data, error } = await supabase
    .from('dish_item')
    .insert([{ ...dishData, user_id }]);
  if (error) { res.status(400).json({ error: error.message }); return; }
  res.json(data);
});

// Update dish item
app.put('/api/dish/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { user_id, ...updateData } = req.body;
  const { data, error } = await supabase
    .from('dish_item')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user_id);
  if (error) { res.status(400).json({ error: error.message }); return; }
  res.json(data);
});

// Fetch dish items for a user
app.get('/api/dishes/:userId', async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { data, error } = await supabase
    .from('dish_item')
    .select('*')
    .eq('user_id', userId);
  if (error) { res.status(400).json({ error: error.message }); return; }
  res.json(data);
});

// Delete dish item
app.delete('/api/dish/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { user_id } = req.body;
  const { error } = await supabase
    .from('dish_item')
    .delete()
    .eq('id', id)
    .eq('user_id', user_id);
  if (error) { res.status(400).json({ error: error.message }); return; }
  res.json({ success: true });
});

// Create client
app.post('/api/client', async (req: Request, res: Response) => {
  const { data, error } = await supabase
    .from('client')
    .insert([{ ...req.body }])
    .select();
  if (error) { res.status(400).json({ error: error.message }); return; }
  res.json(data);
});

// Update client
app.put('/api/client', async (req: Request, res: Response) => {
  const { user_id, ...updateData } = req.body;
  const { data, error } = await supabase
    .from('client')
    .update(updateData)
    .eq('user_id', user_id)
    .select()
    .single();
  if (error) { res.status(400).json({ error: error.message }); return; }
  res.json(data);
});

// Update client website id
app.post('/api/client/website', async (req: Request, res: Response) => {
  const { user_id, cloud_kitchen_website_id } = req.body;
  const { error } = await supabase
    .from('client')
    .update({ cloud_kitchen_website_id, is_first_time: false })
    .eq('user_id', user_id);
  if (error) { res.status(400).json({ error: error.message }); return; }
  res.json({ success: true });
});

// Insert client data
app.post('/api/client/insert', async (req: Request, res: Response): Promise<void> => {
  const { data, error } = await supabase
    .from('client')
    .insert([{ ...req.body }])
    .select();
  if (error) {
    res.status(400).json({ error: error.message });
    return;
  }
  res.json(data);
});

// Fetch cuisine categories
app.get('/api/cuisines', async (req: Request, res: Response): Promise<void> => {
  const { data, error } = await supabase
    .from('cuisine_category')
    .select('*');
  if (error) {
    res.status(400).json({ error: error.message });
    return;
  }
  res.json(data);
});

// Delete file from Supabase storage
app.post('/api/file/delete', async (req: Request, res: Response): Promise<void> => {
  const { path, bucket } = req.body;
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) {
    res.status(400).json({ error: error.message });
    return;
  }
  res.json({ success: true });
});

// Get client by userId
app.get('/api/client/:userId', async (req: Request, res: Response) => {
  const { userId } = req.params;
  try {
    const { data: clientData, error: clientError } = await supabase
      .from('client')
      .select('*')
      .eq('user_id', userId)
      .single();
      console.log('clientError', clientError)
    if (clientError) {
      res.status(400).json({ error: clientError.message });
      return;
    }
    res.json(clientData);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Kitchen backend running on port ${PORT}`);
}); 