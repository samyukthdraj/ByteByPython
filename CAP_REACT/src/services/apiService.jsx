const token = localStorage.getItem("token").replace(/^"|"$/g, '');

export async function getData(url) {
    try {
        console.log(token); // Logs the token for debugging

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching data:', error); 
        throw error;
    }
}

export async function postData(newTokenData, url) {
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(newTokenData),
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error posting data:', error.message);
        throw error; // Re-throw for handling in calling function
    }
}

export async function putData(updatedData, url) {
    try {
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(updatedData),
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error putting data:', error.message);
        throw error; // Re-throw for handling in calling function
    }
}
