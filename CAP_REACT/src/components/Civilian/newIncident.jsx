import * as React from 'react';
import {useEffect, useState, useContext } from 'react';
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

  useEffect(() => {
    const SystemDate = new Date().toISOString(); // Update startDate with current date-time
    setFormData((prevData) => ({ ...prevData, startDate: SystemDate }));
  }, []);

  // Convert file to Base64
  const convertToBase64 = (file, callback) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => callback(reader.result);
    reader.onerror = (error) => console.error('Error converting file to Base64:', error);
  };

  // Handle file changes
  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      convertToBase64(files[0], (base64) => {
        setFormData((prevData) => ({ ...prevData, [name]: base64 }));
      });
    }
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  // Handle form submission
  const handleSubmit = async (event) => {
    event.preventDefault();
    console.log(formData);
    try {
      const response = await postData(formData, 'post/incident');
      console.log('Response:', response);
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>; // Or some loading indicator
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
              {/* Image Upload */}
              <FormControl fullWidth sx={{ marginBottom: 2 }}>
                <Input
                  type="file"
                  id="image"
                  name="image"
                  accept="image/*"
                  onChange={handleFileChange}
                  fullWidth
                  sx={{ display: 'none' }}
                />
                <label htmlFor="image">
                  <Button
                    component="span"
                    variant="outlined"
                    fullWidth
                    sx={{
                      textAlign: 'left',
                      justifyContent: 'flex-start',
                      color: 'black',
                    }}
                  >
                    Upload Image
                  </Button>
                </label>
                {formData.image && <FormHelperText sx={{ color: 'black' }}>Image uploaded</FormHelperText>}
              </FormControl>

              {/* Audio Upload */}
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
                  <Button
                    component="span"
                    variant="outlined"
                    fullWidth
                    sx={{
                      textAlign: 'left',
                      justifyContent: 'flex-start',
                      color: 'black',
                    }}
                  >
                    Upload Audio
                  </Button>
                </label>
                {formData.audio && <FormHelperText sx={{ color: 'black' }}>Audio uploaded</FormHelperText>}
              </FormControl>

              {/* Pincode Input */}
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

              {/* Description Input */}
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

              {/* Crime Type Select */}
              <FormControl variant="standard" fullWidth required sx={{ marginBottom: 2 }}>
                <InputLabel id="crimeType-label">Type of Crime</InputLabel>
                <Select
                  labelId="crimeType-label"
                  id="crimeType"
                  name="crimeType"
                  value={formData.crimeType}
                  onChange={handleChange}
                >
                  <MenuItem value="Theft">Theft</MenuItem>
                  <MenuItem value="Assault">Assault</MenuItem>
                  <MenuItem value="Fraud">Fraud</MenuItem>
                  <MenuItem value="Robbery">Robbery</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>

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

              {/* Submit Button */}
              <Button
                type="submit"
                color="secondary"
                variant="contained"
                sx={{ marginTop: 2 }}
              >
                Submit
              </Button>
            </FormGroup>
          </FormControl>
        </Box>
      </Container>
    </React.Fragment>
  );
}
