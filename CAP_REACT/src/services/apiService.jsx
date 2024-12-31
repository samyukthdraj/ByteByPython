// import { useSnackbar } from "../context/snackbarContext";
// import { Navigate, useNavigate } from "react-router-dom";
// import { AuthContext } from "../context/authContext";

export async function getData(url, accessToken) {
//   const { showSnackbar } = useSnackbar();
//   const { logout } = useContext(AuthContext);

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
            },
        });

        if (!response.ok) {
            if (response.status === 401) {
                // showSnackbar('Session Expired','info');
                // logout();
                // Navigate('/login')
                alert('Please login again')
                throw new Error('Unauthorized: Please login.');
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching data:', error);
        throw error;
    }
}

export async function postData(newTokenData, url, accessToken) {
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
            },
            body: JSON.stringify(newTokenData),
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error posting data:', error);
        throw error;
    }
}

export async function putData(updatedData, url, accessToken) {
    try {
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
            },
            body: JSON.stringify(updatedData),
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error putting data:', error);
        throw error;
    }
}