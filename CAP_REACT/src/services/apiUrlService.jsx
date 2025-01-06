const BASE_URL = 'http://127.0.0.1:8000';

const API_URLS = {
  AUTH: {
    signIn: `${BASE_URL}/login`
  },
  CIVILIAN: {
    signUp: `${BASE_URL}/post/civilian`,
    getCivilianDetailsById: (id) => `${BASE_URL}/get/civilianDetailById/${id}`,
  },
  INCIDENTS: {
    uploadFileToDrive: `${BASE_URL}/uploadFileToDrive`,
    downloadFileFromDrive:(id) => `${BASE_URL}/downloadFileFromDrive/${id}`,
    removeFileFromDrive:(id) => `${BASE_URL}/removeFileFromDrive/${id}`,
    getImageDescription: `${BASE_URL}/post/getImageDescription`,
    getAudioDescripion: `${BASE_URL}/post/getAudioDescription`,
    postIncident: `${BASE_URL}/post/incident`,
    updateIncidentStatus: `${BASE_URL}/update/incidentStatus`,
    getAllIncident: `${BASE_URL}/get/AllIncident`,
    getIncidentByUserId: (id) => `${BASE_URL}/get/incidentByUserId/${id}`,
  },
  POLICE: {
    getPoliceStationDetail: `${BASE_URL}/get/policeStationDetails`,
  }
};

export default API_URLS;
