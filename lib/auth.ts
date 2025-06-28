import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@/app/generated/prisma/index.js";

const prisma = new PrismaClient();

export const auth = betterAuth({
  // Required: Secret for encryption, signing, and hashing
  secret: process.env.BETTER_AUTH_SECRET || process.env.AUTH_SECRET || "better-auth-secret-123456789",
  
  // Database configuration
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  
  // Base URL for your application
  baseURL: process.env.BETTER_AUTH_URL || process.env.NEXTAUTH_URL || "http://localhost:3000",
  
  // Trusted origins for security
  trustedOrigins: [
    process.env.BETTER_AUTH_URL || process.env.NEXTAUTH_URL || "http://localhost:3000",
  ],
  
  // Email and password authentication
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
  },
  
  // Social providers
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  
  // Session configuration
  session: {
    expiresIn: 604800, // 7 days
    updateAge: 86400, // 1 day
  },
  
  // User configuration
  user: {
    additionalFields: {
      // Add any additional user fields you need
    },
  },
});
