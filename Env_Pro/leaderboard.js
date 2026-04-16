document.addEventListener("DOMContentLoaded", () => {
    const backendBase = window.backendBase;

    // 2. RENDER LOGIC
    function renderCards(data, containerId, sortFn, limit = null, isIndividual = false) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = ''; // wipe existing

        // Clone & sort
        let sortedData = [...data].sort(sortFn);

        // Render Analytics Chart universally mapping to Top 5 subset payload
        let canvasId = containerId.replace('Cards', '');
        canvasId = 'chart' + canvasId.charAt(0).toUpperCase() + canvasId.slice(1);

        let chartData = sortedData.slice(0, 5);
        if (!isIndividual) {
            let metricKey = 'score'; let label = 'Overall Score'; let color = '#4ade80';
            if (containerId === 'waterCards') { metricKey = 'waterWasted'; label = 'Liters Wasted'; color = '#0ea5e9'; }
            if (containerId === 'foodCards') { metricKey = 'foodWaste'; label = 'Kg Wasted'; color = '#ef4444'; }
            if (containerId === 'co2Cards') { metricKey = 'co2'; label = 'Kg CO2'; color = '#f59e0b'; }
            renderChart(canvasId, chartData, metricKey, label, color);
        } else {
            renderChart(canvasId, chartData, 'co2', 'CO2 Emitted', '#f59e0b');
        }

        if (limit) sortedData = sortedData.slice(0, limit);

        sortedData.forEach((item, i) => {
            const div = document.createElement("div");
            div.className = "card";
            if (i === 0) div.classList.add("top"); // Highlight #1

            // Inject inline animation capping the initial load stagger so hovered cards appear rapidly
            div.style.animation = `fadeInTab 0.4s ease forwards ${Math.min(i, 4) * 0.05}s`;
            div.style.opacity = "0";

            if (isIndividual) {
                div.innerHTML = `
                    <div>#${i + 1}</div>
                    <h3>${item.name}</h3>
                    <p style="font-size: 13px; color: var(--muted); margin-bottom: 8px;">${item.hostel}</p>
                    <div style="display:flex; justify-content:space-between; margin-top:8px; font-size:12px; font-weight:600; color:#ddd;">
                        <span>💧 ${item.waterSaved}L</span>
                        <span>♻️ ${item.foodSaved}kg</span>
                        <span>🌫 ${item.co2}kg</span>
                    </div>
                    <div style="margin-top:8px; font-weight:bold; color:var(--accent);">
                        ⭐ ${item.hostelRating} User Rating
                    </div>
                `;
            } else {
                let mainScore = item.score + " pts";
                if (containerId === 'waterCards') mainScore = item.waterWasted + "L Wasted";
                if (containerId === 'foodCards') mainScore = item.foodWaste + "kg Wasted";
                if (containerId === 'co2Cards') mainScore = item.co2 + "kg CO2 Emitted";

                const tooltipHtml = `
                    <div class="hover-details">
                        <div style="margin-bottom:8px; border-bottom:1px solid var(--accent); padding-bottom:5px;"><strong>${item.name} Breakdown</strong></div>
                        <div>🏆 Rating: ${item.score}/100</div>
                        <div>💧 Water Wasted: ${item.waterWasted}L</div>
                        <div>♻️ Food Wasted: ${item.foodWaste}kg</div>
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
    async function loadLeaderboards() {
        try {
            const [hostelRes, userRes] = await Promise.all([
                fetch(`${backendBase}/api/leaderboard/hostel`),
                fetch(`${backendBase}/api/leaderboard/individual`)
            ]);
            let liveHostels = [];
            let liveUsers = [];
            if (hostelRes.ok) liveHostels = await hostelRes.json();
            if (userRes.ok) liveUsers = await userRes.json();

            // If empty, supply a fallback dummy row so UI doesn't crash empty
            if (liveHostels.length === 0) liveHostels = [{ hostelName: 'Hostel J', totalScore: 100 }];
            if (liveUsers.length === 0) liveUsers = [{ name: 'Admin', hostelName: 'Hostel J', ecoScore: 100 }];

            const hostelData = liveHostels.map(h => {
                const w = h.waterWastedLiters || 0;
                const f = h.foodWastedKg || 0;
                const c = h.co2EmittedKg || 0;
                // Formulate authoritative Master Leaderboard Rating based on weighted penalties
                const calculatedScore = Math.max(0, Math.floor(1000 - (w * 0.05) - (f * 3) - (c * 1)));

                return {
                    name: h.hostelName,
                    score: calculatedScore,
                    waterWasted: w,
                    foodWaste: f,
                    co2: c
                };
            });

            const individualsData = liveUsers.map(u => ({
                name: u.name,
                hostel: u.hostelName || "Day Scholar",
                hostelRating: Math.min(5, (u.ecoScore / 20)).toFixed(1), // dynamic rating 1-5 scale
                waterSaved: (u.ecoScore * 2.5).toFixed(1),
                foodSaved: (u.ecoScore * 0.4).toFixed(1),
                co2: Math.max(0, (150 - (u.ecoScore * 1.5))).toFixed(1),
                score: u.ecoScore
            }));

            renderCards(hostelData, 'cumulatedCards', (a, b) => b.score - a.score, hostelData.length);
            renderCards(hostelData, 'waterCards', (a, b) => a.waterWasted - b.waterWasted, hostelData.length);
            renderCards(hostelData, 'foodCards', (a, b) => a.foodWaste - b.foodWaste, hostelData.length);
            renderCards(hostelData, 'co2Cards', (a, b) => a.co2 - b.co2, hostelData.length);

            renderCards(individualsData, 'individualCards', (a, b) => b.score - a.score, 10, true);
        } catch (err) {
            console.error("Failed to load leaderboards:", err);
        }
    }

    // Automatically fetch on page load
    loadLeaderboards();

    // 4. ANALYTICS RENDERER
    function renderChart(canvasId, chartData, metricKey, label, color) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;

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
                if (section.classList.contains('expanded')) {
                    e.target.innerText = "Click to collapse ▲";
                } else {
                    e.target.innerText = "Click to see all rankings ▼";
                }
            }
        });
    });
});
