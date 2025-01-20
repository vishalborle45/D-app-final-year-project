import React from 'react';
import { Link } from 'react-router-dom';

const Homepage = () => {
    
    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
            <h1 className="text-4xl font-bold mb-8">Welcome to Decentralized Ledger</h1>
            <Link to="/authenticate">
                <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500">
                    Go to Authenticate
                </button>
            </Link>
        </div>
    );
};

export default Homepage;