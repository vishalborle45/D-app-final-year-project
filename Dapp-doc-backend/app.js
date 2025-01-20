const express = require("express");
const jwt = require("jsonwebtoken");
const { PublicKey } = require("@solana/web3.js");
const cors = require("cors");
const dotenv = require("dotenv");
const { PrismaClient } = require("@prisma/client");
const nacl = require("tweetnacl");
const authenticateToken = require("./Middleware/middleware");

dotenv.config(); // Load environment variables

const app = express();
app.use(express.json());
app.use(cors());

const SECRET_KEY = process.env.JWT_SECRET; // Ensure this is set securely
const prisma = new PrismaClient(); // Initialize Prisma Client

// Endpoint to authenticate user
app.post("/api/authenticate", async (req, res) => {
  const { publicKey, signature } = req.body;

  try {
    const fixedMessage = process.env.SIGN_MESSAGE; // Fixed message
    const messageBytes = new TextEncoder().encode(fixedMessage);

    // Verify the signature using tweetnacl
    const key = new PublicKey(publicKey).toBytes(); // Convert public key to bytes
    const isValid = nacl.sign.detached.verify(messageBytes, Uint8Array.from(signature), key);

    if (!isValid) {
      return res.status(401).json({ message: "Invalid signature." });
    }

    // Check if user exists in the database
    let user = await prisma.wallet.findUnique({
      where: { publicKey },
    });

    // If user doesn't exist, create a new record
    if (!user) {
      user = await prisma.wallet.create({
        data: { publicKey },
      });
      console.log(`New user created with publicKey: ${publicKey}`);
    } else {
      console.log(`Existing user authenticated: ${publicKey}`);
    }

    // Generate a JWT token
    const token = jwt.sign({ publicKey }, SECRET_KEY, { expiresIn: "1h" });

    // Respond with the token
    res.json({ token });
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

app.post('/upload-doc', authenticateToken, async (req, res) => {
  const { encryptedCID, iv, fileHash, fileType, customFileName } = req.body;
  const publicKey = req.publicKey;  // Extracted from the JWT

  if (!publicKey) {
    return res.status(401).json({ error: 'Public key missing in the JWT' });
  }

  try {
    // Decode encryptedCID and IV from base64
    const encryptedCIDBuffer = Buffer.from(encryptedCID, 'base64');
    const ivBuffer = Buffer.from(iv, 'base64');

    // Convert fileHash array to hexadecimal string
    const fileHashString = fileHash.map(byte => byte.toString(16).padStart(2, '0')).join('');

    // Store the document in the database
    const document = await prisma.document.create({
      data: {
        name: customFileName,  // Custom file name
        type: fileType,        // MIME type of the file
        encryptedcid: encryptedCIDBuffer.toString('base64'),  // Base64 encoded string for encrypted CID
        iv: ivBuffer.toString('base64'),  // Store IV as base64 for reuse during decryption
        fileHash: fileHashString,  // Hexadecimal string for the file hash
        publicKey: publicKey,      // Store the public key
      },
    });

    res.status(200).json({ message: 'Document uploaded successfully', document });
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({ error: 'Error uploading document' });
  }
});


// Route to fetch all documents for the authenticated user (including encrypted AES key)
app.get("/api/documents", authenticateToken, async (req, res) => {
  try {
    const publicKey = req.publicKey;  // Ensure publicKey is extracted correctly

    if (!publicKey) {
      return res.status(400).json({ message: "Public key not found in the request." });
    }

    // Fetch documents for the user identified by the public key
    const documents = await prisma.document.findMany({
      where: {
        publicKey: publicKey,  // Filter documents based on the publicKey
      },
    });

    if (documents.length === 0) {
      return res.status(404).json({ message: "No documents found for this user." });
    }

    res.json({
      message: "Documents fetched successfully.",
      documents,
    });
  } catch (error) {
    console.error("Error fetching documents:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});


// Start the server
const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
