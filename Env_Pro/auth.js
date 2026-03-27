const backendBase = 'https://env-pro-full-stack.onrender.com';

document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");

    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const btn = loginForm.querySelector('button');
            const errDiv = document.getElementById('loginError');
            btn.innerText = "Authenticating... ";
            btn.style.opacity = '0.7';
            errDiv.innerText = "";
            
            try {
                const res = await fetch(`${backendBase}/api/auth/login`, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        email: document.getElementById('email').value,
                        password: document.getElementById('password').value
                    })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.message || 'Login failed');
                
                localStorage.setItem('token', data.token);
                // Also store minimal user data for quick UI rendering across pages
                localStorage.setItem('user', JSON.stringify(data.user));
                
                window.location.href = "User_Profile.html";
            } catch(err) {
                console.error(err);
                errDiv.innerText = "❌ " + (err.message || "Failed to connect to authentication server.");
                btn.innerText = "Secure Login";
                btn.style.opacity = '1';
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const btn = registerForm.querySelector('button');
            const errDiv = document.getElementById('registerError');
            btn.innerText = "Creating Profile... ";
            btn.style.opacity = '0.7';
            errDiv.innerText = "";
            
            try {
                const res = await fetch(`${backendBase}/api/auth/register`, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        name: document.getElementById('name').value,
                        email: document.getElementById('email').value,
                        rollNumber: document.getElementById('rollNumber').value,
                        phone: document.getElementById('phone').value,
                        hostelName: document.getElementById('hostelName').value,
                        password: document.getElementById('password').value
                    })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.message || data.error || 'Registration failed');
                
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                
                window.location.href = "User_Profile.html";
            } catch(err) {
                console.error(err);
                errDiv.innerText = "❌ " + (err.message || "Failed to connect to authentication server.");
                btn.innerText = "Register & Start Earning";
                btn.style.opacity = '1';
            }
        });
    }
});
