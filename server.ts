import dotenv from "dotenv";
// Load environment variables immediately
dotenv.config();

// Enforce UTC-3 (America/Sao_Paulo) system-wide timezone for the backend process
process.env.TZ = "America/Sao_Paulo";

import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import admin from "firebase-admin";
import fs from "fs";
import nodemailer from "nodemailer";
import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  Timestamp, 
  doc, 
  updateDoc, 
  increment, 
  getDoc, 
  writeBatch,
  deleteDoc
} from "firebase/firestore";
import { MercadoPagoConfig, PreApprovalPlan, PreApproval, Payment } from 'mercadopago';
import twilio from 'twilio';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Env helper to handle surrounding quotes responsibly
function getEnv(key: string, defaultValue = ""): string {
  let val = (process.env[key] || defaultValue).trim();
  if (val.startsWith('"') && val.endsWith('"')) {
    val = val.slice(1, -1);
  }
  if (val.startsWith("'") && val.endsWith("'")) {
    val = val.slice(1, -1);
  }
  return val;
}

// Initialize Mercado Pago
let mpClient: MercadoPagoConfig | null = null;
const getMPClient = () => {
  if (!mpClient) {
    const accessToken = getEnv("MERCADO_PAGO_ACCESS_TOKEN");
    if (!accessToken) {
      console.warn("MERCADO_PAGO_ACCESS_TOKEN not set. Mercado Pago features will be disabled.");
      return null;
    }
    
    // Log token prefix for debugging (masked)
    const maskedToken = accessToken.substring(0, 15) + "..." + accessToken.substring(accessToken.length - 4);
    console.log(`[Mercado Pago] Initializing with token: ${maskedToken} (length: ${accessToken.length})`);
    
    mpClient = new MercadoPagoConfig({ accessToken, options: { timeout: 10000 } });
  }
  return mpClient;
};

// Load Firebase config to get project ID
let firebaseConfig: any = {};
try {
  const configPath = path.join(__dirname, "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    if (firebaseConfig.projectId) {
      // FORCE the environment to use the project from config
      process.env.GOOGLE_CLOUD_PROJECT = firebaseConfig.projectId;
      process.env.GCLOUD_PROJECT = firebaseConfig.projectId;
      console.log(`[Env] Forcing Project ID: ${firebaseConfig.projectId}`);
    }
  } else {
    console.error("CRITICAL: firebase-applet-config.json not found!");
  }
} catch (err) {
  console.error("Error loading firebase config:", err);
}

// Initialize Firebase Admin
if (admin.apps.length === 0) {
  try {
    admin.initializeApp();
  } catch (initErr: any) {
    console.warn("[Firebase Admin] Ambient initialization failed:", initErr.message);
  }
}

// Initialize Firebase Client SDK for Firestore (to bypass server-side project identity issues)
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);
console.log(`[Firestore Client] Initialized with database ID: ${firebaseConfig.firestoreDatabaseId}`);

// Test Firestore Connectivity
if (db) {
  (async () => {
    try {
      const dbIdDisplay = firebaseConfig.firestoreDatabaseId || "(default)";
      console.log(`[Firestore] Testing connectivity to: ${dbIdDisplay}`);
      
      const q = query(collection(db, "verification_codes"), where("userId", "==", "health-check"));
      await getDocs(q);
      console.log("[Firestore] Connectivity successful.");
    } catch (err: any) {
      console.error("[Firestore] Connectivity failed:", err.message);
      
      if (err.message.includes("PERMISSION_DENIED") || err.message.includes("API has not been used")) {
         console.warn("[Firestore] Database in config is inaccessible. This usually means a Service Account is missing for cross-project access.");
         console.warn("[Firestore] This applet requires its own Firebase Project to be active.");
      }
    }
  })();
}

// Initialize Twilio safely (must start with AC to avoid Twilio initialization throwing an error on empty or invalid configuration)
const twilioAccountSid = getEnv("TWILIO_ACCOUNT_SID");
const twilioAuthToken = getEnv("TWILIO_AUTH_TOKEN");
let twilioClient: any = null;
if (twilioAccountSid && twilioAccountSid.startsWith("AC") && twilioAuthToken) {
  try {
    twilioClient = twilio(twilioAccountSid, twilioAuthToken);
  } catch (err: any) {
    console.error("[Twilio] Falha ao inicializar cliente Twilio:", err.message);
  }
}

// Initialize Nodemailer
const smtpHost = getEnv("SMTP_HOST");
const smtpUser = getEnv("SMTP_USER");
const smtpPass = getEnv("SMTP_PASS");
const smtpPort = Number(getEnv("SMTP_PORT")) || 587;
const emailTransporter = (smtpHost && smtpUser && smtpPass)
  ? nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    })
  : null;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok",
      firebase: {
        projectId: admin.app().options.projectId || "ambient",
        dbInitialized: !!db,
        databaseId: firebaseConfig.firestoreDatabaseId || "default"
      }
    });
  });

  app.get("/api/diag/firestore", async (req, res) => {
    if (!db) return res.status(500).json({ error: "DB not initialized" });
    try {
      const q = query(collection(db, "verification_codes"), where("userId", "==", "health-check"));
      await getDocs(q);
      res.json({ 
        success: true, 
        projectId: firebaseConfig.projectId,
        databaseId: firebaseConfig.firestoreDatabaseId
      });
    } catch (err: any) {
      res.status(500).json({ 
        success: false, 
        error: err.message,
        stack: err.stack,
        projectId: firebaseConfig.projectId,
        databaseId: firebaseConfig.firestoreDatabaseId
      });
    }
  });

  // 2FA API Routes
  app.post("/api/auth/send-code", async (req, res) => {
    const { userId, email, phoneNumber } = req.body;
    if (!userId) return res.status(400).json({ error: "User ID is required" });

    if (!db) {
      console.error("[2FA] Firestore database not initialized");
      return res.status(500).json({ error: "Database configuration missing" });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    try {
      console.log(`[2FA] Generating code for user ${userId} (${email})`);
      
      // Clean up old codes for this user
      try {
        const q = query(collection(db, "verification_codes"), where("userId", "==", userId));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const batch = writeBatch(db);
          snapshot.docs.forEach(d => batch.delete(d.ref));
          await batch.commit();
          console.log(`[2FA] Cleaned up ${snapshot.size} old codes`);
        }
      } catch (cleanupErr: any) {
        console.warn("[2FA] Warning: Cleanup failed (continuing):", cleanupErr.message);
      }

      // Save new code
      try {
        await addDoc(collection(db, "verification_codes"), {
          userId,
          code,
          expiresAt: Timestamp.fromDate(expiresAt),
          createdAt: Timestamp.now()
        });
      } catch (addErr: any) {
        console.error("[2FA] Critical: Failed to add verification code to Firestore:", addErr.message);
        console.error("[2FA] Error Stack:", addErr.stack);
        throw addErr; // Re-throw to be caught by outer catch
      }

      console.log(`\n[2FA SECURITY] Código para ${email || userId}: ${code}\n`);

      let smsSent = false;
      let smsError = null;
      let emailSent = false;
      let emailError = null;

      // Try sending real SMS if Twilio is configured and a phone number is provided
      if (twilioClient && phoneNumber && getEnv("TWILIO_PHONE_NUMBER")) {
        try {
          // Normalize phone number (ensure it's E.164)
          let targetPhone = phoneNumber.replace(/\D/g, '');
          if (!targetPhone.startsWith('+')) {
            targetPhone = '+' + targetPhone;
          }

          await twilioClient.messages.create({
            body: `Seu código de verificação ViTTA Health é: ${code}. Expira em 5 minutes.`,
            from: getEnv("TWILIO_PHONE_NUMBER"),
            to: targetPhone
          });
          smsSent = true;
          console.log(`[Twilio] SMS enviado com sucesso para ${targetPhone}`);
        } catch (err: any) {
          console.error("[Twilio] Erro ao enviar SMS:", err.message);
          smsError = err.message;
        }
      }

      // Try sending real email if Nodemailer is configured and an email is provided
      if (emailTransporter && email) {
        try {
          await emailTransporter.sendMail({
            from: getEnv("SMTP_FROM") || '"ViTTA Health" <ajuda@vittahealth.online>',
            to: email,
            subject: "Seu código de verificação ViTTA Health",
            text: `Seu código de verificação é: ${code}. Este código expira em 5 minutos. Se você não solicitou este código, ignore este e-mail.`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; rounded: 10px;">
                <h2 style="color: #6366f1; text-align: center;">ViTTA Health</h2>
                <h3 style="text-align: center;">Código de Verificação</h3>
                <p style="font-size: 16px; color: #333; text-align: center;">Olá!</p>
                <p style="font-size: 16px; color: #333; text-align: center;">Aqui está o seu código de autenticação em duas etapas:</p>
                <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
                  <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #111827;">${code}</span>
                </div>
                <p style="font-size: 14px; color: #6b7280; text-align: center;">Este código expira em 5 minutos.</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="font-size: 12px; color: #9ca3af; text-align: center;">Se você não solicitou este código, por favor ignore este e-mail.</p>
              </div>
            `
          });
          emailSent = true;
          console.log(`[Nodemailer] E-mail enviado com sucesso para ${email}`);
        } catch (err: any) {
          console.error("[Nodemailer] Erro ao enviar e-mail:", err.message);
          emailError = err.message;
        }
      }

      res.json({ 
        success: true, 
        message: (emailSent || smsSent)
          ? "Código enviado com sucesso." 
          : "Código gerado (verifique o console do servidor para o ambiente de testes).",
        emailSent,
        smsSent,
        devNote: (!emailSent && !smsSent) ? "Ambiente de desenvolvimento: O código foi impresso no log do servidor." : null,
        // In strictly dev mode, we could return the code if we wanted, but let's keep it safe
      });
    } catch (error: any) {
      console.error("[2FA] Error sending 2FA code:", error);
      res.status(500).json({ 
        error: error.message || "Failed to send code",
        code: error.code,
        projectId: firebaseConfig.projectId,
        databaseId: firebaseConfig.firestoreDatabaseId
      });
    }
  });

  app.post("/api/auth/verify-code", async (req, res) => {
    const { userId, code } = req.body;
    if (!userId || !code) return res.status(400).json({ error: "User ID and code are required" });

    try {
      const q = query(
        collection(db, "verification_codes"),
        where("userId", "==", userId),
        where("code", "==", code)
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return res.status(400).json({ error: "Código inválido" });
      }

      const docSnap = snapshot.docs[0];
      const data = docSnap.data();
      if (data.expiresAt.toDate() < new Date()) {
        await deleteDoc(docSnap.ref);
        return res.status(400).json({ error: "Código expirado" });
      }

      // Success - delete code
      await deleteDoc(docSnap.ref);
      res.json({ success: true });
    } catch (error) {
      console.error("Error verifying 2FA code:", error);
      res.status(500).json({ error: "Failed to verify code" });
    }
  });

  // Health check for Mercado Pago
  app.get("/api/mercado-pago/health", async (req, res) => {
    const client = getMPClient();
    if (!client) return res.status(503).json({ status: "unavailable", reason: "MERCADO_PAGO_ACCESS_TOKEN not set" });
    
    try {
      // Try a simple search to test connectivity and token
      const plan = new PreApprovalPlan(client);
      await plan.search({});
      res.json({ status: "ok", message: "Successfully connected to Mercado Pago" });
    } catch (error: any) {
      console.error("Mercado Pago connectivity test failed:", error);
      res.status(500).json({ 
        status: "error", 
        message: error.message || "Failed to connect to Mercado Pago",
        code: error.code || "unknown"
      });
    }
  });

  // Mercado Pago Subscription Routes
  app.get("/api/mercado-pago/plans", async (req, res) => {
    const client = getMPClient();
    if (!client) return res.status(503).json({ error: "Mercado Pago service unavailable" });

    try {
      const plan = new PreApprovalPlan(client);
      const result = await plan.search({}); // Get list of plans
      res.json(result);
    } catch (error: any) {
      if (error?.status === 401 || (error?.message && error.message.toLowerCase().includes("unauthorized"))) {
        console.warn("Mercado Pago: Unauthorized (401)");
        return res.status(401).json({ error: "Token do Mercado Pago inválido ou não autorizado nas Configurações do App" });
      }
      console.error("Error fetching MP plans:", error);
      res.status(500).json({ error: error.message || "Failed to fetch plans" });
    }
  });

  app.post("/api/mercado-pago/plans", async (req, res) => {
    const client = getMPClient();
    if (!client) return res.status(503).json({ error: "Mercado Pago service unavailable" });

    const { reason, auto_recurring, back_url } = req.body;

    try {
      const plan = new PreApprovalPlan(client);
      const result = await plan.create({
        body: {
          reason,
          auto_recurring,
          back_url: back_url || getEnv("APP_URL") || "https://example.com/callback",
          status: "active"
        }
      });
      res.json(result);
    } catch (error: any) {
      if (error?.status === 401 || (error?.message && error.message.toLowerCase().includes("unauthorized"))) {
        console.warn("Mercado Pago: Unauthorized (401)");
        return res.status(401).json({ error: "Token do Mercado Pago inválido ou não autorizado nas Configurações do App" });
      }
      console.error("Error creating MP plan:", error);
      res.status(500).json({ error: error.message || "Failed to create plan" });
    }
  });

  app.get("/api/mercado-pago/plans/:id", async (req, res) => {
    const client = getMPClient();
    if (!client) return res.status(503).json({ error: "Mercado Pago service unavailable" });

    try {
      const plan = new PreApprovalPlan(client);
      const result = await plan.get({ preApprovalPlanId: req.params.id });
      res.json(result);
    } catch (error: any) {
      if (error?.status === 401 || (error?.message && error.message.toLowerCase().includes("unauthorized"))) {
        console.warn("Mercado Pago: Unauthorized (401)");
        return res.status(401).json({ error: "Token do Mercado Pago inválido ou não autorizado nas Configurações do App" });
      }
      console.error("Error fetching MP plan:", error);
      res.status(500).json({ error: error.message || "Failed to fetch plan" });
    }
  });

  app.put("/api/mercado-pago/plans/:id", async (req, res) => {
    const client = getMPClient();
    if (!client) return res.status(503).json({ error: "Mercado Pago service unavailable" });

    try {
      const plan = new PreApprovalPlan(client);
      const result = await plan.update({
        id: req.params.id,
        body: req.body
      } as any);
      res.json(result);
    } catch (error: any) {
      if (error?.status === 401 || (error?.message && error.message.toLowerCase().includes("unauthorized"))) {
        console.warn("Mercado Pago: Unauthorized (401)");
        return res.status(401).json({ error: "Token do Mercado Pago inválido ou não autorizado nas Configurações do App" });
      }
      console.error("Error updating MP plan:", error);
      res.status(500).json({ error: error.message || "Failed to update plan" });
    }
  });

  // Route to create a subscription for a specific user
  app.post("/api/mercado-pago/subscribe", async (req, res) => {
    const client = getMPClient();
    if (!client) return res.status(503).json({ error: "Mercado Pago service unavailable" });

    const { plan_id, payer_email, card_token_id, back_url } = req.body;

    try {
      const preApproval = new PreApproval(client);
      const result = await preApproval.create({
        body: {
          preapproval_plan_id: plan_id,
          payer_email,
          card_token_id,
          back_url: back_url || getEnv("APP_URL") || "https://example.com/callback",
          status: "authorized"
        }
      });
      res.json(result);
    } catch (error: any) {
      if (error?.status === 401 || (error?.message && error.message.toLowerCase().includes("unauthorized"))) {
        console.warn("Mercado Pago: Unauthorized (401)");
        return res.status(401).json({ error: "Token do Mercado Pago inválido ou não autorizado nas Configurações do App" });
      }
      console.error("Error creating subscription:", error);
      res.status(500).json({ error: error.message || "Failed to create subscription" });
    }
  });

  // Pix Payment Routes
  app.post("/api/mercado-pago/pix", async (req, res) => {
    const client = getMPClient();
    if (!client) return res.status(503).json({ error: "Mercado Pago service unavailable" });

    const { amount, email, userId } = req.body;

    try {
      const payment = new Payment(client);
      const result = await payment.create({
        body: {
          transaction_amount: parseFloat(amount),
          description: 'Adição de fundos - ViTTA Health',
          payment_method_id: 'pix',
          payer: {
            email: email
          },
          notification_url: `${getEnv("APP_URL")}/api/webhooks/mercado-pago`,
          metadata: {
            user_id: userId
          }
        }
      });
      res.json(result);
    } catch (error: any) {
      if (error?.status === 401 || (error?.message && error.message.toLowerCase().includes("unauthorized"))) {
        console.warn("Mercado Pago: Unauthorized (401)");
        return res.status(401).json({ error: "Token do Mercado Pago inválido ou não autorizado nas Configurações do App" });
      }
      console.error("Error creating PIX payment:", error);
      res.status(500).json({ error: error.message || "Failed to create Pix payment" });
    }
  });

  app.get("/api/mercado-pago/payments/:id", async (req, res) => {
    const client = getMPClient();
    if (!client) return res.status(503).json({ error: "Mercado Pago service unavailable" });

    try {
      const payment = new Payment(client);
      const result = await payment.get({ id: req.params.id });
      res.json(result);
    } catch (error: any) {
      if (error?.status === 401 || (error?.message && error.message.toLowerCase().includes("unauthorized"))) {
        console.warn("Mercado Pago: Unauthorized (401)");
        return res.status(401).json({ error: "Token do Mercado Pago inválido ou não autorizado nas Configurações do App" });
      }
      console.error("Error fetching payment:", error);
      res.status(500).json({ error: error.message || "Failed to fetch payment" });
    }
  });

  app.post("/api/webhooks/mercado-pago", async (req, res) => {
    const { type, data } = req.body;
    console.log(`[MP Webhook] Received ${type} event for ID: ${data?.id}`);

    if (type === 'payment' && data?.id) {
       const client = getMPClient();
       if (!client) return res.status(500).end();

       try {
         const payment = new Payment(client);
         const paymentData = await payment.get({ id: data.id });
                  if (paymentData.status === 'approved') {
            const userId = paymentData.metadata?.user_id;
            const amount = paymentData.transaction_amount;

            if (userId && amount) {
               // Update balance using Client SDK
               const userRef = doc(db, "users", userId);
               const userSnap = await getDoc(userRef);
               
               if (userSnap.exists()) {
                  await updateDoc(userRef, {
                     walletBalance: increment(amount)
                  });

                  // Add transaction log
                  await addDoc(collection(db, "transactions"), {
                     userId,
                     type: 'credit',
                     amount,
                     description: 'Depósito via PIX (Mercado Pago)',
                     date: new Date().toISOString(),
                     status: 'completed',
                     mpPaymentId: data.id
                  });

                  console.log(`[MP Webhook] Balance updated for user ${userId}: +${amount}`);
               }
            }
         }
       } catch (error) {
         console.error("[MP Webhook] Error processing payment:", error);
       }
    } else if ((type === 'subscription_preapproval' || type === 'subscription') && data?.id) {
       const client = getMPClient();
       if (!client) return res.status(500).end();

       try {
         const preApproval = new PreApproval(client);
         const subData = await preApproval.get({ id: data.id });
         
         if (subData.status === 'authorized') {
            const externalReference = subData.external_reference; // We assume the user ID was passed here
            const reason = subData.reason; // Plan name, e.g., 'Premium', 'Pro'

            if (externalReference) {
               const userRef = doc(db, "users", externalReference);
               const userSnap = await getDoc(userRef);
               if (userSnap.exists()) {
                  await updateDoc(userRef, {
                     plan: reason || 'Premium'
                  });
                  console.log(`[MP Webhook] Plan updated for user ${externalReference}: ${reason}`);
               }
            }
         }
       } catch (error) {
         console.error("[MP Webhook] Error processing subscription webhook:", error);
       }
    }

    res.status(200).end();
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
