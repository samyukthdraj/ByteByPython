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
            const response = await fetch('/signup', {
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

            const data = await response.json();

            if (response.ok) {
                signupMessage.textContent = 'User created successfully!';
                signupMessage.classList.add('success');

                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            } else {
                signupMessage.textContent = data.detail || 'Signup failed.';
                signupMessage.classList.add('error');
            }
        } catch (error) {
            console.error('Signup error:', error);
            signupMessage.textContent = 'An error occurred. Please try again.';
            signupMessage.classList.add('error');
        }
    });
});
