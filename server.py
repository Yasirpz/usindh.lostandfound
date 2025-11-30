import http.server
import socketserver
import json
import sqlite3
import os
import mimetypes
from urllib.parse import urlparse, parse_qs

PORT = 8000
DB_FILE = 'lost_found.db'

def init_db():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    
    # Create Users Table
    c.execute('''CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'user'
    )''')

    # Create Items Table
    c.execute('''CREATE TABLE IF NOT EXISTS items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        location TEXT NOT NULL,
        date TEXT NOT NULL,
        description TEXT,
        contact TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )''')

    # Check if admin exists, if not create one
    c.execute("SELECT * FROM users WHERE email = 'yasirpzshar@gmail.com'")
    if not c.fetchone():
        c.execute("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
                  ('Admin Yasir', 'yasirpzshar@gmail.com', 'Yasir1234@', 'admin'))
        print("Admin user created.")

    conn.commit()
    conn.close()

class MyRequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        parsed_path = urlparse(self.path)
        
        if parsed_path.path == '/api/items':
            self.handle_get_items(parsed_path)
        else:
            # Serve static files
            super().do_GET()

    def do_POST(self):
        parsed_path = urlparse(self.path)
        
        if parsed_path.path == '/api/login':
            self.handle_login()
        elif parsed_path.path == '/api/register':
            self.handle_register()
        elif parsed_path.path == '/api/items':
            self.handle_create_item()
        elif parsed_path.path == '/api/admin/action':
            self.handle_admin_action()
        else:
            self.send_error(404, "Endpoint not found")

    def handle_get_items(self, parsed_path):
        query_params = parse_qs(parsed_path.query)
        status_filter = query_params.get('status', [None])[0]
        
        conn = sqlite3.connect(DB_FILE)
        conn.row_factory = sqlite3.Row
        c = conn.cursor()
        
        if status_filter:
            c.execute("SELECT * FROM items WHERE status = ? ORDER BY created_at DESC", (status_filter,))
        else:
            c.execute("SELECT * FROM items ORDER BY created_at DESC")
            
        rows = c.fetchall()
        items = [dict(row) for row in rows]
        conn.close()
        
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(items).encode())

    def handle_login(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        data = json.loads(post_data)
        
        email = data.get('email')
        password = data.get('password')
        
        conn = sqlite3.connect(DB_FILE)
        conn.row_factory = sqlite3.Row
        c = conn.cursor()
        c.execute("SELECT * FROM users WHERE email = ? AND password = ?", (email, password))
        user = c.fetchone()
        conn.close()
        
        if user:
            user_dict = dict(user)
            del user_dict['password'] # Don't send password back
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(user_dict).encode())
        else:
            self.send_error(401, "Invalid credentials")

    def handle_register(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        data = json.loads(post_data)
        
        try:
            conn = sqlite3.connect(DB_FILE)
            c = conn.cursor()
            c.execute("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
                      (data['name'], data['email'], data['password'], 'user'))
            conn.commit()
            conn.close()
            
            self.send_response(201)
            self.end_headers()
            self.wfile.write(json.dumps({"message": "User registered"}).encode())
        except sqlite3.IntegrityError:
            self.send_error(409, "Email already exists")
        except Exception as e:
            self.send_error(500, str(e))

    def handle_create_item(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        data = json.loads(post_data)
        
        conn = sqlite3.connect(DB_FILE)
        c = conn.cursor()
        c.execute('''INSERT INTO items (type, name, category, location, date, description, contact, status)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)''',
                  (data['type'], data['name'], data['category'], data['location'], 
                   data['date'], data['description'], data['contact'], 'pending'))
        conn.commit()
        conn.close()
        
        self.send_response(201)
        self.end_headers()
        self.wfile.write(json.dumps({"message": "Item reported"}).encode())

    def handle_admin_action(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        data = json.loads(post_data)
        
        item_id = data.get('id')
        action = data.get('action') # 'accept' or 'reject'
        
        conn = sqlite3.connect(DB_FILE)
        c = conn.cursor()
        
        if action == 'accept':
            c.execute("UPDATE items SET status = 'verified' WHERE id = ?", (item_id,))
            print(f"Notification: Item {item_id} has been approved. Email sent to user.")
        elif action == 'reject':
            c.execute("DELETE FROM items WHERE id = ?", (item_id,))
            print(f"Notification: Item {item_id} has been rejected. Email sent to user.")
            
        conn.commit()
        conn.close()
        
        self.send_response(200)
        self.end_headers()
        self.wfile.write(json.dumps({"message": f"Item {action}ed"}).encode())

if __name__ == "__main__":
    init_db()
    with socketserver.TCPServer(("", PORT), MyRequestHandler) as httpd:
        print(f"Serving at http://localhost:{PORT}")
        httpd.serve_forever()
