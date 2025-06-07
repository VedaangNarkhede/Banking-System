import { transactions, fixedDeposits, type Transaction, type FixedDeposit, type InsertTransaction, type InsertFixedDeposit } from "@shared/schema";

export interface IStorage {
  // Transaction operations
  insertTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getTransactionsByUser(userAddress: string): Promise<Transaction[]>;
  updateTransactionStatus(id: number, status: string, txHash?: string): Promise<Transaction | undefined>;
  
  // Fixed deposit operations
  insertFixedDeposit(fixedDeposit: InsertFixedDeposit): Promise<FixedDeposit>;
  getFixedDepositsByUser(userAddress: string): Promise<FixedDeposit[]>;
  updateFixedDepositStatus(id: number, status: string): Promise<FixedDeposit | undefined>;
}

export class MemStorage implements IStorage {
  private transactions: Map<number, Transaction>;
  private fixedDeposits: Map<number, FixedDeposit>;
  private currentTransactionId: number;
  private currentFixedDepositId: number;

  constructor() {
    this.transactions = new Map();
    this.fixedDeposits = new Map();
    this.currentTransactionId = 1;
    this.currentFixedDepositId = 1;
  }

  async insertTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = this.currentTransactionId++;
    const transaction: Transaction = { 
      ...insertTransaction, 
      id,
      txHash: insertTransaction.txHash || null,
      status: insertTransaction.status || "pending",
      createdAt: new Date()
    };
    this.transactions.set(id, transaction);
    return transaction;
  }

  async getTransactionsByUser(userAddress: string): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).filter(
      (transaction) => transaction.userAddress.toLowerCase() === userAddress.toLowerCase()
    );
  }

  async updateTransactionStatus(id: number, status: string, txHash?: string): Promise<Transaction | undefined> {
    const transaction = this.transactions.get(id);
    if (transaction) {
      transaction.status = status;
      if (txHash) {
        transaction.txHash = txHash;
      }
      this.transactions.set(id, transaction);
      return transaction;
    }
    return undefined;
  }

  async insertFixedDeposit(insertFixedDeposit: InsertFixedDeposit): Promise<FixedDeposit> {
    const id = this.currentFixedDepositId++;
    const fixedDeposit: FixedDeposit = { 
      ...insertFixedDeposit, 
      id,
      txHash: insertFixedDeposit.txHash || null,
      status: insertFixedDeposit.status || "active"
    };
    this.fixedDeposits.set(id, fixedDeposit);
    return fixedDeposit;
  }

  async getFixedDepositsByUser(userAddress: string): Promise<FixedDeposit[]> {
    return Array.from(this.fixedDeposits.values()).filter(
      (fd) => fd.userAddress.toLowerCase() === userAddress.toLowerCase()
    );
  }

  async updateFixedDepositStatus(id: number, status: string): Promise<FixedDeposit | undefined> {
    const fixedDeposit = this.fixedDeposits.get(id);
    if (fixedDeposit) {
      fixedDeposit.status = status;
      this.fixedDeposits.set(id, fixedDeposit);
      return fixedDeposit;
    }
    return undefined;
  }
}

export const storage = new MemStorage();
