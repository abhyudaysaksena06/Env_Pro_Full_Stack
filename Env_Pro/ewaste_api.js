document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("marketplaceCards");
    const statusDiv = document.getElementById("marketStatus");
    const searchInput = document.getElementById("searchInput");
    let allItems = [];

    const renderItems = (items) => {
        container.innerHTML = "";
        if (items.length === 0) {
            container.innerHTML = `<h3 style="color:var(--muted); text-align:center; width:100%; grid-column: 1/-1;">No E-Waste items match your search.</h3>`;
            return;
        }

        items.forEach((item, index) => {
            const card = document.createElement("div");
            card.className = "card fade-in delay-" + ((index % 3) + 1);
            
            // Cloudinary API handles URL CDNs natively; no backendBase mapping required!
            const photoHtml = item.photoUrl 
                ? `<div class="market-img" style="background-image:url('${item.photoUrl}'); background-size:cover; background-position:center; background-color:transparent;"></div>`
                : `<div class="market-img">📦</div>`;

            card.innerHTML = `
                <div>
                    ${photoHtml}
                    <div class="market-badge">${item.serialNumber || 'No SN'}</div>
                    <h3>${item.itemName}</h3>
                    <p style="font-size: 13px; color: var(--muted); margin-bottom:10px;">${item.description}</p>
                    <p style="font-size: 12px; color: var(--accent); font-weight:600;">• Listed by ${item.listedBy}</p>
                    <div class="market-price">${item.itemPrice}</div>
                </div>
                <button class="buy-btn" onclick="claimItem('${item._id}')">Claim & Contact Seller</button>
            `;
            container.appendChild(card);
        });

        setTimeout(() => {
            document.querySelectorAll('.card.fade-in').forEach(c => c.classList.add('visible'));
        }, 50);
    };

    if(searchInput) {
        searchInput.addEventListener("input", (e) => {
            const query = e.target.value.toLowerCase();
            const filtered = allItems.filter(item => 
                (item.itemName && item.itemName.toLowerCase().includes(query)) ||
                (item.description && item.description.toLowerCase().includes(query)) ||
                (item.serialNumber && item.serialNumber.toLowerCase().includes(query))
            );
            renderItems(filtered);
        });
    }

    // Dynamic IP mapping for mobile cross-device tracking
    const backendBase = 'https://env-pro-full-stack.onrender.com';

    // Fetch live inventory from local Node.js backend
    fetch(`${backendBase}/api/items`)
        .then(response => {
            if(!response.ok) throw new Error('Network response failed');
            return response.json();
        })
        .then(items => {
            if(statusDiv) statusDiv.style.display = 'none';
            allItems = items.reverse();
            renderItems(allItems);
        })
        .catch(err => {
            console.error('Failed to load marketplace:', err);
            if(statusDiv) {
                statusDiv.innerHTML = `Backend server unreachable.<br><br><b>Falling back to mock UI rendering.</b>`;
                statusDiv.style.color = '#ef4444';
            }
        });

    // Global Claim Function
    window.claimItem = async (itemId) => {
        const token = localStorage.getItem('token');
        if(!token) {
            alert("You must log in to claim items.");
            window.location.href = "login.html";
            return;
        }

        const btn = event.target;
        const originalText = btn.innerText;
        btn.innerText = "Processing...";
        btn.disabled = true;

        try {
            const res = await fetch(`${backendBase}/api/items/claim/${itemId}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if(!res.ok) throw new Error(data.error || "Claim failed");
            
            alert(data.message);
            btn.innerText = "Claimed ✓";
            btn.style.background = "#4ade80";
            btn.style.color = "#000";
        } catch(err) {
            alert(err.message);
            btn.innerText = originalText;
            btn.disabled = false;
        }
    };
});
