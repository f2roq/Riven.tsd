import { REST, Routes } from 'discord.js';
import { ApplicationCommandDataResolvable, SlashCommandBuilder } from 'discord.js'; // Import SlashCommandBuilder
import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';

config(); // Load environment variables

const token = process.env.DISCORD_TOKEN!;
const clientId = process.env.CLIENT_ID!;

// Load commands from src/commands
async function loadCommands(): Promise<ApplicationCommandDataResolvable[]> {
  const commands: ApplicationCommandDataResolvable[] = [];
  const commandsPath = path.join(__dirname, '../src/commands');
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith('.ts') || file.endsWith('.js'));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const commandModule = await import(filePath);

    // Ensure the module exports a valid Sapphire command
    if (commandModule?.default) {
      const command = new commandModule.default();
      if (command.registerApplicationCommands) {
        // Explicitly type `builder` as `SlashCommandBuilder`
        command.registerApplicationCommands({
          registerChatInputCommand: (builder: SlashCommandBuilder) => commands.push(builder.toJSON()),
        });
      }
    }
  }

  return commands;
}

async function deployGlobalCommands() {
  try {
    console.log('Loading commands...');
    const commands = await loadCommands();
    console.log(`Loaded ${commands.length} commands.`);

    console.log('Deploying global commands...');
    const rest = new REST({ version: '10' }).setToken(token);

    await rest.put(Routes.applicationCommands(clientId), {
      body: commands,
    });

    console.log('Successfully deployed global commands!');
  } catch (error) {
    console.error('Error deploying commands:', error);
  }
}

deployGlobalCommands();
