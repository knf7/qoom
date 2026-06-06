import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { env } from '../config/env.config';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);

  constructor(private readonly eventEmitter: EventEmitter2) {
    const key = env.DEEPSEEK_API_KEY;
    if (!key || key === '') {
      this.logger.error('CRITICAL: DEEPSEEK_API_KEY is missing. Real execution requires a valid key.');
    }
  }

  /**
   * Resiliently executes completions with retry-on-failure strategies and model routing.
   * STRICT ENFORCEMENT: No mock data. Temperature 0.2. Strict JSON parsing.
   */
  async queryModel(systemInstruction: string, promptContent: string, retries = 5, responseSchema?: any, modelType: 'FLASH' | 'PRO' = 'FLASH'): Promise<string> {
    let attempts = 0;
    const startTime = Date.now();
    
    while (attempts <= retries) {
      try {
        attempts++;
        
        const deepseekUrl = 'https://api.deepseek.com/v1/chat/completions';
        const payload: any = {
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: systemInstruction + '\n\nIMPORTANT: You MUST respond with valid JSON only.' },
            { role: 'user', content: promptContent }
          ],
          temperature: 0.3,
          max_tokens: 2000,
          response_format: { type: 'json_object' }
        };

        const response = await fetch(deepseekUrl, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${env.DEEPSEEK_API_KEY}`
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorBody = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorBody.substring(0, 300)}`);
        }

        const data = await response.json();
        let textResponse = data?.choices?.[0]?.message?.content;
        
        if (!textResponse) {
          throw new Error('DeepSeek API returned an empty or malformed payload.');
        }

        // V2.2: Verify and extract valid JSON to prevent JSON_PARSE_ERROR in downstream agents
        try {
          const trimmed = textResponse.replace(/^```[a-z]*\n?/im, '').replace(/\n?```$/im, '').trim();
          JSON.parse(trimmed);
          textResponse = trimmed;
        } catch (parseError: any) {
          const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            try {
              JSON.parse(jsonMatch[0].trim());
              textResponse = jsonMatch[0].trim();
            } catch (e: any) {
              throw new Error(`JSON_PARSE_ERROR: ${e.message}`);
            }
          } else {
            throw new Error(`JSON_PARSE_ERROR: ${parseError.message}`);
          }
        }

        // Metrics event
        this.eventEmitter.emit('telemetry.ai.latency', {
          latencyMs: Date.now() - startTime,
          model: 'deepseek-chat',
          attempts
        });

        return textResponse;
      } catch (error) {
        this.logger.warn(
          `[AI Query Failure] Attempt ${attempts}/${retries + 1} failed. Error: ${
            error instanceof Error ? error.message.substring(0, 200) : String(error)
          }`
        );

        if (attempts > retries) {
          this.logger.error(`[AI API Failure] Exhausted all ${retries + 1} retries.`);
          throw new InternalServerErrorException(
            'Failed to safely analyze the startup concept. Please try again later.'
          );
        }

        const errMsg = error instanceof Error ? error.message : '';
        const is429 = errMsg.includes('429') || errMsg.includes('quota');
        
        const delay = is429 ? 10000 : Math.pow(2, attempts) * 2000;
        
        this.logger.log(`[AI Retry] Waiting ${delay/1000}s before attempt ${attempts + 1}...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw new InternalServerErrorException('Unknown failure executing queryModel.');
  }
}
