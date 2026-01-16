/**
 * Broker Types and Interfaces
 * Defines the broker abstraction layer for multi-broker support
 */

/**
 * Supported broker types
 */
export type BrokerType = 'fidelity' | 'schwab' | 'vanguard' | 'td_ameritrade' | 'etrade' | 'robinhood' | 'other';

/**
 * Broker metadata
 */
export interface BrokerInfo {
  id: BrokerType;
  name: string;
  description: string;
  csvExportGuide: string;
}

/**
 * Standard position format (internal representation)
 */
export interface Position {
  symbol: string;
  quantity: number;
  averageCostBasis: number;
  lastPrice?: number;
  currentValue?: number;
}

/**
 * Standard account balances format (internal representation)
 */
export interface AccountBalances {
  settledCash: number;
  netDebit: number;
  accountEquityPercentage: number;
  marginInterestAccrued: number;
  totalAccountValue: number;
}

/**
 * Parsed portfolio data (standard format for all brokers)
 */
export interface ParsedPortfolioData {
  positions: Position[];
  balances: AccountBalances;
  broker: BrokerType;
  exportDate: Date;
}

/**
 * Broker CSV parser interface
 * Each broker implements this interface to parse their CSV format
 */
export interface BrokerCSVParser {
  /**
   * Parse positions CSV file
   * @param csvPath - Path to positions CSV file
   * @returns Array of positions in standard format
   */
  parsePositionsCSV(csvPath: string): Promise<Position[]>;

  /**
   * Parse balances CSV file
   * @param csvPath - Path to balances CSV file
   * @returns Account balances in standard format
   */
  parseBalancesCSV(csvPath: string): Promise<AccountBalances>;

  /**
   * Validate CSV format
   * @param csvPath - Path to CSV file
   * @returns True if CSV is valid for this broker
   */
  validateCSVFormat(csvPath: string): Promise<boolean>;

  /**
   * Get expected CSV file patterns
   * @returns Array of file name patterns to look for
   */
  getExpectedFilePatterns(): {
    positions: string[];
    balances: string[];
  };
}

/**
 * Registry of supported brokers
 */
export const SUPPORTED_BROKERS: Record<BrokerType, BrokerInfo> = {
  fidelity: {
    id: 'fidelity',
    name: 'Fidelity Investments',
    description: 'One of the largest brokerages in the US. Export from Accounts > Positions.',
    csvExportGuide: 'Login → Accounts → Select Account → Positions → Export'
  },
  schwab: {
    id: 'schwab',
    name: 'Charles Schwab',
    description: 'Full-service brokerage. Export from Account Positions.',
    csvExportGuide: 'Login → Accounts → Positions → Export to CSV'
  },
  vanguard: {
    id: 'vanguard',
    name: 'Vanguard',
    description: 'Index fund pioneer. Export from Holdings.',
    csvExportGuide: 'Login → My Accounts → Holdings → Download'
  },
  td_ameritrade: {
    id: 'td_ameritrade',
    name: 'TD Ameritrade',
    description: 'Now owned by Schwab. Export from Account Statement.',
    csvExportGuide: 'Login → My Account → Statements → Download CSV'
  },
  etrade: {
    id: 'etrade',
    name: 'E*TRADE',
    description: 'Morgan Stanley brokerage. Export from Portfolio.',
    csvExportGuide: 'Login → Portfolio → Complete View → Export'
  },
  robinhood: {
    id: 'robinhood',
    name: 'Robinhood',
    description: 'Commission-free trading app. Export from Account.',
    csvExportGuide: 'App → Account → Statements & History → Account Statements'
  },
  other: {
    id: 'other',
    name: 'Other Broker',
    description: 'Manual CSV import. You will need to map columns manually.',
    csvExportGuide: 'Export positions and balances to CSV format'
  }
};

/**
 * Get broker info by ID
 * @param brokerId - Broker type ID
 * @returns Broker information
 */
export function getBrokerInfo(brokerId: BrokerType): BrokerInfo {
  return SUPPORTED_BROKERS[brokerId];
}

/**
 * Get all supported brokers as array
 * @returns Array of broker info objects
 */
export function getAllBrokers(): BrokerInfo[] {
  return Object.values(SUPPORTED_BROKERS);
}

/**
 * Get broker display name for user-facing text
 * @param brokerId - Broker type ID
 * @returns Human-readable broker name
 */
export function getBrokerDisplayName(brokerId: BrokerType): string {
  return SUPPORTED_BROKERS[brokerId]?.name || 'Unknown Broker';
}
