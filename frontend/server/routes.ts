import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTransactionSchema, insertFixedDepositSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get transactions for a user
  app.get("/api/transactions/:userAddress", async (req, res) => {
    try {
      const { userAddress } = req.params;
      const transactions = await storage.getTransactionsByUser(userAddress);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  // Create a new transaction record
  app.post("/api/transactions", async (req, res) => {
    try {
      const validatedData = insertTransactionSchema.parse(req.body);
      const transaction = await storage.insertTransaction(validatedData);
      res.status(201).json(transaction);
    } catch (error) {
      res.status(400).json({ message: "Invalid transaction data" });
    }
  });

  // Update transaction status
  app.patch("/api/transactions/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { status, txHash } = req.body;
      const transaction = await storage.updateTransactionStatus(
        parseInt(id), 
        status, 
        txHash
      );
      
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      
      res.json(transaction);
    } catch (error) {
      res.status(500).json({ message: "Failed to update transaction" });
    }
  });

  // Get fixed deposits for a user
  app.get("/api/fixed-deposits/:userAddress", async (req, res) => {
    try {
      const { userAddress } = req.params;
      const fixedDeposits = await storage.getFixedDepositsByUser(userAddress);
      res.json(fixedDeposits);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch fixed deposits" });
    }
  });

  // Create a new fixed deposit record
  app.post("/api/fixed-deposits", async (req, res) => {
    try {
      const validatedData = insertFixedDepositSchema.parse(req.body);
      const fixedDeposit = await storage.insertFixedDeposit(validatedData);
      res.status(201).json(fixedDeposit);
    } catch (error) {
      res.status(400).json({ message: "Invalid fixed deposit data" });
    }
  });

  // Update fixed deposit status
  app.patch("/api/fixed-deposits/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const fixedDeposit = await storage.updateFixedDepositStatus(
        parseInt(id), 
        status
      );
      
      if (!fixedDeposit) {
        return res.status(404).json({ message: "Fixed deposit not found" });
      }
      
      res.json(fixedDeposit);
    } catch (error) {
      res.status(500).json({ message: "Failed to update fixed deposit" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
