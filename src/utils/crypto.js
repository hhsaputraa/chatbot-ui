import CryptoJS from 'crypto-js';

export function encryptField(text) {
    const keyString = import.meta.env.VITE_AES_KEY;
    if (!keyString) {
        console.error("VITE_AES_KEY is missing!");
        return text;
    }

    const key = CryptoJS.enc.Utf8.parse(keyString);
    // IV is the first 16 bytes of the key in this specific implementation pattern 
    // (Wait, looking at the user's Go code: "iv := data[:aes.BlockSize]". 
    // It seems the Go code EXPECTS the input to be IV + Ciphertext.
    // So we need to GENERATE a random IV, and prepend it.)

    // Correction based on Go code:
    // DecryptField(hexString):
    // 1. Decode hex
    // 2. data[:aes.BlockSize] -> IV
    // 3. data[aes.BlockSize:] -> Ciphertext

    const iv = CryptoJS.lib.WordArray.random(16);

    const encrypted = CryptoJS.AES.encrypt(text, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    });

    // Combine IV + Ciphertext
    const combined = iv.concat(encrypted.ciphertext);

    // Return as Hex
    return combined.toString(CryptoJS.enc.Hex);
}
