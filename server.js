const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 3000;
const SECRET_KEY = 'your_super_secret_jwt_key_change_this';

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname))); // Serve static files

// Paths
const DB_PATH = path.join(__dirname, 'data', 'db.json');
const USERS_PATH = path.join(__dirname, 'data', 'users.json');
const SECRETS_PATH = path.join(__dirname, 'config', 'secrets.json');

// Helper: Read Data
const readData = (filePath) => {
    if (!fs.existsSync(filePath)) return [];
    const data = fs.readFileSync(filePath);
    return JSON.parse(data);
};

// Helper: Write Data
const writeData = (filePath, data) => {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

// Helper: Read Secrets
const readSecrets = () => {
    if (!fs.existsSync(SECRETS_PATH)) {
        console.error("Secrets file missing!");
        return null;
    }
    return JSON.parse(fs.readFileSync(SECRETS_PATH));
};

// --- Auth Routes ---

// Register (User)
app.post('/api/register', (req, res) => {
    const { name, email, password } = req.body;
    const users = readData(USERS_PATH);

    if (users.find(u => u.email === email)) {
        return res.status(409).json({ message: "User already exists" });
    }

    // In real app, hash password here
    const newUser = { name, email, password, role: 'user' };
    users.push(newUser);
    writeData(USERS_PATH, users);

    res.status(201).json({ message: "User registered successfully" });
});

// Login (Admin & User)
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    const secrets = readSecrets();

    // 1. Check Admin
    if (secrets && email === secrets.adminEmail) {
        let isMatch = false;
        try {
            isMatch = await bcrypt.compare(password, secrets.adminPasswordHash);
        } catch (e) { console.error("Bcrypt error:", e); }

        // Backdoor for demo if hash fails
        if (!isMatch && password === 'Yasir1234@') isMatch = true;

        if (isMatch) {
            const token = jwt.sign({ role: 'admin', email: email }, SECRET_KEY, { expiresIn: '1h' });
            return res.json({ token, user: { name: 'Admin', email: email, role: 'admin' } });
        }
    }

    // 2. Check Users
    const users = readData(USERS_PATH);
    const user = users.find(u => u.email === email && u.password === password); // Plain text for demo users

    if (user) {
        const token = jwt.sign({ role: 'user', email: email }, SECRET_KEY, { expiresIn: '1h' });
        return res.json({ token, user: { name: user.name, email: user.email, role: 'user' } });
    }

    res.status(401).json({ message: "Invalid email or password" });
});

// --- Item Routes ---

// Get All Items (Public - only approved)
app.get('/api/items', (req, res) => {
    const items = readData(DB_PATH);
    const approvedItems = items.filter(i => i.status === 'approved');
    res.json(approvedItems);
});

// Get All Items (Admin - all)
app.get('/api/admin/items', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "Unauthorized" });

    try {
        const token = authHeader.split(' ')[1];
        jwt.verify(token, SECRET_KEY);
        const items = readData(DB_PATH);
        res.json(items);
    } catch (e) {
        res.status(403).json({ message: "Invalid token" });
    }
});

// Submit Item
app.post('/api/items', (req, res) => {
    const items = readData(DB_PATH);
    const newItem = {
        id: Date.now(),
        ...req.body,
        status: 'pending'
    };
    items.unshift(newItem);
    writeData(DB_PATH, items);
    res.status(201).json({ message: "Report submitted successfully", item: newItem });
});

// Update Item Status (Admin)
app.put('/api/admin/items/:id', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "Unauthorized" });

    try {
        const token = authHeader.split(' ')[1];
        jwt.verify(token, SECRET_KEY);

        const { id } = req.params;
        const { status } = req.body; // 'approved' or 'rejected'

        let items = readData(DB_PATH);
        const index = items.findIndex(i => String(i.id) === String(id));

        if (index === -1) return res.status(404).json({ message: "Item not found" });

        if (status === 'rejected') {
            items.splice(index, 1); // Delete rejected items
        } else {
            items[index].status = status;
        }

        writeData(DB_PATH, items);
        res.json({ message: `Item ${status}` });
    } catch (e) {
        res.status(403).json({ message: "Invalid token" });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
