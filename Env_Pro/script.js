window.backendBase = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:')
  ? 'http://localhost:3000'
  : 'https://env-pro-full-stack.onrender.com';

function renderCards(data, id) {
  const container = document.getElementById(id);
  if (!container) return;
  container.innerHTML = ""; // Clear existing before rendering

  data.forEach((item, i) => {
    const div = document.createElement("div");
    div.className = "card";
    if (i === 0) div.classList.add("top");

    div.innerHTML = `
    <div>#${i + 1}</div>
    <h3 style="font-size:16px;">${item.name}</h3>
    <p>${item.score}</p>
  `;

    container.appendChild(div);
  });
}

async function loadHomeLeaderboards() {
  const hostelContainer = document.getElementById("hostelCards");
  const individualContainer = document.getElementById("individualCards");

  if (!hostelContainer || !individualContainer) return; // Only process on homepage!

  try {
    const [hRes, iRes] = await Promise.all([
      fetch(`${backendBase}/api/leaderboard/hostel`),
      fetch(`${backendBase}/api/leaderboard/individual`)
    ]);

    if (hRes.ok && iRes.ok) {
      const liveHostels = await hRes.json();
      const liveUsers = await iRes.json();

      let topHostels = liveHostels.map(h => ({ name: h.hostelName, score: h.totalScore })).sort((a, b) => b.score - a.score).slice(0, 3);
      let topUsers = liveUsers.map(u => ({ name: u.name, score: u.ecoScore })).sort((a, b) => b.score - a.score).slice(0, 3);

      // Failsafe rendering if DB is completely empty early on
      if (topHostels.length === 0) topHostels = [{ name: 'Hostel J', score: 100 }, { name: 'Hostel M', score: 80 }, { name: 'Hostel E', score: 60 }];
      if (topUsers.length === 0) topUsers = [{ name: 'Admin', score: 100 }, { name: 'Eco Warrior', score: 90 }, { name: 'Student', score: 80 }];

      renderCards(topHostels, "hostelCards");
      renderCards(topUsers, "individualCards");
    }
  } catch (err) {
    console.error("Home Leaderboard fetch failed, running mock fallbacks.", err);

    // Fallback to static lists
    const hostels = [{ name: "HOSTEL H", score: 82 }, { name: "HOSTEL M", score: 75 }, { name: "HOSTEL E", score: 68 }];
    const individuals = [{ name: "REDDIT USER", score: 85 }, { name: "SAAAAAAANVI", score: 78 }, { name: "INSTA USER", score: 74 }];
    renderCards(hostels, "hostelCards");
    renderCards(individuals, "individualCards");
  }
}
loadHomeLeaderboards();

/* DYNAMIC SCROLL COUNTERS */
const statsSection = document.getElementById('stats-section');
let countersStarted = false;

if (statsSection) {
  const statsObserver = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && !countersStarted) {
      countersStarted = true;
      document.querySelectorAll(".counter").forEach((counter) => {
        let target = +counter.dataset.target;
        let count = 0;
        let duration = 2000;
        let increment = target / (duration / 20);
        counter.innerText = "0";

        let update = () => {
          count += increment;
          if (count < target) {
            counter.innerText = Math.ceil(count);
            setTimeout(update, 20);
          } else {
            counter.innerText = target;
          }
        };
        // Add random slight stagger to counters popping off
        setTimeout(update, Math.random() * 400);
      });
    }
  }, { threshold: 0.4 });
  statsObserver.observe(statsSection);
}

/* CURSOR GLOW */
const glow = document.querySelector(".cursor-glow");
document.addEventListener("mousemove", (e) => {
  if (glow) {
    glow.style.left = e.clientX + "px";
    glow.style.top = e.clientY + "px";
  }
});

/* GSAP PRELOADER */
function initPreloader() {
  const loader = document.getElementById("loader");

  // Only show preloader once per session
  if (sessionStorage.getItem('preloaderShown') === 'true') {
    if (loader) loader.style.display = 'none';
    gsap.set(".nav-container, .hero, section, footer", { visibility: "visible" });
    return;
  }

  sessionStorage.setItem('preloaderShown', 'true');

  let tl = gsap.timeline();
  const words = document.querySelectorAll(".loader-text");

  // Sundown-style rolling text transition
  words.forEach((word) => {
    tl.to(word, {
      opacity: 1,
      y: "0%",
      duration: 0.5,
      ease: "power3.out"
    })
      .to(word, {
        opacity: 0,
        y: "-100%",
        duration: 0.4,
        ease: "power3.in"
      }, "+=0.2"); // Brief pause at center
  });

  // Final Wipe Reveal
  tl.to("#loader", {
    y: "-100%",
    duration: 1,
    ease: "expo.inOut",
    onStart: function () {
      gsap.set(".nav-container, .hero, section, footer", { visibility: "visible" });
    }
  }, "-=0.3");

  // Hero content entrance (if hero exists on page)
  if (document.querySelector(".hero")) {
    tl.from(".hero h1, .hero p", {
      y: 50,
      opacity: 0,
      duration: 0.8,
      stagger: 0.1,
      ease: "power4.out"
    }, "-=0.5");
  }
}

window.addEventListener("load", initPreloader);

/* MOBILE MENU TOGGLE AND AUTH POPUP */
document.addEventListener("DOMContentLoaded", () => {
  const hamburger = document.querySelector(".hamburger");
  const menu = document.querySelector(".menu");
  if (hamburger && menu) {
    hamburger.addEventListener("click", () => {
      hamburger.classList.toggle("active");
      menu.classList.toggle("active");
    });
  }

  // Global Login Prompt 
  const token = localStorage.getItem('token');
  const path = window.location.pathname;
  const isAuthPage = path.includes('login.html') || path.includes('register.html');

  if (!token && !isAuthPage && !sessionStorage.getItem('popupDismissed')) {
    const popup = document.createElement('div');
    popup.id = 'authPopup';
    popup.style.cssText = `
            position: fixed; 
            top: -300px; 
            right: 30px; 
            background: var(--nav-bg); 
            border: 1px solid var(--accent); 
            padding: 20px; 
            border-radius: 16px; 
            z-index: 999999; 
            box-shadow: 0 10px 30px rgba(0,0,0,0.5); 
            opacity: 0; 
            transition: top 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.5s ease;
            pointer-events: auto;
        `;
    popup.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px;">
                <h3 style="color:var(--text-main); font-size:18px;">Join GreenScore 🌱</h3>
                <button onclick="sessionStorage.setItem('popupDismissed', 'true'); document.getElementById('authPopup').style.display='none'" style="background:none; border:none; color:var(--muted); font-size:18px; cursor:pointer;" aria-label="Close">&times;</button>
            </div>
            <p style="color:var(--muted); font-size:14px; margin-bottom:15px; max-width:260px; line-height:1.4;">Log in to buy or sell E-Waste items, track your CO2 footprint, and climb the leaderboard!</p>
            <div style="display:flex; gap:10px;">
                <button onclick="window.location.href='login.html'" class="btn" style="padding:10px 20px; font-size:14px; width:100%; background:#4ade80; color:black; font-weight:600; text-align:center;">Secure Portal Login</button>
            </div>
        `;
    document.body.appendChild(popup);

    // Wait for preloader to finish, then slide in
    setTimeout(() => {
      popup.style.top = "25vh";
      popup.style.opacity = "1";
    }, 2500);
  }
});

/* ADMIN NAVBAR INJECTION */
document.addEventListener("DOMContentLoaded", () => {
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user && user.role === 'admin') {
        const navMenu = document.querySelector('.menu');
        if (navMenu && !document.querySelector('.admin-link')) {
          const adminLink = document.createElement('a');
          adminLink.href = "admin_dashboard.html";
          adminLink.className = "link admin-link";
          adminLink.style.color = "#ef4444";

          adminLink.innerHTML = `
                      <span class="link-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </span>
                      <span class="link-title" style="color:#ef4444;">Admin Portal</span>
                    `;
          navMenu.appendChild(adminLink);
        }
      }
    }
  } catch (e) {
    console.error("Admin eval bypass filter: ", e);
  }
});

/* SCROLL ANIMATION */
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
      }
    });
  },
  { threshold: 0.1 }
);

document.querySelectorAll(".fade-in").forEach((el) => {
  observer.observe(el);
});

/* IMPACT CALCULATOR */
function calculateTotalImpact() {
  const acHours = document.getElementById("acHours").value || 0;
  const distKm = document.getElementById("distKm").value || 0;
  const vehicleType = document.getElementById("vehicleType").value;
  const clothesKg = document.getElementById("clothesKg").value || 0;

  // Constants (approximate kg CO2)
  const acCo2PerHour = 0.45;
  let transportCo2PerKm = 0;

  switch (vehicleType) {
    case "car": transportCo2PerKm = 0.15; break; // 150g/km
    case "bike": transportCo2PerKm = 0.05; break; // 50g/km
    case "auto": transportCo2PerKm = 0.10; break; // 100g/km
    case "ev": transportCo2PerKm = 0.02; break; // 20g/km (grid emissions)
    case "bus": transportCo2PerKm = 0.04; break; // 40g/km
  }

  const acImpact = (acHours * acCo2PerHour).toFixed(2);
  const transportImpact = (distKm * transportCo2PerKm).toFixed(2);
  const totalCo2 = (parseFloat(acImpact) + parseFloat(transportImpact)).toFixed(2);

  const waterPerKg = 15; // ~15 liters of water per kg of clothes
  const totalWater = (clothesKg * waterPerKg).toFixed(1);

  // Averages for comparison
  const avgCo2 = 6; // daily average kg CO2
  const avgWater = 20; // daily average liters for washing

  let result = "";
  if (totalCo2 > 0 || totalWater > 0) {
    const co2Comparison = totalCo2 > avgCo2
      ? `<span style="color: #ef4444;">higher than the average (${avgCo2} kg) ⚠️</span>`
      : (totalCo2 == avgCo2 ? `<span style="color: #eab308;">equal to the average ⚖️</span>` : `<span style="color: #4ade80;">lower than the average (${avgCo2} kg) 🌟</span>`);

    const waterComparison = totalWater > avgWater
      ? `<span style="color: #ef4444;">higher than the average (${avgWater} L) ⚠️</span>`
      : (totalWater == avgWater ? `<span style="color: #eab308;">equal to the average ⚖️</span>` : `<span style="color: #4ade80;">lower than the average (${avgWater} L) 🌟</span>`);

    result = `
      <p>🌬️ <strong>Carbon Footprint:</strong> ${totalCo2} kg CO2</p>
      <p style="font-size: 14px; margin-bottom: 12px;">This is ${co2Comparison}</p>
      
      <p>💧 <strong>Water Footprint:</strong> ${totalWater} Liters</p>
      <p style="font-size: 14px;">This is ${waterComparison}</p>
    `;
  } else {
    result = "<p>Please enter valid usage data to see your impact.</p>";
  }

  const resultBox = document.getElementById("totalImpactResult");
  if (resultBox) {
    resultBox.innerHTML = result;
    resultBox.style.display = "block";
  }
}

/* NAVBAR SCROLL */
const navContainer = document.getElementById('navContainer');
if (navContainer) {
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navContainer.classList.add('scrolled');
    } else {
      navContainer.classList.remove('scrolled');
    }
  });
}
