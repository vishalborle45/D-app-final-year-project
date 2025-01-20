import React, { useEffect, useState } from "react";
import { PublicKey, Connection } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { useNavigate } from "react-router-dom";
import { ALCHEMY_URL } from "../../config";

const TopBar = () => {
  const { publicKey, disconnect } = useWallet();
  const [balance, setBalance] = useState(0);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBalance = async () => {
      if (!publicKey) return;

      try {
        const connection = new Connection(ALCHEMY_URL, "confirmed");
        const walletBalance = await connection.getBalance(publicKey);
        setBalance(walletBalance / 1e9); // Convert lamports to SOL
      } catch (error) {
        console.error("Failed to fetch balance:", error.message);
      }
    };

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
