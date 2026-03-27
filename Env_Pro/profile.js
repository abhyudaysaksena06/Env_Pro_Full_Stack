document.addEventListener("DOMContentLoaded", () => {
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
