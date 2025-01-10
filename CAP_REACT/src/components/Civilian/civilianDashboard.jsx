import React, { useEffect, useState, useContext } from 'react';
import { getData } from '../../services/apiService';
import { AuthContext } from '../../context/authContext';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
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

export default function CivilianDashboard() {
  const { user } = useContext(AuthContext);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [incidentMedia, setIncidentMedia] = useState({});

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
        setIncidents(incidentsData);
        await fetchMediaURLs(incidentsData);
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

  const fetchMediaURLs = async (incidents) => {
    const mediaPromises = incidents.map(async (incident) => {
      const imageURL = incident.image ? await getImageFromDrive(incident.image) : null;
      const audioURL = incident.audio ? await getAudioFromDrive(incident.audio) : null;
      return { id: incident.id, image: imageURL, audio: audioURL };
    });
    const mediaData = await Promise.all(mediaPromises);
    const mediaMap = {};
    mediaData.forEach(item => mediaMap[item.id] = item);
    setIncidentMedia(mediaMap);
  };

  const getImageFromDrive = async (fileId) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/downloadFileFromDrive/${fileId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Error fetching image:', error.message);
      return null;
    }
  };

  const getAudioFromDrive = async (fileId) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/downloadFileFromDrive/${fileId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Error fetching audio:', error.message);
      return null;
    }
  };

  const handleShowMore = (incident) => {
    setSelectedIncident(incident);
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setSelectedIncident(null);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <Grid container spacing={2} sx={{ padding: 2 }}>
      {loading ? (
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        </Grid>
      ) : incidents.length === 0 ? (
        <Grid item xs={12}>
          <Typography variant="h6" color="textSecondary" align="center">
            No incidents found. Please check back later.
          </Typography>
        </Grid>
      ) : (
        incidents.map((incident) => (
          <Grid item xs={12} sm={6} md={4} key={incident.id}>
            <Card sx={{ margin: '5px' }}>
              <CardMedia
                component="img"
                alt={incident.imageDescription || 'Incident Image'}
                height="140"
                image={incidentMedia[incident.id]?.image || '/placeholder.jpg'}
                sx={{ objectFit: 'cover', width: '100%' }}
                onError={(e) => {
                  if (!e.target.src.includes('/placeholder.jpg')) {
                    e.target.src = '/placeholder.jpg';
                  }
                }}
              />
              <CardContent>
                <Typography sx={{ fontWeight: 'bold', fontSize: '20px' }}>
                  {incident.crimeType}
                </Typography>
                <Typography>
                  {getStatus(incident.status)} {formatDate(incident.startDate)}
                </Typography>
              </CardContent>
              <CardActions>
                <Button
                  size="small"
                  onClick={() => handleShowMore(incident)}
                  sx={{
                    backgroundColor: 'rgba(245, 245, 245, 1)',
                    fontWeight: 'bold',
                    padding: '10px',
                    color: 'black',
                    borderRadius: '.5rem',
                    textTransform: 'capitalize',
                    '&:hover': {
                      backgroundColor: 'black',
                      color: 'white',
                    },
                  }}
                >
                  Show More
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))
      )}

      <Dialog open={showDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          {selectedIncident?.crimeType || 'Incident Details'}
        </DialogTitle>
        <DialogContent dividers>
          {selectedIncident ? (
            <>
              <Typography variant="body1">Image Description</Typography>
              <Typography variant="caption" sx={{ marginBottom: 2 }}>
                {selectedIncident.imageDescription}
              </Typography>
              <Typography variant="body1">Audio Description</Typography>
              <Typography variant="caption" sx={{ marginBottom: 2 }}>
                {selectedIncident.audioDescription}
              </Typography>
              <Typography variant="body1">User Description</Typography>
              <Typography variant="caption" sx={{ marginBottom: 2 }}>
                {selectedIncident.userDescription}
              </Typography>
              <Typography variant="body1" sx={{ marginBottom: 1 }}>
                Alloted Police Station
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: 1 }}>
                <HomeIcon sx={{ marginRight: 1, color: 'primary.main' }} />
                <Typography variant="caption">{selectedIncident.policeStationName}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: 1 }}>
                <CallIcon sx={{ marginRight: 1, color: 'primary.main' }} />
                <Typography variant="caption">{selectedIncident.policeMobileNumber}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: 1 }}>
                <ShareLocationIcon sx={{ marginRight: 1, color: 'primary.main' }} />
                <Typography variant="caption">{selectedIncident.policeStationLocation}</Typography>
              </Box>
            </>
          ) : (
            <Typography variant="body1">No details available.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCloseDialog}
            color="primary"
            sx={{
              backgroundColor: 'rgba(245, 245, 245, 1)',
              fontWeight: 'bold',
              padding: '10px',
              color: 'black',
              borderRadius: '.5rem',
              textTransform: 'capitalize',
              '&:hover': {
                backgroundColor: 'black',
                color: 'white',
              },
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
}
