document.addEventListener("DOMContentLoaded", () => {
    const sellForm = document.getElementById("sellForm");
    const statusDiv = document.getElementById("submitStatus");

    if (sellForm) {
        sellForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            
            const btn = sellForm.querySelector('button[type="submit"]');
            btn.innerHTML = "Uploading to blockchain registry... ⏳";
            btn.style.pointerEvents = "none";
            btn.style.opacity = "0.7";

            try {
                const formData = new FormData();
                formData.append('itemName', document.getElementById('itemName').value);
                formData.append('serialNumber', document.getElementById('serialNumber').value);
                formData.append('itemPrice', document.getElementById('itemPrice').value);
                formData.append('listedBy', document.getElementById('listedBy').value);
                formData.append('description', document.getElementById('description').value);
                
                // Pack physical image
                const fileInput = document.getElementById('itemPhoto');
                if(fileInput.files.length > 0) {
                    formData.append('itemPhoto', fileInput.files[0]);
                }

                // Dynamic IP detection for cross-device mobile testing
                const backendBase = 'https://env-pro-full-stack.onrender.com';

                // Push explicitly to local node server REST endpoint 
                const response = await fetch(`${backendBase}/api/items`, {
                    method: 'POST',
                    body: formData // Note: Form data automatically sets correct Multpiart boundaries natively!
                });

                if (!response.ok) {
                    throw new Error('Database ingestion failed. Verify node server.js is actively running.');
                }

                sellForm.reset();
                document.getElementById('uploadLabel').innerText = "Browse Computer for Photo...";

                // Trigger huge GSAP Success Overlay
                const overlay = document.getElementById('successOverlay');
                if(overlay && window.gsap) {
                    gsap.to(overlay, { opacity: 1, pointerEvents: 'all', duration: 0.5 });
                    gsap.to('#successCheck', { scale: 1, rotation: 360, duration: 0.8, ease: "back.out(1.7)", delay: 0.2 });
                    gsap.from('#successText', { y: 30, opacity: 0, duration: 0.5, delay: 0.4 });
                    gsap.from('#successSub', { y: 30, opacity: 0, duration: 0.5, delay: 0.6 });
                }

                // Redirect user to the Live Market feed dynamically
                setTimeout(() => {
                    window.location.href = "E_Waste_Buy.html";
                }, 3500);

            } catch(error) {
                console.error(error);
                statusDiv.innerHTML = "❌ Failed to connect to local database engine. Run `node server.js` before listing.";
                statusDiv.style.color = "#ef4444";
            } finally {
                btn.innerHTML = "Publish Listing Live →";
                btn.style.pointerEvents = "all";
                btn.style.opacity = "1";
            }
        });
    }
});
