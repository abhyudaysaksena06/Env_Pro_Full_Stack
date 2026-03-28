const axios = require('axios');

async function test() {
    console.log("Starting test...");
    try {
        const response = await axios.post('http://localhost:3000/api/auth/send-otp', {
            name: 'Test',
            email: 'test@thapar.edu',
            rollNumber: '102203124',
            password: 'password123',
            phone: '9876543210',
            hostelName: 'Hostel J'
        });
        console.log("Success:", response.data);
    } catch (e) {
        console.error("Error:", e.response ? e.response.data : e.message);
    }
}
test();
