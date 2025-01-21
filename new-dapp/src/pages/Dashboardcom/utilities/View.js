import axios from 'axios';
import { MESSAGE } from '../../../config';

// Derives AES key from the provided signature using SHA-256 hashing
export const deriveAESKeyFromSignature = async (signature) => {
  const hashBuffer = await crypto.subtle.digest('SHA-256', signature);
  return await crypto.subtle.importKey(
    'raw',
    hashBuffer,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
};

// Decrypts the provided CID using the signature and iv
export const decryptCID = async (encryptedCID, iv, signMessage) => {
  try {
    if (!signMessage) {
      throw new Error('signMessage function is not available.');
    }

    const encodedMessage = new TextEncoder().encode(MESSAGE);
    const signature = await signMessage(encodedMessage);
    const aesKey = await deriveAESKeyFromSignature(signature);
    const ivBuffer = Uint8Array.from(atob(iv), c => c.charCodeAt(0));
    const encryptedBuffer = Uint8Array.from(atob(encryptedCID), c => c.charCodeAt(0));

    const decryptedCID = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: ivBuffer },
      aesKey,
      encryptedBuffer
    );

    return new TextDecoder().decode(decryptedCID);
  } catch (error) {
    console.error('Error decrypting CID:', error);
    throw new Error('Failed to decrypt CID.');
  }
};

// Fetches a file from IPFS using the provided CID
export const fetchFileFromIPFS = async (cid) => {
  try {
    const response = await fetch(`http://127.0.0.1:8080/ipfs/${cid}`);
    if (response.ok) {
      return await response.blob();
    } else {
      throw new Error('Error fetching file from IPFS');
    }
  } catch (error) {
    console.error('Error fetching file from IPFS:', error);
    throw error;
  }
};
