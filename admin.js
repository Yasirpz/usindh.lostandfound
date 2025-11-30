// Admin Dashboard Logic

// Check if admin is logged in
const currentUser = JSON.parse(localStorage.getItem('uos_currentUser'));
const token = localStorage.getItem('uos_token');

if (!currentUser || currentUser.role !== 'admin' || !token) {
    alert('Access Denied. Admin only.');
    window.location.href = 'login.html';
}

function logout() {
    localStorage.removeItem('uos_currentUser');
    localStorage.removeItem('uos_token');
    window.location.href = 'login.html';
}

document.addEventListener('DOMContentLoaded', () => {
    loadPendingItems();
});

async function loadPendingItems() {
    const pendingContainer = document.getElementById('pending-items-container');
    pendingContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">Loading...</p>';

    try {
        const response = await fetch('http://localhost:3000/api/admin/items', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Failed to fetch items');

        const allItems = await response.json();
        const pendingItems = allItems.filter(item => item.status === 'pending');

        pendingContainer.innerHTML = '';

        if (pendingItems.length === 0) {
            pendingContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #666;">No pending items to review.</p>';
        } else {
            pendingItems.forEach(item => {
                const card = document.createElement('div');
                card.className = `item-card ${item.type}`;
                card.style.position = 'relative';
                card.style.backgroundColor = 'white';
                card.style.borderRadius = '8px';
                card.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';
                card.style.overflow = 'hidden';

                card.innerHTML = `
                <div class="card-body" style="padding: 15px;">
                    <span class="badge ${item.type}" style="display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: bold; margin-bottom: 10px; ${item.type === 'lost' ? 'background: #ffebee; color: #c62828;' : 'background: #e8f5e9; color: #2e7d32;'}">${item.type.toUpperCase()}</span>
                    <span class="status-badge status-pending">PENDING</span>
                    <h3 class="card-title" style="margin: 0 0 10px 0; font-size: 1.2rem;">${item.name}</h3>
                    <div class="card-info" style="margin-bottom: 5px; color: #666;">
                        <i class="fa-solid fa-location-dot"></i> ${item.location}
                    </div>
                    <div class="card-info" style="margin-bottom: 5px; color: #666;">
                        <i class="fa-regular fa-calendar"></i> ${item.date}
                    </div>
                    <div class="card-info" style="margin-bottom: 5px; color: #666;">
                        <i class="fa-solid fa-tag"></i> ${item.category}
                    </div>
                    <p style="margin: 10px 0; color: #555;">${item.description}</p>
                    <div style="margin-top: 10px; font-size: 0.9rem; border-top: 1px solid #eee; padding-top: 10px;">
                        <strong>Reported by:</strong> ${item.contact}
                    </div>
                    <div class="admin-controls">
                        <button onclick="updateItemStatus('${item.id}', 'approved')" class="btn btn-primary"
                            style="padding: 8px 15px; font-size: 0.9rem; background-color: var(--primary); color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 5px;">Verify</button>
                        <button onclick="updateItemStatus('${item.id}', 'rejected')" class="btn btn-danger"
                            style="padding: 8px 15px; font-size: 0.9rem; background-color: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">Reject</button>
                    </div>
                </div>
                `;
                pendingContainer.appendChild(card);
            });
        }
    } catch (error) {
        console.error('Error:', error);
        pendingContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: red;">Error loading items. Is server running?</p>';
    }
}

async function updateItemStatus(id, status) {
    if (!confirm(`Are you sure you want to ${status === 'approved' ? 'verify' : 'reject'} this item?`)) return;

    try {
        const response = await fetch(`http://localhost:3000/api/admin/items/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status })
        });

        if (response.ok) {
            alert(`Item ${status} successfully!`);
            loadPendingItems();
        } else {
            alert('Error updating item.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Server error.');
    }
}
