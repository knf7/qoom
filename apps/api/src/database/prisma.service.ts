import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: ['error', 'warn'],
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Connected to Supabase PostgreSQL Database.');
    } catch (error) {
      this.logger.error('CRITICAL: Failed to connect to PostgreSQL database.', error);
      throw error; // Fail fast in V7 to trigger proper service restarts instead of hiding the error
    }
    
    // Register Soft Delete & Query Filter Middleware
    const softDeleteModels = ['User', 'Project'];

    this.$use(async (params: any, next: any) => {
      if (params.model && softDeleteModels.includes(params.model)) {
        // 1. Convert DELETE into UPDATE with soft delete timestamp
        if (params.action === 'delete') {
          params.action = 'update';
          params.args['data'] = { deletedAt: new Date() };
        }
        if (params.action === 'deleteMany') {
          params.action = 'updateMany';
          if (params.args['data'] !== undefined) {
            params.args['data']['deletedAt'] = new Date();
          } else {
            params.args['data'] = { deletedAt: new Date() };
          }
        }

        // 2. Filter out soft deleted records on search operations
        const readActions = ['findUnique', 'findFirst', 'findMany', 'count'];
        if (readActions.includes(params.action)) {
          if (!params.args) {
            params.args = { where: {} };
          }
          if (!params.args.where) {
            params.args.where = {};
          }

          // If the query is not explicitly looking for deleted items, filter them
          if (params.args.where.deletedAt === undefined) {
            params.args.where.deletedAt = null;
          }
        }
      }

      return next(params);
    });
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Disconnected from database connection.');
  }

  /**
   * Safe transaction helper to handle query isolation
   */
  async runTransaction<T>(actions: (prisma: PrismaClient) => Promise<T>): Promise<T> {
    return this.$transaction(async (tx: any) => {
      return actions(tx as PrismaClient);
    });
  }
}
