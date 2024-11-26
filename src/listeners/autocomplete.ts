import { Listener } from '@sapphire/framework';
import { AutocompleteInteraction } from 'discord.js';

export class AutocompleteListener extends Listener {
  public constructor(context: Listener.Context, options: Listener.Options) {
    super(context, {
      ...options,
      event: 'interactionCreate',
    });
  }

  public async run(interaction: AutocompleteInteraction) {
    // Check if the interaction is an AutocompleteInteraction
    if (!interaction.isAutocomplete()) return;

    const focusedOption = interaction.options.getFocused(true);

    // Handle autocomplete for a specific command and option
    if (interaction.commandName === 'search' && focusedOption.name === 'query') {
      const searchQuery = focusedOption.value as string;

      // Example: Suggest fruits that match the user's input
      const suggestions = ['apple', 'banana', 'cherry', 'date', 'elderberry'];
      const matches = suggestions.filter((item) =>
        item.toLowerCase().startsWith(searchQuery.toLowerCase())
      );

      // Respond with the filtered suggestions
      await interaction.respond(
        matches.map((match) => ({
          name: match, // The label shown in the dropdown
          value: match, // The value sent back to the command
        }))
      );
    }
  }
}
