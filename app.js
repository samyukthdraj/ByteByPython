// Analyze Image
async function analyzeImage(file) {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("http://127.0.0.1:8000/analyze-image/", {
        method: "POST",
        body: formData,
    });
    const data = await response.json();

    const descriptionBox = document.getElementById("description");
    const crimeTypeDropdown = document.getElementById("crimeType");
    const customCrimeTypeInput = document.getElementById("customCrimeTypeInput");

    // Clear the description field
    descriptionBox.value = "";

    // Append keywords to the description
    descriptionBox.value = `Image Analysis Keywords: ${data.keywords.join(", ")}`;

    // Update crime type dropdown
    if (data.crime_type) {
        const existingOption = Array.from(crimeTypeDropdown.options).find(
            option => option.value.toLowerCase() === data.crime_type.toLowerCase().replace(/\s+/g, '')
        );

        if (existingOption) {
            // Select the matching existing option
            crimeTypeDropdown.value = existingOption.value;
            // Hide custom input
            document.getElementById('customCrimeType').style.display = 'none';
        } else {
            // If no match, select 'custom' and set the input
            crimeTypeDropdown.value = 'custom';
            customCrimeTypeInput.value = data.crime_type;
            document.getElementById('customCrimeType').style.display = 'block';
        }
    }
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