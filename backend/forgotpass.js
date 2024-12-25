document.addEventListener('DOMContentLoaded', () => {
    const BACKEND_URL = 'http://127.0.0.1:8000';
    
    const forgotPasswordForm = document.getElementById('forgot-password-form');
    const emailSection = document.getElementById('email-section');
    const otpSection = document.getElementById('otp-section');
    const resetPasswordSection = document.getElementById('reset-password-section');
    const message = document.getElementById('forgot-password-message');
    const otpTimer = document.getElementById('otp-timer');
    const progressSteps = document.querySelectorAll('.step'); // Add progress steps reference

    function showSection(section) {
        emailSection.classList.add('hidden');
        otpSection.classList.add('hidden');
        resetPasswordSection.classList.add('hidden');
        section.classList.remove('hidden');
    }

    showSection(emailSection);

    async function fetchApi(endpoint, data) {
        const response = await fetch(`${BACKEND_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'same-origin',
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    }

    function startOTPTimer(duration) {
        let timeLeft = duration;
        const timer = setInterval(() => {
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            otpTimer.textContent = `Time remaining: ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
            
            if (--timeLeft < 0) {
                clearInterval(timer);
                otpTimer.textContent = 'OTP Expired';
                showSection(emailSection);
                updateProgress(1); // Reset progress step to 1
            }
        }, 1000);
    }

    // Function to update the progress steps
    function updateProgress(stepNumber) {
        progressSteps.forEach((step, index) => {
            if (index < stepNumber) {
                step.classList.add('active');
            } else {
                step.classList.remove('active');
            }
        });
    }

    forgotPasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitButton = e.submitter;
        
        try {
            switch(submitButton.id) {
                case 'send-otp-btn': {
                    const email = document.getElementById('forgot-email').value;
                    const result = await fetchApi('/send-otp', { email });
                    
                    if (result.success) {
                        showSection(otpSection);
                        startOTPTimer(300);
                        message.textContent = 'OTP sent successfully';
                        message.className = 'message success';
                        updateProgress(2); // Move to step 2
                    }
                    break;
                }
                
                case 'verify-otp-btn': {
                    const email = document.getElementById('forgot-email').value;
                    const otp = document.getElementById('otp-input').value;
                    const result = await fetchApi('/verify-otp', { email, otp });
                    
                    if (result.success) {
                        showSection(resetPasswordSection);
                        message.textContent = 'OTP verified successfully';
                        message.className = 'message success';
                        updateProgress(3); // Move to step 3
                    }
                    break;
                }
                
                case 'reset-password-btn': {
                    const email = document.getElementById('forgot-email').value;
                    const newPassword = document.getElementById('new-password').value;
                    const confirmPassword = document.getElementById('confirm-new-password').value;
                    
                    if (newPassword !== confirmPassword) {
                        message.textContent = 'Passwords do not match';
                        message.className = 'message error';
                        return;
                    }
                    
                    const result = await fetchApi('/reset-password', { 
                        email, 
                        new_password: newPassword 
                    });
                    
                    if (result.success) {
                        message.textContent = 'Password reset successful';
                        message.className = 'message success';
                        setTimeout(() => {
                            window.location.href = 'login.html';
                        }, 2000);
                    }
                    break;
                }
            }
        } catch (error) {
            message.textContent = 'An error occurred. Please try again.';
            message.className = 'message error';
        }
    });
});
