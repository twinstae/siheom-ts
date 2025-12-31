import * as v from "valibot";

export function parseFormDatatoJsObject<T extends object>(formData: FormData, schema: v.BaseSchema<T, T, v.BaseIssue<unknown>>): unknown {
	// Extract field keys from schema
	const fieldKeys: string[] = [];
	
	// Check if schema is a valibot object schema
	if (schema && typeof schema === 'object' && 'type' in schema && schema.type === 'object') {
		// For valibot object schemas, entries are available
		const entries = (schema as any).entries;
		if (entries && typeof entries === 'object') {
			fieldKeys.push(...Object.keys(entries));
		}
	}
	
	// If no keys found from schema, fall back to formData keys
	const keysToProcess = fieldKeys.length > 0 ? fieldKeys : [...formData.keys()];
	
	// Map formData values to proper types based on schema
	return Object.fromEntries(
		keysToProcess.map((key) => {
			const value = formData.get(key);
			
			if (value === null || value === undefined) {
				return [key, undefined];
			}
			
			// Get the field schema to determine type
			let fieldSchema: any = null;
			if (schema && typeof schema === 'object' && 'type' in schema && schema.type === 'object') {
				const entries = (schema as any).entries;
				if (entries && typeof entries === 'object') {
					fieldSchema = entries[key];
				}
			}
			
			// Determine type from field schema
			let targetType: 'string' | 'number' | 'boolean' | 'unknown' = 'unknown';
			
			if (fieldSchema) {
				// Check for valibot type
				if (fieldSchema.type === 'string' || fieldSchema.type === 'email' || fieldSchema.type === 'password') {
					targetType = 'string';
				} else if (fieldSchema.type === 'number' || fieldSchema.type === 'integer') {
					targetType = 'number';
				} else if (fieldSchema.type === 'boolean' || fieldSchema.type === 'literal') {
					targetType = 'boolean';
				} else if (fieldSchema.type === 'pipe') {
					// For piped schemas, check the first schema in the pipe
					const schemas = fieldSchema.pipe;
					if (Array.isArray(schemas) && schemas.length > 0) {
						const firstSchema = schemas[0];
						if (firstSchema.type === 'string' || firstSchema.type === 'email' || firstSchema.type === 'password') {
							targetType = 'string';
						} else if (firstSchema.type === 'number' || firstSchema.type === 'integer') {
							targetType = 'number';
						} else if (firstSchema.type === 'boolean' || firstSchema.type === 'literal') {
							targetType = 'boolean';
						}
					}
				}
			}
			
			// Convert value based on type
			if (targetType === 'number') {
				const num = Number(value);
				return [key, isNaN(num) ? value : num];
			} else if (targetType === 'boolean') {
				// Handle checkbox values ('on'/'off') and string booleans
				if (value === 'on') return [key, true];
				if (value === 'off') return [key, false];
				const lowerValue = String(value).toLowerCase();
				if (['true', '1', 'yes'].includes(lowerValue)) return [key, true];
				if (['false', '0', 'no', ''].includes(lowerValue)) return [key, false];
				return [key, Boolean(value)];
			} else {
				// Default to string
				return [key, String(value)];
			}
		})
	);
}