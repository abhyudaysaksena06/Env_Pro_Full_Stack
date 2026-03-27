document.addEventListener("DOMContentLoaded", () => {
    // 1. DATA MOCKING (14 Hostels) 
    const TIET_HOSTELS = [
        "Hostel J", "Hostel H", "Hostel M", "Hostel E", 
        "Hostel G", "Hostel C", "Hostel A", "Hostel B", 
        "Hostel D", "Hostel I", "Hostel K", "Hostel L", 
        "Hostel N", "Hostel O"
    ];

    // Seed data 
    // WaterSaved: Higher is better (Liters)
    // FoodWaste: Lower is better (Kg)
    // co2: Lower is better (Kg)
    const hostelData = TIET_HOSTELS.map(name => {
        let water = Math.floor(Math.random() * 900) + 150;
        let food = Math.floor(Math.random() * 85) + 5;
        let carbon = Math.floor(Math.random() * 400) + 40;
        
        // Artificial composite score algorithm based on the randomly generated values
        let score = Math.floor(((water / 1000) * 30) + ((100 - food) * 0.4) + ((500 - carbon) * 0.06));
        
        return { name, score, waterSaved: water, foodWaste: food, co2: carbon };
    });

    // Generate 15 fake individuals 
    const individualsData = Array.from({length: 15}, (_, i) => ({
        name: `TIET Student ${i+1}`,
        hostel: TIET_HOSTELS[Math.floor(Math.random() * TIET_HOSTELS.length)],
        hostelRating: (Math.random() * 1.5 + 3.5).toFixed(1), // Between 3.5 and 5.0
        co2: Math.floor(Math.random() * 40) + 8 // Between 8 and 48 kg
    }));

    // 2. RENDER LOGIC
    function renderCards(data, containerId, sortFn, limit = null, isIndividual = false) {
        const container = document.getElementById(containerId);
        if(!container) return;
        container.innerHTML = ''; // wipe existing
        
        // Clone & sort
        let sortedData = [...data].sort(sortFn);
        
        // Render Analytics Chart universally mapping to Top 5 subset payload
        let canvasId = containerId.replace('Cards', ''); 
        canvasId = 'chart' + canvasId.charAt(0).toUpperCase() + canvasId.slice(1);
        
        let chartData = sortedData.slice(0, 5); 
        if(!isIndividual) {
            let metricKey = 'score'; let label = 'Overall Score'; let color = '#4ade80';
            if(containerId === 'waterCards') { metricKey = 'waterSaved'; label = 'Liters Saved'; color = '#0ea5e9'; }
            if(containerId === 'foodCards') { metricKey = 'foodWaste'; label = 'Kg Wasted'; color = '#ef4444'; }
            if(containerId === 'co2Cards') { metricKey = 'co2'; label = 'Kg CO2'; color = '#f59e0b'; }
            renderChart(canvasId, chartData, metricKey, label, color);
        } else {
            renderChart(canvasId, chartData, 'co2', 'CO2 Emitted', '#f59e0b');
        }

        if(limit) sortedData = sortedData.slice(0, limit);

        sortedData.forEach((item, i) => {
            const div = document.createElement("div");
            div.className = "card";
            if(i === 0) div.classList.add("top"); // Highlight #1

            // Inject inline animation capping the initial load stagger so hovered cards appear rapidly
            div.style.animation = `fadeInTab 0.4s ease forwards ${Math.min(i, 4) * 0.05}s`;
            div.style.opacity = "0";

            if(isIndividual) {
                div.innerHTML = `
                    <div>#${i + 1}</div>
                    <h3>${item.name}</h3>
                    <p style="font-size: 13px; color: var(--muted); margin-bottom: 8px;">${item.hostel}</p>
                    <div style="display:flex; justify-content:space-between; margin-top:10px; font-weight:600;">
                        <span>⭐ ${item.hostelRating}</span>
                        <span>🌫 ${item.co2}kg</span>
                    </div>
                `;
            } else {
                let mainScore = item.score + " pts"; 
                if(containerId === 'waterCards') mainScore = item.waterSaved + "L Saved";
                if(containerId === 'foodCards') mainScore = item.foodWaste + "kg Wasted";
                if(containerId === 'co2Cards') mainScore = item.co2 + "kg CO2 Emitted";

                const tooltipHtml = `
                    <div class="hover-details">
                        <div style="margin-bottom:8px; border-bottom:1px solid var(--accent); padding-bottom:5px;"><strong>${item.name} Breakdown</strong></div>
                        <div>🏆 Rating: ${item.score}/100</div>
                        <div>💧 Water Preserved: ${item.waterSaved}L</div>
                        <div>♻️ Food Ignored: ${item.foodWaste}kg</div>
                        <div>🌫️ Total Carbon: ${item.co2}kg</div>
                    </div>
                `;

                div.innerHTML = `
                    ${tooltipHtml}
                    <div>#${i + 1}</div>
                    <h3>${item.name}</h3>
                    <p style="font-size: 20px; font-weight:700; color:var(--accent); margin-top:5px;">${mainScore}</p>
                `;
            }
            container.appendChild(div);
        });
    }

    // 3. UI STATE MANAGEMENT
    // Render all elements automatically; CSS cleanly hides child components past the top 5 to enable hover-expansion!
    
    renderCards(hostelData, 'cumulatedCards', (a, b) => b.score - a.score, TIET_HOSTELS.length);
    renderCards(hostelData, 'waterCards', (a, b) => b.waterSaved - a.waterSaved, TIET_HOSTELS.length); 
    renderCards(hostelData, 'foodCards', (a, b) => a.foodWaste - b.foodWaste, TIET_HOSTELS.length);    
    renderCards(hostelData, 'co2Cards', (a, b) => a.co2 - b.co2, TIET_HOSTELS.length);                
    
    renderCards(individualsData, 'individualCards', (a, b) => {
        let scoreA = parseFloat(a.hostelRating) - (a.co2 / 30);
        let scoreB = parseFloat(b.hostelRating) - (b.co2 / 30);
        return scoreB - scoreA;
    }, 10, true);

    // 4. ANALYTICS RENDERER
    function renderChart(canvasId, chartData, metricKey, label, color) {
        const ctx = document.getElementById(canvasId);
        if(!ctx) return;
        
        const existingChart = Chart.getChart(canvasId);
        if (existingChart) existingChart.destroy();

        const labels = chartData.map(item => item.name);
        const dataPoints = chartData.map(item => item[metricKey]);

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: label,
                    data: dataPoints,
                    backgroundColor: color + '80', // 50% transparency overlay
                    borderColor: color,
                    borderWidth: 1,
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { ticks: { color: getTextColor() } },
                    y: { ticks: { color: getTextColor() } }
                }
            }
        });
    }

    function getTextColor() {
        return document.documentElement.getAttribute('data-theme') === 'light' ? '#0f172a' : '#94a3b8';
    }

    // EXPAND TOGGLE LOGIC
    const toggles = document.querySelectorAll('.expand-toggle');
    toggles.forEach(toggle => {
        toggle.addEventListener('click', (e) => {
            const section = e.target.closest('.leaderboard-section');
            if (section) {
                section.classList.toggle('expanded');
                if(section.classList.contains('expanded')) {
                    e.target.innerText = "Click to collapse ▲";
                } else {
                    e.target.innerText = "Click to see all rankings ▼";
                }
            }
        });
    });
});
