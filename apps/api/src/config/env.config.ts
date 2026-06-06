import { z } from 'zod';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

function findEnvFile(startDir: string): string | null {
  let dir = startDir;
  while (true) {
    const envPath = path.join(dir, '.env');
    if (fs.existsSync(envPath)) {
      return envPath;
    }
    // Stop climbing if we hit the monorepo root (contains turbo.json) to prevent iCloud timeout hangs
    if (fs.existsSync(path.join(dir, 'turbo.json'))) {
      break;
    }
    const parentDir = path.dirname(dir);
    if (parentDir === dir) {
      break;
    }
    dir = parentDir;
  }
  return null;
}

const envFile = findEnvFile(__dirname) || findEnvFile(process.cwd());
if (envFile) {
  dotenv.config({ path: envFile });
}
dotenv.config(); // fallback local



const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),
  DATABASE_URL: z.string({
    required_error: 'DATABASE_URL env variable is required',
  }).min(5, 'DATABASE_URL is too short'),
  DEEPSEEK_API_KEY: z.string({
    required_error: 'DEEPSEEK_API_KEY is required to contact DeepSeek AI',
  }).min(5, 'DEEPSEEK_API_KEY is too short'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  JWT_SECRET: z.string({
    required_error: 'JWT_SECRET is required to secure user sessions',
  }).min(12, 'JWT_SECRET must be at least 12 characters for production integrity'),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
});

export type EnvConfig = z.infer<typeof EnvSchema>;

let validatedEnv: EnvConfig;

try {
  validatedEnv = EnvSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    const missingKeys = error.issues.map((i) => i.path.join('.')).join(', ');
    console.error(`\n❌ [ENV CONFIGURATION ERROR]: Missing or invalid environment keys: ${missingKeys}\n`);
    process.exit(1);
  }
  throw error;
}

export const env = validatedEnv;
