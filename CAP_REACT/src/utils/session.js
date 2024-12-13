export const saveSession = (key, value) => {
    localStorage.setItem(key, JSON.stringify(value));
};

export const getSession = (key) => {
    return JSON.parse(localStorage.getItem(key));
};

export const clearSession = () => {
    localStorage.clear();
};
