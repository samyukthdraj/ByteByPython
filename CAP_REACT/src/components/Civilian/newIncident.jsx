import * as React from 'react';
import { useEffect, useState, useContext, useRef } from 'react';
import Box from '@mui/material/Box';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Container from '@mui/material/Container';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import CssBaseline from '@mui/material/CssBaseline';
import { Button, FormControl, FormGroup, FormHelperText, Input, Snackbar, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import API_URLS from '../../services/apiUrlService';
import { getData, postData } from '../../services/apiService';
import { AuthContext } from '../../context/authContext';
import crimeTypesData from '../../utils/crimeTypes.json';

export default function NewIncident() {
  const { user, isLoading } = useContext(AuthContext);
  const navigate = useNavigate(); // Initialize useNavigate
  const [formData, setFormData] = useState({
    _id: '',
    image: null,
    audio: null,
    pincode: '',
    crimeType: '',
    imageDescription: '',
    audioDescription: '',
    userDescription: '',
    policeStationId: '',
    userId: user ? user._id : '',
    startDate: '',
    status: '1',
  });

  const [response, setResponse] = useState(null);
  const [crimeTypes, setCrimeTypes] = useState([]);
  const imageInputRef = useRef();
  const [policeStationDetial, setPoliceStationDetail] = useState([]);

  const [snackbarOpen, setSnackbarOpen] = useState(false); // Snackbar state
  const [snackbarMessage, setSnackbarMessage] = useState(''); // Snackbar message
  const [filteredStations, setFilteredStations] = useState([]);

  useEffect(() => {
    const SystemDate = new Date().toISOString();
    setFormData((prevData) => ({ ...prevData, startDate: SystemDate }));
    setCrimeTypes(crimeTypesData);
    getPoliceStationDetail();
  }, []);

  const getPoliceStationDetail = async () => {
    try {
      const response = await getData(API_URLS.POLICE.getPoliceStationDetail);
      if (response && Array.isArray(response)) {
        // If response is a list, set it directly
        setPoliceStationDetail(response);
      } else if (response) {
        // If response is not an array but still valid
        setPoliceStationDetail([response]);
      } else {
        console.error("Unexpected response format:", response);
        setPoliceStationDetail([]); // Fallback to an empty list
      }
    } catch (error) {
      console.error("Error fetching police station details:", error);
    }
  };


  const handleFileChange = (event) => {
    const { name, files } = event.target;

    if (files && files[0]) {
      const reader = new FileReader();
      reader.onload = () => {
        setFormData((prevData) => {
          const updatedData = { ...prevData, [name]: reader.result };
          if (name === 'image') {
            getImageDescription(updatedData.image);
          }
          return updatedData;
        });
      };
      reader.readAsDataURL(files[0]);
    }
  };

  const getImageDescription = async (image_base64) => {
    const image = image_base64.split(',')[1]; // Remove the prefix

    const payload = {
      image: image,
    };

    try {
      const response = await postData(payload, API_URLS.INCIDENTS.getImageDescription);
      const responseData = response.description.split('\n');
      let parsedData = {
        crime: '',
        typeOfCrime: '',
        imageDescription: '',
      };

      responseData.forEach((line) => {
        const [key, value] = line.split(':');
        if (key === 'crime') {
          parsedData.crime = value.trim();
        } else if (key === 'typeOfCrime') {
          parsedData.typeOfCrime = value.trim();
        } else if (key === 'description') {
          parsedData.imageDescription = value.trim();
        }
      });
      setResponse(parsedData);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  useEffect(() => {
    if (response) {
      setFormData((prevData) => ({
        ...prevData,
        crimeType: response.typeOfCrime || '',
        imageDescription: response.imageDescription || '',
      }));

      const existingCrime = crimeTypes.find((crime) => crime === response.typeOfCrime);
      if (!existingCrime) {
        setCrimeTypes((prevTypes) => [...prevTypes, response.typeOfCrime]);
      }
    }
  }, [response, crimeTypes]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  // Handle pincode change and filter police station details
  const handlePincodeChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));

    if (value.length === 6) { // Assuming pincode is 6 digits
      const filteredStations = policeStationDetial.filter(
        (station) => station.pincode === value
      );
      setFilteredStations(filteredStations);
    } else {
      setFilteredStations([]); // Reset the list if pincode is invalid
    }
  };

  const handlePoliceStationChange = (e) => {
    const { value } = e.target;
    setFormData((prevData) => ({ ...prevData, policeStationId: value }));
  };


  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const response = await postData(formData, API_URLS.INCIDENTS.postIncident);
      setSnackbarMessage(response.detail);
      setSnackbarOpen(true);
      if (response.detail === '201: Incident created successfully.') {
        setTimeout(() => {
          navigate('/civilian/dashboard'); // Navigate after showing the message
        }, 2000); // Wait for 2 seconds
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setSnackbarMessage('Failed to submit incident. Please try again.');
      setSnackbarOpen(true); // Open Snackbar
    }
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <React.Fragment>
      <Container maxWidth="sm">
        <CssBaseline />
        <Box
          sx={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
          }}
        >
          <h2>New Incident</h2>
          <FormControl component="form" onSubmit={handleSubmit} fullWidth>
            <FormGroup>
              <FormControl fullWidth sx={{ marginBottom: 2 }}>
                <Input
                  type="file"
                  id="image"
                  name="image"
                  accept="image/*"
                  onChange={handleFileChange}
                  fullWidth
                  sx={{ display: 'none' }}
                  ref={imageInputRef}
                />
                <label htmlFor="image">
                  <Button component="span" variant="outlined" fullWidth sx={{ textAlign: 'left', justifyContent: 'flex-start', color: 'black' }}>
                    Upload Image
                  </Button>
                </label>
                {formData.image && <FormHelperText sx={{ color: 'black' }}>Image uploaded</FormHelperText>}
              </FormControl>

              <FormControl fullWidth sx={{ marginBottom: 2 }}>
                <Input
                  type="file"
                  id="audio"
                  name="audio"
                  accept="audio/*"
                  onChange={handleFileChange}
                  fullWidth
                  sx={{ display: 'none' }}
                />
                <label htmlFor="audio">
                  <Button component="span" variant="outlined" fullWidth sx={{ textAlign: 'left', justifyContent: 'flex-start', color: 'black' }}>
                    Upload Audio
                  </Button>
                </label>
                {formData.audio && <FormHelperText sx={{ color: 'black' }}>Audio uploaded</FormHelperText>}
              </FormControl>

              <TextField
                id="imageDescription"
                name="imageDescription"
                label="Image Description"
                multiline
                variant="standard"
                value={formData.imageDescription}
                onChange={handleChange}
                fullWidth
                required
                sx={{ marginBottom: 2 }}
              />

              <TextField
                id="audioDescription"
                name="audioDescription"
                label="Audio Description"
                multiline
                variant="standard"
                value={formData.audioDescription}
                onChange={handleChange}
                fullWidth
                required
                sx={{ marginBottom: 2 }}
              />

              <TextField
                id="userDescription"
                name="userDescription"
                label="Description"
                multiline
                variant="standard"
                value={formData.userDescription}
                onChange={handleChange}
                fullWidth
                required
                sx={{ marginBottom: 2 }}
              />

              <FormControl variant="standard" fullWidth required sx={{ marginBottom: 2 }}>
                <InputLabel id="crimeType-label">Type of Crime</InputLabel>
                <Select
                  labelId="crimeType-label"
                  id="crimeType"
                  name="crimeType"
                  value={formData.crimeType}
                  onChange={handleChange}
                  fullWidth
                >
                  {crimeTypes.map((crime, index) => (
                    <MenuItem key={index} value={crime}>
                      {crime}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                id="pincode"
                name="pincode"
                label="Enter Pincode"
                variant="standard"
                value={formData.pincode}
                onChange={handlePincodeChange}
                fullWidth
                required
                sx={{ marginBottom: 2 }}
              />

              {/* Police Station Select */}
              <FormControl variant="standard" fullWidth required sx={{ marginBottom: 2 }}>
                <InputLabel id="policeStation-label">Nearest Police Station</InputLabel>
                <Select
                  labelId="policeStation-label"
                  id="policeStationId"
                  name="policeStationId"
                  value={formData.policeStationId}
                  onChange={handlePoliceStationChange}
                  disabled={!filteredStations.length}
                >
                  {filteredStations.map((station) => (
                    <MenuItem key={station._id} value={station._id}>
                      {station.stationName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Button type="submit" variant="contained" fullWidth sx={{ marginTop: 2 }}>
                Submit
              </Button>
            </FormGroup>
          </FormControl>
        </Box>
      </Container>
    </React.Fragment>
  );
}
