document.addEventListener("DOMContentLoaded", () => {
    // --- 1. AUTHENTICATION LOGIC ---
    const backendBase = 'https://env-pro-full-stack.onrender.com';
    const token = localStorage.getItem('token');
    
    if(!token) {
        // Just return to let the hardcoded Guest Mode HTML render natively
        return;
    }

    // Valid token found: Hide Guest Blocks, Show Authorized Sub-Panels
    document.getElementById('detailsGuest').style.display = 'none';
    document.getElementById('detailsAuth').style.display = 'grid';
    document.getElementById('editProfileBtn').style.display = 'block';
    
    document.getElementById('listingsGuest').style.display = 'none';
    document.getElementById('listingsAuth').style.display = 'block';
    
    document.getElementById('performanceGuest').style.display = 'none';
    document.getElementById('performanceAuth').style.display = 'block';

    fetch(`${backendBase}/api/users/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => {
        if(!res.ok) {
            localStorage.removeItem('token');
            window.location.reload();
            throw new Error("Session expired - reverting to guest status");
        }
        return res.json();
    })
    .then(user => {
        document.getElementById('profileInitials').innerText = user.name.substring(0,2).toUpperCase();
        document.getElementById('profileName').innerText = user.name;
        document.getElementById('profileBadge').innerText = `GreenScore - ${user.ecoScore} Points 🌿`;
        document.getElementById('profileBadge').style.display = 'block';

        const inputs = document.querySelectorAll('.input-group input');
        if(inputs.length >= 5) {
            inputs[0].value = user.name;      // Full Name
            inputs[1].value = user.rollNumber || "N/A"; // Roll No 
            inputs[2].value = user.email;     // Email
            inputs[3].value = user.hostelName || "Day Scholar"; // Hostel
            inputs[4].value = user.phone || "Not Provided"; // Phone
        }

        if(user.role === 'admin') {
            const navMenu = document.querySelector('.menu');
            if(navMenu) {
                const adminLink = document.createElement('a');
                adminLink.href = "admin_dashboard.html";
                adminLink.className = "link admin-link";
                adminLink.style.color = "#ef4444";
                adminLink.innerHTML = `<span class="link-title">Admin Dash</span>`;
                navMenu.appendChild(adminLink);
            }
        }

        // Fetch User's Active Listings 
        fetch(`${backendBase}/api/items`)
            .then(r => r.json())
            .then(items => {
                const myListings = items.filter(i => i.listedBy === user.name);
                const container = document.getElementById('myListingsContainer');
                container.innerHTML = "";
                
                if(myListings.length === 0) {
                    container.innerHTML = `<p style="color:var(--muted); width:100%; grid-column:1/-1;">You have no active items on the GreenScore marketplace.</p>`;
                } else {
                    myListings.forEach(item => {
                        const card = document.createElement('div');
                        card.className = 'card';
                        card.style = "background: rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); padding:15px; border-radius:16px;";
                        card.innerHTML = `
                            <div style="width:100%; height:120px; background-image:url('${item.photoUrl || ''}'); background-size:cover; background-position:center; border-radius:12px; margin-bottom:10px; background-color:rgba(255,255,255,0.05);"></div>
                            <h3 style="font-size:18px;">${item.itemName}</h3>
                            <p style="color:var(--accent); font-weight:700; margin-bottom:15px;">${item.itemPrice}</p>
                            <button onclick="deleteListing('${item._id}')" style="width:100%; padding:10px; background:rgba(239,68,68,0.2); color:#ef4444; border:1px solid #ef4444; border-radius:8px; cursor:pointer;" onmouseover="this.style.background='#ef4444'; this.style.color='#fff';" onmouseout="this.style.background='rgba(239,68,68,0.2)'; this.style.color='#ef4444';">Mark Sold / Remove</button>
                        `;
                        container.appendChild(card);
                    });
                }
            });

        // Expose global deletion function for the buttons
        window.deleteListing = async (itemId) => {
            if(!confirm("Are you sure you want to remove this item permanently from the marketplace?")) return;
            try {
                const dr = await fetch(`${backendBase}/api/items/${itemId}`, { 
                    method: 'DELETE', 
                    headers: { 'Authorization': `Bearer ${token}` } 
                });
                if(dr.ok) { window.location.reload(); } else { alert("Failed to delete."); }
            } catch(e) { alert(e.message); }
        };

    })
    .catch(err => {
        console.error(err);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = "login.html";
    });

    // 1. TABS LOGIC
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            const target = btn.getAttribute('data-tab');
            document.getElementById(target).classList.add('active');

            if(target === 'performance' && greenChart) {
                // Must explicitly update chart sizes when unhidden
                greenChart.resize();
            }
        });
    });

    // 2. SETTINGS LOGIC
    const themeToggle = document.getElementById('themeToggle');
    const textToggle = document.getElementById('textSizeToggle');

    // Sync toggle UI to local storage loaded preference
    if (localStorage.getItem('theme') === 'light' && themeToggle) {
        themeToggle.checked = true;
    }
    
    if (localStorage.getItem('text-size') === 'large' && textToggle) {
        textToggle.checked = true;
    }

    // Toggle listeners map DOM interactions directly to Local Storage
    if(themeToggle) {
        themeToggle.addEventListener('change', (e) => {
            if (e.target.checked) {
                document.documentElement.setAttribute('data-theme', 'light');
                localStorage.setItem('theme', 'light');
            } else {
                document.documentElement.removeAttribute('data-theme');
                localStorage.setItem('theme', 'dark');
            }
            if(greenChart) updateChartTheme();
        });
    }

    if(textToggle) {
        textToggle.addEventListener('change', (e) => {
            if (e.target.checked) {
                document.documentElement.setAttribute('data-text', 'large');
                localStorage.setItem('text-size', 'large');
            } else {
                document.documentElement.removeAttribute('data-text');
                localStorage.setItem('text-size', 'normal');
            }
        });
    }

    // 3. CHART.JS INITIALIZATION (AI Performance Mocks)
    const ctx = document.getElementById('performanceChart');
    let greenChart = null;

    if (ctx) {
        const data = {
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
            datasets: [
                {
                    label: 'Carbon Saved (kg)',
                    data: [12, 19, 15, 25],
                    borderColor: '#4ade80',
                    backgroundColor: 'rgba(74, 222, 128, 0.2)',
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Water Saved (L)',
                    data: [30, 45, 40, 60],
                    borderColor: '#0ea5e9',
                    backgroundColor: 'rgba(14, 165, 233, 0.2)',
                    fill: true,
                    tension: 0.4
                }
            ]
        };

        const config = {
            type: 'line',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { labels: { color: getTextColor() } }
                },
                scales: {
                    x: { ticks: { color: getTextColor() } },
                    y: { ticks: { color: getTextColor() } }
                }
            }
        };

        greenChart = new Chart(ctx, config);

        function updateChartTheme() {
            const color = getTextColor();
            greenChart.options.plugins.legend.labels.color = color;
            greenChart.options.scales.x.ticks.color = color;
            greenChart.options.scales.y.ticks.color = color;
            greenChart.update();
        }

        function getTextColor() {
            return document.documentElement.getAttribute('data-theme') === 'light' ? '#0f172a' : '#94a3b8';
        }
    }
});
