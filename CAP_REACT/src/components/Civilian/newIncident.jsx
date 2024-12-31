import * as React from 'react';
import { useEffect, useState, useContext, useRef } from 'react';
import Container from '@mui/material/Container';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import CssBaseline from '@mui/material/CssBaseline';
import { Button, FormControl, FormGroup, FormHelperText, Input, Snackbar, Alert, Select, MenuItem } from '@mui/material';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import API_URLS from '../../services/apiUrlService';
import { getData, postData } from '../../services/apiService';
import { AuthContext } from '../../context/authContext';
import crimeTypesData from '../../utils/crimeTypes.json';
import { ThemeProvider, createTheme } from '@mui/material';
import { useSnackbar } from '../../context/snackbarContext';

const theme = createTheme({
  palette: {
    background: {
      default: '#FFFFFF',
    },
    primary: {
      main: '#272343',
    },
    secondary: {
      main: '#E3F6F5',
    },
    tertiary: {
      main: '#FFFFFF',
    },
    quaternary: {
      main: '#BAE8E8',
    },
  },
});

export default function NewIncident() {
  const { user, isLoading } = useContext(AuthContext);
  const navigate = useNavigate(); // Initialize useNavigate
  const { showSnackbar } = useSnackbar();
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
  const [filteredStations, setFilteredStations] = useState([]);

  useEffect(() => {
    const SystemDate = new Date().toISOString();
    setFormData((prevData) => ({ ...prevData, startDate: SystemDate }));
  }, []);

  useEffect(()=>{
    setCrimeTypes(crimeTypesData);
    getPoliceStationDetail();
  },[user])

  const getPoliceStationDetail = async () => {
    try {
      const response = await getData(API_URLS.POLICE.getPoliceStationDetail, user.access_token);
      if (response && Array.isArray(response)) {
        setPoliceStationDetail(response);
      } else if (response) {
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

    const payload = { image: image };

    try {
      const response = await postData(payload, API_URLS.INCIDENTS.getImageDescription, user.access_token);
      const responseData = response.description.split('\n');
      let parsedData = {
        crime: '',
        typeOfCrime: '',
        imageDescription: 'Can\'t find any crime in the image.', // Default message
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

      // If a crime is detected, update the description
      if (parsedData.crime && parsedData.crime !== 'false') {
        setResponse(parsedData);
      } else {
        setResponse({
          ...parsedData,
          imageDescription: 'Can\'t find any crime in the image.',
        });
      }
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

      if (response.typeOfCrime && !crimeTypes.includes(response.typeOfCrime)) {
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
      const response = await postData(formData, API_URLS.INCIDENTS.postIncident, user.access_token);
      if (response.detail === '201: Incident created successfully.') {
        showSnackbar('Incident raised successfully.', 'info');
        setTimeout(() => {
          navigate('/civilian/dashboard'); // Navigate after showing the message
        }, 2000); // Wait for 2 seconds
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      showSnackbar('Error occured', 'warning');
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <ThemeProvider theme={theme}>
      <Container maxWidth="sm">
        <CssBaseline />
        <div style={{
          overflowY: 'auto',
          maxHeight: 'calc(100vh - 20vh)',
          scrollbarWidth: 'none',  /* Firefox */
          '-ms-overflow-style': 'none',  /* IE and Edge */
          '&::-webkit-scrollbar': {
            display: 'none'  /* Chrome, Safari, Opera */
          }
        }}>
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
                  <Button component="span" variant="outlined" fullWidth
                    sx={{ textAlign: 'left', 
                      justifyContent: 'flex-start', 
                      color: 'primary.main', 
                      borderColor: 'quaternary.main'  
                    }}>
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
                  <Button component="span" variant="outlined" fullWidth 
                    sx={{ textAlign: 'left', 
                          justifyContent: 'flex-start', 
                          color: 'primary.main', 
                          borderColor: 'quaternary.main'  
                        }}>
                    Upload Audio
                  </Button>
                </label>
                {formData.audio && <FormHelperText sx={{ color: 'black' }}>Audio uploaded</FormHelperText>}
              </FormControl>

              {/* Conditionally Render Image Description Field */}
              {response && (
                <TextField
                  id="imageDescription"
                  name="imageDescription"
                  label="Image Description"
                  multiline
                  variant="standard"
                  value={formData.imageDescription}
                  onChange={handleChange}
                  fullWidth
                  color="primary"
                  sx={{
                    marginBottom: 2,
                    maxHeight: 200,
                    overflowY: 'auto',
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'secondary.main',
                      '& input': {
                        color: 'primary.main',
                      },
                      '& fieldset': {
                        borderColor: 'quaternary.main',
                      },
                      '&:hover fieldset': {
                        borderColor: 'primary.main',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: 'primary.main',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: 'primary.main',
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: 'primary.main',
                    },
                  }}
                />
              )}

              <TextField
                id="audioDescription"
                name="audioDescription"
                label="Audio Description"
                multiline
                variant="standard"
                value={formData.audioDescription}
                onChange={handleChange}
                fullWidth
                color="primary"
                sx={{ 
                  marginBottom: 2,
                  '& .MuiOutlinedInput-root': {
                      backgroundColor: 'secondary.main',
                      '& input': {
                        color: 'primary.main',
                      },
                      '& fieldset': {
                        borderColor: 'quaternary.main',
                      },
                      '&:hover fieldset': {
                        borderColor: 'primary.main',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: 'primary.main',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: 'primary.main',
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: 'primary.main',
                    },
                }}
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
                color="primary"
                sx={{ 
                  marginBottom: 2,
                  '& .MuiOutlinedInput-root': {
                      backgroundColor: 'secondary.main',
                      '& input': {
                        color: 'primary.main',
                      },
                      '& fieldset': {
                        borderColor: 'quaternary.main',
                      },
                      '&:hover fieldset': {
                        borderColor: 'primary.main',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: 'primary.main',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: 'primary.main',
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: 'primary.main',
                    },
                }}
              />

              <FormControl variant="standard" fullWidth  sx={{ marginBottom: 2 }}>
                <InputLabel id="crimeType-label" sx = {{color :"primary.main"}}>Type of Crime</InputLabel>
                <Select
                  labelId="crimeType-label"
                  id="crimeType"
                  name="crimeType"
                  value={formData.crimeType}
                  onChange={handleChange}
                  fullWidth 
                >
                  {crimeTypes.map((crime, index) => (
                    <MenuItem key={index} value={crime} style={{ color: 'primary.main' }}>
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
                color="primary"
                sx={{ 
                  marginBottom: 2,
                  '& .MuiOutlinedInput-root': {
                      backgroundColor: 'secondary.main',
                      '& input': {
                        color: 'primary.main',
                      },
                      '& fieldset': {
                        borderColor: 'quaternary.main',
                      },
                      '&:hover fieldset': {
                        borderColor: 'primary.main',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: 'primary.main',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: 'primary.main',
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: 'primary.main',
                    },
                }}
              />

              {/* Police Station Select */}
              <FormControl variant="standard" fullWidth  sx={{ marginBottom: 2 }}>
                <InputLabel id="policeStationId-label" sx = {{color :"primary.main"}}>Police Station</InputLabel>
                <Select
                  labelId="policeStationId-label"
                  id="policeStationId"
                  name="policeStationId"
                  value={formData.policeStationId}
                  onChange={handlePoliceStationChange}
                >
                  {filteredStations.length > 0 ? (
                    filteredStations.map((station, index) => (
                      <MenuItem key={index} value={station._id} style={{ color: 'primary.main' }}>
                        {station.stationName}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem value="" sx = {{ color: 'primary.main' }}>No stations found</MenuItem>
                  )}
                </Select>
              </FormControl>

              <Button variant="contained" color="primary" type="submit" fullWidth>
                Submit
              </Button>
            </FormGroup>
          </FormControl>
        </div>
      </Container>
    </ThemeProvider>
  );
}
