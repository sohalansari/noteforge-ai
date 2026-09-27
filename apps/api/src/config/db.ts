import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from './logger.js';
import { UsageModel } from '../models/Usage.model.js';

export async function connectDB(): Promise<void> {
    mongoose.set('strictQuery', true);

    mongoose.connection.on('connected', () => logger.info('✅ MongoDB connected'));
    mongoose.connection.on('error', (err) => logger.error({ err }, 'MongoDB error'));
    mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));

    await mongoose.connect(env.MONGODB_URI, {
        serverSelectionTimeoutMS: 10_000,
        maxPoolSize: 10,
    });

    await UsageModel.init();
    const usageIndexes = await UsageModel.collection.indexes();
    for (const index of usageIndexes) {
        if (index.name === 'userId_1_month_1' || index.name === 'userId_1_day_1') {
            await UsageModel.collection.dropIndex(index.name);
        }
    }
    await UsageModel.createIndexes();
}

export async function disconnectDB(): Promise<void> {
    await mongoose.disconnect();
}