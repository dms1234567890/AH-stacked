import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: process.env.NODE_ENV === 'development'
        ? ['query', 'info', 'warn', 'error']
        : ['warn', 'error'],
    });
  }

  async onModuleInit() {
    const maxAttempts = this.getPositiveIntegerEnvironmentValue('DATABASE_CONNECT_RETRIES', 3);
    const retryDelayMs = this.getPositiveIntegerEnvironmentValue('DATABASE_CONNECT_RETRY_DELAY_MS', 1000);

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        await this.$connect();
        this.logger.log('Connected to PostgreSQL database');
        return;
      } catch (error) {
        if (attempt === maxAttempts) {
          this.logger.error(`Could not connect to PostgreSQL after ${maxAttempts} attempt(s)`);
          throw error;
        }

        const delay = retryDelayMs * attempt;
        this.logger.warn(`PostgreSQL connection attempt ${attempt} failed; retrying in ${delay}ms`);
        await this.wait(delay);
      }
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Disconnected from PostgreSQL database');
  }

  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') return;
    const models = Reflect.ownKeys(this).filter((key: any) => typeof key === 'string' && (key as string)[0] !== '_');
    return Promise.all(models.map((modelKey) => (this as any)[modelKey as string]?.deleteMany()));
  }

  private getPositiveIntegerEnvironmentValue(name: string, defaultValue: number) {
    const value = process.env[name];
    const parsedValue = value ? Number.parseInt(value, 10) : Number.NaN;

    return Number.isSafeInteger(parsedValue) && parsedValue > 0
      ? parsedValue
      : defaultValue;
  }

  private wait(milliseconds: number) {
    return new Promise<void>((resolvePromise) => setTimeout(resolvePromise, milliseconds));
  }
}
