window.backendBase = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:') 
    ? 'http://localhost:3000' 
    : 'https://env-pro-full-stack.onrender.com';

document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");

    // --- LOGIN TAB SWITCHER ---
    const emailTabBtn = document.getElementById("emailTabBtn");
    const phoneTabBtn = document.getElementById("phoneTabBtn");
    const phoneLoginForm = document.getElementById("phoneLoginForm");
    const phoneInputGroup = document.getElementById("phoneInputGroup");
    const otpInputGroup = document.getElementById("otpInputGroup");

    if (emailTabBtn && phoneTabBtn && loginForm && phoneLoginForm) {
        emailTabBtn.addEventListener("click", () => {
            emailTabBtn.classList.add("active");
            emailTabBtn.style.background = "";
            emailTabBtn.style.color = "";
            phoneTabBtn.classList.remove("active");
            phoneTabBtn.style.background = "rgba(255,255,255,0.05)";
            phoneTabBtn.style.color = "white";
            
            loginForm.style.display = "grid";
            phoneLoginForm.style.display = "none";
        });

        phoneTabBtn.addEventListener("click", () => {
            phoneTabBtn.classList.add("active");
            phoneTabBtn.style.background = "";
            phoneTabBtn.style.color = "";
            emailTabBtn.classList.remove("active");
            emailTabBtn.style.background = "rgba(255,255,255,0.05)";
            emailTabBtn.style.color = "white";
            
            phoneLoginForm.style.display = "grid";
            loginForm.style.display = "none";
        });
    }

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

    // --- PHONE LOGIN LOGIC ---
    let pendingPhone = null;
    if (phoneLoginForm) {
        phoneLoginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const btn = document.getElementById('phoneLoginBtn');
            const errDiv = document.getElementById('phoneLoginError');
            btn.style.opacity = '0.7';
            errDiv.innerText = "";

            if (!pendingPhone) {
                // Step 1: Send OTP
                btn.innerText = "Dispatching Security Code... ";
                const phoneVal = document.getElementById('loginPhone').value;
                try {
                    const res = await fetch(`${backendBase}/api/auth/phone-login-send`, {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({ phone: phoneVal })
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.message || 'Failed to dispatch verification.');
                    
                    pendingPhone = phoneVal;
                    
                    // UI Transition
                    phoneInputGroup.style.display = 'none';
                    otpInputGroup.style.display = 'block';
                    btn.innerText = "Verify OTP & Secure Login";
                    btn.style.opacity = '1';
                    
                } catch(err) {
                    console.error(err);
                    errDiv.innerText = "❌ " + (err.message || "Failed to reach dispatch system.");
                    btn.innerText = "Send OTP";
                    btn.style.opacity = '1';
                }
            } else {
                // Step 2: Verify OTP
                btn.innerText = "Decoupling Cryptography... ";
                const otpVal = document.getElementById('loginOtp').value;
                try {
                    const res = await fetch(`${backendBase}/api/auth/phone-login-verify`, {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({ phone: pendingPhone, phoneOtp: otpVal })
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.message || 'Invalid validation code.');
                    
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user', JSON.stringify(data.user));
                    window.location.href = "User_Profile.html";
                    
                } catch(err) {
                    console.error(err);
                    errDiv.innerText = "❌ " + (err.message || "Invalid or Mismatched PIN Codes.");
                    btn.innerText = "Verify OTP & Secure Login";
                    btn.style.opacity = '1';
                }
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const btn = registerForm.querySelector('button');
            const errDiv = document.getElementById('registerError');
            btn.innerText = "Dispatching Security Codes... ";
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
                btn.innerText = "Send Verification Codes";
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
                        emailOtp: document.getElementById('emailOtp').value,
                        phoneOtp: document.getElementById('phoneOtp').value
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
                errDiv.innerText = "❌ " + (err.message || "Invalid or Mismatched PIN Codes.");
                btn.innerText = "Authenticate & Initialize";
                btn.style.opacity = '1';
            }
        });
    }
});
