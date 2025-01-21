import React, { useEffect, useState } from "react";
import { PublicKey, Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useNavigate } from "react-router-dom";
import { ALCHEMY_URL } from "../../config";

const TopBar = () => {
  const { publicKey, disconnect } = useWallet();
  const { connection } = useConnection();
  const [balance, setBalance] = useState(0);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [loading, setLoading] = useState(false); // Track the loading state
  const navigate = useNavigate();

  const fetchBalance = async () => {
    if (!publicKey) return;

    try {
      const walletBalance = await connection.getBalance(publicKey);
      setBalance(walletBalance / LAMPORTS_PER_SOL); // Convert lamports to SOL
    } catch (error) {
      console.error("Failed to fetch balance:", error.message);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, [publicKey]);

  const handleLogout = () => {
    disconnect(); // Disconnect the wallet
    localStorage.removeItem("jwt"); // Clear JWT token
    navigate("/"); // Redirect to home page
  };

  const toggleProfileDropdown = () => {
    setShowProfileDropdown((prev) => !prev);
  };

  const requestAirdrop = async () => {
    if (!publicKey || loading) return; // Don't request if already in progress

    try {
      setLoading(true); // Set loading to true while processing the request

      const conne = new Connection("https://api.devnet.solana.com");
      const airdropSignature = await conne.requestAirdrop(publicKey, 1 * LAMPORTS_PER_SOL); // Request 1 SOL
      await connection.confirmTransaction(airdropSignature); // Confirm the transaction
      console.log("Airdrop successful!");

      // Refetch the balance after the airdrop
      fetchBalance();

    } catch (error) {
      console.error("Airdrop failed:", error.message);
    } finally {
      setLoading(false); // Reset loading state after completion (either success or failure)
    }
  };

  return (
    <header className="flex items-center justify-between bg-blue-600 text-white py-2 px-6 shadow-md">
      <h1 className="text-lg font-bold">My Solana App</h1>
      <div className="flex items-center space-x-4">
        {publicKey && (
          <>
            {/* Display balance */}
            <div className="text-sm">
              Balance: <span className="font-medium">{balance.toFixed(2)} SOL</span>
            </div>

            {/* Airdrop Button */}
            <button
              onClick={requestAirdrop}
              disabled={loading} // Disable the button if request is in progress
              className="bg-green-500 hover:bg-green-600 text-white text-sm py-2 px-4 rounded"
            >
              {loading ? "Requesting Airdrop..." : "Request Airdrop"}
            </button>

            {/* Profile Icon and Dropdown */}
            <div className="relative">
              <div
                className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-black font-bold cursor-pointer"
                onClick={toggleProfileDropdown}
              >
                {/* User Profile Icon Placeholder */}
                U
              </div>
              {showProfileDropdown && (
                <div className="absolute right-0 mt-2 w-64 bg-white text-black rounded shadow-lg z-10 p-4">
                  <div className="text-sm">
                    <span className="font-bold">Public Key:</span>
                    <p className="block break-all mt-1 text-xs bg-gray-100 p-2 rounded">
                      {publicKey.toString()}
                    </p>
                  </div>
                  <button
                    className="mt-3 w-full bg-red-500 hover:bg-red-600 text-white text-sm py-2 rounded"
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </header>
  );
};

export default TopBar;
