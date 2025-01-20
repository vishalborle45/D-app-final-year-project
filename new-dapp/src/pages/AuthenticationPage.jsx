import React from 'react';
import { WalletMultiButton, WalletDisconnectButton } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useRecoilState } from 'recoil';
import { authState } from '../store/authAtom'; // Import the Recoil atom for authentication state
import { MESSAGE } from '../config';

const AuthenticationPage = () => {
    const { publicKey, signMessage } = useWallet();
    const navigate = useNavigate();

    // Access Recoil state
    const [auth, setAuth] = useRecoilState(authState);

    const handleSignIn = async () => {
        if (!publicKey) {
            alert('Please connect your wallet first!');
            return;
        }
        if (!signMessage) {
            alert('Your wallet does not support message signing.');
            return;
        }

        try {
            const message = MESSAGE;
            const encodedMessage = new TextEncoder().encode(message);

            // Sign the message with the wallet
            const signature = await signMessage(encodedMessage);
            console.log(signature)
            console.log(message)

          

            // Send the signed data and public key to the server
            const response = await axios.post('http://localhost:3000/api/authenticate', {
                publicKey: publicKey.toBase58(),
                signature: Array.from(signature),
            });

            if (response.status === 200) {
                const { token } = response.data;

                // Update Recoil state with sign-in data, including signature and signed message
                setAuth({
                    isSignedIn: true,
                    publicKey: publicKey.toBase58(),
                });

                localStorage.setItem('jwt', token);

                navigate('/dashboard');
            } else {
                alert('Authentication failed. Please try again.');
            }
        } catch (error) {
            console.error('Error during sign-in:', error);
            alert('Sign-in failed. Please check your wallet or server.');
        }
    };

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-800 text-white">
            <h1 className="text-3xl font-bold mb-6">Authenticate Using Your Wallet</h1>
            <div className="flex space-x-4 mb-6">
                <WalletMultiButton />
                <WalletDisconnectButton />
            </div>
            <button
                onClick={handleSignIn}
                className="px-6 py-2 bg-blue-600 rounded-md text-white hover:bg-blue-500"
            >
                Authenticate
            </button>
        </div>
    );
};

export default AuthenticationPage;
