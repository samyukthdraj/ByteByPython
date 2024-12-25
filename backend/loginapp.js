document.addEventListener('DOMContentLoaded', () => {
    // Event Listeners for Login
    const userLoginForm = document.querySelector('.user-login form');
    const policeLoginForm = document.querySelector('.police-login form');

    if (userLoginForm) {
        userLoginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('user-username').value;
            const password = document.getElementById('user-password').value;
    
            try {
                const response = await fetch('http://localhost:8000/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ 
                        username: username, 
                        password: password 
                    })
                });
    
                const data = await response.json();
    
                if (response.ok) {
                    localStorage.setItem('access_token', data.access_token);
                    localStorage.setItem('user_id', data.user_id);
                    window.location.href = 'user_dashboard.html';
                } else {
                    alert(data.detail || 'Login failed');
                }
            } catch (error) {
                console.error('Login error:', error);
                alert('An error occurred during login. Please try again.');
            }
        });
    }

    if (policeLoginForm) {
        policeLoginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const stationId = document.getElementById('police-station-id').value;
            const stationPassword = document.getElementById('police-station-password').value;

            try {
                const response = await fetch('http://localhost:8000/police-login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ 
                        stationId: stationId, 
                        stationPassword: stationPassword 
                    })
                });

                const data = await response.json();

                if (response.ok) {
                    localStorage.setItem('access_token', data.access_token);
                    localStorage.setItem('police_station_id', data.police_station_id);
                    window.location.href = 'police_dashboard.html';
                } else {
                    alert(data.detail || 'Login failed');
                }
            } catch (error) {
                console.error('Police login error:', error);
                alert('An error occurred during login. Please try again.');
            }
        });
    }

    // Rest of the code remains the same...

    // Logout functionality
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            localStorage.removeItem('access_token');
            localStorage.removeItem('user_id');
            localStorage.removeItem('police_station_id');
            window.location.href = 'login.html';
        });
    }
});

// Function to check authentication status
function checkAuthentication() {
    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) {
        window.location.href = 'login.html';
    }
}