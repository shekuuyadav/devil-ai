
import { genkit, type GenkitPlugin } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { createNoopPlugin } from './noop-plugin'; // Updated import

let effectivePlugins: GenkitPlugin[];
let startupMessage = "";

// Check for Google API key in environment variables
const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;

if (!apiKey) {
  startupMessage = `
****************************************************************************************
* WARNING: GOOGLE_API_KEY or GEMINI_API_KEY is not set in your .env file.              *
* Genkit will use a NoOp plugin. AI features will be disabled.                         *
* Please add your API key to the .env file and restart the server.                     *
* Example: GEMINI_API_KEY=your_api_key_here                                          *
****************************************************************************************
  `;
  console.warn(startupMessage);
  effectivePlugins = [createNoopPlugin()]; // Call the function to get the plugin
} else {
  try {
    // Attempt to initialize and use the real googleAI plugin
    effectivePlugins = [googleAI()];
    startupMessage = `
****************************************************************************************
* Google AI Plugin initialized successfully.                                           *
****************************************************************************************
    `;
    console.info(startupMessage);
  } catch (error) {
    startupMessage = `
****************************************************************************************
* ERROR: Failed to initialize GoogleAI plugin, even though an API key was present.     *
* This could be due to an invalid key, network issues, or other configuration errors.  *
* Genkit will use a NoOp plugin. AI features will be disabled.                         *
* Error Details: ${error instanceof Error ? error.message : String(error)}                  *
* Please check your API key and configuration, then restart the server.                *
****************************************************************************************
    `;
    console.error(startupMessage);
    effectivePlugins = [createNoopPlugin()]; // Call the function to get the plugin
  }
}

export const ai = genkit({
  plugins: effectivePlugins,
  model: 'googleai/gemini-2.0-flash', // Default model; may not be used if NoOp plugin is active
  // Consider adding telemetry: false and other flags if they help in this scenario.
});

// You could potentially export startupMessage or a status for client-side display if needed,
// but the primary goal here is to prevent server crashes and provide server-log feedback.
