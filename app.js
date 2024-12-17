// Analyze Image
async function analyzeImage(file) {
    // Ensure you have a valid Gemini API key
    const API_KEY = 'AIzaSyBXr_EYbwC-JA4tJ_F37fctbzgKDcxTzZo'; // Replace with your actual API key

    // Create a base64 encoded image
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    return new Promise((resolve, reject) => {
        reader.onload = async () => {
            const base64Image = reader.result.split(',')[1];

            try {
                // Prepare the Gemini API request
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        contents: [{
                            parts: [
                                { text: 'Analyze this image and provide the following in a structured JSON format: keywords (list of descriptive keywords), crime_type (if applicable, otherwise null), description (a brief summary of the image)' },
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

                // Parse the response
                let analysisResult;
                try {
                    // Try to parse the text response as JSON
                    analysisResult = JSON.parse(
                        data.candidates[0].content.parts[0].text
                            .replace(/```json/g, '')
                            .replace(/```/g, '')
                            .trim()
                    );
                } catch (parseError) {
                    console.error('Failed to parse JSON:', parseError);
                    throw new Error('Unable to parse Gemini response');
                }

                const descriptionBox = document.getElementById("description");
                const crimeTypeDropdown = document.getElementById("crimeType");
                const customCrimeTypeInput = document.getElementById("customCrimeTypeInput");

                // Clear the description field
                descriptionBox.value = "";

                // Append keywords and description to the description
                descriptionBox.value = `Keywords: ${analysisResult.keywords.join(", ")}\n\nDescription: ${analysisResult.description}`;

                // Update crime type dropdown
                if (analysisResult.crime_type) {
                    const existingOption = Array.from(crimeTypeDropdown.options).find(
                        option => option.value.toLowerCase() === analysisResult.crime_type.toLowerCase().replace(/\s+/g, '')
                    );

                    if (existingOption) {
                        // Select the matching existing option
                        crimeTypeDropdown.value = existingOption.value;
                        // Hide custom input
                        document.getElementById('customCrimeType').style.display = 'none';
                    } else {
                        // If no match, select 'custom' and set the input
                        crimeTypeDropdown.value = 'custom';
                        customCrimeTypeInput.value = analysisResult.crime_type;
                        document.getElementById('customCrimeType').style.display = 'block';
                    }
                }

                resolve(analysisResult);
            } catch (error) {
                console.error('Error analyzing image:', error);
                reject(error);
            }
        };

        reader.onerror = (error) => {
            console.error('Error reading file:', error);
            reject(error);
        };
    });
}

// Speech-to-Text
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

// Fetch Police Stations
async function fetchPoliceStations(pincode) {
    const response = await fetch(`http://127.0.0.1:8000/police-stations/${pincode}`);
    const data = await response.json();

    const policeStationDropdown = document.getElementById("policeStation");
    policeStationDropdown.innerHTML = data.stations
        .map(
            station =>
                `<option value="${station.name}">${station.name} (${station.distance})</option>`
        )
        .join("");
}

// Submit Report and Generate Ticket
async function submitReport() {
    const pincode = document.getElementById("pincode").value;
    const policeStation = document.getElementById("policeStation").value;
    const phoneNumber = document.getElementById("phoneNumber").value;
    const crimeType = document.getElementById("crimeType").value === 'custom' 
        ? document.getElementById('customCrimeTypeInput').value 
        : document.getElementById("crimeType").value;
    const description = document.getElementById("description").value;
    const userName = document.getElementById("userName").value;

    const reportData = {
        pincode,
        police_station: policeStation,
        phone_number: phoneNumber,
        crime_type: crimeType,
        description,
        user_name: userName
    };

    try {
        const response = await fetch("http://127.0.0.1:8000/submit-report", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(reportData)
        });

        const result = await response.json();

        // Show ticket generation popup
        const popup = document.createElement('div');
        popup.innerHTML = `
            <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 20px; border: 2px solid blue; z-index: 1000; text-align: center;">
                <h2>Report Submitted Successfully!</h2>
                <p>Your Ticket Number is: <strong>${result.ticket_number}</strong></p>
                <button onclick="this.parentElement.remove()">Close</button>
            </div>
        `;
        document.body.appendChild(popup);
    } catch (error) {
        console.error("Error submitting report:", error);
        alert("Failed to submit report. Please try again.");
    }
}

// Event Listeners
document.getElementById("uploadImage").addEventListener("change", (e) => {
    analyzeImage(e.target.files[0]);
});
document.getElementById("uploadVoice").addEventListener("change", (e) => {
    processVoice(e.target.files[0]);
});
document.getElementById("pincode").addEventListener("input", (e) => {
    if (e.target.value.length === 6) {
        fetchPoliceStations(e.target.value);
    }
});
document.querySelector(".submit-button").addEventListener("click", submitReport);

// Event listener for crime type dropdown to show/hide custom input
document.getElementById("crimeType").addEventListener("change", function() {
    const customInput = document.getElementById('customCrimeType');
    customInput.style.display = this.value === 'custom' ? 'block' : 'none';
});