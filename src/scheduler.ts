import { schedule } from 'node-cron';
import { checkStreamStatus } from './services/checkStreamStatus';

schedule('*/5 * * * *', () => {
    checkStreamStatus();
});
