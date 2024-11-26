import dotenv from 'dotenv';
dotenv.config();
import { clearDatabase } from './database/models';

(async () => {
    try {
        await clearDatabase();
        console.log('Database has been cleared.');
    } catch (error) {
        console.error('Error clearing database:', error);
    }
})();
