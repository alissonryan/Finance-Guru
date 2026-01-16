/**
 * Fidelity CSV Parser
 * Reference implementation for parsing Fidelity CSV exports
 */

import { readFile } from 'fs/promises';
import type { BrokerCSVParser, Position, AccountBalances } from '../broker-types';

/**
 * Fidelity CSV parser implementation
 */
export class FidelityParser implements BrokerCSVParser {
  /**
   * Parse Fidelity positions CSV
   * Expected format: Symbol,Quantity,Last Price,Current Value,Total Gain/Loss Dollar,...,Average Cost Basis
   */
  async parsePositionsCSV(csvPath: string): Promise<Position[]> {
    const content = await readFile(csvPath, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());

    if (lines.length < 2) {
      throw new Error('CSV file is empty or has no data rows');
    }

    // Parse header to find column indices
    const header = lines[0].split(',').map(h => h.trim().toLowerCase());
    const symbolIdx = header.indexOf('symbol');
    const quantityIdx = header.indexOf('quantity');
    const lastPriceIdx = header.indexOf('last price');
    const currentValueIdx = header.indexOf('current value');
    const costBasisIdx = this.findCostBasisColumn(header);

    if (symbolIdx === -1 || quantityIdx === -1 || costBasisIdx === -1) {
      throw new Error('Required columns not found in CSV. Expected: Symbol, Quantity, Average Cost Basis');
    }

    const positions: Position[] = [];

    // Parse data rows (skip header)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;

      const columns = this.parseCSVLine(line);

      const symbol = columns[symbolIdx]?.trim();
      const quantityStr = columns[quantityIdx]?.replace(/,/g, '');
      const lastPriceStr = columns[lastPriceIdx]?.replace(/[\$,]/g, '');
      const currentValueStr = columns[currentValueIdx]?.replace(/[\$,]/g, '');
      const costBasisStr = columns[costBasisIdx]?.replace(/[\$,]/g, '');

      // Skip invalid rows
      if (!symbol || !quantityStr || !costBasisStr) continue;

      // Skip core positions (SPAXX is cash, handled separately)
      if (symbol === 'SPAXX' || symbol === 'FDRXX' || symbol === 'FCASH') continue;

      const quantity = parseFloat(quantityStr);
      const costBasis = parseFloat(costBasisStr);

      if (isNaN(quantity) || isNaN(costBasis)) {
        console.warn(`Skipping invalid row: ${symbol} (quantity: ${quantityStr}, cost basis: ${costBasisStr})`);
        continue;
      }

      const position: Position = {
        symbol,
        quantity,
        averageCostBasis: costBasis
      };

      // Add optional fields if present
      if (lastPriceIdx !== -1 && lastPriceStr) {
        const lastPrice = parseFloat(lastPriceStr);
        if (!isNaN(lastPrice)) {
          position.lastPrice = lastPrice;
        }
      }

      if (currentValueIdx !== -1 && currentValueStr) {
        const currentValue = parseFloat(currentValueStr);
        if (!isNaN(currentValue)) {
          position.currentValue = currentValue;
        }
      }

      positions.push(position);
    }

    return positions;
  }

  /**
   * Parse Fidelity balances CSV
   * Expected format: Account summary with "Settled cash", "Net debit", "Account equity percentage", etc.
   */
  async parseBalancesCSV(csvPath: string): Promise<AccountBalances> {
    const content = await readFile(csvPath, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());

    const balances: Partial<AccountBalances> = {
      settledCash: 0,
      netDebit: 0,
      accountEquityPercentage: 100,
      marginInterestAccrued: 0,
      totalAccountValue: 0
    };

    // Parse key-value pairs
    for (const line of lines) {
      const [key, value] = line.split(',').map(s => s.trim());
      if (!key || !value) continue;

      const keyLower = key.toLowerCase();
      const numericValue = parseFloat(value.replace(/[\$,\(\)]/g, ''));

      if (keyLower.includes('settled cash')) {
        balances.settledCash = numericValue || 0;
      } else if (keyLower.includes('net debit')) {
        // Net debit is negative if you owe margin
        balances.netDebit = value.includes('(') ? -Math.abs(numericValue) : numericValue;
      } else if (keyLower.includes('account equity percentage') || keyLower.includes('equity percentage')) {
        balances.accountEquityPercentage = numericValue || 100;
      } else if (keyLower.includes('margin interest accrued')) {
        balances.marginInterestAccrued = numericValue || 0;
      } else if (keyLower.includes('total account value') || keyLower.includes('account value')) {
        balances.totalAccountValue = numericValue || 0;
      }
    }

    return balances as AccountBalances;
  }

  /**
   * Validate Fidelity CSV format
   */
  async validateCSVFormat(csvPath: string): Promise<boolean> {
    try {
      const content = await readFile(csvPath, 'utf-8');
      const lines = content.split('\n').filter(line => line.trim());

      if (lines.length < 2) return false;

      const header = lines[0].toLowerCase();

      // Check for Fidelity-specific columns
      const hasFidelityColumns =
        header.includes('symbol') &&
        (header.includes('quantity') || header.includes('qty')) &&
        (header.includes('average cost basis') || header.includes('cost basis'));

      return hasFidelityColumns;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get expected file patterns for Fidelity
   */
  getExpectedFilePatterns() {
    return {
      positions: [
        'Portfolio_Positions_*.csv',
        'portfolio_positions_*.csv',
        'positions_*.csv',
        'fidelity_positions_*.csv'
      ],
      balances: [
        'Balances_for_Account_*.csv',
        'balances_for_account_*.csv',
        'account_balances_*.csv',
        'fidelity_balances_*.csv'
      ]
    };
  }

  /**
   * Parse CSV line handling quoted fields with commas
   */
  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current);
    return result;
  }

  /**
   * Find cost basis column (various naming conventions)
   */
  private findCostBasisColumn(header: string[]): number {
    const costBasisVariants = [
      'average cost basis',
      'avg cost basis',
      'cost basis',
      'average cost',
      'avg cost',
      'basis'
    ];

    for (const variant of costBasisVariants) {
      const idx = header.findIndex(h => h.includes(variant));
      if (idx !== -1) return idx;
    }

    return -1;
  }
}

/**
 * Create a new Fidelity parser instance
 */
export function createFidelityParser(): BrokerCSVParser {
  return new FidelityParser();
}
