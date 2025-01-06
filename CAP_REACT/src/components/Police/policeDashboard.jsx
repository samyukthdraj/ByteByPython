import * as React from 'react';
import { useEffect, useState, useContext, useMemo } from 'react';
import { getData, putData } from '../../services/apiService';
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
import EditIcon from '@mui/icons-material/Edit';
import DoneIcon from '@mui/icons-material/Done';
import CloseIcon from '@mui/icons-material/Close';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

export default function PoliceDashboard() {
  const { user } = useContext(AuthContext);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [isFileLoading, setIsFileLoading] = useState(false);
  const [sliderValue, setSliderValue] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [selectedStatus, setSelectedStatus] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [editingStatus, setEditingStatus] = useState(null);

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

  const handleEditStatus = (incidentId) => {
    setEditingStatus(incidentId);
    const incident = incidents.find(inc => inc.id === incidentId);
    setSelectedStatus(incident?.status || '');
  };

  const handleCancelEdit = () => {
    setEditingStatus(null);
    setSelectedStatus('');
  };

  const handleUpdateStatus = async (incidentId) => {
    if (!selectedStatus) return;

    setIsUpdatingStatus(true);
    try {
      await putData(
        { id: incidentId, status: selectedStatus },
        API_URLS.INCIDENTS.updateIncidentStatus,
        user.access_token
      );
      setSnackbar({
        open: true,
        message: 'Incident status updated successfully!',
        severity: 'success'
      });
      await fetchUserIncidents();
    } catch (error) {
      console.error('Error updating incident status:', error);
      setSnackbar({
        open: true,
        message: 'Failed to update incident status.',
        severity: 'error'
      });
    } finally {
      setIsUpdatingStatus(false);
      setEditingStatus(null);
      setSelectedStatus('');
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

  const renderStatusSection = (incident) => {
    const isEditing = editingStatus === incident.id;

    return (
      <Box display="flex" justifyContent="space-between" alignItems="center">
        {isEditing ? (
          <Box display="flex" alignItems="center" gap={1}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <Select
                value={selectedStatus || incident.status}
                onChange={(e) => setSelectedStatus(e.target.value)}
                disabled={isUpdatingStatus}
              >
                <MenuItem value={1}>Awaiting Action</MenuItem>
                <MenuItem value={2}>Resolved</MenuItem>
                <MenuItem value={3}>Dismissed</MenuItem>
              </Select>
            </FormControl>
            <IconButton
              size="small"
              color="primary"
              onClick={() => handleUpdateStatus(incident.id)}
              disabled={isUpdatingStatus}
            >
              <DoneIcon />
            </IconButton>
            <IconButton
              size="small"
              color="error"
              onClick={handleCancelEdit}
              disabled={isUpdatingStatus}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        ) : (
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="body2" color="textSecondary">
              {getStatus(incident.status)}
            </Typography>
            <IconButton
              size="small"
              onClick={() => handleEditStatus(incident.id)}
              sx={{ ml: 1 }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Box>
        )}
      </Box>
    );
  };

  useEffect(() => {
    if (user?._id) {
      fetchUserIncidents();
    }
  }, [user]);

  const fetchUserIncidents = async () => {
    setLoading(true);
    try {
      const response = await getData(API_URLS.INCIDENTS.getAllIncident, user.access_token);
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

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
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
                  {renderStatusSection(incident)}
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
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">{selectedIncident?.crimeType || 'Incident Details'}</Typography>
            <IconButton onClick={handleCloseDialog} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedIncident ? (
            <>
              <Box sx={{ marginBottom: 3 }}>
                <Typography variant="h6" sx={{ marginBottom: 1 }}>
                  Description
                </Typography>
                <Typography variant="body1" sx={{ marginBottom: 2 }}>
                  {selectedIncident.userDescription}
                </Typography>
                
                {/* Status Section */}
                <Box sx={{ marginBottom: 2 }}>
                  <Typography variant="subtitle1" sx={{ marginBottom: 1 }}>
                    Current Status
                  </Typography>
                  {renderStatusSection(selectedIncident)}
                </Box>

                {/* Date and Time */}
                <Typography variant="body2" color="textSecondary" sx={{ marginBottom: 2 }}>
                  Reported on: {new Date(selectedIncident.startDate).toLocaleString()}
                </Typography>
              </Box>

              {/* Media Section */}
              {(selectedIncident.files?.image || selectedIncident.files?.audio) && (
                <Box sx={{ marginBottom: 3 }}>
                  <Typography variant="h6" sx={{ marginBottom: 1 }}>
                    Evidence
                  </Typography>
                  
                  {/* Image Section */}
                  {selectedIncident.files?.image && (
                    <Box sx={{ marginBottom: 2 }}>
                      <CardMedia
                        component="img"
                        alt={selectedIncident.imageDescription || 'Incident Image'}
                        height="200"
                        image={selectedIncident.files.image}
                        sx={{ 
                          objectFit: 'contain', 
                          borderRadius: 1,
                          backgroundColor: 'background.default'
                        }}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/placeholder.jpg';
                        }}
                      />
                      <Typography variant="body2" color="textSecondary" sx={{ marginTop: 1 }}>
                        {selectedIncident.imageDescription || 'No description provided for the image.'}
                      </Typography>
                    </Box>
                  )}

                  {/* Audio Section */}
                  {selectedIncident.files?.audio && (
                    <Box sx={{ marginBottom: 2 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        Audio Recording
                      </Typography>
                      <Box sx={{ 
                        backgroundColor: 'background.default', 
                        padding: 2, 
                        borderRadius: 1 
                      }}>
                        <audio controls style={{ width: '100%' }}>
                          <source src={selectedIncident.files.audio} type="audio/mpeg" />
                          Your browser does not support the audio element.
                        </audio>
                      </Box>
                    </Box>
                  )}
                </Box>
              )}

              {/* Location Section */}
              <Box sx={{ marginBottom: 2 }}>
                <Typography variant="h6" sx={{ marginBottom: 1 }}>
                  Alloted Police Station Details
                </Typography>
                <Card variant="outlined" sx={{ padding: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: 1 }}>
                    <HomeIcon sx={{ marginRight: 1, color: 'primary.main' }} />
                    <Typography variant="body1">
                      {selectedIncident.policeStationName || 'Not assigned'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: 1 }}>
                    <CallIcon sx={{ marginRight: 1, color: 'primary.main' }} />
                    <Typography variant="body1">
                      {selectedIncident.policeMobileNumber || 'No contact provided'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <ShareLocationIcon sx={{ marginRight: 1, color: 'primary.main' }} />
                    <Typography variant="body1">
                      {selectedIncident.policeStationLocation || 'Location not available'}
                    </Typography>
                  </Box>
                </Card>
              </Box>

              {/* Additional Details Section if needed */}
              {selectedIncident.additionalDetails && (
                <Box sx={{ marginBottom: 2 }}>
                  <Typography variant="h6" sx={{ marginBottom: 1 }}>
                    Additional Details
                  </Typography>
                  <Typography variant="body1">
                    {selectedIncident.additionalDetails}
                  </Typography>
                </Box>
              )}
            </>
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center', padding: 3 }}>
              <Typography>No incident details available.</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}