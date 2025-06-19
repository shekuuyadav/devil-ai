
// src/ai/flows/interpret-command.ts
'use server';
/**
 * @fileOverview A flow to interpret custom voice commands and trigger specific actions.
 *
 * - interpretCommand - A function that takes a voice command and context as input and returns the interpreted action.
 * - InterpretCommandInput - The input type for the interpretCommand function.
 * - InterpretCommandOutput - The return type for the interpretCommand function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const InterpretCommandInputSchema = z.object({
  command: z
    .string()
    .describe('The voice command to interpret.'),
  context: z.string().optional().describe('Optional context, such as a JSON string of available custom commands.'),
});
export type InterpretCommandInput = z.infer<typeof InterpretCommandInputSchema>;

const InterpretCommandOutputSchema = z.object({
  action: z.string().describe('The interpreted action to perform based on the command. Examples: "navigate", "search", "unknown".'),
  parameters: z.object({
    matchedPhrase: z.string().optional().describe('If the input command matched a custom command phrase from the context, this is the original matched phrase.'),
  }).catchall(z.any()).describe('Parameters for the action. This field is required, but can be an empty object if no specific parameters are applicable. If a custom command is matched, "matchedPhrase" may be included. Other dynamic parameters (e.g., "searchTerm", "urlToNavigate") may also be present.'),
  confidence: z.number().describe('The confidence level of the interpretation (0-1).'),
});
export type InterpretCommandOutput = z.infer<typeof InterpretCommandOutputSchema>;

export async function interpretCommand(input: InterpretCommandInput): Promise<InterpretCommandOutput> {
  return interpretCommandFlow(input);
}

const prompt = ai.definePrompt({
  name: 'interpretCommandPrompt',
  input: {schema: InterpretCommandInputSchema},
  output: {schema: InterpretCommandOutputSchema},
  prompt: `You are a voice command interpreter. Your task is to analyze the given voice command and determine the appropriate action to perform.

  Voice Command: {{{command}}}
  Context (e.g., custom commands available): {{{context}}}

  Based on the command and context, identify the action (e.g., "navigate", "search", "customAction", "unknown") and any required parameters.
  If the command seems to match a custom command phrase from the provided context, include the original phrase as 'matchedPhrase' within the parameters object.
  Provide a confidence level (0-1) to indicate the accuracy of the interpretation.

  Return the action and parameters in JSON format. The "parameters" field must always be an object, even if it's empty (e.g., {}).

  If you cannot understand the command with reasonable confidence, return an action of "unknown", an empty parameters object, and a confidence of 0.
  Example for a search command: { "action": "search", "parameters": { "searchTerm": "latest news" }, "confidence": 0.9 }
  Example for a custom command match: { "action": "customAction", "parameters": { "matchedPhrase": "open my dashboard", "actionUrl": "https://example.com/dashboard" }, "confidence": 0.95 }
  Example for unknown: { "action": "unknown", "parameters": {}, "confidence": 0 }
  `,
});

const interpretCommandFlow = ai.defineFlow(
  {
    name: 'interpretCommandFlow',
    inputSchema: InterpretCommandInputSchema,
    outputSchema: InterpretCommandOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

