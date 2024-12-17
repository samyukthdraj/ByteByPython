export async function getData(url) {
    try {
        const response = await fetch(url);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching data:', error.message);
        throw error; // Re-throw for handling in calling function
    }
}

export async function postData(newTokenData, url) {
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
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