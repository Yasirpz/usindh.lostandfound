import requests
import json
import time

BASE_URL = "http://localhost:8000/api"

def test_api():
    print("Testing API...")
    
    # 1. Register User
    print("\n1. Testing Registration...")
    reg_data = {
        "name": "Test User",
        "email": "test@example.com",
        "password": "password123"
    }
    try:
        res = requests.post(f"{BASE_URL}/register", json=reg_data)
        print(f"Register Status: {res.status_code}")
    except Exception as e:
        print(f"Registration failed (might already exist): {e}")

    # 2. Login User
    print("\n2. Testing Login...")
    login_data = {
        "email": "test@example.com",
        "password": "password123"
    }
    res = requests.post(f"{BASE_URL}/login", json=login_data)
    print(f"Login Status: {res.status_code}")
    if res.status_code == 200:
        print("Login Response:", res.json())

    # 3. Report Item
    print("\n3. Testing Report Item...")
    item_data = {
        "type": "lost",
        "name": "Test Wallet",
        "category": "wallet",
        "location": "Library",
        "date": "2025-11-30",
        "description": "Black leather wallet",
        "contact": "0300-0000000"
    }
    res = requests.post(f"{BASE_URL}/items", json=item_data)
    print(f"Report Status: {res.status_code}")

    # 4. Get Items (Pending)
    print("\n4. Testing Get Pending Items...")
    res = requests.get(f"{BASE_URL}/items?status=pending")
    items = res.json()
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
        res = requests.post(f"{BASE_URL}/admin/action", json=action_data)
        print(f"Admin Action Status: {res.status_code}")

    # 6. Get Items (Verified)
    print("\n6. Testing Get Verified Items...")
    res = requests.get(f"{BASE_URL}/items?status=verified")
    items = res.json()
    print(f"Verified Items Count: {len(items)}")

if __name__ == "__main__":
    try:
        test_api()
    except Exception as e:
        print(f"Test failed: {e}")
