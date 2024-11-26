import { MongoClient, Db } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

// Ensure MONGO_URI is defined in the environment variables
const uri = process.env.MONGO_URI || '';

if (!uri) {
  throw new Error('MONGO_URI is not defined in the environment variables.');
}

// MongoClient options (no need for `useNewUrlParser` and `useUnifiedTopology` as defaults are used)
const client = new MongoClient(uri);

// Get the database instance
export const getDatabase = (): Db => client.db('streamers');

// Interface for streamer details
interface StreamerDetails {
  streamUrl: string;
  liveUrl: string;
  channelId: string;
  imageUrl: string;
}

// Function to clear the database
export async function clearDatabase(): Promise<void> {
  try {
    const database = getDatabase();
    const collection = database.collection('streamerData');
    await collection.deleteMany({}); // Remove all documents from the collection
    console.log('Database cleared successfully.');
  } catch (error) {
    console.error('Error clearing database:', error);
    throw error; // Rethrow the error to propagate it
  }
}

// Function to add a streamer
export async function addStreamer(name: string, guildId: string, details: StreamerDetails): Promise<void> {
  try {
    const database = getDatabase();
    const collection = database.collection('streamerData');
    const result = await collection.insertOne({ name, guildId, ...details });

    if (result.acknowledged) {
      console.log(`Streamer ${name} added successfully.`);
    } else {
      console.error(`Failed to add streamer ${name}.`);
    }
  } catch (error) {
    console.error('Error adding streamer:', error);
    throw error; // Rethrow the error to propagate it
  }
}

// Function to remove a streamer
export async function removeStreamer(name: string, guildId: string): Promise<boolean> {
  try {
    const database = getDatabase();
    const collection = database.collection('streamerData');
    const result = await collection.deleteOne({ name, guildId });

    // Return whether a document was deleted
    return result.deletedCount > 0;
  } catch (error) {
    console.error('Error removing streamer:', error);
    throw error; // Rethrow the error to propagate it
  }
}
