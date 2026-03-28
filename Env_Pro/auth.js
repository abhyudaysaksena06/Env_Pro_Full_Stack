window.backendBase = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:') 
    ? 'http://localhost:3000' 
    : 'https://env-pro-full-stack.onrender.com';

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
            btn.innerText = "Dispatching Security Code... ";
            btn.style.opacity = '0.7';
            errDiv.innerText = "";
            
            try {
                const res = await fetch(`${backendBase}/api/auth/send-otp`, {
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
                if (!res.ok) throw new Error(data.message || data.error || 'Failed to initialize verification.');
                
                // Transition Interface
                registerForm.style.display = 'none';
                document.getElementById('otpForm').style.display = 'grid';
                document.querySelector('h2').innerText = "2-Step Verification";
                
            } catch(err) {
                console.error(err);
                errDiv.innerText = "❌ " + (err.message || "Failed to reach dispatch system.");
                btn.innerText = "Send Verification Code";
                btn.style.opacity = '1';
            }
        });
    }

    const otpForm = document.getElementById("otpForm");
    if (otpForm) {
        otpForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const btn = otpForm.querySelector('button');
            const errDiv = document.getElementById('otpError');
            btn.innerText = "Decoupling Cryptography... ";
            btn.style.opacity = '0.7';
            errDiv.innerText = "";

            try {
                const res = await fetch(`${backendBase}/api/auth/register`, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        email: document.getElementById('email').value, // Carried over from hidden form
                        emailOtp: document.getElementById('emailOtp').value
                    })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.message || data.error || 'Invalid OTP validation.');
                
                // Success!
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                
                window.location.href = "User_Profile.html";
            } catch(err) {
                console.error(err);
                errDiv.innerText = "❌ " + (err.message || "Invalid Email PIN Code.");
                btn.innerText = "Authenticate & Initialize";
                btn.style.opacity = '1';
            }
        });
    }
});
