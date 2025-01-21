
// UploadDocument.js
import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { uploadToIPFS, encryptCID, sendToBackend, hashFile } from './utilities/Upload';

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

  const handleCustomFileNameChange = (e) => setCustomFileName(e.target.value);

  const handleFileTypeChange = (e) => setFileType(e.target.value);

  const handleUpload = async () => {
    setError('');

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
      const ipfsCID = await uploadToIPFS(file, setLoading, setError);
      if (!ipfsCID) return;

      const encryptedCID = await encryptCID(ipfsCID, signMessage);
      await sendToBackend(encryptedCID, fileHash, fileType, customFileName, setError);

      alert('File uploaded and data sent successfully.');
    } catch (err) {
      console.error('Upload process failed:', err);
      setError('Error during the file upload process.');
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
