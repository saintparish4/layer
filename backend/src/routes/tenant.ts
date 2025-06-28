import { Router } from "express";
import { prisma } from "../prisma";

export const tenantRouter = Router();

// Create Tenant
tenantRouter.post("/", async (req, res) => {
    const { name, ownerId } = req.body;
    if (!name || !ownerId) {
        return res.status(400).json({ error: "Name and ownerId are required" });
    }
    const tenant = await prisma.tenant.create({
        data: { 
            name, 
            ownerId,
            createdAt: new Date(),
            updatedAt: new Date()
        },
    });
    res.status(201).json(tenant);
});

// GET TENANT
tenantRouter.get("/:id", async (req, res) => {
    const { id } = req.params;
    const tenant = await prisma.tenant.findUnique({ where: { id } });
    if (!tenant) return res.status(404).json({ error: "Tenant not found" });
    res.json(tenant);
});

// GET ALL TENANTS
tenantRouter.get("/", async (req, res) => {
    const { ownerId } = req.query;
    
    if (ownerId) {
        // Find tenant by ownerId
        const tenant = await prisma.tenant.findFirst({ 
            where: { ownerId: ownerId as string } 
        });
        if (!tenant) {
            return res.status(404).json({ error: "Tenant not found for this owner" });
        }
        return res.json(tenant);
    }
    
    // Return all tenants if no ownerId specified
    const tenants = await prisma.tenant.findMany();
    res.json(tenants);
});

// UPDATE TENANT
