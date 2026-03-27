document.addEventListener("DOMContentLoaded", () => {
    // Marketplace Data Mocks
    const marketItems = [
        {
            title: "Old Calculator fx-991EX",
            category: "Peripherals",
            price: "₹400",
            condition: "Fully Working",
            icon: "🖩"
        },
        {
            title: "Lenovo ThinkPad (For Parts)",
            category: "Laptops",
            price: "₹2500",
            condition: "Scrap/Dead",
            icon: "💻"
        },
        {
            title: "Broken Apple AirPods",
            category: "Accessories",
            price: "₹500",
            condition: "Dead Battery",
            icon: "🎧"
        },
        {
            title: "Used Arduino Uno Board",
            category: "Components",
            price: "₹250",
            condition: "Good",
            icon: "🔌"
        },
        {
            title: "Generic USB Keyboard",
            category: "Peripherals",
            price: "₹150",
            condition: "Keys Sticking",
            icon: "⌨️"
        },
        {
            title: "Raspberry Pi Starter Kit",
            category: "Components",
            price: "₹1200",
            condition: "Like New",
            icon: "📟"
        }
    ];

    const container = document.getElementById("marketplaceCards");

    if (container) {
        marketItems.forEach((item, index) => {
            const card = document.createElement("div");
            card.className = "card fade-in delay-" + ((index % 3) + 1);
            card.innerHTML = `
                <div>
                    <div class="market-img">${item.icon}</div>
                    <div class="market-badge">${item.category}</div>
                    <h3>${item.title}</h3>
                    <p style="font-size: 13px; color: var(--muted)">Condition: ${item.condition}</p>
                    <div class="market-price">${item.price}</div>
                </div>
                <button class="buy-btn">Contact Seller</button>
            `;
            container.appendChild(card);
        });
    }
});
