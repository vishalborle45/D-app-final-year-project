import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import axios from 'axios';
import { MESSAGE } from '../../config';

const UploadDocument = () => {
  const [file, setFile] = useState(null);
  const [fileType, setFileType] = useState('');
  const [customFileName, setCustomFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { publicKey, signMessage } = useWallet();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setFileType(selectedFile.type);
  };

  const handleCustomFileNameChange = (e) => {
    setCustomFileName(e.target.value);
  };

  const handleFileTypeChange = (e) => {
    setFileType(e.target.value);  // User selects file type from dropdown
  };

  const hashFile = async (file) => {
    const fileBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', fileBuffer);
    const hashArray = new Uint8Array(hashBuffer);
    return hashArray;
  };

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

  const encryptCID = async (cid) => {
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
      setError('Error encrypting CID.');
      console.error("Error encrypting CID:", error);
    }
  };

  const uploadToIPFS = async (file) => {
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
      setError('Error uploading file to IPFS.');
      setLoading(false);
      console.error(err);
    }
  };

  const sendToBackend = async ({ encryptedCID, iv }, fileHash) => {
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
      setError('Error sending data to backend.');
      console.error('Error sending data to backend:', err);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file to upload.');
      return;
    }

    if (!customFileName) {
      setError('Please provide a custom file name.');
      return;
    }

    try {
      const fileHash = await hashFile(file);
      const ipfsCID = await uploadToIPFS(file);
      if (!ipfsCID) return;

      const encryptedCID = await encryptCID(ipfsCID);
      await sendToBackend(encryptedCID, fileHash);

      setLoading(false);
      alert('File uploaded and data sent successfully.');
    } catch (err) {
      setLoading(false);
      setError('Error during the file upload process.');
      console.error(err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-4">
        <label htmlFor="file-upload" className="block text-gray-700 font-medium mb-2">Select File:</label>
        <input id="file-upload" type="file" onChange={handleFileChange} className="w-full p-3 border border-gray-300 rounded-md" />
      </div>

      <div className="mb-4">
        <label htmlFor="custom-file-name" className="block text-gray-700 font-medium mb-2">Custom File Name:</label>
        <input
          id="custom-file-name"
          type="text"
          placeholder="Enter custom file name"
          value={customFileName}
          onChange={handleCustomFileNameChange}
          className="w-full p-3 border border-gray-300 rounded-md"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="file-type" className="block text-gray-700 font-medium mb-2">File Type:</label>
        <select
          id="file-type"
          value={fileType}
          onChange={handleFileTypeChange}
          className="w-full p-3 border border-gray-300 rounded-md"
        >
          <option value="">Select File Type</option>
          <option value="image/jpeg">Jpeg</option>
          <option value="image/png">Png</option>
          <option value="application/pdf">Pdf</option>
          <option value="text/plain">Txt</option>
          <option value="application/zip">Other</option>
        </select>
      </div>

      <button
        onClick={handleUpload}
        disabled={loading}
        className="w-full p-3 bg-blue-600 text-white font-medium rounded-md disabled:bg-gray-300 hover:bg-blue-700 focus:outline-none"
      >
        {loading ? (
          <div className="animate-spin border-4 border-t-4 border-white w-6 h-6 mx-auto rounded-full"></div>
        ) : (
          'Upload'
        )}
      </button>

      {error && <p className="text-red-500 text-center mt-4">{error}</p>}
    </div>
  );
};

export default UploadDocument;
