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

  if (!outputSchema) {
    // If no schema, return a generic error object with a 'response' field.
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
          defaultObject[key] = createDefaultResponse(fieldSchema); // Recursive call
        } else if (fieldSchemaTypeName === "ZodOptional" || fieldSchemaTypeName === "ZodNullable") {
          defaultObject[key] = null; // Optional/nullable fields can be null
        } else {
          // For other required complex types (arrays, enums, etc.), attempt a descriptive string.
          // This might cause parsing to fail if the schema expects a non-string type here.
          defaultObject[key] = `NoOp_Unsupported_type_${fieldSchemaTypeName}_for_field_${key}`;
        }
      }
      return outputSchema.parse(defaultObject);
    } else if (typeName === "ZodString") {
      return outputSchema.parse(errorMessage);
    } else {
      // For other top-level schema types (not Object or String),
      // this return value is unlikely to be parsed correctly by the original schema.
      // The catch block below should handle parsing failures.
      // To satisfy some simple cases, we return a string, but it's not robust.
      const parsedValue = `${errorMessage} (Unsupported top-level schema: ${typeName})`;
      // Attempt to parse if the schema expects a string, otherwise this will be caught.
      if (typeof outputSchema.parse(parsedValue) === 'string') {
        return parsedValue;
      }
      // If not a string schema, force an error to go to the catch block for consistent error shaping.
      throw new Error(`Cannot provide default for non-string, non-object top-level schema ${typeName}`);
    }
  } catch (e) {
    const errorDetails = e instanceof Error ? e.message : String(e);
    console.warn(`NoOp Plugin: Error during default response creation. Details: ${errorDetails}. Schema description: ${outputSchema.description || 'N/A'}. Falling back to basic error response.`);
    // Fallback: ALWAYS ensure a 'response' field for compatibility with ChatInterface expecting object with 'response'
    return { response: `${errorMessage} (Error creating NoOp default: ${errorDetails})` };
  }
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

