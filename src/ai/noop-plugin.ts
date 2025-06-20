/**
 * @fileOverview A NoOp Genkit plugin for graceful degradation when API keys are missing.
 * This plugin provides placeholder implementations for Genkit flows and prompts,
 * allowing the application to run without crashing if the AI services cannot be initialized.
 */
import type { Flow } from 'genkit';
import type { ZodSchema, ZodObject, z } from 'zod';
// Minimal fallback for genkitPlugin (replace with official import if available)
function genkitPlugin(name: string, factory: any) { return { name, factory }; }
// Minimal fallback for Prompt type (replace with official type if available)
type Prompt<I = any, O = any> = (input: I) => Promise<{ output: O }>;


// Helper to create a default response based on a Zod schema
// This is now primarily a fallback for unknown schemas.
function createDefaultResponse(outputSchema?: ZodSchema<any>): any {
  const errorMessage = "AI functionality is currently disabled. Please configure the API key in your .env file.";

  if (!outputSchema) {
    return { response: `${errorMessage} (No output schema provided for NoOp plugin)` };
  }

  try {
    // @ts-ignore - Using _def and shape is an internal detail of Zod and can be brittle.
    const typeName = outputSchema._def?.typeName;

    if (typeName === "ZodObject") {
      const shape = (outputSchema as ZodObject<any>).shape;
      const defaultObject: Record<string, any> = {};
      for (const key in shape) {
        // @ts-ignore
        const fieldSchema = shape[key];
        // @ts-ignore
        const fieldSchemaTypeName = fieldSchema._def?.typeName;

        if (fieldSchemaTypeName === "ZodString") {
          defaultObject[key] = `${errorMessage} (field: ${key})`;
        } else if (fieldSchemaTypeName === "ZodBoolean") {
          defaultObject[key] = false;
        } else if (fieldSchemaTypeName === "ZodNumber") {
          defaultObject[key] = 0;
        } else if (fieldSchemaTypeName === "ZodObject") {
          defaultObject[key] = createDefaultResponse(fieldSchema);
        } else if (fieldSchemaTypeName === "ZodOptional" || fieldSchemaTypeName === "ZodNullable") {
          defaultObject[key] = null;
        } else {
          defaultObject[key] = `NoOp_Unsupported_type_${fieldSchemaTypeName}_for_field_${key}`;
        }
      }
      return outputSchema.parse(defaultObject);
    } else if (typeName === "ZodString") {
      return outputSchema.parse(errorMessage);
    } else {
      const parsedValue = `${errorMessage} (Unsupported top-level schema: ${typeName})`;
      if (typeof outputSchema.parse(parsedValue) === 'string') {
        return parsedValue;
      }
      throw new Error(`Cannot provide default for non-string, non-object top-level schema ${typeName}`);
    }
  } catch (e) {
    const errorDetails = e instanceof Error ? e.message : String(e);
    console.warn(`NoOp Plugin: Error during default response creation for a generic schema. Details: ${errorDetails}. Schema description: ${outputSchema.description || 'N/A'}. Falling back to basic error response.`);
    return { response: `${errorMessage} (Error creating NoOp default for generic schema: ${errorDetails})` };
  }
}

export function createNoopPlugin() {
  return genkitPlugin('noop', async () => {
    const baseErrorMessage = "AI functionality is currently disabled. Please configure the API key in your .env file.";

    return {
      defineFlow<In extends ZodSchema<any> | undefined, Out extends ZodSchema<any> | undefined, Stream extends ZodSchema<any> | undefined>(
        config: { name: string; inputSchema?: In; outputSchema?: Out; streamSchema?: Stream },
        _fn: (input: In extends ZodSchema<any> ? z.infer<In> : void) => Promise<Out extends ZodSchema<any> ? z.infer<Out> : void>
      ): Flow<In extends ZodSchema<any> ? z.infer<In> : void, Out extends ZodSchema<any> ? z.infer<Out> : void, Stream extends ZodSchema<any> ? z.infer<Stream> : void> {
        console.warn(`Genkit NoOp Plugin: Flow '${config.name}' is defined. AI logic will NOT be executed.`);
        
        const flowFn = async (input: any) => {
          console.warn(`Genkit NoOp Plugin: Flow '${config.name}' called (NoOp). Input:`, JSON.stringify(input));

          if (config.name === 'generateResponseFromContextFlow') {
            return { response: `${baseErrorMessage} (NoOp for ${config.name})` } as any;
          }
          if (config.name === 'interpretCommandFlow') {
            return {
              action: "unknown",
              parameters: { noopMessage: `${baseErrorMessage} (NoOp for ${config.name})` },
              confidence: 0
            } as any;
          }
           if (config.name === 'summarizePageContentFlow') {
            return { summary: `${baseErrorMessage} (NoOp for ${config.name})` } as any;
          }
          
          // Fallback for other/unknown flows
          try {
            const genericResponse = createDefaultResponse(config.outputSchema);
            if (typeof genericResponse === 'object' && genericResponse !== null) {
              return genericResponse as any;
            }
            return { response: `${baseErrorMessage} (Generic NoOp for ${config.name}, unexpected response type from createDefaultResponse)` } as any;
          } catch (e) {
             console.error(`NoOp Plugin: Critical error in createDefaultResponse for flow ${config.name}`, e);
             return { response: `${baseErrorMessage} (Critical NoOp error for ${config.name})` } as any;
          }
        };
        
        Object.defineProperty(flowFn, 'name', { value: `noopFlow__${config.name}`, writable: false });
        (flowFn as any).inputSchema = config.inputSchema;
        (flowFn as any).outputSchema = config.outputSchema;
        (flowFn as any).streamSchema = config.streamSchema;
        (flowFn as any).toJSON = () => ({ name: config.name, type: 'flow' }); 

        return flowFn as Flow<In extends ZodSchema<any> ? z.infer<In> : void, Out extends ZodSchema<any> ? z.infer<Out> : void, Stream extends ZodSchema<any> ? z.infer<Stream> : void>;
      },

      definePrompt<In extends ZodSchema | undefined = undefined, Out extends ZodSchema | undefined = undefined>(
        config: { name: string; input?: { schema?: In }; output?: { schema?: Out }; prompt: string | ((input: In extends ZodSchema<any> ? z.infer<In> : void) => string); modelName?: string; tools?: any[]; config?: any; },
      ): Prompt<In extends ZodSchema<any> ? z.infer<In> : void, Out extends ZodSchema<any> ? z.infer<Out> : void> {
        console.warn(`Genkit NoOp Plugin: Prompt '${config.name}' is defined. AI logic will NOT be executed.`);
        
        const promptFn = async (input: any) => {
          console.warn(`Genkit NoOp Plugin: Prompt '${config.name}' called (NoOp). Input:`, JSON.stringify(input));
          let responseOutput;

          if (config.name === 'generateResponseFromContextPrompt') {
            responseOutput = { response: `${baseErrorMessage} (NoOp for ${config.name})` };
          } else if (config.name === 'interpretCommandPrompt') {
            responseOutput = {
              action: "unknown",
              parameters: { noopMessage: `${baseErrorMessage} (NoOp for ${config.name})` },
              confidence: 0
            };
          } else if (config.name === 'summarizePageContentPrompt') {
             responseOutput = { summary: `${baseErrorMessage} (NoOp for ${config.name})` };
          } else {
            // Fallback for other/unknown prompts
            try {
              responseOutput = createDefaultResponse(config.output?.schema);
            } catch (e) {
              console.error(`NoOp Plugin: Critical error in createDefaultResponse for prompt ${config.name}`, e);
              responseOutput = { response: `${baseErrorMessage} (Critical NoOp error for ${config.name})` };
            }
          }
          return { output: responseOutput } as { output: (Out extends ZodSchema<any> ? z.infer<Out> : void) };
        };

        Object.defineProperty(promptFn, 'name', { value: `noopPrompt__${config.name}`, writable: false });
        (promptFn as any).inputSchema = config.input?.schema;
        (promptFn as any).outputSchema = config.output?.schema;
        (promptFn as any).toJSON = () => ({ name: config.name, type: 'prompt' });

        return promptFn as Prompt<In extends ZodSchema<any> ? z.infer<In> : void, Out extends ZodSchema<any> ? z.infer<Out> : void>;
      },
    };
  });
}
