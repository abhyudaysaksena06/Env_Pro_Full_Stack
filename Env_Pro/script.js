const hostels = [
  { name: "HOSTEL H", score: 82 },
  { name: "HOSTEL M", score: 75 },
  { name: "HOSTEL E", score: 68 },
];

const individuals = [
  { name: "REDDIT USER", score: 85 },
  { name: "SAAAAAAANVI", score: 78 },
  { name: "INSTA USER", score: 74 },
];

function render(data, id) {
  const container = document.getElementById(id);
  if (!container) return; // Safety check in case elements do not exist on the current page

  data.sort((a, b) => b.score - a.score);

  data.forEach((item, i) => {
    const div = document.createElement("div");
    div.className = "card";
    if (i === 0) div.classList.add("top");

    div.innerHTML = `
    <div>#${i + 1}</div>
    <h3>${item.name}</h3>
    <p>${item.score}</p>
  `;

    container.appendChild(div);
  });
}

render(hostels, "hostelCards");
render(individuals, "individualCards");

/* DYNAMIC SCROLL COUNTERS */
const statsSection = document.getElementById('stats-section');
let countersStarted = false;

if (statsSection) {
  const statsObserver = new IntersectionObserver((entries) => {
    if(entries[0].isIntersecting && !countersStarted) {
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
        onStart: function() {
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

/* MOBILE MENU TOGGLE */
document.addEventListener("DOMContentLoaded", () => {
    const hamburger = document.querySelector(".hamburger");
    const menu = document.querySelector(".menu");
    if(hamburger && menu) {
        hamburger.addEventListener("click", () => {
            hamburger.classList.toggle("active");
            menu.classList.toggle("active");
        });
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
function calculateImpact() {
  const acHours = document.getElementById("acHours").value || 0;
  const distKm = document.getElementById("distKm").value || 0;
  const vehicleType = document.getElementById("vehicleType").value;

  // Constants (approximate kg CO2)
  const acCo2PerHour = 0.45;
  let transportCo2PerKm = 0;

  switch (vehicleType) {
    case "car": transportCo2PerKm = 0.15; break; // 150g/km
    case "bike": transportCo2PerKm = 0.05; break; // 50g/km
    case "auto": transportCo2PerKm = 0.10; break; // 100g/km
    case "ev": transportCo2PerKm = 0.02; break; // 20g/km (grid emissions)
  }

  const acImpact = (acHours * acCo2PerHour).toFixed(2);
  const transportImpact = (distKm * transportCo2PerKm).toFixed(2);
  const totalImpact = (parseFloat(acImpact) + parseFloat(transportImpact)).toFixed(2);

  let analogy = "";
  if (totalImpact > 0) {
    const mobileCharges = Math.round(totalImpact * 122); // 1kg CO2 = ~122 smartphone charges
    const treeAbsorption = (totalImpact / 21).toFixed(1); // 1 tree absorbs ~21kg CO2 per year

    analogy = `
      <p>Your footprint for these activities is <strong>${totalImpact} kg of CO2</strong>.</p>
      <br>
      <p>🌎 <strong>What does this mean?</strong></p>
      <p>This equals the emissions from charging a smartphone <strong>${mobileCharges} times</strong>.</p>
      <p>It would take a mature tree <strong>${treeAbsorption} years</strong> to absorb this much CO2.</p>
    `;
  } else {
    analogy = "<p>Please enter valid usage data to see your impact.</p>";
  }

const resultBox = document.getElementById("impactResult");
  resultBox.innerHTML = analogy;
  resultBox.style.display = "block";
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
