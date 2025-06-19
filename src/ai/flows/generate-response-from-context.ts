
'use server';
/**
 * @fileOverview An AI agent that generates a response based on the provided context.
 *
 * - generateResponseFromContext - A function that generates a response based on the provided context.
 * - GenerateResponseFromContextInput - The input type for the generateResponseFromContext function.
 * - GenerateResponseFromContextOutput - The return type for the generateResponseFromContext function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateResponseFromContextInputSchema = z.object({
  context: z.string().describe('The context to generate the response from.'),
  query: z.string().describe('The query to generate the response for.'),
  language: z.string().optional().describe('The language for the AI response (e.g., "en", "hi"). Defaults to English if not provided.'),
  mediaDataUri: z.string().optional().describe("Optional media file (image or video) as a data URI. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
});
export type GenerateResponseFromContextInput = z.infer<
  typeof GenerateResponseFromContextInputSchema
>;

const GenerateResponseFromContextOutputSchema = z.object({
  response: z.string().describe('The generated response.'),
});
export type GenerateResponseFromContextOutput = z.infer<
  typeof GenerateResponseFromContextOutputSchema
>;

export async function generateResponseFromContext(
  input: GenerateResponseFromContextInput
): Promise<GenerateResponseFromContextOutput> {
  return generateResponseFromContextFlow(input);
}

const generateResponseFromContextPrompt = ai.definePrompt({
  name: 'generateResponseFromContextPrompt',
  input: {schema: GenerateResponseFromContextInputSchema},
  output: {schema: GenerateResponseFromContextOutputSchema},
  prompt: `You are an AI embodying human nature, acting as a Devil's Advocate. Your responses should reflect the complexities, curiosities, and sometimes contradictory aspects of human thought. Be conversational, inquisitive, and don't shy away from nuanced perspectives. Use the context provided to engage with the query, rather than just answering it directly.

Respond in the language specified by the two-letter code: {{{language}}}. For example, 'en' for English, 'hi' for Hindi.

{{#if mediaDataUri}}
The user has also provided the following media content. Consider it as part of their query or context:
{{media url=mediaDataUri}}
{{/if}}

Context (may include user's typed text or URL info): {{{context}}}
User's explicit query/statement: {{{query}}}

Based on all the above, provide your Devil's Advocate response:`,
});

const generateResponseFromContextFlow = ai.defineFlow(
  {
    name: 'generateResponseFromContextFlow',
    inputSchema: GenerateResponseFromContextInputSchema,
    outputSchema: GenerateResponseFromContextOutputSchema,
  },
  async input => {
    const lang = input.language || 'en'; // Default to English if language is not provided
    const {output} = await generateResponseFromContextPrompt({...input, language: lang});
    return output!;
  }
);
