import { Schema, model } from 'mongoose';

interface Reminder {
  user: string;
  text: string;
  time: Date;
  description?: string;
  sendDM: boolean; // Ensure this field exists in the schema
  sent: boolean;
}

const reminderSchema = new Schema<Reminder>({
  user: { type: String, required: true },
  text: { type: String, required: true },
  time: { type: Date, required: true },
  description: { type: String, required: false },
  sendDM: { type: Boolean, default: false }, // Added sendDM here
  sent: { type: Boolean, default: false },
});

const ReminderModel = model<Reminder>('Reminder', reminderSchema);

export default ReminderModel;
