async function loadUserData() {
    try {
        const accessToken = localStorage.getItem('access_token');
        if (!accessToken) {
            console.log('No access token found, redirecting to login');
            window.location.href = 'login.html';
            return;
        }

        const response = await fetch('http://localhost:8000/users/me', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const userData = await response.json();
        console.log('User data received:', userData);

        // Get the username input field
        const userNameInput = document.getElementById('userName');
        
        if (userNameInput && userData.username) {
            userNameInput.value = userData.username;
            userNameInput.setAttribute('readonly', true);
        } else {
            console.error('Either username input not found or username data missing', {
                inputFound: !!userNameInput,
                usernameReceived: userData.username
            });
        }
    } catch (error) {
        console.error('Error loading user data:', error);
        if (error.message.includes('401')) {
            window.location.href = 'login.html';
        }
    }
}

// Make sure the function runs when the page loads
document.addEventListener('DOMContentLoaded', loadUserData);

let mediaRecorder;
let audioChunks = [];

async function startRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);

        // Store the username and timestamp at the start of the recording
        const timestamp = Date.now();
        const userName = document.getElementById('userName').value || 'anonymous';
        const sanitizedUsername = userName.replace(/[^a-zA-Z0-9]/g, '_');
        const uniqueFileName = `recorded_audio_${sanitizedUsername}_${timestamp}.webm`;

        mediaRecorder.ondataavailable = event => {
            audioChunks.push(event.data);
        };

        mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            audioChunks = [];

            const audioUrl = URL.createObjectURL(audioBlob);
            const recordedAudio = document.getElementById('recordedAudio');
            recordedAudio.src = audioUrl;
            recordedAudio.style.display = 'block';

            // Create a file-like object for upload
            const file = new File([audioBlob], uniqueFileName, { type: 'audio/webm' });
            
            // Add loading message to description box
            const descriptionBox = document.getElementById("description");
            let existingContent = descriptionBox.value.trim();
            if (existingContent) {
                descriptionBox.value = `${existingContent}\n\nProcessing voice recording...`;
            } else {
                descriptionBox.value = 'Processing voice recording...';
            }

            // Process the voice recording
            try {
                const formData = new FormData();
                formData.append("file", file);

                const response = await fetch("http://127.0.0.1:8000/process-speech", {
                    method: "POST",
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                    },
                    body: formData
                });

                if (!response.ok) {
                    throw new Error("Failed to process voice file.");
                }

                const data = await response.json();
                const transcription = data.transcription;

                // Update description box with transcription
                existingContent = descriptionBox.value
                    .replace('Processing voice recording...', '')
                    .trim();
                
                if (existingContent) {
                    descriptionBox.value = `${existingContent}\n\nVoice Description: ${transcription}`;
                } else {
                    descriptionBox.value = `Voice Description: ${transcription}`;
                }

                // Scroll to the bottom of the description box
                descriptionBox.scrollTop = descriptionBox.scrollHeight;

            } catch (error) {
                console.error("Error processing voice:", error);
                // Remove the processing message and show error
                descriptionBox.value = existingContent;
                alert("Voice processing failed. Please try again.");
            }

            // Store the file in the upload input
            const uploadVoice = document.getElementById('uploadVoice');
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            uploadVoice.files = dataTransfer.files;
        };

        mediaRecorder.start();
        document.getElementById('startRecording').style.display = 'none';
        document.getElementById('stopRecording').style.display = 'inline-block';
        document.getElementById('removeRecording').style.display = 'none';

    } catch (error) {
        console.error('Error starting recording:', error);
        alert('Failed to access microphone. Please ensure your microphone is enabled.');
    }
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
        
        document.getElementById('startRecording').style.display = 'inline-block';
        document.getElementById('stopRecording').style.display = 'none';
        document.getElementById('removeRecording').style.display = 'inline-block';
    }
}

function removeRecording() {
    // Reset the audio player
    const recordedAudio = document.getElementById('recordedAudio');
    recordedAudio.src = '';
    recordedAudio.style.display = 'none';

    // Clear the file input
    const uploadVoice = document.getElementById('uploadVoice');
    const dataTransfer = new DataTransfer();
    uploadVoice.files = dataTransfer.files;

    // Remove the last voice description from the description box
    const descriptionBox = document.getElementById('description');
    const content = descriptionBox.value;
    const lastVoiceDescIndex = content.lastIndexOf('Voice Description:');
    if (lastVoiceDescIndex !== -1) {
        // Find the end of this voice description (either the next voice description or the end of text)
        const nextVoiceDescIndex = content.indexOf('Voice Description:', lastVoiceDescIndex + 1);
        if (nextVoiceDescIndex !== -1) {
            // Remove this voice description up to the next one
            descriptionBox.value = content.slice(0, lastVoiceDescIndex) + content.slice(nextVoiceDescIndex);
        } else {
            // Remove this voice description to the end
            descriptionBox.value = content.slice(0, lastVoiceDescIndex).trim();
        }
    }

    // Reset buttons
    document.getElementById('startRecording').style.display = 'inline-block';
    document.getElementById('stopRecording').style.display = 'none';
    document.getElementById('removeRecording').style.display = 'none';
}

async function showLoadingPopup() {
  // Create the loading popup
  const popup = document.createElement("div");
  popup.innerHTML = `
    <div id="report-popup" style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 20px; border: 2px solid blue; z-index: 1000; text-align: center;">
        <h2>Submitting Report...</h2>
        <div>Loading...</div> <!-- Static loading text -->
    </div>
  `;
  document.body.appendChild(popup); // Add to the body of the document
  
  // Force reflow to ensure the popup is displayed immediately
  popup.offsetHeight; // Accessing this forces the browser to reflow the DOM
  return popup; // Return the popup element to modify it later
}




// Store police stations data globally
let policeStationsData = [];

// Function to parse CSV content into array of police station objects
async function loadPoliceStationsFromCSV() {
    try {
        console.log('Attempting to load police stations CSV');
        
        const response = await fetch('../police_stations/policestations.csv');
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
    const GEMINI_API_KEY = 'AIzaSyAfd0qt66GzWWxEAh150F5YuY1BDomkZiw';

    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    return new Promise((resolve, reject) => {
        reader.onload = async () => {
            const base64Image = reader.result.split(',')[1];

            try {
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`, {
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

                // Check if the response is ok (status 200-299)
                if (!response.ok) {
                    throw new Error(`API request failed with status ${response.status}`);
                }

                const data = await response.json();
                console.log("API Response:", data); // Log response for debugging

                let analysisResult;
                try {
                    // Safely access response data
                    const responseText = data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0]
                        ? data.candidates[0].content.parts[0].text.replace(/```json/g, '').replace(/```/g, '').trim()
                        : '';

                    if (responseText) {
                        analysisResult = JSON.parse(responseText);
                    } else {
                        throw new Error('Invalid response format or missing content');
                    }
                } catch (parseError) {
                    console.error('Failed to parse JSON:', parseError);
                    throw new Error('Unable to parse Gemini response');
                }

                console.log("Analysis Result:", analysisResult); // Log the analysis result

                // Handle the description and crime type
                const descriptionBox = document.getElementById("description");
                const crimeTypeDropdown = document.getElementById("crimeType");
                const customCrimeTypeInput = document.getElementById("customCrimeTypeInput");
                const customCrimeTypeContainer = document.getElementById("customCrimeType");

                // Get existing content and trim any trailing whitespace
                let existingContent = descriptionBox.value.trim();
                
                // Create the new image analysis content
                const imageAnalysis = `Keywords: ${analysisResult.keywords.join(", ")}\n\nImage Description: ${analysisResult.description}`;
                
                // Append the new content to existing content if there is any
                if (existingContent) {
                    descriptionBox.value = `${existingContent}\n\n${imageAnalysis}`;
                } else {
                    descriptionBox.value = imageAnalysis;
                }

                // Scroll to the bottom of the description box
                descriptionBox.scrollTop = descriptionBox.scrollHeight;

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
    try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("http://127.0.0.1:8000/process-speech", {
            method: "POST",
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            },
            body: formData
        });

        if (!response.ok) {
            throw new Error("Failed to process voice file.");
        }

        const data = await response.json();
        const transcription = data.transcription;

        // Get the description box element
        const descriptionBox = document.getElementById("description");
        
        // Get existing content and trim any extra whitespace
        let existingContent = descriptionBox.value.trim();
        
        // Append the transcription with proper formatting
        if (existingContent) {
            descriptionBox.value = `${existingContent}\n\nVoice Description: ${transcription}`;
        } else {
            descriptionBox.value = `Voice Description: ${transcription}`;
        }

        // Optional: Scroll to the bottom of the description box
        descriptionBox.scrollTop = descriptionBox.scrollHeight;
        
    } catch (error) {
        console.error("Error processing voice:", error);
        alert("Voice processing failed. Please try again.");
    }
}



let isSubmitting = false;
async function submitReport() {
    if (isSubmitting) {
        console.log('Submission already in progress');
        return;
    }
    try {
        isSubmitting = true;

        // Show the "Submitting Report..." popup
        const popup = await showLoadingPopup();

        const userName = document.getElementById("userName").value;
        const pincode = document.getElementById("pincode").value;
        const policeStation = document.getElementById("policeStation").value;
        const crimeType = document.getElementById("crimeType").value === 'others' 
            ? document.getElementById('customCrimeTypeInput').value 
            : document.getElementById("crimeType").value;
        const description = document.getElementById("description").value;

        const imageFile = document.getElementById("uploadImage").files[0];
        const voiceFile = document.getElementById("uploadVoice").files[0];

        const formData = new FormData();
        // FormData to send data to the backend
        formData.append("user_name", userName);
        formData.append("pincode", pincode);
        formData.append("police_station", policeStation);
        formData.append("crime_type", crimeType);
        formData.append("description", description);

        if (imageFile) {
            formData.append("image_file", imageFile); // Match the backend field name
        }
        if (voiceFile) {
            formData.append("voice_file", voiceFile); // Match the backend field name
        }

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

        // Show success popup with ticket number
        showSuccessPopup(result.ticket_number);

    } catch (error) {
        console.error("Error submitting report:", error);
        alert(error.message || "Failed to submit report. Please try again.");
    } finally {
        isSubmitting = false;
    }
}
    
    function showSuccessPopup(ticketNumber) {
      const popup = document.createElement("div");
      popup.innerHTML = `
        <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 20px; border: 2px solid blue; z-index: 1000; text-align: center;">
            <h2>Report Submitted Successfully!</h2>
            <p>Your Ticket Number is: <strong>${ticketNumber}</strong></p>
            <button onclick="this.parentElement.remove(); window.location.href='user_dashboard.html'">View Dashboard</button>
        </div>
      `;
      document.body.appendChild(popup);
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

});