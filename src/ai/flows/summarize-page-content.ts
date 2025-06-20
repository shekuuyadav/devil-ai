
'use server';
/**
 * @fileOverview Summarizes the content of a webpage given its URL.
 *
 * - summarizePageContent - A function that summarizes webpage content.
 * - SummarizePageContentInput - The input type for the summarizePageContent function.
 * - SummarizePageContentOutput - The return type for the summarizePageContent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizePageContentInputSchema = z.object({
  url: z.string().describe('The URL of the webpage to summarize.'),
  additionalContext: z.string().optional().describe('Additional context to include when summarizing the webpage content.'),
});
export type SummarizePageContentInput = z.infer<typeof SummarizePageContentInputSchema>;

const SummarizePageContentOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the webpage content.'),
});
export type SummarizePageContentOutput = z.infer<typeof SummarizePageContentOutputSchema>;

export async function summarizePageContent(input: SummarizePageContentInput): Promise<SummarizePageContentOutput> {
  return summarizePageContentFlow(input);
}

const summarizePageContentPrompt = ai.definePrompt({
  name: 'summarizePageContentPrompt',
  input: {schema: SummarizePageContentInputSchema},
  output: {schema: SummarizePageContentOutputSchema},
  prompt: `You are an AI assistant that summarizes the content of a webpage given its URL.  You should provide a concise summary of the content.

URL: {{{url}}}

{{#if additionalContext}}
Additional Context: {{{additionalContext}}}
{{/if}}

Summary:`,
});

const summarizePageContentFlow = ai.defineFlow(
  {
    name: 'summarizePageContentFlow',
    inputSchema: SummarizePageContentInputSchema,
    outputSchema: SummarizePageContentOutputSchema,
  },
  async input => {
    const result = await summarizePageContentPrompt(input);
    const output = result.output;

    if (!output) {
      console.error('Genkit prompt "summarizePageContentPrompt" did not return an output. Input:', input, 'Result:', result);
      return { summary: "I couldn't summarize the page content. The AI service didn't provide a valid response." };
    }
    return output;
  }
);
