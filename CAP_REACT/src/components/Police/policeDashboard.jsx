import * as React from 'react';
import { useEffect, useState, useContext } from 'react';
import { getData } from '../../services/API';
import { AuthContext } from '../../context/AuthContext';

export default function PoliceDashboard() {
    const { user } = useContext(AuthContext);
    const [incidents, setIncidents] = useState(null); // State to store incidents data as null initially

    const userIncidents = async () => {
        try {
            const response = await getData('getAll/incidents');
            console.log(response);
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

    return (
        <>
            <h1>Police Dashboard</h1>
            <div>
                {Array.isArray(incidents) && incidents.length > 0 ? (
                    incidents.map((incident, index) => (
                        <div
                            key={index}
                            style={{ border: '1px solid #ccc', margin: '10px', padding: '10px' }}
                        >
                            {incident?.image && (
                                <div>
                                    <strong>Image:</strong>
                                    <img
                                        src={convertBase64ToBlobUrl(incident.image, 'image/jpeg')}
                                        alt="Incident"
                                        style={{ width: '100%', maxWidth: '300px', marginTop: '10px' }}
                                    />
                                </div>
                            )}
                            {incident?.audio && (
                                <div style={{ marginTop: '10px' }}>
                                    <strong>Audio:</strong>
                                    <audio controls>
                                        <source
                                            src={convertBase64ToBlobUrl(incident.audio, 'audio/mpeg')}
                                            type="audio/mpeg"
                                        />
                                        Your browser does not support the audio element.
                                    </audio>
                                </div>
                            )}
                            <p>
                                <strong>Pincode:</strong> {incident?.pincode || 'Not available'}
                            </p>
                            <p>
                                <strong>Crime Type:</strong> {incident?.crimeType || 'Not available'}
                            </p>
                            <p>
                                <strong>Description:</strong> {incident?.description || 'No description provided'}
                            </p>
                            <p>
                                <strong>Police Station:</strong> {incident?.policeStation || 'Not available'}
                            </p>
                            <p>
                                <strong>Username:</strong> {incident?.username || 'Anonymous'}
                            </p>
                            <p>
                                <strong>Start Date:</strong>{' '}
                                {incident?.startDate
                                    ? new Date(incident.startDate).toLocaleString()
                                    : 'Unknown'}
                            </p>
                            <p>
                                <strong>Status:</strong> {incident?.status || 'Pending'}
                            </p>
                        </div>
                    ))
                ) : (
                    <p>No incidents to display</p>
                )}
            </div>
        </>
    );
}
