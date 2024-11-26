import { connectToDatabase, disconnectFromDatabase } from './database/connect'; // Adjust import paths as needed
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGO_URI || '';
if (!uri) {
    throw new Error("MONGO_URI is not defined in the environment variables.");
}

const client = new MongoClient(uri);

async function clearCollection() {
    try {
        const database = client.db('streamers'); // Use the correct database name
        const collection = database.collection('streamerData'); // Specify the collection to clear
        await collection.deleteMany({}); // Clears all documents in the collection
        console.log('Collection cleared.');
    } catch (error) {
        console.error('Error clearing collection:', error);
        throw error;
    }
}

async function dropCollection() {
    try {
        const database = client.db('streamers');
        const collection = database.collection('streamerData');
        await collection.drop(); // Drops the collection entirely (including data and schema)
        console.log('Collection dropped.');
    } catch (error) {
        console.error('Error dropping collection:', error);
        throw error;
    }
}

async function dropDatabase() {
    try {
        const database = client.db('streamers'); // Use the correct database name
        await database.dropDatabase(); // Drops the entire database (including all collections)
        console.log('Database dropped.');
    } catch (error) {
        console.error('Error dropping database:', error);
        throw error;
    }
}

// Main function to run clearing process
async function clearData() {
    await connectToDatabase(); // Connect to the database before performing any operation

    // You can choose one of the following options based on what you need:
    // await clearCollection();  // Clears the collection but keeps the schema
    // await dropCollection();   // Drops the collection entirely
     await dropDatabase();     // Drops the entire database

    // After clearing, disconnect from the database
    await disconnectFromDatabase();
}

// Run the script to clear data
clearData().catch((error) => {
    console.error('Error clearing data:', error);
    process.exit(1);
});
