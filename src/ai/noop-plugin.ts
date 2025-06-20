
/**
 * @fileOverview A NoOp Genkit plugin for graceful degradation when API keys are missing.
 * This plugin provides placeholder implementations for Genkit flows and prompts,
 * allowing the application to run without crashing if the AI services cannot be initialized.
 */
import { genkitPlugin, type Flow, type Prompt, type ZodSchema } from 'genkit';
import type { ZodObject, z } from 'zod';

// Helper to create a default response based on a Zod schema
function createDefaultResponse(outputSchema?: ZodSchema<any>): any {
  const errorMessage = "AI functionality is currently disabled. Please configure the API key in your .env file.";
  if (outputSchema) {
    try {
      // @ts-ignore - Accessing internal Zod properties
      if (outputSchema._def?.typeName === "ZodObject") {
        const shape = (outputSchema as ZodObject<any>).shape;
        const defaultObject: Record<string, any> = {};
        for (const key in shape) {
          // @ts-ignore
          const fieldSchema = shape[key];
          // @ts-ignore
          const fieldTypeName = fieldSchema._def?.typeName;
          if (fieldTypeName === "ZodString") {
            defaultObject[key] = errorMessage;
          } else if (fieldTypeName === "ZodBoolean") {
            defaultObject[key] = false;
          } else if (fieldTypeName === "ZodNumber") {
            defaultObject[key] = 0;
          } else if (fieldTypeName === "ZodObject") {
            defaultObject[key] = createDefaultResponse(fieldSchema);
          } else {
            // For arrays, enums, optionals, etc., null might be a safe default
            defaultObject[key] = null;
          }
        }
        return outputSchema.parse(defaultObject);
      } else if (outputSchema._def?.typeName === "ZodString") {
        // @ts-ignore
        return outputSchema.parse(errorMessage);
      }
    } catch (e) {
      // console.warn("NoOp Plugin: Failed to create a typed default response for schema. Falling back.", e);
    }
  }
  // Fallback for unknown or unhandled schema types, or if schema is undefined
  return { message: errorMessage, error: true };
}

export function createNoopPlugin() {
  return genkitPlugin('noop', async () => {
    return {
      defineFlow<In extends ZodSchema<any> | undefined, Out extends ZodSchema<any> | undefined, Stream extends ZodSchema<any> | undefined>(
        config: { name: string; inputSchema?: In; outputSchema?: Out; streamSchema?: Stream },
        _fn: (input: In extends ZodSchema<any> ? z.infer<In> : void) => Promise<Out extends ZodSchema<any> ? z.infer<Out> : void>
      ): Flow<In extends ZodSchema<any> ? z.infer<In> : void, Out extends ZodSchema<any> ? z.infer<Out> : void, Stream extends ZodSchema<any> ? z.infer<Stream> : void> {
        console.warn(`Genkit NoOp Plugin: Flow '${config.name}' is defined. AI logic will NOT be executed.`);
        
        const flowFn = async (input: any) => {
          console.warn(`Genkit NoOp Plugin: Flow '${config.name}' called (NoOp). Input:`, JSON.stringify(input));
          return createDefaultResponse(config.outputSchema) as (Out extends ZodSchema<any> ? z.infer<Out> : void);
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
          const responseOutput = createDefaultResponse(config.output?.schema);
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
