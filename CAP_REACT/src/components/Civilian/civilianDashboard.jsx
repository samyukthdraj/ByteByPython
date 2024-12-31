import * as React from 'react';
import { useEffect, useState, useContext } from 'react';
import { getData } from '../../services/apiService';
import { AuthContext } from '../../context/authContext';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import Button from '@mui/material/Button';
import API_URLS from '../../services/apiUrlService';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';  // Import Typography component for the message
import Box from '@mui/material/Box';  // For styling the container of the message

export default function CivilianDashboard() {
  const { user } = useContext(AuthContext);
  const [incidents, setIncidents] = useState([]);
  const [openImageDialog, setOpenImageDialog] = useState(null);
  const [openAudioDialog, setOpenAudioDialog] = useState(null);
  const [selectedIncident, setSelectedIncident] = useState(null);

  const getStatus = (statusNumber) => {
    const statusString = String(statusNumber);
    switch (statusString) {
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
      userIncidents();
    }
  }, [user]);

  const userIncidents = async () => {
    try {
      const response = await getData(API_URLS.INCIDENTS.getIncidentByUserId(user._id), user.access_token);
      if (Array.isArray(response)) {
        setIncidents(response);
      } else if (Array.isArray(response?.data)) {
        setIncidents(response.data);
      } else {
        console.error('Unexpected response format:', response);
        setIncidents([]);
      }
    } catch (error) {
      console.error('Error fetching incidents:', error);
      setIncidents([]);
    }
  };

  const handleCloseDialog = () => {
    setOpenImageDialog(null);
    setOpenAudioDialog(null);
    setSelectedIncident(null);
  };

  const handleOpenImageDialog = (incident) => {
    setOpenImageDialog(true);
    setSelectedIncident(incident);
  };

  const handleOpenAudioDialog = (incident) => {
    setOpenAudioDialog(true);
    setSelectedIncident(incident);
  };

  const convertBase64ToBlobUrl = (base64, mimeType) => {
    if (!base64) return null;
    try {
      const binary = atob(base64.split(',')[1]);
      const array = [];
      for (let i = 0; i < binary.length; i++) {
        array.push(binary.charCodeAt(i));
      }
      const blob = new Blob([new Uint8Array(array)], { type: mimeType });
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error("Error converting base64:", error);
      return null;
    }
  };

  return (
    <>
      {/* Check if there are incidents */}
      {incidents.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', padding: 2 }}>
          <Typography variant="h6" color="textSecondary" align="center">
            No incidents found. Please check back later.
          </Typography>
        </Box>
      ) : (
        <TableContainer
          component={Paper}
          sx={{
            overflowY: 'auto',
          maxHeight: 'calc(100vh - 20vh)',
          scrollbarWidth: 'none',  /* Firefox */
          '-ms-overflow-style': 'none',  /* IE and Edge */
          '&::-webkit-scrollbar': {
            display: 'none'  /* Chrome, Safari, Opera */
          }
          }}
        >
          <Table stickyHeader sx={{ minWidth: 650 }} aria-label="sticky table">
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: '20vh' }}>Image</TableCell>
                <TableCell sx={{ width: 100 }}>Audio</TableCell>
                <TableCell sx={{ width: 100 }}>Crime Type</TableCell>
                <TableCell sx={{ width: 200, maxWidth: '200px', overflow: 'auto' }}>Image Description</TableCell>
                <TableCell sx={{ width: 200, maxWidth: '200px', overflow: 'auto' }}>Audio Description</TableCell>
                <TableCell sx={{ width: 200, maxWidth: '200px', overflow: 'auto' }}>Description</TableCell>
                <TableCell sx={{ width: 100 }}>Police Station Name</TableCell>
                <TableCell sx={{ width: 100 }}>Police Station Location</TableCell>
                <TableCell sx={{ width: 100 }}>Start Date</TableCell>
                <TableCell sx={{ width: 100 }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {incidents.map((incident) => (
                <TableRow key={incident.id}>
                  <TableCell>
                    <Button onClick={() => handleOpenImageDialog(incident)}>
                      {incident.image ? 'View Image' : 'No Image'}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Button onClick={() => handleOpenAudioDialog(incident)}>
                      {incident.audio ? 'Play Audio' : 'No Audio'}
                    </Button>
                  </TableCell>
                  <TableCell>{incident.crimeType}</TableCell>
                  <TableCell>
                    <Tooltip title={incident.imageDescription} placement="right">
                      <span>{incident.imageDescription.substring(0, 20) + (incident.imageDescription.length > 20 ? '...' : '')}</span>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Tooltip title={incident.audioDescription} placement="right">
                      <span>{incident.audioDescription.substring(0, 20) + (incident.audioDescription.length > 20 ? '...' : '')}</span>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Tooltip title={incident.userDescription} placement="right">
                      <span>{incident.userDescription.substring(0, 20) + (incident.userDescription.length > 20 ? '...' : '')}</span>
                    </Tooltip>
                  </TableCell>
                  <TableCell>{incident.policeStationName}</TableCell>
                  <TableCell>{incident.policeStationLocation}</TableCell>
                  <TableCell>{new Date(incident.startDate).toLocaleString()}</TableCell>
                  <TableCell>{getStatus(incident.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

      )}

      {/* Image Dialog */}
      <Dialog open={openImageDialog} onClose={handleCloseDialog}>
        <DialogTitle>
          Incident Image
          <IconButton
            aria-label="close"
            onClick={handleCloseDialog}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedIncident?.image && (
            <img
              src={convertBase64ToBlobUrl(selectedIncident.image, 'image/jpeg')}
              alt="Incident Image"
              style={{ maxWidth: '100%' }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Audio Dialog */}
      <Dialog open={openAudioDialog} onClose={handleCloseDialog}>
        <DialogTitle>
          Incident Audio
          <IconButton
            aria-label="close"
            onClick={handleCloseDialog}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedIncident?.audio && (
            <audio controls style={{ width: '100%' }}>
              <source
                src={convertBase64ToBlobUrl(selectedIncident.audio, 'audio/mpeg')}
                type="audio/mpeg"
              />
              Your browser does not support the audio element.
            </audio>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
