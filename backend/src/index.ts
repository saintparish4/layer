import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { tenantRouter } from "./routes/tenant";
import { stripeRouter } from "./routes/stripe";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Tenant APIs
app.use("/api/tenants", tenantRouter);
app.use("/api/stripe", stripeRouter);
app.get('/hello-world', (_req, res) => res.json({ message: 'OK' }));

// Health Check
app.get("/hello-world", (req, res) => {
    res.json({ message: "Hello from Layer backend!" });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Backend is running on port ${PORT}`);
});