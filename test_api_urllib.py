import urllib.request
import urllib.parse
import json

BASE_URL = "http://localhost:8000/api"

def make_request(url, method='GET', data=None):
    req = urllib.request.Request(url, method=method)
    req.add_header('Content-Type', 'application/json')
    
    if data:
        json_data = json.dumps(data).encode('utf-8')
        req.data = json_data
        req.add_header('Content-Length', len(json_data))
        
    try:
        with urllib.request.urlopen(req) as response:
            return response.status, json.loads(response.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()
    except Exception as e:
        return 500, str(e)

def test_api():
    print("Testing API with urllib...")
    
    # 1. Register User
    print("\n1. Testing Registration...")
    reg_data = {
        "name": "Test User",
        "email": "test_urllib@example.com",
        "password": "password123"
    }
    status, res = make_request(f"{BASE_URL}/register", 'POST', reg_data)
    print(f"Register Status: {status}")

    # 2. Login User
    print("\n2. Testing Login...")
    login_data = {
        "email": "test_urllib@example.com",
        "password": "password123"
    }
    status, res = make_request(f"{BASE_URL}/login", 'POST', login_data)
    print(f"Login Status: {status}")
    if status == 200:
        print("Login Response:", res)

    # 3. Report Item
    print("\n3. Testing Report Item...")
    item_data = {
        "type": "lost",
        "name": "Test Wallet Urllib",
        "category": "wallet",
        "location": "Library",
        "date": "2025-11-30",
        "description": "Black leather wallet",
        "contact": "0300-0000000"
    }
    status, res = make_request(f"{BASE_URL}/items", 'POST', item_data)
    print(f"Report Status: {status}")

    # 4. Get Items (Pending)
    print("\n4. Testing Get Pending Items...")
    status, items = make_request(f"{BASE_URL}/items?status=pending")
    print(f"Pending Items Count: {len(items)}")
    
    if len(items) > 0:
        item_id = items[0]['id']
        print(f"Found Item ID: {item_id}")

        # 5. Admin Action (Approve)
        print("\n5. Testing Admin Approve...")
        action_data = {
            "id": item_id,
            "action": "accept"
        }
        status, res = make_request(f"{BASE_URL}/admin/action", 'POST', action_data)
        print(f"Admin Action Status: {status}")

    # 6. Get Items (Verified)
    print("\n6. Testing Get Verified Items...")
    status, items = make_request(f"{BASE_URL}/items?status=verified")
    print(f"Verified Items Count: {len(items)}")

if __name__ == "__main__":
    test_api()
