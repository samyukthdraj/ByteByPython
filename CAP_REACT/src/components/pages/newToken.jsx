import * as React from 'react';
import { useState } from 'react';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import { Button, FormControl, FormGroup, FormHelperText, Input } from '@mui/material';
import { getData, postData } from '../../services/API';

export default function NewToken() {
  // State to manage the form data as a single object
  const [formData, setFormData] = useState({
    image: null,
    audio: null,
    pincode: '',
    contact: '',
    crimeType: '',
    description: '',
    policeStation: '',
  });

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  // Handle file changes
  const handleFileChange = (e) => {
    const { name, files } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: files[0] }));
  };

  // Handle form submission
  const handleSubmit = async (event) => {
    event.preventDefault();

    // Log the grouped form data
    console.log(formData);

    // Call the postData function with the form data
    try {
      const fetchData= await getData();
      console.log(fetchData);
      await postData(formData); // Ensure postData is implemented to handle the data
      alert('Form submitted successfully!');
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  return (
    <React.Fragment>
      <CssBaseline />
      <Container maxWidth="sm">
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
          <h1>CAP</h1>
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
                  <Button component="span" variant="outlined" fullWidth>
                    {formData.image ? formData.image.name : 'Upload Image'}
                  </Button>
                </label>
                {formData.image && <FormHelperText>Image: {formData.image.name}</FormHelperText>}
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
                  <Button component="span" variant="outlined" fullWidth>
                    {formData.audio ? formData.audio.name : 'Upload Audio'}
                  </Button>
                </label>
                {formData.audio && <FormHelperText>Audio: {formData.audio.name}</FormHelperText>}
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

              {/* Contact Input */}
              <TextField
                id="contact"
                name="contact"
                label="Your Contact"
                variant="standard"
                value={formData.contact}
                onChange={handleChange}
                fullWidth
                required
                sx={{ marginBottom: 2 }}
              />

              {/* Crime Type Select */}
              <TextField
                id="crimeType"
                name="crimeType"
                select
                label="Type of Crime"
                value={formData.crimeType}
                onChange={handleChange}
                fullWidth
                required
                sx={{ marginBottom: 2 }}
              >
                <MenuItem value="Theft">Theft</MenuItem>
                <MenuItem value="Assault">Assault</MenuItem>
                <MenuItem value="Fraud">Fraud</MenuItem>
                <MenuItem value="Robbery">Robbery</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </TextField>

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

              {/* Police Station Select */}
              <TextField
                id="policeStation"
                name="policeStation"
                select
                label="Nearest Police Station"
                value={formData.policeStation}
                onChange={handleChange}
                fullWidth
                required
                sx={{ marginBottom: 2 }}
              >
                <MenuItem value="Station A">Station A</MenuItem>
                <MenuItem value="Station B">Station B</MenuItem>
                <MenuItem value="Station C">Station C</MenuItem>
                <MenuItem value="Station D">Station D</MenuItem>
              </TextField>

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
