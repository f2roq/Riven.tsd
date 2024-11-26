import 'dotenv/config';
import { container, LogLevel, SapphireClient } from '@sapphire/framework';
import { ActivityType } from 'discord.js';
import { checkStreamStatus } from './services/checkStreamStatus'; 
import { connectToDatabase, disconnectFromDatabase } from './database/connect'; 

export class BotClient extends SapphireClient {
  public constructor() {
    super({
      intents: ['Guilds', 'GuildMessages'],
      allowedMentions: { parse: ['roles', 'users'] },
      presence: {
        afk: true,
        status: 'idle',
        activities: [
          {
            name: 'for the ready signal',
            type: ActivityType.Watching,
          },
        ],
      },
      logger: { level: LogLevel.Debug },
    });
  }

  public override async login(token?: string) {
    container.logger.info('Bot logging in...');
    return super.login(token);
  }

  public override async destroy() {
    container.logger.info('Bot is shutting down...');
    return super.destroy();
  }
}

declare module '@sapphire/pieces' {
  interface Container {}
}

declare module 'discord.js' {
  interface ClientEvents {}
}

const client = new BotClient();

// Graceful shutdown handling
process.on('SIGUSR2', async () => {
  console.log('[nodemon] restarting process, shutting down gracefully');
  await shutdownBot();
  process.exit();
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await shutdownBot();
  process.exit();
});

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await shutdownBot();
  process.exit();
});

// Function to handle bot shutdown
async function shutdownBot() {
  try {
    await client.destroy();
    await disconnectFromDatabase(); 
    console.log('Bot successfully destroyed and database disconnected.');
  } catch (error) {
    console.error('Error during shutdown:', error);
  }
}

// Bot startup function
if (!process.env.BOT_TOKEN) {
  throw new Error('Bot token is required but not found.');
}

setInterval(checkStreamStatus, 10 * 1000);  // Every 10 seconds

async function startBot() {
  try {
    await connectToDatabase();
    console.log('Database connected.');
    await client.login(process.env.BOT_TOKEN);
    console.log('Bot logged in successfully!');
  } catch (e) {
    console.error('Login failed:', e);
    process.exit(1); 
  }
}

// Start the bot and handle connection logic
startBot();
