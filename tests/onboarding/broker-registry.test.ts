/**
 * Tests for Broker Registry
 */

import { describe, it, expect } from 'bun:test';
import {
  getParserForBroker,
  isBrokerSupported,
  getSupportedBrokers
} from '../../scripts/onboarding/modules/broker-registry';
import type { BrokerType } from '../../scripts/onboarding/modules/broker-types';

describe('Broker Registry', () => {
  describe('isBrokerSupported', () => {
    it('should return true for Fidelity', () => {
      expect(isBrokerSupported('fidelity')).toBe(true);
    });

    it('should return false for Schwab (not yet implemented)', () => {
      expect(isBrokerSupported('schwab')).toBe(false);
    });

    it('should return false for Vanguard (not yet implemented)', () => {
      expect(isBrokerSupported('vanguard')).toBe(false);
    });

    it('should return false for unsupported brokers', () => {
      expect(isBrokerSupported('other')).toBe(false);
    });
  });

  describe('getSupportedBrokers', () => {
    it('should return array of supported broker types', () => {
      const supported = getSupportedBrokers();
      expect(Array.isArray(supported)).toBe(true);
    });

    it('should include Fidelity in supported brokers', () => {
      const supported = getSupportedBrokers();
      expect(supported).toContain('fidelity');
    });

    it('should have at least one supported broker', () => {
      const supported = getSupportedBrokers();
      expect(supported.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('getParserForBroker', () => {
    it('should return parser for Fidelity', () => {
      const parser = getParserForBroker('fidelity');
      expect(parser).toBeDefined();
      expect(typeof parser.parsePositionsCSV).toBe('function');
      expect(typeof parser.parseBalancesCSV).toBe('function');
      expect(typeof parser.validateCSVFormat).toBe('function');
    });

    it('should throw error for unsupported broker', () => {
      expect(() => {
        getParserForBroker('schwab');
      }).toThrow(/not yet supported/);
    });

    it('should throw error for invalid broker', () => {
      expect(() => {
        getParserForBroker('invalid' as BrokerType);
      }).toThrow(/not yet supported/);
    });

    it('should return parser with all required methods', () => {
      const parser = getParserForBroker('fidelity');

      expect(parser.parsePositionsCSV).toBeDefined();
      expect(parser.parseBalancesCSV).toBeDefined();
      expect(parser.validateCSVFormat).toBeDefined();
      expect(parser.getExpectedFilePatterns).toBeDefined();
    });

    it('should return parser with correct file patterns', () => {
      const parser = getParserForBroker('fidelity');
      const patterns = parser.getExpectedFilePatterns();

      expect(patterns).toHaveProperty('positions');
      expect(patterns).toHaveProperty('balances');
      expect(Array.isArray(patterns.positions)).toBe(true);
      expect(Array.isArray(patterns.balances)).toBe(true);
    });
  });
});
