"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const supabase_js_1 = require("@supabase/supabase-js");
const multer_1 = __importDefault(require("multer"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const upload = (0, multer_1.default)();
const supabase = (0, supabase_js_1.createClient)((_a = process.env.SUPABASE_URL) !== null && _a !== void 0 ? _a : "https://qvkgwzkfbsahxyooshan.supabase.co", (_b = process.env.SUPABASE_API_KEY) !== null && _b !== void 0 ? _b : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2a2d3emtmYnNhaHh5b29zaGFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE1ODUyMDIsImV4cCI6MjA1NzE2MTIwMn0.on4OutbcDoj4bb1vDOc2ZmX1LwJYLqvt9QrUTz-zdsA");
// Authorization middleware
function authorize(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        // Exclude public endpoints
        const publicPaths = [
            '/api/auth/signin',
            '/api/auth/signup',
            '/api/auth/signout',
            '/api/public/website/'
        ];
        console.log('req.path', req.path);
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
            const { data: { user }, error } = yield supabase.auth.getUser(token);
            if (error || !user) {
                return res.status(401).json({ error: 'Invalid or expired token' });
            }
            // Attach user info to request
            req.user = user;
            next();
        }
        catch (err) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
    });
}
// Apply authorization middleware globally (after express.json, before routes)
app.use(authorize);
// Public endpoint: Get website data by userId (no auth)
app.get('/api/public/website/:userId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.params;
    if (!userId) {
        res.status(400).json({ error: 'No user found' });
        return;
    }
    try {
        const { data, error } = yield supabase
            .from('cloud_kitchen_website')
            .select('*')
            .eq('user_id', userId)
            .single();
        if (error) {
            res.status(400).json({ error: error.message });
            return;
        }
        res.json(data);
    }
    catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
}));
// Public endpoint: Get restaurant menu items by userId (no auth)
app.get('/api/public/restaurant/:userId/menu', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.params;
    if (!userId) {
        res.status(400).json({ error: 'No user found' });
        return;
    }
    try {
        const { data, error } = yield supabase
            .from('dish_item')
            .select('*')
            .eq('user_id', userId);
        if (error) {
            res.status(400).json({ error: error.message });
            return;
        }
        res.json(data || []);
    }
    catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
}));
// Sample endpoint: Get website data by userId
app.get('/api/website/:userId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.params;
    try {
        const { data, error } = yield supabase
            .from('cloud_kitchen_website')
            .select('*')
            .eq('user_id', userId)
            .single();
        if (error) {
            res.status(400).json({ error: error.message });
            return;
        }
        res.json(data);
    }
    catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
}));
// Get all restaurants
app.get('/api/restaurants', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { data, error } = yield supabase
            .from('cloud_kitchen_website')
            .select('id, user_id, website_name, description, website_logo, created_at');
        if (error) {
            res.status(400).json({ error: error.message });
            return;
        }
        res.json(data || []);
    }
    catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
}));
// Get restaurant by userId
app.get('/api/restaurant/:userId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.params;
    try {
        const { data, error } = yield supabase
            .from('cloud_kitchen_website')
            .select('*')
            .eq('user_id', userId)
            .single();
        if (error) {
            res.status(400).json({ error: error.message });
            return;
        }
        res.json(data);
    }
    catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
}));
// Get menu items for a restaurant
app.get('/api/restaurant/:userId/menu', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.params;
    try {
        const { data, error } = yield supabase
            .from('dish_item')
            .select('*')
            .eq('user_id', userId);
        if (error) {
            res.status(400).json({ error: error.message });
            return;
        }
        res.json(data || []);
    }
    catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
}));
// Auth: signup
app.post('/api/auth/signup', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    try {
        const { data, error } = yield supabase.auth.signUp({ email, password });
        if (error) {
            res.status(400).json({ error: error.message });
            return;
        }
        res.json(data);
    }
    catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
}));
// Create a new website (from kitchen_client)
app.post('/api/website', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { website_name, website_subtitle, about_us, description, user_id, website_logo, website_data } = req.body;
    try {
        const { data, error } = yield supabase
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
        if (error) {
            res.status(400).json({ error: error.message });
            return;
        }
        res.json(data);
    }
    catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
}));
// Update website data by userId
app.put('/api/website/:userId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.params;
    const websiteData = req.body;
    try {
        const { data, error } = yield supabase
            .from('cloud_kitchen_website')
            .update(websiteData)
            .eq('user_id', userId)
            .select()
            .single();
        if (error) {
            res.status(400).json({ error: error.message });
            return;
        }
        res.json(data);
    }
    catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
}));
// Auth: signin
app.post('/api/auth/signin', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    try {
        const { data, error } = yield supabase.auth.signInWithPassword({ email, password });
        if (error) {
            res.status(400).json({ error: error.message });
            return;
        }
        res.json(data);
    }
    catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
}));
// Auth: signout (stub, as Supabase handles this client-side)
app.post('/api/auth/signout', (req, res) => {
    // Supabase signout is client-side; just return success
    res.json({ message: 'Signed out' });
});
// File upload (logo) - uploads to Supabase storage and returns public URL
app.post('/api/upload/logo', upload.single('logo'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
    }
    const file = req.file;
    const filePath = `website-icons/${Date.now()}-${file.originalname}`;
    try {
        // Upload to Supabase storage
        const { error } = yield supabase.storage
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
    }
    catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
}));
// Insert dish item
app.post('/api/dish', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const _a = req.body, { user_id } = _a, dishData = __rest(_a, ["user_id"]);
    if (!user_id) {
        res.status(400).json({ error: 'user_id is required' });
        return;
    }
    const { data, error } = yield supabase
        .from('dish_item')
        .insert([Object.assign(Object.assign({}, dishData), { user_id })]);
    if (error) {
        res.status(400).json({ error: error.message });
        return;
    }
    res.json(data);
}));
// Update dish item
app.put('/api/dish/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const _a = req.body, { user_id } = _a, updateData = __rest(_a, ["user_id"]);
    const { data, error } = yield supabase
        .from('dish_item')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user_id);
    if (error) {
        res.status(400).json({ error: error.message });
        return;
    }
    res.json(data);
}));
// Fetch dish items for a user
app.get('/api/dishes/:userId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.params;
    const { data, error } = yield supabase
        .from('dish_item')
        .select('*')
        .eq('user_id', userId);
    if (error) {
        res.status(400).json({ error: error.message });
        return;
    }
    res.json(data);
}));
// Delete dish item
app.delete('/api/dish/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { user_id } = req.body;
    const { error } = yield supabase
        .from('dish_item')
        .delete()
        .eq('id', id)
        .eq('user_id', user_id);
    if (error) {
        res.status(400).json({ error: error.message });
        return;
    }
    res.json({ success: true });
}));
// Create client
app.post('/api/client', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { data, error } = yield supabase
        .from('client')
        .insert([Object.assign({}, req.body)])
        .select();
    if (error) {
        res.status(400).json({ error: error.message });
        return;
    }
    res.json(data);
}));
// Update client
app.put('/api/client', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const _a = req.body, { user_id } = _a, updateData = __rest(_a, ["user_id"]);
    const { data, error } = yield supabase
        .from('client')
        .update(updateData)
        .eq('user_id', user_id)
        .select()
        .single();
    if (error) {
        res.status(400).json({ error: error.message });
        return;
    }
    res.json(data);
}));
// Update client website id
app.post('/api/client/website', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { user_id, cloud_kitchen_website_id } = req.body;
    const { error } = yield supabase
        .from('client')
        .update({ cloud_kitchen_website_id, is_first_time: false })
        .eq('user_id', user_id);
    if (error) {
        res.status(400).json({ error: error.message });
        return;
    }
    res.json({ success: true });
}));
// Insert client data
app.post('/api/client/insert', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { data, error } = yield supabase
        .from('client')
        .insert([Object.assign({}, req.body)])
        .select();
    if (error) {
        res.status(400).json({ error: error.message });
        return;
    }
    res.json(data);
}));
// Fetch cuisine categories
app.get('/api/cuisines', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { data, error } = yield supabase
        .from('cuisine_category')
        .select('*');
    if (error) {
        res.status(400).json({ error: error.message });
        return;
    }
    res.json(data);
}));
// Delete file from Supabase storage
app.post('/api/file/delete', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { path, bucket } = req.body;
    const { error } = yield supabase.storage.from(bucket).remove([path]);
    if (error) {
        res.status(400).json({ error: error.message });
        return;
    }
    res.json({ success: true });
}));
// Get client by userId
app.get('/api/client/:userId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.params;
    try {
        const { data: clientData, error: clientError } = yield supabase
            .from('client')
            .select('*')
            .eq('user_id', userId)
            .single();
        console.log('clientError', clientError);
        if (clientError) {
            res.status(400).json({ error: clientError.message });
            return;
        }
        res.json(clientData);
    }
    catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
}));
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Kitchen backend running on port ${PORT}`);
});
