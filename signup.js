document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('signup-form');
    const signupMessage = document.getElementById('signup-message');

    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Reset previous message
        signupMessage.textContent = '';
        signupMessage.className = 'message';

        // Get form values
        const username = document.getElementById('signup-username').value;
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        const confirmPassword = document.getElementById('signup-confirm-password').value;
        const fullName = document.getElementById('signup-full-name').value;
        const phoneNumber = document.getElementById('signup-phone').value;

        // Basic validation
        if (password !== confirmPassword) {
            signupMessage.textContent = 'Passwords do not match';
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
                    hashed_password: password, // Backend will hash this
                    full_name: fullName || null,
                    phone_number: phoneNumber || null
                })
            });

            const data = await response.json();

            if (data.success) {
                signupMessage.textContent = 'Account created successfully!';
                signupMessage.classList.add('success');
                
                // Optional: Redirect to login after a short delay
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            } else {
                signupMessage.textContent = data.message || 'Sign up failed';
                signupMessage.classList.add('error');
            }
        } catch (error) {
            console.error('Signup error:', error);
            signupMessage.textContent = 'An error occurred. Please try again.';
            signupMessage.classList.add('error');
        }
    });
});