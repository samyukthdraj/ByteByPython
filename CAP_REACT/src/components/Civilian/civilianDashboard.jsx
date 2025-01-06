import * as React from 'react';
import { useEffect, useState, useContext, useMemo } from 'react';
import { getData } from '../../services/apiService';
import { AuthContext } from '../../context/authContext';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import API_URLS from '../../services/apiUrlService';
import ShareLocationIcon from '@mui/icons-material/ShareLocation';
import CallIcon from '@mui/icons-material/Call';
import HomeIcon from '@mui/icons-material/Home';
import Slider from '@mui/material/Slider';
import SwipeableViews from 'react-swipeable-views';
import IconButton from '@mui/material/IconButton';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

export default function CivilianDashboard() {
  const { user } = useContext(AuthContext);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [isFileLoading, setIsFileLoading] = useState(false);
  const [sliderValue, setSliderValue] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);

  const getStatus = (statusNumber) => {
    switch (String(statusNumber)) {
      case '1':
        return 'Awaiting Action';
      case '2':
        return 'Resolved';
      case '3':
        return 'Dismissed';
      default:
        return 'Unknown';
    }
  };

  const handleSliderChange = (event, newValue) => {
    setSliderValue(newValue);
  };

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % memoizedIncidents.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + memoizedIncidents.length) % memoizedIncidents.length);
  };

  const filterIncidentsByDate = (incident) => {
    const today = new Date();
    const incidentDate = new Date(incident.startDate);
    today.setHours(0, 0, 0, 0);
    incidentDate.setHours(0, 0, 0, 0);

    if (sliderValue === 0) {
      return incidentDate.getTime() === today.getTime();
    } else if (sliderValue === 1) {
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      return incidentDate.getTime() === yesterday.getTime();
    } else {
      return incidentDate.getTime() < today.getTime() - 86400000;
    }
  };

  useEffect(() => {
    if (user?._id) {
      fetchUserIncidents();
    }
  }, [user]);

  const fetchUserIncidents = async () => {
    setLoading(true);
    try {
      const response = await getData(API_URLS.INCIDENTS.getIncidentByUserId(user._id), user.access_token);
      const incidentsData = Array.isArray(response) ? response : response?.data;

      if (Array.isArray(incidentsData)) {
        const incidentsWithUrls = await Promise.all(incidentsData.map(async (incident) => ({
          ...incident,
          files: await fetchIncidentFiles(incident),
        })));
        setIncidents(incidentsWithUrls);
      } else {
        console.error('Unexpected response format:', response);
        setIncidents([]);
      }
    } catch (error) {
      console.error('Error fetching incidents:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchIncidentFiles = async (incident) => {
    const files = {};
    const promises = [];
    if (incident.image) {
      promises.push(downloadFileFromDrive(incident.image).then(url => ({ image: url })));
    }
    if (incident.audio) {
      promises.push(downloadFileFromDrive(incident.audio).then(url => ({ audio: url })));
    }
    const results = await Promise.allSettled(promises);
    results.forEach(result => {
      if (result.status === 'fulfilled') {
        Object.assign(files, result.value);
      } else {
        console.error('Error downloading file for incident', incident.id, result.reason);
      }
    });
    return files;
  };

  const downloadFileFromDrive = async (link) => {
    const id = extractFileId(link);
    setIsFileLoading(true);
    try {
      const response = await fetch(API_URLS.INCIDENTS.downloadFileFromDrive(id), {
        method: 'GET',
        headers: user?.access_token ? { Authorization: `Bearer ${user.access_token}` } : {},
      });
      setIsFileLoading(false);
      return response.url || response;
    } catch (error) {
      console.error('Error downloading file:', error);
      setIsFileLoading(false);
      return null;
    }
  };

  const extractFileId = (url) => {
    const regex = /\/d\/(.*?)(?=\/|$)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const handleShowMore = (incident) => {
    setSelectedIncident(incident);
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setSelectedIncident(null);
  };

  const memoizedIncidents = useMemo(() => incidents.filter(filterIncidentsByDate), [incidents, sliderValue]);

  return (
    <Box sx={{ padding: 2 }}>
      <Slider
        value={sliderValue}
        onChange={handleSliderChange}
        valueLabelDisplay="auto"
        valueLabelFormat={(value) => (value === 0 ? 'Today' : value === 1 ? 'Yesterday' : 'Other')}
        step={1}
        marks={[
          { value: 0, label: 'Today' },
          { value: 1, label: 'Yesterday' },
          { value: 2, label: 'Other' },
        ]}
        min={0}
        max={2}
        sx={{ marginBottom: 2 }}
      />

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', height: '100%' }}>
          <CircularProgress />
        </Box>
      ) : memoizedIncidents.length === 0 ? (
        <Typography variant="h6" color="textSecondary" align="center">
          No incidents found. Please check back later.
        </Typography>
      ) : (
        <Box sx={{ position: 'relative' }}>
          <IconButton
            onClick={handlePrev}
            sx={{ position: 'absolute', top: '50%', left: 0, zIndex: 1 }}
            disabled={memoizedIncidents.length <= 1}
          >
            <ArrowBackIosIcon />
          </IconButton>
          <SwipeableViews
            index={currentIndex}
            onChangeIndex={(index) => setCurrentIndex(index)}
            enableMouseEvents
          >
            {memoizedIncidents.map((incident) => (
              <Card key={incident.id} sx={{ maxWidth: 345, margin: '0 auto', marginBottom: 2 }}>
                {incident.files?.image && (
                  <CardMedia
                    component="img"
                    alt={incident.imageDescription || 'Incident Image'}
                    height="140"
                    image={incident.files.image}
                    sx={{ objectFit: 'cover' }}
                    onError={(e) => { e.target.src = '/placeholder.jpg'; }}
                  />
                )}
                <CardContent>
                  <Typography gutterBottom variant="h5" component="div">
                    {incident.crimeType}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {getStatus(incident.status)}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button size="small" onClick={() => handleShowMore(incident)}>Show More</Button>
                </CardActions>
              </Card>
            ))}
          </SwipeableViews>
          <IconButton
            onClick={handleNext}
            sx={{ position: 'absolute', top: '50%', right: 0, zIndex: 1 }}
            disabled={memoizedIncidents.length <= 1}
          >
            <ArrowForwardIosIcon />
          </IconButton>
        </Box>
      )}

      {/* Dialog for showing more details */}
      <Dialog open={showDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedIncident?.crimeType || 'Incident Details'}</DialogTitle>
        <DialogContent dividers>
          {selectedIncident ? (
            <>
              <Typography variant="h6" sx={{ marginBottom: 1 }}>
                {selectedIncident.crimeType}
              </Typography>
              <Typography variant="body1" sx={{ marginBottom: 2 }}>
                {selectedIncident.userDescription}
              </Typography>

              {selectedIncident.files?.image && (
                <Box sx={{ marginBottom: 2 }}>
                  <CardMedia
                    component="img"
                    alt={selectedIncident.imageDescription || 'Incident Image'}
                    height="200"
                    image={selectedIncident.files.image}
                    sx={{ objectFit: 'contain', borderRadius: 2 }}
                    onError={(e) => {
                      e.target.onerror = null; // Prevent infinite loop
                      e.target.src = '/placeholder.jpg'; // Default image
                    }}
                  />
                  <Typography variant="body2" color="textSecondary" sx={{ marginTop: 1 }}>
                    {selectedIncident.imageDescription || 'No description provided for the image.'}
                  </Typography>
                </Box>
              )}

              {selectedIncident.files?.audio && (
                <Box sx={{ marginBottom: 2 }}>
                  <Typography variant="body1" gutterBottom>
                    <strong>Audio:</strong>
                  </Typography>
                  <audio controls>
                    <source src={selectedIncident.files.audio} type="audio/mpeg" />
                    Your browser does not support the audio element.
                  </audio>
                </Box>
              )}

              <Typography variant="h6" sx={{ marginBottom: 1 }}>Alloted Police Station</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: 1 }}>
                <HomeIcon sx={{ marginRight: 1, color: 'primary.main' }} />
                <Typography variant="body1">{selectedIncident.policeStationName}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: 1 }}>
                <CallIcon sx={{ marginRight: 1, color: 'primary.main' }} />
                <Typography variant="body1">{selectedIncident.policeMobileNumber}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: 1 }}>
                <ShareLocationIcon sx={{ marginRight: 1, color: 'primary.main' }} />
                <Typography variant="body1">{selectedIncident.policeStationLocation}</Typography>
              </Box>
            </>
          ) : (
            <Typography>No incident details available.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}