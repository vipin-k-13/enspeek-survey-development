import * as CryptoJS from 'crypto-js';

const encryptSecretKey = import.meta.env.VITE_ENCRYPT_SECRET_KEY as string;

export function encFrData() {
    let ec = btoa("ConversationalSurvey");
    return ec;
}

export function decryptData(data: any) {
    try {
        const bytes = CryptoJS.AES.decrypt(data, encryptSecretKey);
        if (bytes.toString()) {
            return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
        }
        return data;
    } catch (e) {
        console.error("Decryption error:", e);
    }
}

export const replaceSymbols = (response: string): string => {
    return response ? response.replace(/&\^/g, ', ') : '';
};

export function getLocalStorage() {
    let lcData: any = sessionStorage.getItem(encFrData());
    if (!lcData) return ({ sessionID: "", token: "" });
    let masterData = decryptData(JSON.parse(lcData));
    return masterData;
}

export function setLocalStorage(masterData: any) {
    let reMain = (masterData);
    sessionStorage.setItem(encFrData(), JSON.stringify(reMain));
}