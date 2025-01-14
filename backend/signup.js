document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('signup-form');
    const signupMessage = document.getElementById('signup-message');

    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Clear previous message
        signupMessage.textContent = '';
        signupMessage.className = 'message';

        // Collect form data
        const username = document.getElementById('signup-username').value.trim();
        const email = document.getElementById('signup-email').value.trim();
        const password = document.getElementById('signup-password').value.trim();
        const confirmPassword = document.getElementById('signup-confirm-password').value.trim();
        const fullName = document.getElementById('signup-full-name').value.trim();
        const phoneNumber = document.getElementById('signup-phone').value.trim();

        // Validation
        if (password !== confirmPassword) {
            signupMessage.textContent = 'Passwords do not match.';
            signupMessage.classList.add('error');
            return;
        }

        try {
            const response = await fetch('https://bytebypython.onrender.com/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username,
                    email,
                    password,
                    full_name: fullName || null,
                    phone_number: phoneNumber || null,
                }),
            });

            const responseData = await response.json();

            if (response.ok) {
                signupMessage.textContent = responseData.message || 'User created successfully!';
                signupMessage.classList.add('success');

                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            } else {
                // Use the error message from the server response
                signupMessage.textContent = responseData.detail || 'Signup failed. Please try again.';
                signupMessage.classList.add('error');
            }
        } catch (error) {
            console.error('Signup Error:', error);
            signupMessage.textContent = 'Network error. Please check your connection and try again.';
            signupMessage.classList.add('error');
        }
    });
});