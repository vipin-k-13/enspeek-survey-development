import * as CryptoJS from 'crypto-js';

const encryptSecretKey = import.meta.env.VITE_ENCRYPT_SECRET_KEY as string;

export function encFrData() {
    let ec = btoa("ConversationalSurvey");
    return ec;
}

export function decryptData(data: any) {
    if (!data) return null;
    if (typeof data !== "string") return data;

    try {
        const bytes = CryptoJS.AES.decrypt(data, encryptSecretKey);
        if (bytes.toString()) {
            return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
        }
        return data;
    } catch (e) {
        console.error("Decryption error:", e);
        return data;
    }
}

export const replaceSymbols = (response: string): string => {
    return response ? response.replace(/&\^/g, ', ') : '';
};

export function getLocalStorage() {
    let lcData: any = sessionStorage.getItem(encFrData());
    if (!lcData) return ({ sessionID: "", token: "" });
    let parsedData = JSON.parse(lcData);
    let masterData = decryptData(parsedData);
    return masterData;
}

export function setLocalStorage(masterData: any) {
    let reMain = (masterData);
    sessionStorage.setItem(encFrData(), JSON.stringify(reMain));
}
