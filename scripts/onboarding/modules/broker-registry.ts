/**
 * Broker Registry
 * Maps broker types to their CSV parser implementations
 */

import type { BrokerType, BrokerCSVParser } from './broker-types';
import { createFidelityParser } from './parsers/fidelity-parser';

/**
 * Registry of broker parsers
 */
const parserRegistry = new Map<BrokerType, () => BrokerCSVParser>();

/**
 * Register default broker parsers
 */
function registerDefaultParsers() {
  // Fidelity is fully implemented
  parserRegistry.set('fidelity', createFidelityParser);

  // Other brokers to be implemented (placeholder)
  // parserRegistry.set('schwab', createSchwabParser);
  // parserRegistry.set('vanguard', createVanguardParser);
  // parserRegistry.set('td_ameritrade', createTDAmeritrade Parser);
  // parserRegistry.set('etrade', createETradeParser);
  // parserRegistry.set('robinhood', createRobinhoodParser);
}

// Initialize default parsers
registerDefaultParsers();

/**
 * Get parser for a specific broker
 * @param brokerType - Type of broker
 * @returns CSV parser instance for the broker
 * @throws Error if broker is not supported
 */
export function getParserForBroker(brokerType: BrokerType): BrokerCSVParser {
  const parserFactory = parserRegistry.get(brokerType);

  if (!parserFactory) {
    throw new Error(
      `Broker "${brokerType}" is not yet supported. Currently supported: ${Array.from(parserRegistry.keys()).join(', ')}`
    );
  }

  return parserFactory();
}

/**
 * Check if a broker is supported
 * @param brokerType - Type of broker
 * @returns True if broker has a parser implementation
 */
export function isBrokerSupported(brokerType: BrokerType): boolean {
  return parserRegistry.has(brokerType);
}

/**
 * Get list of all supported broker types
 * @returns Array of supported broker type IDs
 */
export function getSupportedBrokers(): BrokerType[] {
  return Array.from(parserRegistry.keys());
}

/**
 * Register a custom broker parser (for extensibility)
 * @param brokerType - Type of broker
 * @param parserFactory - Factory function that creates parser instance
 */
export function registerBrokerParser(
  brokerType: BrokerType,
  parserFactory: () => BrokerCSVParser
): void {
  parserRegistry.set(brokerType, parserFactory);
}
