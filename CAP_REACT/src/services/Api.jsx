const url = 'http://127.0.0.1:8000/';

export async function getData(endPoint) {
    try {
        const response = await fetch(url + endPoint);
        // if (!response.ok) {
        //     throw new Error(`Error ${response.status}: ${response.statusText}`);
        // }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching data:', error.message);
        throw error; // Re-throw for handling in calling function
    }
}

export async function postData(newTokenData, endPoint) {
    try {
        const response = await fetch(url + endPoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newTokenData),
        });
        // if (!response.ok) {
        //     throw new Error(`Error ${response.status}: ${response.statusText}`);
        // }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error posting data:', error.message);
        throw error; // Re-throw for handling in calling function
    }
}