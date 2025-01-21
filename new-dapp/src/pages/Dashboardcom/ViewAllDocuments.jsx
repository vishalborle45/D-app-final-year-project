import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useWallet } from '@solana/wallet-adapter-react';
import { decryptCID, fetchFileFromIPFS } from './utilities/View';

const ViewAllDocuments = () => {
  const [documents, setDocuments] = useState([]);
  const [error, setError] = useState('');
  const { signMessage } = useWallet();

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const token = localStorage.getItem('jwt');
        if (!token) {
          throw new Error('JWT token not found');
        }
        const response = await axios.get('http://localhost:3000/api/documents', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setDocuments(response.data.documents);
      } catch (err) {
        setError('Error fetching documents.');
        console.error('Error fetching documents:', err);
      }
    };

    fetchDocuments();
  }, []);

  const viewFile = async (encryptedCID, iv) => {
    try {
      const decryptedCID = await decryptCID(encryptedCID, iv, signMessage);
      const fileBlob = await fetchFileFromIPFS(decryptedCID);
      if (fileBlob) {
        const fileURL = URL.createObjectURL(fileBlob);
        window.open(fileURL);
      }
    } catch (error) {
      alert(error.message);
    }
  };

  const downloadFile = async (encryptedCID, iv, fileType) => {
    try {
      const decryptedCID = await decryptCID(encryptedCID, iv, signMessage);
      const fileBlob = await fetchFileFromIPFS(decryptedCID);
      if (fileBlob) {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(fileBlob);
        link.download = `download.${fileType}`;
        link.click();
      }
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold mb-4 text-center">All Documents</h1>
      {error && <p className="text-red-500 text-center mb-4">{error}</p>}
      {documents.length === 0 ? (
        <p className="text-center">No documents available.</p>
      ) : (
        <ul className="space-y-4">
          {documents.map((doc) => (
            <li key={doc.id} className="border p-4 rounded-md shadow-md">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-lg">{doc.name}</span>
                <span className="text-sm text-gray-500">{doc.type}</span>
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={() => viewFile(doc.encryptedcid, doc.iv)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none"
                >
                  View
                </button>
                <button
                  onClick={() => downloadFile(doc.encryptedcid, doc.iv, doc.type)}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none"
                >
                  Download
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ViewAllDocuments;
