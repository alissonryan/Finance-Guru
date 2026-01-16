/**
 * Investment Portfolio Section
 * Interactive prompts for collecting investment portfolio information
 */

import { createInterface } from 'readline';
import { validateCurrency, validateRiskTolerance, validateNonEmpty } from '../modules/input-validator';
import type { OnboardingState } from '../modules/progress';
import { saveSectionData, markSectionComplete, saveState } from '../modules/progress';

export interface InvestmentPortfolioData {
  total_value: number;
  retirement_accounts: number;
  bitcoin_holdings: string;
  total_net_worth: number;
  allocation: string;
  accounts: string[];
  risk_profile: string;
}

/**
 * Creates a readline interface for prompting user
 */
function createPrompt() {
  return createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

/**
 * Prompts user for input with validation
 * @param rl - Readline interface
 * @param question - Question to ask
 * @param validator - Validation function
 * @param allowEmpty - Whether empty input is allowed
 * @returns Validated value
 */
async function promptWithValidation<T>(
  rl: ReturnType<typeof createInterface>,
  question: string,
  validator: (input: string) => T,
  allowEmpty: boolean = false
): Promise<T> {
  return new Promise((resolve) => {
    const ask = () => {
      rl.question(question, (answer) => {
        if (allowEmpty && answer.trim() === '') {
          resolve(null as T);
          return;
        }

        try {
          const validated = validator(answer);
          resolve(validated);
        } catch (error) {
          if (error instanceof Error) {
            console.log(`❌ ${error.message}`);
          }
          console.log('Please try again.');
          ask();
        }
      });
    };
    ask();
  });
}

/**
 * Runs the Investment Portfolio section
 * @param state - Current onboarding state
 * @returns Updated state with investment portfolio data
 */
export async function runInvestmentPortfolioSection(state: OnboardingState): Promise<OnboardingState> {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📈 Section 2 of 7: Investment Portfolio');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log("Now let's gather information about your investment portfolio.");
  console.log('');

  const rl = createPrompt();

  try {
    // Prompt for total brokerage value
    const totalValue = await promptWithValidation(
      rl,
      'What is the total value of your brokerage/investment accounts? $',
      validateCurrency
    );

    // Prompt for retirement accounts
    const retirementAccounts = await promptWithValidation(
      rl,
      'What is the total value of your retirement accounts (401k, IRA, etc.)? $',
      validateCurrency
    );

    // Prompt for Bitcoin holdings
    console.log('');
    console.log('Do you have Bitcoin or cryptocurrency holdings?');
    console.log('Enter the value, or type "excluded" if you want to exclude from planning.');
    console.log('');

    const bitcoinInput = await promptWithValidation(
      rl,
      'Bitcoin/Crypto value ($ or "excluded"): ',
      (input: string) => {
        const trimmed = input.trim().toLowerCase();
        if (trimmed === 'excluded' || trimmed === 'exclude') {
          return 'EXCLUDED_FROM_PLANNING';
        }
        return validateCurrency(input).toString();
      }
    );

    // Calculate total net worth
    const bitcoinValue = bitcoinInput === 'EXCLUDED_FROM_PLANNING' ? 0 : parseFloat(bitcoinInput);
    const totalNetWorth = totalValue + retirementAccounts + bitcoinValue;

    // Prompt for allocation strategy
    console.log('');
    console.log('What is your overall portfolio allocation strategy?');
    console.log('Examples: "aggressive_growth", "balanced", "income_focused", "conservative"');
    console.log('');

    const allocation = await promptWithValidation(
      rl,
      'Allocation strategy: ',
      validateNonEmpty
    );

    // Prompt for account list
    console.log('');
    console.log('List your investment accounts (comma-separated)');
    console.log('Example: "Fidelity Brokerage, Vanguard 401k, Roth IRA"');
    console.log('');

    const accountsInput = await promptWithValidation(
      rl,
      'Investment accounts: ',
      validateNonEmpty
    );

    // Parse accounts into array
    const accounts = accountsInput
      .split(',')
      .map((account: string) => account.trim())
      .filter((account: string) => account.length > 0);

    // Prompt for risk profile
    console.log('');
    const riskProfile = await promptWithValidation(
      rl,
      'What is your risk tolerance? (conservative/moderate/aggressive) ',
      validateRiskTolerance
    );

    // Create investment portfolio data
    const investmentPortfolioData: InvestmentPortfolioData = {
      total_value: totalValue,
      retirement_accounts: retirementAccounts,
      bitcoin_holdings: bitcoinInput,
      total_net_worth: totalNetWorth,
      allocation,
      accounts,
      risk_profile: riskProfile
    };

    // Save section data
    saveSectionData(state, 'investment_portfolio', investmentPortfolioData);

    // Mark section as complete and set next section
    markSectionComplete(state, 'investments', 'cash_flow');

    // Save state to disk
    saveState(state);

    console.log('');
    console.log('✅ Investment Portfolio: Complete');
    console.log('');

    return state;
  } finally {
    rl.close();
  }
}
