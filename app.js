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

    descriptionBox.value = `Keywords: ${data.keywords.join(", ")}`;
    crimeTypeDropdown.innerHTML = data.keywords
        .map(keyword => `<option value="${keyword}">${keyword}</option>`)
        .join("");
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
    descriptionBox.value += `\nTranscription: ${data.transcription}`;
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
