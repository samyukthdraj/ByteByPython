import * as React from 'react';
import { useEffect, useState, useContext, useRef } from 'react';
import Container from '@mui/material/Container';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import CssBaseline from '@mui/material/CssBaseline';
import { Button, FormControl, FormGroup, FormHelperText, Input, Snackbar, Alert, Select, MenuItem, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import API_URLS from '../../services/apiUrlService';
import { getData, postData, deleteData } from '../../services/apiService';
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
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();
  const { user, isLoading } = useContext(AuthContext);
  const imageInputRef = useRef();
  const [crimeTypes, setCrimeTypes] = useState([]);
  const [localImageId, setLocalImageId] = useState(null);
  const [localAudioId, setLocalAudioId] = useState(null);
  const [imageDescriptionResponse, setImageDescriptionResponse] = useState(null);
  const [audioDescriptionResponse, setAudioDescriptionResponse] = useState(null);
  const [policeStationDetial, setPoliceStationDetail] = useState([]);
  const [filteredStations, setFilteredStations] = useState([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [removingFile, setRemovingFile] = useState(null); 
  const [formData, setFormData] = useState({
    _id: '',
    image: '',
    audio: '',
    pincode: '',
    crimeType: '',
    imageDescription: '',
    audioDescription: '',
    userDescription: '',
    policeStationId: '',
    userId: '',
    startDate: '',
    status: '1',
  });

  useEffect(() => {
    const SystemDate = new Date().toISOString();
    setFormData((prevData) => ({ ...prevData, startDate: SystemDate }));
  }, []);

  useEffect(() => {
    setCrimeTypes(crimeTypesData);
    if (user && user.access_token) {  //Add a check for user and token before calling
      getPoliceStationDetail();
      setFormData((prevData) => ({
        ...prevData,
        userId: user._id,
      }));
    }

  }, [user, user?.access_token]);

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

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const { name } = event.target;
    const isImage = name === 'image';
    const setUploading = isImage ? setUploadingImage : setUploadingAudio;
    setUploading(true);

    try {
      const uploadResponse = await uploadFileToDrive(file);
      if (uploadResponse) {
        const { webViewLink, file_id } = uploadResponse;
        const setLocalId = isImage ? setLocalImageId : setLocalAudioId;
        const setImageDescResp = isImage ? setImageDescriptionResponse : setAudioDescriptionResponse;
        const getDescFunc = isImage ? getImageDescription : getAudioDescription;

        setLocalId(file_id);
        setFormData((prevData) => ({ ...prevData, [name]: webViewLink }));
        await getDescFunc(file);
      } else {
        showSnackbar('File upload failed.', 'error');
      }
    } catch (error) {
      showSnackbar(`File upload failed: ${error.message}`, 'error');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };
  
  const handleRemoveFile = async (fileType) => {
    setRemovingFile(fileType);
    try {
      let success = false;
      if (fileType === 'image') {
        success = await removeFileFromDrive(localImageId);
        if (success) {
          setLocalImageId(null);
          setImageDescriptionResponse(null);
          if (imageInputRef.current) {
            imageInputRef.current.value = '';
          }
        }
      } else if (fileType === 'audio') {
        success = await removeFileFromDrive(localAudioId);
        if (success) {
          setLocalAudioId(null);
          setAudioDescriptionResponse(null);
          const audioInput = document.getElementById('audio');
          if (audioInput) {
            audioInput.value = '';
          }
        }
      }
      
      if (success) {
        setFormData((prevData) => ({
          ...prevData,
          [fileType]: '',
          [`${fileType}Description`]: '',
        }));
        showSnackbar(`Successfully removed ${fileType}.`, 'success');
      } else {
        showSnackbar(`Error removing ${fileType}. Please try again.`, 'error');
      }
    } catch (error) {
      showSnackbar(`Error removing ${fileType}: ${error.message}`, 'error');
    } finally {
      setRemovingFile(null);
    }
  };

  const uploadFileToDrive = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
  
    try {
      const response = await fetch(API_URLS.INCIDENTS.uploadFileToDrive, {
        method: 'POST',
        headers: {
          ...(user?.access_token ? { Authorization: `Bearer ${user.access_token}` } : {}),
        },
        body: formData,
      });
  
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (jsonError) {
          errorData = { detail: `HTTP error! Status: ${response.status}, Message: ${response.statusText}` };
        }
        throw new Error(errorData.detail || `HTTP error! Status: ${response.status}`);
      }
  
      const data = await response.json();
      console.log("Upload successful:", data);
      return {
        webViewLink: data.webViewLink,
        file_id: data.file_id,
      };
    } catch (error) {
      console.error("Error during file upload:", error.message || error);
      return null
    }
  };
  
  const removeFileFromDrive = async (id) => {
    try{
      const response = await fetch(API_URLS.INCIDENTS.removeFileFromDrive(id),{
        method: 'DELETE',
        headers: {
          ...(user?.access_token ? { Authorization: `Bearer ${user.access_token}` } : {}),
        },
      });
      const data = await response.json();
      if(data.message === "File deleted successfully")
        return true;
      else 
        return false;
    }catch(error){
      console.log(error);
    }
  };

  const getImageDescription = async (imageFile) => {
    if (!imageFile) return;

    const formData = new FormData();
    formData.append("file", imageFile);

    try {
      const response = await fetch(API_URLS.INCIDENTS.getImageDescription, {
        method: 'POST',
        headers: {
          ...(user.access_token ? { Authorization: `Bearer ${user.access_token}` } : {}),
        },
        body: formData,
      });

      if (response.ok) {
        const responseData = await response.json();
        const description = responseData.description || '';
        const lines = description.split(',');
        let parsedData = {
          crime: '',
          typeOfCrime: 'No Crime',
          imageDescription: 'Can\'t find any crime in the image.',
        };
        lines.forEach((line) => {
          const [key, value] = line.split(':');
          if (key && value) {
            if (key.trim() === 'crime') {
              parsedData.crime = value.trim();
            } else if (key.trim() === 'typeOfCrime') {
              parsedData.typeOfCrime = value.trim();
            } else if (key.trim() === 'description') {
              parsedData.imageDescription = value.trim();
            }
          }
        });
        setImageDescriptionResponse(parsedData);
      } else {
        console.error('Failed to fetch image description');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const getAudioDescription = async (audioFile) => {
    if (!audioFile) return;

    const formData = new FormData();
    formData.append("file", audioFile);

    try {
      const response = await fetch(API_URLS.INCIDENTS.getAudioDescripion, {
        method: 'POST',
        headers: {
          // No need to add "Content-Type: multipart/form-data" as FormData handles that automatically
          ...(user.access_token ? { Authorization: `Bearer ${user.access_token}` } : {}),
        },
        body: formData,
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
          console.log(errorData);
        } catch (jsonError) {
          // Handle cases where response isn't valid JSON (e.g., 500 error)
          errorData = { detail: `HTTP error! status: ${response.status}, message: ${response.statusText}` };
        }
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.detail || response.statusText}`);
      }

      const data = await response.json();
      console.log('Audio Description Response:', data); // Log the response for debugging
      setAudioDescriptionResponse(data.description?.transcription_text)
      setFormData((prevData) => ({
        ...prevData,
        audioDescription: data.description?.transcription_text || '', //Handle potential missing keys gracefully
      }));
    } catch (error) {
      console.error('Error posting data:', error);
      showSnackbar('Error processing audio.', 'error');
      throw error;
    }
  };


  useEffect(() => {
    if (imageDescriptionResponse) {
      setFormData((prevData) => ({
        ...prevData,
        crimeType: imageDescriptionResponse.typeOfCrime || '',
        imageDescription: imageDescriptionResponse.imageDescription || '',
      }));

      if (imageDescriptionResponse.typeOfCrime && !crimeTypes.includes(imageDescriptionResponse.typeOfCrime)) {
        setCrimeTypes((prevTypes) => [...prevTypes, imageDescriptionResponse.typeOfCrime]);
      }
    }
  }, [imageDescriptionResponse, crimeTypes]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handlePincodeChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
    const filtered = value.length === 6 ?
      policeStationDetial.filter(station => station.pincode === value) : [];
    setFilteredStations(filtered);
  };

  const handlePoliceStationChange = (e) => {
    const { value } = e.target;
    setFormData((prevData) => ({ ...prevData, policeStationId: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      if (!formData.image || !formData.audio || !formData.pincode || !formData.crimeType || !formData.policeStationId) {
        showSnackbar('Please fill in all required fields.', 'error');
        return;
    }
      let uploadPromises = [];
      const response = await postData(formData, API_URLS.INCIDENTS.postIncident, user.access_token);
      if (response.detail === '201: Incident created successfully.') {
        showSnackbar('Incident raised successfully.', 'info');
        setTimeout(() => {
          navigate('/civilian/dashboard');
        }, 2000);
      } else {
        showSnackbar('Error creating incident: ' + response.detail, 'error'); // Improved error message
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      showSnackbar('An error occurred while submitting the form.', 'error'); // More generic error message
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
                    sx={{
                      textAlign: 'left',
                      justifyContent: 'flex-start',
                      color: 'primary.main',
                      borderColor: 'quaternary.main'
                    }}>
                    Upload Image
                  </Button>
                </label>
                {uploadingImage ? <CircularProgress size={20} /> : null}  {/* Show loading indicator */}
                {localImageId && (
                  <>
                    <FormHelperText sx={{ color: 'black' }}>Image selected</FormHelperText>
                    <Button onClick={() => handleRemoveFile('image')} disabled={removingFile === 'image'}>
                      {removingFile === 'image' ? 'Removing...' : 'Remove Image'}
                    </Button>
                  </>
                )}
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
                    sx={{
                      textAlign: 'left',
                      justifyContent: 'flex-start',
                      color: 'primary.main',
                      borderColor: 'quaternary.main'
                    }}>
                    Upload Audio
                  </Button>
                </label>
                {uploadingAudio ? <CircularProgress size={20} /> : null}  {/* Show loading indicator */}
                {localAudioId && (
                  <>
                    <FormHelperText sx={{ color: 'black' }}>Audio selected</FormHelperText>
                    <Button onClick={() => handleRemoveFile('audio')} disabled={removingFile === 'audio'}>
                      {removingFile === 'audio' ? 'Removing...' : 'Remove Audio'}
                    </Button>
                  </>
                )}
              </FormControl>

              {/* Conditionally Render Image Description Field */}
              {imageDescriptionResponse && (
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
              {
                audioDescriptionResponse && (

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
                )
              }
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

              <FormControl variant="standard" fullWidth sx={{ marginBottom: 2 }}>
                <InputLabel id="crimeType-label" sx={{ color: "primary.main" }}>Type of Crime</InputLabel>
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
              <FormControl variant="standard" fullWidth sx={{ marginBottom: 2 }}>
                <InputLabel id="policeStationId-label" sx={{ color: "primary.main" }}>Police Station</InputLabel>
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
                    <MenuItem value="" disabled sx={{ color: 'primary.main' }}>Select Pincode First</MenuItem>
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
