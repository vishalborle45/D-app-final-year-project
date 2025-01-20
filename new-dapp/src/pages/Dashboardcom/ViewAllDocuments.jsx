import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useWallet } from '@solana/wallet-adapter-react'; // Solana wallet adapter
import { MESSAGE } from '../../config';

function ViewAllDocuments() {
  const [documents, setDocuments] = useState([]);
  const [error, setError] = useState('');
  const { publicKey, signMessage } = useWallet();

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const token = localStorage.getItem('jwt'); // Retrieve the JWT token from localStorage
        if (!token) {
          throw new Error('JWT token not found');
        }
        const response = await axios.get('http://localhost:3000/api/documents', {
          headers: {
            Authorization: `Bearer ${token}`, // Include the token in the Authorization header
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

  const decryptCID = async (encryptedCID, iv) => {
    try {
      if (!signMessage) {
        throw new Error('signMessage function is not available.');
      }

      const message = MESSAGE;
      const encodedMessage = new TextEncoder().encode(message);
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
      alert('Failed to decrypt CID.');
      return null;
    }
  };

  const fetchFileFromIPFS = async (cid) => {
    try {
      const response = await fetch(`http://127.0.0.1:8080/ipfs/${cid}`);
      if (response.ok) {
        return await response.blob();
      } else {
        throw new Error('Error fetching file from IPFS');
      }
    } catch (error) {
      console.error('Error fetching file from IPFS:', error);
      alert('Error fetching file from IPFS');
    }
  };

  const downloadFile = async (encryptedCID, iv, fileType) => {
    const decryptedCID = await decryptCID(encryptedCID, iv);
    if (decryptedCID) {
      const fileBlob = await fetchFileFromIPFS(decryptedCID);
      if (fileBlob) {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(fileBlob);
        link.download = `download.${fileType}`; 
        link.click();
      }
    }
  };

  const viewFile = async (encryptedCID, iv) => {
    const decryptedCID = await decryptCID(encryptedCID, iv);
    if (decryptedCID) {
      const fileBlob = await fetchFileFromIPFS(decryptedCID);
      if (fileBlob) {
        const fileURL = URL.createObjectURL(fileBlob);
        window.open(fileURL); 
      }
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
}

async function deriveAESKeyFromSignature(signature) {
  const hashBuffer = await crypto.subtle.digest('SHA-256', signature);
  return await crypto.subtle.importKey(
    'raw',
    hashBuffer,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
}

export default ViewAllDocuments;
