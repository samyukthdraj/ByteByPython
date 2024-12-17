import * as React from 'react';
import { useEffect, useState, useContext } from 'react';
import { getData } from '../../services/API';
import { AuthContext } from '../../context/AuthContext';
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


export default function PoliceDashboard() {
    const { user } = useContext(AuthContext);
    const [incidents, setIncidents] = useState([]);
    const [openImageDialog, setOpenImageDialog] = useState(false);
    const [openAudioDialog, setOpenAudioDialog] = useState(false);
    const [selectedIncident, setSelectedIncident] = useState(null);

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
                console.warn(`Unexpected status number: ${statusNumber}`);
                return 'Unknown';
        }
    };

    const userIncidents = async () => {
        try {
            const response = await getData('getAll/incidents');
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

    useEffect(() => {
        if (user?.username) {
            userIncidents();
        }
    }, [user]);

    const convertBase64ToBlobUrl = (base64, mimeType) => {
        if (!base64) return null;
        const binary = atob(base64.split(',')[1]);
        const array = [];
        for (let i = 0; i < binary.length; i++) {
            array.push(binary.charCodeAt(i));
        }
        const blob = new Blob([new Uint8Array(array)], { type: mimeType });
        return URL.createObjectURL(blob);
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


    return (
        <>
            <TableContainer component={Paper}>
                <Table sx={{ minWidth: 650 }} aria-label="simple table">
                    <TableHead>
                        <TableRow>
                            <TableCell>Image</TableCell>
                            <TableCell>Audio</TableCell>
                            <TableCell>Pincode</TableCell>
                            <TableCell>Crime Type</TableCell>
                            <TableCell>Description</TableCell>
                            <TableCell>Police Station</TableCell>
                            <TableCell>Username</TableCell>
                            <TableCell>Start Date</TableCell>
                            <TableCell>Status</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {incidents.map((incident) => (
                            <TableRow key={incident.id || incident.incidentId}> {/* Use incidentId or index if no id */}
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
                                <TableCell>{incident.pincode}</TableCell>
                                <TableCell>{incident.crimeType}</TableCell>
                                <TableCell>{incident.description}</TableCell>
                                <TableCell>{incident.policeStation}</TableCell>
                                <TableCell>{incident.username}</TableCell>
                                <TableCell>{new Date(incident.startDate).toLocaleString()}</TableCell>
                                <TableCell>{getStatus(incident.status)}</TableCell>
                            </TableRow>
                        ))}
                        {incidents.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={9}>No incidents found.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

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