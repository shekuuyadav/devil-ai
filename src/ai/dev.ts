import { config } from 'dotenv';
config();

import '@/ai/flows/interpret-command.ts';
import '@/ai/flows/summarize-page-content.ts';
import '@/ai/flows/generate-response-from-context.ts';