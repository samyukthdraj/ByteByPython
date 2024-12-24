import * as React from 'react';
import { useEffect, useState, useContext } from 'react';
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
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import API_URLS from '../../services/apiUrlService';
import { getData, putData } from '../../services/apiService';
import Tooltip from '@mui/material/Tooltip';
import EditIcon from '@mui/icons-material/Edit';


export default function PoliceDashboard() {
    const { user } = useContext(AuthContext);
    const [incidents, setIncidents] = useState([]);
    const [openImageDialog, setOpenImageDialog] = useState(false);
    const [openAudioDialog, setOpenAudioDialog] = useState(false);
    const [selectedIncident, setSelectedIncident] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const getStatus = (statusNumber) => {
        const statusString = String(statusNumber); // Convert to string

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

    const userIncidents = async () => {
        try {
            const response = await getData(API_URLS.INCIDENTS.getAllIncident);
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

    const handleUpdateIncidentStatus = async (id, status) => {
        const updateIncidentStatus = {
            id,
            status
        };
        try {
            const response = await putData(updateIncidentStatus, API_URLS.INCIDENTS.updateIncidentStatus);
            setSnackbar({ open: true, message: 'Incident status updated successfully!', severity: 'success' });
            userIncidents(); // Reload incidents
        } catch (error) {
            console.error('Error updating incident status:', error);
            setSnackbar({ open: true, message: 'Failed to update incident status.', severity: 'error' });
        }
    };

    useEffect(() => {
        if (user?._id) {
            userIncidents();
        }
    }, [user]);

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

    const handleCloseDialog = () => {
        setOpenImageDialog(false);
        setOpenAudioDialog(false);
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

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    return (
        <>
            <TableContainer component={Paper} sx={{ maxHeight: 600, overflow: 'auto' }}>
                <Table sx={{ minWidth: 650 }} aria-label="simple table">
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ width: 100 }}>Image</TableCell>
                            <TableCell sx={{ width: 100 }}>Audio</TableCell>
                            <TableCell sx={{ width: 150 }}>Crime Type</TableCell>
                            <TableCell sx={{ width: 200, maxWidth: '200px', overflow: 'auto' }}>Image Description</TableCell>
                            <TableCell sx={{ width: 200, maxWidth: '200px', overflow: 'auto' }}>Audio Description</TableCell>
                            <TableCell sx={{ width: 250, maxWidth: '250px', overflow: 'auto' }}>Description</TableCell>
                            <TableCell sx={{ width: 150 }}>Civilian Name</TableCell>
                            <TableCell sx={{ width: 150 }}>Civilian Mobile Number</TableCell>
                            <TableCell sx={{ width: 200 }}>Police Station Name</TableCell>
                            <TableCell sx={{ width: 200 }}>Police Station Location</TableCell>
                            <TableCell sx={{ width: 150 }}>Start Date</TableCell>
                            <TableCell sx={{ width: 100 }}>Status</TableCell>
                            <TableCell sx={{ width: 150 }}>Update Status</TableCell>
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
                                        <span>{incident.imageDescription.substring(0, 20) + (incident.imageDescription.length > 20 ? "..." : "")}</span>
                                    </Tooltip>
                                </TableCell>
                                <TableCell>
                                    <Tooltip title={incident.audioDescription} placement="right">
                                        <span>{incident.audioDescription.substring(0, 20) + (incident.audioDescription.length > 20 ? "..." : "")}</span>
                                    </Tooltip>
                                </TableCell>
                                <TableCell>
                                    <Tooltip title={incident.userDescription} placement="right">
                                        <span>{incident.userDescription.substring(0, 20) + (incident.userDescription.length > 20 ? "..." : "")}</span>
                                    </Tooltip>
                                </TableCell>
                                <TableCell>{incident.userName}</TableCell>
                                <TableCell>{incident.userMobileNumber}</TableCell>
                                <TableCell>{incident.policeStationName}</TableCell>
                                <TableCell>{incident.policeStationLocation}</TableCell>
                                <TableCell>{new Date(incident.startDate).toLocaleString()}</TableCell>
                                <TableCell>{getStatus(incident.status)}</TableCell>
                                <TableCell>
                                    {!incident.editingStatus ? (
                                        <IconButton
                                            onClick={() =>
                                                setIncidents((prev) =>
                                                    prev.map((item) =>
                                                        item.id === incident.id
                                                            ? { ...item, editingStatus: true }
                                                            : item
                                                    )
                                                )
                                            }
                                        >
                                            <EditIcon />
                                        </IconButton>
                                    ) : (
                                        <Select
                                            value={String(incident.status)}
                                            onChange={(e) =>
                                                handleUpdateIncidentStatus(incident.id, e.target.value)
                                            }
                                            onBlur={() =>
                                                setIncidents((prev) =>
                                                    prev.map((item) =>
                                                        item.id === incident.id
                                                            ? { ...item, editingStatus: false }
                                                            : item
                                                    )
                                                )
                                            }
                                            displayEmpty
                                            autoWidth
                                        >
                                            <MenuItem value="2">Resolved</MenuItem>
                                            <MenuItem value="3">Dismissed</MenuItem>
                                        </Select>
                                    )}
                                </TableCell>

                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

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

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </>
    );
}
