// Utility function to extract JSON from API responses (handles markdown code blocks and multiple JSON objects)
export function extractJsonFromResponse(
  content: string,
  requiredFields?: string[],
  excludeFields?: string[]
): string | null {
  let jsonString = content.trim();
  
  // Remove markdown code block markers if present
  jsonString = jsonString.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
  
  let searchIndex = 0;
  
  while (searchIndex < jsonString.length) {
    // Find the next opening brace
    const jsonStart = jsonString.indexOf('{', searchIndex);
    if (jsonStart === -1) break;
    
    // Find the matching closing brace by counting braces
    let braceCount = 0;
    let jsonEnd = -1;
    for (let i = jsonStart; i < jsonString.length; i++) {
      if (jsonString[i] === '{') {
        braceCount++;
      } else if (jsonString[i] === '}') {
        braceCount--;
        if (braceCount === 0) {
          jsonEnd = i + 1;
          break;
        }
      }
    }
    
    if (jsonEnd === -1) {
      // Incomplete JSON, skip to next
      searchIndex = jsonStart + 1;
      continue;
    }
    
    // Extract this JSON object
    const candidateJson = jsonString.substring(jsonStart, jsonEnd);
    
    // Skip JSON objects that contain exclude fields but not required fields
    if (excludeFields && excludeFields.some(field => candidateJson.includes(`"${field}"`))) {
      const hasRequired = !requiredFields || requiredFields.some(field => candidateJson.includes(`"${field}"`));
      if (!hasRequired) {
        searchIndex = jsonEnd;
        continue;
      }
    }
    
    // Check if this JSON contains required fields
    if (requiredFields && requiredFields.some(field => candidateJson.includes(`"${field}"`))) {
      return candidateJson;
    }
    
    // If no required fields specified, return first valid JSON
    if (!requiredFields) {
      try {
        JSON.parse(candidateJson);
        return candidateJson;
      } catch {
        // Invalid JSON, continue searching
      }
    }
    
    // Move search index past this JSON object
    searchIndex = jsonEnd;
  }
  
  return null;
}

// Helper function to parse SSE stream responses
export async function parseSSEResponse(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  onChunk?: (content: string) => void,
  onDone?: (responseId: string | null) => void
): Promise<{ content: string; responseId: string | null }> {
  const decoder = new TextDecoder();
  let buffer = '';
  let accumulatedResponse = '';
  let responseId: string | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.slice(6));
          if (data.type === 'chunk') {
            accumulatedResponse += data.content;
            onChunk?.(accumulatedResponse);
          } else if (data.type === 'done' && data.responseId) {
            responseId = data.responseId;
            onDone?.(responseId);
          }
        } catch (parseError) {
          console.error('Error parsing SSE data:', parseError);
        }
      }
    }
  }

  return { content: accumulatedResponse, responseId };
}

