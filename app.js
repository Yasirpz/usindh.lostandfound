```javascript
// API Configuration
const API_URL = 'http://localhost:3000/api';

// DOM Elements
const itemsContainer = document.getElementById('items-container');
const reportForm = document.getElementById('report-form');
const filterType = document.getElementById('filter-type');
const filterCategory = document.getElementById('filter-category');

// --- Helper: Auth Header ---
function getAuthHeaders() {
    const token = localStorage.getItem('uos_token');
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${ token } ` : ''
    };
}

// --- Functions ---

async function loadItems() {
    if (!itemsContainer) return;

    try {
        // Fetch all items initially
        let url = `${ API_URL }/items`;

// Apply filters if they exist
if (filterType && filterCategory) {
    const typeValue = filterType.value;
    const categoryValue = filterCategory.value;

    const params = new URLSearchParams();
    if (typeValue !== 'all') {
        params.append('type', typeValue);
    }
    if (categoryValue !== 'all') {
        params.append('category', categoryValue);
    }
    if (params.toString()) {
        url += `?${params.toString()}`;
    }
}

const response = await fetch(url);
if (!response.ok) throw new Error('Failed to fetch items');

const items = await response.json();
renderItems(items);
    } catch (error) {
    console.error('Error loading items:', error);
    itemsContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: red;">Error loading items. Is the server running?</p>';
}
}

function renderItems(itemsToRender) {
    itemsContainer.innerHTML = '';

    if (itemsToRender.length === 0) {
        itemsContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">No items found.</p>';
        return;
    }

    itemsToRender.forEach(item => {
        const card = document.createElement('div');
        card.className = `item-card ${item.type}`;

        card.innerHTML = `
            <div class="card-body">
                <span class="badge ${item.type}">${item.type.toUpperCase()}</span>
                <h3 class="card-title">${item.name}</h3>
                <div class="card-info">
                    <i class="fa-solid fa-location-dot"></i> ${item.location}
                </div>
                <div class="card-info">
                    <i class="fa-regular fa-calendar"></i> ${new Date(item.date).toLocaleDateString()}
                </div>
                <div class="card-info">
                    <i class="fa-solid fa-tag"></i> ${item.category}
                </div>
                <p style="margin: 10px 0; color: #555;">${item.description}</p>
                <div style="margin-top: 15px; padding-top: 10px; border-top: 1px solid #eee;">
                    <strong>Contact:</strong> ${item.contact}
                </div>
            </div>
        `;
        itemsContainer.appendChild(card);
    });
}

async function handleReportSubmit(e) {
    e.preventDefault();

    const formData = new FormData(reportForm);
    const newItem = {
        type: formData.get('type'),
        name: formData.get('name'),
        category: formData.get('category'),
        location: formData.get('location'),
        date: formData.get('date'),
        description: formData.get('description'),
        contact: formData.get('contact')
    };

    try {
        const response = await fetch(`${API_URL}/items`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(newItem)
        });

        if (response.ok) {
            alert('Report submitted successfully! It will be visible after verification.');
            window.location.href = 'items.html';
        } else {
            const errorData = await response.json();
            alert(`Error submitting report: ${errorData.message || response.statusText}`);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Server error.');
    }
}

// --- Auth Functions ---

async function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    const confirmPassword = document.getElementById('reg-confirm-password').value;

    if (password !== confirmPassword) {
        alert("Passwords do not match!");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });

        const data = await response.json();

        if (response.ok) {
            alert("Registration successful! Please login.");
            window.location.href = 'login.html';
        } else {
            alert(data.message || "Registration failed.");
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred during registration.');
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('uos_token', data.token);
            localStorage.setItem('uos_currentUser', JSON.stringify(data.user));

            if (data.user.role === 'admin') {
                alert("Welcome Admin!");
                window.location.href = 'admin.html';
            } else {
                alert(`Welcome back, ${data.user.name}!`);
                window.location.href = 'index.html';
            }
        } else {
            alert(data.message || "Login failed");
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Server error during login.');
    }
}

function logout() {
    localStorage.removeItem('uos_token');
    localStorage.removeItem('uos_currentUser');
    window.location.href = 'login.html';
}

function checkAuth() {
    const currentUser = JSON.parse(localStorage.getItem('uos_currentUser'));
    const navList = document.querySelector('.main-nav ul');

    if (currentUser) {
        if (navList) {
            let navLinks = `
                <li><a href="index.html">Home</a></li>
                <li><a href="items.html">Browse Items</a></li>
                <li><a href="report.html">Report Item</a></li>
            `;

            if (currentUser.role === 'admin') {
                navLinks += `<li><a href="admin.html" style="color: var(--warning);">Admin Dashboard</a></li>`;
            }

            navLinks += `<li><a href="#" onclick="logout()">Logout (${currentUser.name})</a></li>`;
            navList.innerHTML = navLinks;
        }

        // Protect report page if not logged in (though this check is for logged in state)
        // This logic was previously for non-logged in users, now it's implicitly handled by the report form's auth check
    } else {
        if (navList) {
            navList.innerHTML = `
                <li><a href="index.html">Home</a></li>
                <li><a href="items.html">Browse Items</a></li>
                <li><a href="login.html">Login</a></li>
                <li><a href="register.html">Register</a></li>
            `;
        }

        // Protect report page
        if (window.location.pathname.includes('report.html')) {
            alert("You must be logged in to report an item.");
            window.location.href = 'login.html';
        }
    }

    // Highlight active link
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    const links = document.querySelectorAll('.main-nav a');
    links.forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active');
        }
    });
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    loadItems();
    checkAuth();
});

if (reportForm) {
    reportForm.addEventListener('submit', handleReportSubmit);
}

if (filterType) {
    filterType.addEventListener('change', loadItems); // Reload items to apply filters
}

if (filterCategory) {
    filterCategory.addEventListener('change', loadItems); // Reload items to apply filters
}

const registerForm = document.getElementById('register-form');
const loginForm = document.getElementById('login-form');

if (registerForm) {
    registerForm.addEventListener('submit', handleRegister);
}

if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
}
```
