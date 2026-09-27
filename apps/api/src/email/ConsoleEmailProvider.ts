import type { EmailProvider } from './EmailProvider.js';
import { logger } from '../config/logger.js';

export class ConsoleEmailProvider implements EmailProvider {
    async send(to: string, subject: string, body: string): Promise<void> {
        logger.info({ to, subject }, '📧 [ConsoleEmail] — see body below');
        // eslint-disable-next-line no-console
        console.log('\n--- EMAIL ---');
        // eslint-disable-next-line no-console
        console.log(`To: ${to}`);
        // eslint-disable-next-line no-console
        console.log(`Subject: ${subject}`);
        // eslint-disable-next-line no-console
        console.log(body);
        // eslint-disable-next-line no-console
        console.log('--- /EMAIL ---\n');
    }
}

export const consoleEmail = new ConsoleEmailProvider();