/**
 * Crypto Utilities for HarryTien Admin Dashboard
 * Encrypts and decrypts sensitive data stored in localStorage
 * Uses AES-GCM encryption with Web Crypto API
 */

class CryptoUtils {
    constructor() {
        // Use a combination of browser fingerprint as encryption key base
        this.keyBase = this.generateKeyBase();
    }

    /**
     * Generate a key base from browser fingerprint
     * This makes the encryption unique to each browser/device
     */
    generateKeyBase() {
        const components = [
            navigator.userAgent,
            navigator.language,
            screen.width + 'x' + screen.height,
            new Date().getTimezoneOffset(),
            navigator.hardwareConcurrency || 'unknown',
            'HarryTien-Admin-v1' // Salt
        ];
        return components.join('|');
    }

    /**
     * Convert string to ArrayBuffer
     */
    stringToBuffer(str) {
        return new TextEncoder().encode(str);
    }

    /**
     * Convert ArrayBuffer to string
     */
    bufferToString(buffer) {
        return new TextDecoder().decode(buffer);
    }

    /**
     * Convert ArrayBuffer to Base64
     */
    bufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    /**
     * Convert Base64 to ArrayBuffer
     */
    base64ToBuffer(base64) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes.buffer;
    }

    /**
     * Derive encryption key from key base using PBKDF2
     */
    async deriveKey(salt) {
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            this.stringToBuffer(this.keyBase),
            'PBKDF2',
            false,
            ['deriveKey']
        );

        return await crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: 100000,
                hash: 'SHA-256'
            },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt', 'decrypt']
        );
    }

    /**
     * Encrypt data
     * @param {string} plaintext - Data to encrypt
     * @returns {string} - Encrypted data as base64 string
     */
    async encrypt(plaintext) {
        try {
            // Generate random salt and IV
            const salt = crypto.getRandomValues(new Uint8Array(16));
            const iv = crypto.getRandomValues(new Uint8Array(12));

            // Derive key
            const key = await this.deriveKey(salt);

            // Encrypt
            const encrypted = await crypto.subtle.encrypt(
                { name: 'AES-GCM', iv: iv },
                key,
                this.stringToBuffer(plaintext)
            );

            // Combine salt + iv + encrypted data
            const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
            combined.set(salt, 0);
            combined.set(iv, salt.length);
            combined.set(new Uint8Array(encrypted), salt.length + iv.length);

            // Return as base64
            return this.bufferToBase64(combined.buffer);
        } catch (error) {
            console.error('Encryption error:', error);
            throw new Error('Failed to encrypt data');
        }
    }

    /**
     * Decrypt data
     * @param {string} encryptedBase64 - Encrypted data as base64 string
     * @returns {string} - Decrypted plaintext
     */
    async decrypt(encryptedBase64) {
        try {
            // Decode base64
            const combined = new Uint8Array(this.base64ToBuffer(encryptedBase64));

            // Extract salt, iv, and encrypted data
            const salt = combined.slice(0, 16);
            const iv = combined.slice(16, 28);
            const encrypted = combined.slice(28);

            // Derive key
            const key = await this.deriveKey(salt);

            // Decrypt
            const decrypted = await crypto.subtle.decrypt(
                { name: 'AES-GCM', iv: iv },
                key,
                encrypted
            );

            return this.bufferToString(decrypted);
        } catch (error) {
            console.error('Decryption error:', error);
            throw new Error('Failed to decrypt data - credentials may be corrupted or from different browser');
        }
    }

    /**
     * Securely store credentials
     * @param {object} credentials - Object containing credentials
     */
    async storeCredentials(credentials) {
        const json = JSON.stringify(credentials);
        const encrypted = await this.encrypt(json);
        localStorage.setItem('harrytien_admin_credentials_encrypted', encrypted);
        // Remove old unencrypted credentials if exists
        localStorage.removeItem('harrytien_admin_credentials');
    }

    /**
     * Retrieve stored credentials
     * @returns {object|null} - Decrypted credentials or null
     */
    async getCredentials() {
        // Check for encrypted credentials first
        const encrypted = localStorage.getItem('harrytien_admin_credentials_encrypted');
        if (encrypted) {
            try {
                const json = await this.decrypt(encrypted);
                return JSON.parse(json);
            } catch (error) {
                console.warn('Failed to decrypt credentials:', error.message);
                // Remove corrupted data
                localStorage.removeItem('harrytien_admin_credentials_encrypted');
                return null;
            }
        }

        // Migrate old unencrypted credentials if exists
        const oldCredentials = localStorage.getItem('harrytien_admin_credentials');
        if (oldCredentials) {
            try {
                const credentials = JSON.parse(oldCredentials);
                // Encrypt and store
                await this.storeCredentials(credentials);
                // Remove old unencrypted
                localStorage.removeItem('harrytien_admin_credentials');
                return credentials;
            } catch (error) {
                localStorage.removeItem('harrytien_admin_credentials');
                return null;
            }
        }

        return null;
    }

    /**
     * Clear stored credentials
     */
    clearCredentials() {
        localStorage.removeItem('harrytien_admin_credentials_encrypted');
        localStorage.removeItem('harrytien_admin_credentials');
    }

    /**
     * Check if credentials are stored
     */
    hasStoredCredentials() {
        return localStorage.getItem('harrytien_admin_credentials_encrypted') !== null ||
               localStorage.getItem('harrytien_admin_credentials') !== null;
    }
}

// Export for use in other modules
window.CryptoUtils = CryptoUtils;
