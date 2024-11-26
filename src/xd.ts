import 'dotenv/config'; // Import dotenv to load environment variables
import { REST, Routes } from 'discord.js';
import { Command } from '@sapphire/framework';

const token = process.env.BOT_TOKEN;  // Load token from environment variables
const clientId = process.env.CLIENT_ID; // Load client ID from environment variables

// Check if bot token and client ID are set
if (!token || !clientId) {
  throw new Error('Bot token or client ID is missing in the .env file.');
}

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    console.log('Refreshing application (/) commands.');

    // Register commands (adjust your command files accordingly)
    await rest.put(Routes.applicationCommands(clientId), {
      body: [
        {
          name: 'riven-matchups',
          description: 'Select a Riven matchup and view its details.',
        },
        // Add other commands as needed, e.g., your `ping` or `help` commands
      ],
    });

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error('Error while registering commands:', error);
  }
})();
