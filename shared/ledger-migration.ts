/**
 * LEDGER MIGRATION UTILITY
 * Migrates existing data from individual app storage to unified ledger
 */

import { LedgerService, UnifiedTransaction, BankAccount, VestHolding } from './unified-ledger';

export interface MigrationResult {
  success: boolean;
  bankAccountsMigrated: number;
  walletMigrated: boolean;
  vestHoldingsMigrated: number;
  transactionsMigrated: number;
  errors: string[];
}

export class LedgerMigration {
  private ledger: LedgerService;
  private errors: string[] = [];

  constructor() {
    this.ledger = LedgerService.getInstance();
  }

  /**
   * Migrate data from localStorage to unified ledger
   */
  migrateFromLocalStorage(userId: string): MigrationResult {
    const result: MigrationResult = {
      success: false,
      bankAccountsMigrated: 0,
      walletMigrated: false,
      vestHoldingsMigrated: 0,
      transactionsMigrated: 0,
      errors: [],
    };

    try {
      // Initialize ledger if not exists
      let ledgerData = this.ledger.getLedger();
      if (!ledgerData) {
        ledgerData = this.ledger.initializeLedger(userId);
      }

      // Migrate AuraBank data
      result.bankAccountsMigrated = this.migrateBankData();

      // Migrate AuraWallet data
      result.walletMigrated = this.migrateWalletData();

      // Migrate AuraVest data
      result.vestHoldingsMigrated = this.migrateVestData();

      // Migrate transactions from all apps
      result.transactionsMigrated = this.migrateTransactions(userId);

      result.errors = this.errors;
      result.success = this.errors.length === 0;

      console.log('✅ Migration completed:', result);
      return result;
    } catch (error) {
      console.error('❌ Migration failed:', error);
      result.errors.push(`Migration failed: ${error}`);
      return result;
    }
  }

  /**
   * Migrate AuraBank accounts
   */
  private migrateBankData(): number {
    try {
      const storedAccounts = localStorage.getItem('aurabank_accounts');
      if (!storedAccounts) return 0;

      const accounts: BankAccount[] = JSON.parse(storedAccounts);
      this.ledger.updateBankAccounts(accounts);
      
      console.log(`✅ Migrated ${accounts.length} bank accounts`);
      return accounts.length;
    } catch (error) {
      this.errors.push(`Bank migration error: ${error}`);
      return 0;
    }
  }

  /**
   * Migrate AuraWallet balance
   */
  private migrateWalletData(): boolean {
    try {
      // Wallet data might be stored in different formats
      const walletBalance = localStorage.getItem('aurawallet_balance');
      if (walletBalance) {
        const balance = parseFloat(walletBalance);
        this.ledger.updateWalletBalance(balance);
        console.log(`✅ Migrated wallet balance: $${balance}`);
        return true;
      }

      // Check if wallet data is in mock-data format
      const userDataStr = localStorage.getItem('aura_user_data');
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        if (userData.wallet?.balance) {
          this.ledger.updateWalletBalance(userData.wallet.balance);
          console.log(`✅ Migrated wallet balance: $${userData.wallet.balance}`);
          return true;
        }
      }

      return false;
    } catch (error) {
      this.errors.push(`Wallet migration error: ${error}`);
      return false;
    }
  }

  /**
   * Migrate AuraVest holdings
   */
  private migrateVestData(): number {
    try {
      const storedPortfolio = localStorage.getItem('auravest_portfolio');
      if (!storedPortfolio) return 0;

      const portfolio = JSON.parse(storedPortfolio);
      
      // Convert portfolio to VestHoldings format
      const holdings: VestHolding[] = [];
      
      if (portfolio.assets) {
        for (const assetGroup of portfolio.assets) {
          if (assetGroup.items) {
            for (const item of assetGroup.items) {
              holdings.push({
                id: item.id,
                name: item.name,
                symbol: item.symbol,
                type: assetGroup.type.toLowerCase() as 'stock' | 'crypto' | 'gold' | 'nft',
                quantity: item.amount,
                currentPrice: item.currentPrice,
                currentValue: item.currentValue,
                costBasis: item.costBasis,
                unrealizedPnL: item.unrealizedPnL,
              });
            }
          }
        }
      }

      this.ledger.updateVestHoldings(holdings);
      console.log(`✅ Migrated ${holdings.length} vest holdings`);
      return holdings.length;
    } catch (error) {
      this.errors.push(`Vest migration error: ${error}`);
      return 0;
    }
  }

  /**
   * Migrate transactions from all apps
   */
  private migrateTransactions(userId: string): number {
    let count = 0;

    // Migrate bank transactions
    count += this.migrateBankTransactions(userId);

    // Migrate wallet transactions
    count += this.migrateWalletTransactions(userId);

    // Migrate vest transactions
    count += this.migrateVestTransactions(userId);

    return count;
  }

  private migrateBankTransactions(userId: string): number {
    try {
      const storedTransactions = localStorage.getItem('aurabank_transactions');
      if (!storedTransactions) return 0;

      const transactions = JSON.parse(storedTransactions);
      let count = 0;

      for (const txn of transactions) {
        this.ledger.addTransaction({
          userId,
          source: 'bank',
          type: txn.type === 'credit' ? 'credit' : 'debit',
          amount: Math.abs(txn.amount),
          currency: txn.currency || 'USD',
          description: txn.description,
          status: txn.status,
          category: txn.category,
          merchant: txn.merchant,
          metadata: {
            originalId: txn.id,
            accountId: txn.accountId,
            location: txn.location,
          },
        });
        count++;
      }

      console.log(`✅ Migrated ${count} bank transactions`);
      return count;
    } catch (error) {
      this.errors.push(`Bank transactions migration error: ${error}`);
      return 0;
    }
  }

  private migrateWalletTransactions(userId: string): number {
    try {
      const storedTransactions = localStorage.getItem('aurawallet_transactions');
      if (!storedTransactions) return 0;

      const transactions = JSON.parse(storedTransactions);
      let count = 0;

      for (const txn of transactions) {
        this.ledger.addTransaction({
          userId,
          source: 'wallet',
          type: txn.type === 'receive' ? 'credit' : 'debit',
          amount: txn.amount,
          currency: 'USD',
          description: txn.description,
          status: txn.status,
          metadata: {
            originalId: txn.id,
            from: txn.from,
            to: txn.to,
          },
        });
        count++;
      }

      console.log(`✅ Migrated ${count} wallet transactions`);
      return count;
    } catch (error) {
      this.errors.push(`Wallet transactions migration error: ${error}`);
      return 0;
    }
  }

  private migrateVestTransactions(userId: string): number {
    try {
      const storedTransactions = localStorage.getItem('auravest_transactions');
      if (!storedTransactions) return 0;

      const transactions = JSON.parse(storedTransactions);
      let count = 0;

      for (const txn of transactions) {
        this.ledger.addTransaction({
          userId,
          source: 'vest',
          type: txn.type === 'buy' ? 'trade' : 'trade',
          amount: txn.amount,
          currency: txn.currency || 'USD',
          description: txn.description,
          status: txn.status,
          metadata: {
            originalId: txn.id,
            asset: txn.asset,
            quantity: txn.quantity,
            price: txn.price,
          },
        });
        count++;
      }

      console.log(`✅ Migrated ${count} vest transactions`);
      return count;
    } catch (error) {
      this.errors.push(`Vest transactions migration error: ${error}`);
      return 0;
    }
  }

  /**
   * Create backup of existing localStorage data
   */
  createBackup(): string | null {
    try {
      const backup: Record<string, any> = {};
      
      // Backup all Aura-related keys
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('aura') || key.startsWith('payne'))) {
          const value = localStorage.getItem(key);
          if (value) {
            backup[key] = value;
          }
        }
      }

      const backupStr = JSON.stringify(backup, null, 2);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `aura-backup-${timestamp}.json`;

      // Download backup file
      if (typeof window !== 'undefined') {
        const blob = new Blob([backupStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      }

      console.log('✅ Backup created:', filename);
      return backupStr;
    } catch (error) {
      console.error('❌ Backup failed:', error);
      return null;
    }
  }

  /**
   * Restore from backup
   */
  restoreFromBackup(backupJson: string): boolean {
    try {
      const backup = JSON.parse(backupJson);
      
      for (const [key, value] of Object.entries(backup)) {
        if (typeof value === 'string') {
          localStorage.setItem(key, value);
        }
      }

      console.log('✅ Backup restored');
      return true;
    } catch (error) {
      console.error('❌ Restore failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const ledgerMigration = new LedgerMigration();
