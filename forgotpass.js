document.addEventListener('DOMContentLoaded', () => {
    const forgotPasswordForm = document.getElementById('forgot-password-form');
    const emailSection = document.getElementById('email-section');
    const otpSection = document.getElementById('otp-section');
    const resetPasswordSection = document.getElementById('reset-password-section');
    const message = document.getElementById('forgot-password-message');
    const otpTimer = document.getElementById('otp-timer');

    let otpCountdown;

    // Send OTP
    forgotPasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        message.textContent = '';
        message.className = 'message';

        const submitBtn = e.submitter;

        if (submitBtn.id === 'send-otp-btn') {
            const email = document.getElementById('forgot-email').value;

            try {
                const response = await fetch('/send-otp', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email })
                });

                const data = await response.json();

                if (data.success) {
                    message.textContent = 'OTP sent to your email';
                    message.classList.add('success');
                    
                    // Hide email section, show OTP section
                    emailSection.style.display = 'none';
                    otpSection.style.display = 'block';

                    // Start OTP countdown
                    startOTPCountdown(300); // 5 minutes
                } else {
                    message.textContent = data.message || 'Failed to send OTP';
                    message.classList.add('error');
                }
            } catch (error) {
                console.error('Send OTP error:', error);
                message.textContent = 'An error occurred. Please try again.';
                message.classList.add('error');
            }
        }
        // Verify OTP
        else if (submitBtn.id === 'verify-otp-btn') {
            const email = document.getElementById('forgot-email').value;
            const otp = document.getElementById('otp-input').value;

            try {
                const response = await fetch('/verify-otp', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, otp })
                });

                const data = await response.json();

                if (data.success) {
                    message.textContent = 'OTP Verified';
                    message.classList.add('success');
                    
                    // Hide OTP section, show reset password section
                    otpSection.style.display = 'none';
                    resetPasswordSection.style.display = 'block';
                    
                    // Stop countdown
                    clearInterval(otpCountdown);
                } else {
                    message.textContent = data.message || 'Invalid OTP';
                    message.classList.add('error');
                }
            } catch (error) {
                console.error('Verify OTP error:', error);
                message.textContent = 'An error occurred. Please try again.';
                message.classList.add('error');
            }
        }
        // Reset Password
        else if (submitBtn.id === 'reset-password-btn') {
            const email = document.getElementById('forgot-email').value;
            const newPassword = document.getElementById('new-password').value;
            const confirmNewPassword = document.getElementById('confirm-new-password').value;

            if (newPassword !== confirmNewPassword) {
                message.textContent = 'Passwords do not match';
                message.classList.add('error');
                return;
            }

            try {
                const response = await fetch('/reset-password', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, new_password: newPassword })
                });

                const data = await response.json();

                if (data.success) {
                    message.textContent = 'Password reset successful';
                    message.classList.add('success');
                    
                    // Redirect to login after a short delay
                    setTimeout(() => {
                        window.location.href = 'login.html';
                    }, 2000);
                } else {
                    message.textContent = data.message || 'Failed to reset password';
                    message.classList.add('error');
                }
            } catch (error) {
                console.error('Reset password error:', error);
                message.textContent = 'An error occurred. Please try again.';
                message.classList.add('error');
            }
        }
    });

    function startOTPCountdown(seconds) {
        let remainingTime = seconds;
        otpCountdown = setInterval(() => {
            const minutes = Math.floor(remainingTime / 60);
            const secs = remainingTime % 60;
            
            otpTimer.textContent = `OTP expires in ${minutes}:${secs < 10 ? '0' : ''}${secs}`;
            
            if (remainingTime <= 0) {
                clearInterval(otpCountdown);
                otpTimer.textContent = 'OTP Expired';
                
                // Optional: Reset to email section
                emailSection.style.display = 'block';
                otpSection.style.display = 'none';
            }
            
            remainingTime--;
        }, 1000);
    }
});