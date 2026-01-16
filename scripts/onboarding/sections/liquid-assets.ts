/**
 * Liquid Assets Section
 * Interactive prompts for collecting liquid assets information
 */

import { createInterface } from 'readline';
import { validateCurrency, validatePositiveInteger, validatePercentage } from '../modules/input-validator';
import type { OnboardingState } from '../modules/progress';
import { saveSectionData, markSectionComplete, saveState } from '../modules/progress';

export interface LiquidAssetsData {
  total: number;
  accounts_count: number;
  average_yield: number;
  structure: string[];
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
 * Runs the Liquid Assets section
 * @param state - Current onboarding state
 * @returns Updated state with liquid assets data
 */
export async function runLiquidAssetsSection(state: OnboardingState): Promise<OnboardingState> {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Section 1 of 7: Liquid Assets');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log("Let's start with your cash accounts (checking, savings, business accounts).");
  console.log('');

  const rl = createPrompt();

  try {
    // Prompt for total liquid cash
    const total = await promptWithValidation(
      rl,
      'What is the total value of your liquid cash? $',
      validateCurrency
    );

    // Prompt for number of accounts
    const accountsCount = await promptWithValidation(
      rl,
      'How many accounts do you have? (checking, savings, business) ',
      validatePositiveInteger
    );

    // Prompt for average yield
    const averageYield = await promptWithValidation(
      rl,
      'What is the average yield on your cash? (e.g., 4.5 for 4.5%) ',
      validatePercentage
    );

    // Prompt for account structure (optional)
    console.log('');
    console.log('Would you like to describe your account structure? (optional)');
    console.log('Example: "2 business accounts (LLC A & LLC B), 3 checking, 2 high-yield savings"');
    console.log('');

    const structureInput = await promptWithValidation(
      rl,
      'Account structure (press Enter to skip): ',
      (input: string) => input.trim(),
      true
    );

    // Parse structure into array
    const structure: string[] = structureInput && structureInput.length > 0
      ? [structureInput]
      : [];

    // Create liquid assets data
    const liquidAssetsData: LiquidAssetsData = {
      total,
      accounts_count: accountsCount,
      average_yield: averageYield / 100, // Convert percentage to decimal
      structure
    };

    // Save section data
    saveSectionData(state, 'liquid_assets', liquidAssetsData);

    // Mark section as complete
    markSectionComplete(state, 'liquid_assets', 'investments');

    // Save state to disk
    saveState(state);

    console.log('');
    console.log('✅ Liquid Assets: Complete');
    console.log('');

    return state;
  } finally {
    rl.close();
  }
}
