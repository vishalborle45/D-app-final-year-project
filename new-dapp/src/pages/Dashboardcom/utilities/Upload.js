// utilities/Upload.js
import axios from 'axios';
import { MESSAGE } from '../../../config';

const deriveAESKeyFromSignature = async (signature) => {
  const hashBuffer = await crypto.subtle.digest("SHA-256", signature);
  return await crypto.subtle.importKey(
    "raw",
    hashBuffer,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  );
};

const encryptCID = async (cid, signMessage) => {
  try {
    if (!signMessage) {
      throw new Error('signMessage function is not available.');
    }

    const predefinedMessage = new TextEncoder().encode(MESSAGE);
    const signature = await signMessage(predefinedMessage);
    const aesKey = await deriveAESKeyFromSignature(signature);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encryptedCID = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: iv },
      aesKey,
      new TextEncoder().encode(cid)
    );

    const encryptedCIDBase64 = btoa(String.fromCharCode(...new Uint8Array(encryptedCID)));
    const ivBase64 = btoa(String.fromCharCode(...iv));
    return { encryptedCID: encryptedCIDBase64, iv: ivBase64 };
  } catch (error) {
    console.error("Error encrypting CID:", error);
    throw new Error('Error encrypting CID.');
  }
};

const uploadToIPFS = async (file, setLoading, setError) => {
  try {
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post('http://127.0.0.1:5001/api/v0/add', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (response.data?.Hash) {
      return response.data.Hash;
    } else {
      throw new Error('Failed to upload file to IPFS');
    }
  } catch (err) {
    console.error('Error uploading file to IPFS:', err);
    setError('Error uploading file to IPFS.');
    throw err;
  } finally {
    setLoading(false);
  }
};

const sendToBackend = async ({ encryptedCID, iv }, fileHash, fileType, customFileName, setError) => {
  try {
    const token = localStorage.getItem('jwt');
    if (!token) {
      throw new Error('JWT token not found');
    }

    const response = await axios.post('http://localhost:3000/upload-doc', {
      encryptedCID,
      iv,
      fileHash: Array.from(fileHash),
      fileType,
      customFileName,
    }, {
      headers: {
        Authorization: `Bearer ${token}`,
      }
    });

    console.log('Backend response:', response.data);
  } catch (err) {
    console.error('Error sending data to backend:', err);
    setError('Error sending data to backend.');
    throw err;
  }
};

const hashFile = async (file) => {
  const fileBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', fileBuffer);
  return new Uint8Array(hashBuffer);
};

export { encryptCID, uploadToIPFS, hashFile, sendToBackend };
