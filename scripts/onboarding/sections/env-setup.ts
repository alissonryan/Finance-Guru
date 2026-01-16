/**
 * Environment Setup Section
 * Interactive prompts for collecting environment configuration
 */

import { createInterface } from 'readline';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { validateNonEmpty } from '../modules/input-validator';
import type { OnboardingState } from '../modules/progress';
import { saveSectionData, markSectionComplete, saveState } from '../modules/progress';

export interface EnvSetupData {
  user_name: string;
  communication_language: string;
  has_alphavantage?: boolean;
  alphavantage_key?: string;
  has_brightdata?: boolean;
  brightdata_key?: string;
  google_sheets_credentials?: string;
  primary_brokerage?: string;
  brokerage_account_number?: string;
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
 * Prompts user for yes/no confirmation
 * @param rl - Readline interface
 * @param question - Question to ask
 * @returns Boolean response
 */
async function promptYesNo(
  rl: ReturnType<typeof createInterface>,
  question: string
): Promise<boolean> {
  return new Promise((resolve) => {
    rl.question(`${question} (Y/n): `, (answer) => {
      const normalized = answer.trim().toLowerCase();
      resolve(normalized === 'y' || normalized === 'yes' || normalized === '');
    });
  });
}

/**
 * Generates .env file from template
 * @param envData - Environment configuration data
 * @param state - Current onboarding state
 */
function generateEnvFile(envData: EnvSetupData, state: OnboardingState): void {
  const timestamp = new Date().toISOString();
  const projectRoot = process.cwd();

  let envContent = `# Finance Guru Environment Configuration
# Generated: ${timestamp}

# User Configuration
USER_NAME="${envData.user_name}"
COMMUNICATION_LANGUAGE="${envData.communication_language}"
`;

  // MCP Server Configuration
  if (envData.has_alphavantage && envData.alphavantage_key) {
    envContent += `
# MCP Server Configuration
ALPHA_VANTAGE_API_KEY="${envData.alphavantage_key}"
`;
  }

  if (envData.has_brightdata && envData.brightdata_key) {
    if (!envData.has_alphavantage) {
      envContent += `\n# MCP Server Configuration\n`;
    }
    envContent += `BRIGHT_DATA_API_KEY="${envData.brightdata_key}"
`;
  }

  // Google Sheets Integration
  if (envData.google_sheets_credentials) {
    envContent += `
# Google Sheets Integration
GOOGLE_SHEETS_CREDENTIALS_PATH="${envData.google_sheets_credentials}"
`;
  }

  // Portfolio Tracking
  if (envData.primary_brokerage) {
    envContent += `
# Portfolio Tracking
PRIMARY_BROKERAGE="${envData.primary_brokerage}"
`;
    if (envData.brokerage_account_number) {
      envContent += `BROKERAGE_ACCOUNT_NUMBER="${envData.brokerage_account_number}"
`;
    }
  }

  // System Paths
  envContent += `
# System Paths (auto-detected, edit if needed)
PROJECT_ROOT="${projectRoot}"
FIN_GURU_PATH="${projectRoot}/fin-guru"
NOTEBOOKS_PATH="${projectRoot}/notebooks"
`;

  // Write .env file
  const envPath = join(projectRoot, '.env');
  writeFileSync(envPath, envContent, { encoding: 'utf-8' });

  console.log('');
  console.log(`✅ Generated .env file at: ${envPath}`);
}

/**
 * Runs the Environment Setup section
 * @param state - Current onboarding state
 * @returns Updated state with environment data
 */
export async function runEnvSetupSection(state: OnboardingState): Promise<OnboardingState> {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔐 Section 7 of 7: Environment Setup');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('Finance Guru uses a .env file for sensitive configuration.');
  console.log('This includes API keys, user settings, and integration credentials.');
  console.log('');

  const rl = createPrompt();

  try {
    // User Name
    console.log('1. User Configuration');
    console.log('');

    const userName = await promptWithValidation(
      rl,
      'Your name (used in reports and agent communications): ',
      validateNonEmpty
    );

    // Communication Language
    const language = await promptWithValidation(
      rl,
      'Preferred language for communication (default: English): ',
      (input: string) => input.trim() || 'English',
      true
    );

    // API Keys (Optional)
    console.log('');
    console.log('2. API Keys (Optional)');
    console.log('');
    console.log('Finance Guru can integrate with various data providers.');
    console.log('These are optional - you can add them later if needed.');
    console.log('');

    // Alpha Vantage
    const hasAlphaVantage = await promptYesNo(
      rl,
      'Do you have an Alpha Vantage API key? (free tier available at https://www.alphavantage.co)'
    );

    let alphaVantageKey: string | undefined;
    if (hasAlphaVantage) {
      alphaVantageKey = await promptWithValidation(
        rl,
        'Alpha Vantage API key: ',
        validateNonEmpty
      );
    }

    // Bright Data
    const hasBrightData = await promptYesNo(
      rl,
      'Do you have a Bright Data API key? (paid service for web scraping)'
    );

    let brightDataKey: string | undefined;
    if (hasBrightData) {
      brightDataKey = await promptWithValidation(
        rl,
        'Bright Data API key: ',
        validateNonEmpty
      );
    }

    // Google Sheets Integration
    console.log('');
    console.log('3. Google Sheets Integration (Optional)');
    console.log('');

    const hasGoogleSheets = await promptYesNo(
      rl,
      'Do you want to configure Google Sheets integration?'
    );

    let googleSheetsCredentials: string | undefined;
    if (hasGoogleSheets) {
      console.log('');
      console.log('You will need a Google Cloud service account credentials JSON file.');
      console.log('See: https://developers.google.com/sheets/api/quickstart');
      console.log('');

      googleSheetsCredentials = await promptWithValidation(
        rl,
        'Path to Google Sheets credentials JSON file (or press Enter to skip): ',
        (input: string) => input.trim(),
        true
      );
    }

    // Portfolio Tracking
    console.log('');
    console.log('4. Portfolio Tracking (Optional)');
    console.log('');

    const configurePortfolio = await promptYesNo(
      rl,
      'Do you want to configure portfolio tracking settings?'
    );

    let primaryBrokerage: string | undefined;
    let brokerageAccountNumber: string | undefined;

    if (configurePortfolio) {
      // Get brokerage from investment portfolio section if available
      const investmentData = state.data?.investment_portfolio as any;
      if (investmentData?.primary_brokerage) {
        primaryBrokerage = investmentData.primary_brokerage;
        console.log(`Using brokerage from portfolio: ${primaryBrokerage}`);
      } else {
        primaryBrokerage = await promptWithValidation(
          rl,
          'Primary brokerage (e.g., Fidelity, Schwab, Vanguard): ',
          validateNonEmpty
        );
      }

      const wantAccountNumber = await promptYesNo(
        rl,
        'Do you want to store your brokerage account number?'
      );

      if (wantAccountNumber) {
        console.log('');
        console.log('⚠️  Warning: Account number will be stored in plain text in .env');
        console.log('Make sure .env is in .gitignore (it is by default)');
        console.log('');

        brokerageAccountNumber = await promptWithValidation(
          rl,
          'Brokerage account number: ',
          validateNonEmpty
        );
      }
    }

    // Create environment data
    const envData: EnvSetupData = {
      user_name: userName,
      communication_language: language || 'English'
    };

    // Add optional fields
    if (hasAlphaVantage && alphaVantageKey) {
      envData.has_alphavantage = true;
      envData.alphavantage_key = alphaVantageKey;
    }

    if (hasBrightData && brightDataKey) {
      envData.has_brightdata = true;
      envData.brightdata_key = brightDataKey;
    }

    if (googleSheetsCredentials) {
      envData.google_sheets_credentials = googleSheetsCredentials;
    }

    if (primaryBrokerage) {
      envData.primary_brokerage = primaryBrokerage;
    }

    if (brokerageAccountNumber) {
      envData.brokerage_account_number = brokerageAccountNumber;
    }

    // Generate .env file
    generateEnvFile(envData, state);

    // Save section data
    saveSectionData(state, 'env_setup', envData);

    // Mark section as complete (no next section - this is the last one)
    markSectionComplete(state, 'env_setup', 'summary');

    // Save state to disk
    saveState(state);

    console.log('');
    console.log('✅ Environment Setup: Complete');
    console.log('');
    console.log('🔒 Security Notes:');
    console.log('   • .env file is automatically gitignored');
    console.log('   • Never commit .env to version control');
    console.log('   • API keys are stored in plain text locally');
    console.log('   • Backup .env securely if needed');
    console.log('');

    return state;
  } finally {
    rl.close();
  }
}
