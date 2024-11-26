import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGO_URI || ''; // Default to empty string if undefined

if (!uri) {
    throw new Error("MONGO_URI is not defined in the environment variables.");
}

// MongoClient options (no need for useNewUrlParser and useUnifiedTopology in recent versions)
const options = {
    // No need for useNewUrlParser and useUnifiedTopology anymore
};

const client = new MongoClient(uri, options);

let isConnected = false;

export const connectToDatabase = async () => {
    if (isConnected) {
        console.log('Already connected to the database.');
        return;
    }
    try {
        await client.connect();
        isConnected = true;
        console.log('Connected to database');
    } catch (error) {
        console.error('Error connecting to database:', error);
        throw error;
    }
};

export const disconnectFromDatabase = async () => {
    if (!isConnected) {
        console.log('Database connection is not open.');
        return;
    }
    try {
        await client.close();
        isConnected = false;
        console.log('Disconnected from database');
    } catch (error) {
        console.error('Error disconnecting from database:', error);
        throw error;
    }
};

export default client;
