import * as React from 'react';
import { useEffect, useState, useContext } from 'react';
import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import Container from '@mui/material/Container';
import TextField from '@mui/material/TextField';
import CssBaseline from '@mui/material/CssBaseline';
import { Button, FormControl, FormGroup, FormHelperText, Input } from '@mui/material';
import { postData } from '../../services/API';
import { AuthContext } from '../../context/AuthContext';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import { useRef } from 'react';
import crimeTypesData from '../../utils/crimeTypes.json';
export default function NewIncident() {
  const { user, isLoading } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    image: null,
    audio: null,
    pincode: '',
    crimeType: '',
    description: '',
    policeStationId: '',
    username: user ? user.username : '',
    startDate: '',
    status: '1'
  });

  const [response, setResponse] = useState(null);
  const [crimeTypes, setCrimeTypes] = useState([]);
  const imageInputRef = useRef();

  useEffect(() => {
    const SystemDate = new Date().toISOString();
    setFormData((prevData) => ({ ...prevData, startDate: SystemDate }));
    setCrimeTypes(crimeTypesData);
  }, []);

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

  // const getImageDescription = async (image_base64) => {
  //   const image = image_base64.split(',')[1];

  //   const payload = {
  //     image: image,
  //   };

  //   try {
  //     let parsedData = {
  //       crime: 'True',
  //       typeOfCrime: 'Illegal Parking',
  //       description: 'Multiple vehicles are parked in a "No Parking" zon…age.  This is a violation of traffic regulations',
  //     };

  //     console.log(parsedData);
  //     setResponse(parsedData);
  //   } catch (error) {
  //     console.error('Error:', error);
  //   }
  // };

  const getImageDescription = async (image_base64) => {
    const image = image_base64.split(',')[1]; // Remove the prefix
 
    // Construct the payload
    const payload = {
      image: image, // Send image as a key-value pair
    };
 
    // Make the POST request
    try {
      const response = await postData(payload, 'post/getImageDescription');
      const responseData = response.description.split('\n'); // Split the description string by lines
      let parsedData = {
        crime: '',
        typeOfCrime: '',
        description: '',
      };
 
      responseData.forEach((line) => {
        const [key, value] = line.split(':');
        if (key === 'crime') {
          parsedData.crime = value.trim();
        } else if (key === 'typeOfCrime') {
          parsedData.typeOfCrime = value.trim();
        } else if (key === 'description') {
          parsedData.description = value.trim();
        }
      });
      console.log(parsedData);
      setResponse(parsedData); // Store the parsed response in the state
    } catch (error) {
      console.error('Error:', error);
    }
  };

  useEffect(() => {
    if (response) {
      setFormData((prevData) => ({
        ...prevData,
        crimeType: response.typeOfCrime || '',
        description: response.description || '',
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

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const response = await postData(formData, 'post/incident');
      console.log('Response:', response);
    } catch (error) {
      console.error('Error submitting form:', error);
    }
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
                id="description"
                name="description"
                label="Description"
                multiline
                variant="standard"
                value={formData.description}
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
                onChange={handleChange}
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
                  onChange={handleChange}
                >
                  <MenuItem value="Station A">Station A</MenuItem>
                  <MenuItem value="Station B">Station B</MenuItem>
                  <MenuItem value="Station C">Station C</MenuItem>
                  <MenuItem value="Station D">Station D</MenuItem>
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
