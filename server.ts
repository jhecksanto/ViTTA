import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import admin from "firebase-admin";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load Firebase config to get project ID
const firebaseConfig = JSON.parse(fs.readFileSync(path.join(__dirname, "firebase-applet-config.json"), "utf-8"));

// Initialize Firebase Admin
// Note: In this environment, we try to initialize with default credentials or just the project ID
if (admin.apps.length === 0) {
  admin.initializeApp({
    projectId: firebaseConfig.projectId,
    // If we had a service account, we would use it here. 
    // For now, we rely on the environment or admin privileges if possible.
  });
}

const db = admin.firestore();
// Set the database ID if it's not the default
if (firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)') {
  // Note: firebase-admin doesn't have a direct way to set databaseId in initializeApp for Firestore easily in some versions
  // but we can try to access it via the firestore instance if supported or just use default.
  // In many cases, the default database is used.
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // 2FA API Routes
  app.post("/api/auth/send-code", async (req, res) => {
    const { userId, email } = req.body;
    if (!userId) return res.status(400).json({ error: "User ID is required" });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    try {
      // Clean up old codes for this user
      const snapshot = await db.collection("verification_codes").where("userId", "==", userId).get();
      const deletePromises = snapshot.docs.map(d => d.ref.delete());
      await Promise.all(deletePromises);

      // Save new code
      await db.collection("verification_codes").add({
        userId,
        code,
        expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
        createdAt: admin.firestore.Timestamp.now()
      });

      console.log(`\n[2FA SECURITY] Código para ${email || userId}: ${code}\n`);
      res.json({ success: true, message: "Código enviado com sucesso (verifique o console do servidor)" });
    } catch (error) {
      console.error("Error sending 2FA code:", error);
      res.status(500).json({ error: "Failed to send verification code" });
    }
  });

  app.post("/api/auth/verify-code", async (req, res) => {
    const { userId, code } = req.body;
    if (!userId || !code) return res.status(400).json({ error: "User ID and code are required" });

    try {
      const snapshot = await db.collection("verification_codes")
        .where("userId", "==", userId)
        .where("code", "==", code)
        .get();

      if (snapshot.empty) {
        return res.status(400).json({ error: "Código inválido" });
      }

      const data = snapshot.docs[0].data();
      if (data.expiresAt.toDate() < new Date()) {
        await snapshot.docs[0].ref.delete();
        return res.status(400).json({ error: "Código expirado" });
      }

      // Success - delete code
      await snapshot.docs[0].ref.delete();
      res.json({ success: true });
    } catch (error) {
      console.error("Error verifying 2FA code:", error);
      res.status(500).json({ error: "Failed to verify code" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
