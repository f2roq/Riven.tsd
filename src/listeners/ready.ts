import { Listener } from '@sapphire/framework';
import { ActivityType, type Client, OAuth2Scopes } from 'discord.js';

export class ReadyListener extends Listener {
  public constructor(context: Listener.LoaderContext, options: Listener.Options) {
    super(context, {
      ...options,
      event: 'ready', // The event to listen for when the bot is ready
    });
  }

  async run(client: Client<true>): Promise<void> {
    // Log the bot's username and ID upon successful login
    const { username, id } = client.user;
    this.container.logger.info(`Successfully logged in as ${username} (${id})`);

    // Attempt to generate the invite link with necessary OAuth2 scopes
    try {
      const inviteLink = client.generateInvite({
        scopes: [OAuth2Scopes.Bot, OAuth2Scopes.ApplicationsCommands],
        permissions: ['Administrator'],
      });
      this.container.logger.info(`Invite link: ${inviteLink}`);
    } catch (error) {
      this.container.logger.error('Failed to generate invite link:', error);
    }

    // Set the bot's presence to indicate it's online and watching chat
    try {
      await client.user.setPresence({
        status: 'online',
        afk: false,
        activities: [
          {
            name: 'Awaken',
            type: ActivityType.Watching,
          },
        ],
      });
      this.container.logger.info('Presence set successfully');
    } catch (error) {
      this.container.logger.error('Failed to set presence:', error);
    }
  }
}
