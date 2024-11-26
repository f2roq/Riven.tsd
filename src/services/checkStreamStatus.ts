import axios from 'axios';
import { MongoClient } from 'mongodb';
import { EmbedBuilder, TextChannel } from 'discord.js';
import dotenv from 'dotenv';
import { container } from '@sapphire/framework'; // Access Sapphire's client container

dotenv.config();

const uri = process.env.MONGO_URI;
if (!uri) {
    throw new Error("MONGO_URI is not defined in the environment variables.");
}

const mongoClient = new MongoClient(uri);
const notifiedStreamers = new Set<string>();

export const checkStreamStatus = async () => {
    console.log("Starting stream status check...");

    const database = mongoClient.db('streamers');
    const collection = database.collection('streamerData');
    const streamerData = await collection.find().toArray();

    for (const { name, streamUrl, liveUrl, channelId, imageUrl } of streamerData) {
        console.log(`Checking stream: ${streamUrl}`);

        try {
            const response = await axios.get(streamUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36'
                }
            });
            console.log(`Status Code: ${response.status}`);
            const html = response.data;
            const isLive = html.includes('开播中');
            console.log(`Is live: ${isLive}`);

            if (isLive) {
                if (!notifiedStreamers.has(streamUrl)) {
                    console.log(`Streamer ${name} is live! Notifying channel: ${channelId}`);

                    const channel = await container.client.channels.fetch(channelId);
                    if (channel instanceof TextChannel) {
                        const embed = new EmbedBuilder()
                            .setColor('#FFE5E5')
                            .setTitle(`${name} is Live Now!`)
                            .setDescription(`[Watch the Stream](${liveUrl})`)
                            .setTimestamp();

                        if (imageUrl && imageUrl !== '') {
                            embed.setImage(imageUrl);
                        }

                        await channel.send({ embeds: [embed] });
                        console.log('Message sent successfully.');

                        // Track the notification
                        notifiedStreamers.add(streamUrl);
                    } else {
                        console.error('Channel not found or not a text channel.');
                    }
                } else {
                    console.log(`Already notified for stream: ${streamUrl}`);
                }
            } else {
                // Remove from tracker if not live
                notifiedStreamers.delete(streamUrl);
                console.log(`Streamer ${name} is not live: ${streamUrl}`);
            }
        } catch (error) {
            console.error(`Error fetching stream URL ${streamUrl}:`, error);
        }
    }
};
