// Store police stations data globally
let policeStationsData = [];

// Function to parse CSV content into array of police station objects
async function loadPoliceStationsFromCSV() {
    try {
        console.log('Attempting to load police stations CSV');
        
        const response = await fetch('/police_stations/policestations.csv');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const csvContent = await response.text();
        
        // Split CSV into lines
        const lines = csvContent.split('\n');
        const header = lines.shift(); // Remove header line
        
        // Helper function to parse CSV line while respecting quotes
        function parseCSVLine(line) {
            const values = [];
            let currentValue = '';
            let insideQuotes = false;
            
            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                
                if (char === '"') {
                    insideQuotes = !insideQuotes;
                } else if (char === ',' && !insideQuotes) {
                    values.push(currentValue.trim());
                    currentValue = '';
                } else {
                    currentValue += char;
                }
            }
            
            // Push the last value
            values.push(currentValue.trim());
            return values;
        }

        // Parse each line into a police station object
        const stations = lines
            .filter(line => line.trim()) // Remove empty lines
            .map(line => {
                const [
                    slNo, cityName, name, address, longitude, latitude, pincode
                ] = parseCSVLine(line);
                
                // Remove quotes and trim whitespace
                const cleanLongitude = longitude.replace(/"/g, '').trim();
                const cleanLatitude = latitude.replace(/"/g, '').trim();
                const cleanPincode = pincode.replace(/"/g, '').trim();
                
                return {
                    name: name.replace(/"/g, '').trim(),
                    longitude: parseFloat(cleanLongitude),
                    latitude: parseFloat(cleanLatitude),
                    pincode: cleanPincode,
                    address: address.replace(/"/g, '').trim()
                };
            })
            .filter(station => {
                // Validate station data
                const isValid = 
                    station.name && 
                    !isNaN(station.longitude) && 
                    !isNaN(station.latitude) && 
                    station.pincode && 
                    station.pincode.length === 6;
                
                if (!isValid) {
                    console.warn('Invalid station data:', station);
                }
                
                return isValid;
            });

        console.log('Successfully loaded stations:', stations.length);
        return stations;
    } catch (error) {
        console.error('Error loading police stations:', error);
        return [];
    }
}

// Calculate distance between two points using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
    
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in kilometers
}

// Initialize dropdown with alphabetically sorted police stations
async function initializePoliceStationDropdown() {
    try {
        console.log('Initializing police station dropdown');
        const policeStationDropdown = document.getElementById("policeStation");
        if (!policeStationDropdown) {
            throw new Error('Police station dropdown element not found');
        }

        // Load stations from CSV if not already loaded
        if (!policeStationsData.length) {
            policeStationsData = await loadPoliceStationsFromCSV();
            console.log('Loaded police stations data:', policeStationsData.length, 'stations');
        }
        
        // Sort stations alphabetically
        const sortedStations = [...policeStationsData].sort((a, b) => 
            a.name.localeCompare(b.name)
        );

        // Clear existing options
        policeStationDropdown.innerHTML = '<option value="">Select a station</option>';
        
        // Add sorted stations to dropdown
        sortedStations.forEach(station => {
            if (station && station.name) {
                const option = document.createElement('option');
                option.value = station.name;
                option.textContent = station.name;
                policeStationDropdown.appendChild(option);
            }
        });

    } catch (error) {
        console.error('Error initializing police station dropdown:', error);
    }
}

// Helper function to update dropdown with stations
function updateDropdownWithStations(dropdown, stations) {
    dropdown.innerHTML = '<option value="">Select a station</option>';
    
    stations.forEach(station => {
        const option = document.createElement('option');
        option.value = station.name;
        if (station.distance !== undefined) {
            option.textContent = `${station.name} (${station.distance.toFixed(2)} km)`;
        } else {
            option.textContent = station.name;
        }
        dropdown.appendChild(option);
    });
}
// Update dropdown with nearest stations based on pincode and automatically select the nearest
async function updateNearestStations(pincode) {
    try {
        console.log('Updating stations for pincode:', pincode);
        const policeStationDropdown = document.getElementById("policeStation");
        if (!policeStationDropdown) {
            throw new Error('Police station dropdown element not found');
        }

        // Load stations if not already loaded
        if (!policeStationsData.length) {
            policeStationsData = await loadPoliceStationsFromCSV();
            console.log('Loaded police stations data:', policeStationsData.length, 'stations');
        }

        const pincodeNumber = parseInt(pincode);
        if (isNaN(pincodeNumber) || pincode.length !== 6) {
            console.warn('Invalid pincode format');
            await initializePoliceStationDropdown(); // Reset to default dropdown
            return;
        }

        // Find stations with matching or closest pincode
        const stationsWithDistance = policeStationsData
            .map(station => ({
                ...station,
                distance: Math.abs(parseInt(station.pincode) - pincodeNumber) // Approximate distance metric
            }))
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 3); // Take the 3 nearest stations

        if (stationsWithDistance.length === 0) {
            console.warn('No stations found near this pincode');
            await initializePoliceStationDropdown(); // Reset to default dropdown
            return;
        }

        // Update dropdown with nearest stations
        updateDropdownWithStations(policeStationDropdown, stationsWithDistance);

        // Auto-select the nearest station
        const nearestStation = stationsWithDistance[0];
        const matchingOption = Array.from(policeStationDropdown.options).find(
            option => option.value === nearestStation.name
        );

        if (matchingOption) {
            policeStationDropdown.value = nearestStation.name; // Set selected value
            console.log(`Auto-selected nearest station: ${nearestStation.name}`);
        } else {
            console.warn(`Nearest station not found in dropdown options: ${nearestStation.name}`);
        }
    } catch (error) {
        console.error('Error updating nearest stations:', error);
        await initializePoliceStationDropdown(); // Fallback to alphabetical list
    }
}

// Helper function to update dropdown options
function updateDropdownWithStations(dropdown, stations) {
    dropdown.innerHTML = ''; // Clear existing options
    stations.forEach(station => {
        const option = document.createElement('option');
        option.value = station.name.trim(); // Ensure value matches nearestStation.name
        option.textContent = `${station.name} (${station.pincode})`;
        dropdown.appendChild(option);
    });
}

async function analyzeImage(file) {
    const API_KEY = 'AIzaSyBXr_EYbwC-JA4tJ_F37fctbzgKDcxTzZo';

    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    return new Promise((resolve, reject) => {
        reader.onload = async () => {
            const base64Image = reader.result.split(',')[1];

            try {
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        contents: [{
                            parts: [
                                { text: 'Analyze this image and provide the following in a structured JSON format: {"keywords": [], "crime_type": "", "description": ""}. If no specific crime is evident, set crime_type to null. Make crime_type match existing dropdown options (theft, vandalism, assault, fraud, or others). If not in the list then the real type should be appended in the dropdown and selected automatically. If not a crime then give in the description not a crime and update the type of crime as No Criminal Activity.' },
                                { 
                                    inlineData: {
                                        mimeType: 'image/jpeg',
                                        data: base64Image
                                    }
                                }
                            ]
                        }]
                    })
                });

                const data = await response.json();
                let analysisResult;
                try {
                    const responseText = data.candidates[0].content.parts[0].text
                        .replace(/```json/g, '')
                        .replace(/```/g, '')
                        .trim();
                    
                    analysisResult = JSON.parse(responseText);
                } catch (parseError) {
                    console.error('Failed to parse JSON:', parseError);
                    throw new Error('Unable to parse Gemini response');
                }

                const descriptionBox = document.getElementById("description");
                const crimeTypeDropdown = document.getElementById("crimeType");
                const customCrimeTypeInput = document.getElementById("customCrimeTypeInput");
                const customCrimeTypeContainer = document.getElementById("customCrimeType");

                descriptionBox.value = "";

                descriptionBox.value = `Keywords: ${analysisResult.keywords.join(", ")}\n\nDescription: ${analysisResult.description}`;

                if (analysisResult.crime_type) {
                    const normalizedCrimeType = analysisResult.crime_type.toLowerCase();
                    
                    const existingOption = Array.from(crimeTypeDropdown.options).find(
                        option => option.value.toLowerCase() === normalizedCrimeType
                    );

                    if (existingOption) {
                        crimeTypeDropdown.value = existingOption.value;
                        customCrimeTypeContainer.style.display = 'none';
                    } else {
                        crimeTypeDropdown.value = 'others';
                        customCrimeTypeInput.value = analysisResult.crime_type;
                        customCrimeTypeContainer.style.display = 'block';
                    }
                }

                resolve(analysisResult);
            } catch (error) {
                console.error('Error analyzing image:', error);
                alert('Image analysis failed. Please try again or manually enter details.');
                reject(error);
            }
        };

        reader.onerror = (error) => {
            console.error('Error reading file:', error);
            alert('Error reading image file. Please try again.');
            reject(error);
        };
    });
}

async function processVoice(file) {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("http://127.0.0.1:8000/speech-to-text/", {
        method: "POST",
        body: formData,
    });
    const data = await response.json();

    const descriptionBox = document.getElementById("description");
    descriptionBox.value = `Voice Transcription: ${data.transcription}`;
}

async function submitReport() {
    const userName = document.getElementById("userName").value;
    const pincode = document.getElementById("pincode").value;
    const policeStation = document.getElementById("policeStation").value;
    const phoneNumber = document.getElementById("phoneNumber").value;
    const crimeType = document.getElementById("crimeType").value === 'others' 
        ? document.getElementById('customCrimeTypeInput').value 
        : document.getElementById("crimeType").value;
    const description = document.getElementById("description").value;

    const imageFile = document.getElementById("uploadImage").files[0];
    const voiceFile = document.getElementById("uploadVoice").files[0];

    const formData = new FormData();
    formData.append('user_name', userName);
    formData.append('pincode', pincode);
    formData.append('police_station', policeStation);
    formData.append('phone_number', phoneNumber);
    formData.append('crime_type', crimeType);
    formData.append('description', description);
    
    if (imageFile) {
        formData.append('file', imageFile);
    }
    
    try {
        const accessToken = localStorage.getItem('access_token');
        if (!accessToken) {
            throw new Error('No access token found. Please log in.');
        }

        const response = await fetch("http://localhost:8000/upload-crime-report", {
            method: "POST",
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to submit report');
        }

        const result = await response.json();

        const popup = document.createElement('div');
        popup.innerHTML = `
            <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 20px; border: 2px solid blue; z-index: 1000; text-align: center;">
                <h2>Report Submitted Successfully!</h2>
                <p>Your Ticket Number is: <strong>${result.ticket_number}</strong></p>
                <button onclick="this.parentElement.remove(); window.location.href='user_dashboard.html'">View Dashboard</button>
            </div>
        `;
        document.body.appendChild(popup);
    } catch (error) {
        console.error("Error submitting report:", error);
        alert(error.message || "Failed to submit report. Please try again.");
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM Content Loaded - Initializing application');
    
    // Load initial police stations data
    policeStationsData = await loadPoliceStationsFromCSV();
    console.log('Initial police stations data loaded:', policeStationsData.length, 'stations');
    
    await initializePoliceStationDropdown();
    
    // Event Listeners
    const uploadImageInput = document.getElementById("uploadImage");
    const uploadVoiceInput = document.getElementById("uploadVoice");
    const pincodeInput = document.getElementById("pincode");
    const crimeTypeSelect = document.getElementById("crimeType");
    const submitButton = document.querySelector(".submit-button");

    if (uploadImageInput) {
        uploadImageInput.addEventListener("change", (e) => {
            if (e.target.files[0]) {
                analyzeImage(e.target.files[0]);
            }
        });
    }

    if (uploadVoiceInput) {
        uploadVoiceInput.addEventListener("change", (e) => {
            if (e.target.files[0]) {
                processVoice(e.target.files[0]);
            }
        });
    }

    if (pincodeInput) {
        pincodeInput.addEventListener("input", async (e) => {
            const pincode = e.target.value;
            if (pincode.length === 6) {
                await updateNearestStations(pincode);
            } else {
                await initializePoliceStationDropdown();
            }
        });
    }

    if (crimeTypeSelect) {
        crimeTypeSelect.addEventListener("change", function() {
            const customInput = document.getElementById('customCrimeType');
            customInput.style.display = this.value === 'others' ? 'block' : 'none';
        });
    }

    if (submitButton) {
        submitButton.addEventListener("click", submitReport);
    }
});