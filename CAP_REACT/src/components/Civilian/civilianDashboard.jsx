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

export default function CivilianDashboard() {
  const { user } = useContext(AuthContext);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [isFileLoading, setIsFileLoading] = useState(false); //Removed fileUrls state

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
      return response.url || response; //Check if response is a URL or the Response object itself
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

  const memoizedIncidents = useMemo(() => incidents, [incidents]);

  return (
    <Box
      sx={{
        overflowY: 'auto',
        maxHeight: 'calc(100vh - 20vh)',
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 2,
        justifyContent: 'center',
        scrollbarWidth: 'none',
        '-ms-overflow-style': 'none',
        '&::-webkit-scrollbar': {
          display: 'none',
        },
      }}
    >
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', height: '100%' }}>
          <CircularProgress />
        </Box>
      ) : memoizedIncidents.length === 0 ? (
        <Typography variant="h6" color="textSecondary" align="center">
          No incidents found. Please check back later.
        </Typography>
      ) : (
        memoizedIncidents.map((incident) => ( //Use memoizedIncidents
          <Card
            key={incident.id}
            sx={{
              maxWidth: 345,
              marginBottom: 2,
              transition: 'transform 0.3s, box-shadow 0.3s',
              '&:hover': {
                transform: 'scale(1.05)',
                boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)',
              },
            }}
          >
            {incident.files?.image && (
              <CardMedia
                component="img"
                alt={incident.imageDescription || 'Incident Image'}
                height="140"
                image={incident.files.image}
                sx={{ objectFit: 'cover' }}
                onError={(e) => {
                  e.target.src = '/placeholder.jpg';
                }}
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
              <Button size="small" onClick={() => handleShowMore(incident)}>
                Show More
              </Button>
            </CardActions>
          </Card>
        ))
      )}

      <Dialog open={showDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>Incident Details</DialogTitle>
        <DialogContent>
          {selectedIncident && (
            <>
              <Typography variant="h6" sx={{ marginBottom: 1 }}>{selectedIncident.crimeType}</Typography>
              <Typography variant="body1" sx={{ marginBottom: 2 }}>{selectedIncident.userDescription}</Typography>
              {selectedIncident.files?.image && (
                <Box sx={{ marginBottom: 2 }}>
                  <CardMedia
                    component="img"
                    alt={selectedIncident.imageDescription || 'Incident Image'}
                    height="200"
                    image={selectedIncident.files.image}
                    sx={{ objectFit: 'contain', borderRadius: 2 }}
                    onError={(e) => {
                      e.target.src = '/placeholder.jpg'; // Or any default image URL
                    }}
                  />
                  <Typography variant="body2" color="textSecondary" sx={{ marginTop: 1 }}>
                    {selectedIncident.imageDescription || 'No description provided for the image.'}
                  </Typography>
                </Box>
              )}
              {selectedIncident.files?.audio && (
                <Box sx={{ marginBottom: 2 }}>
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
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}