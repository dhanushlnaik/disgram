import mongoose from "mongoose";
import * as dotenv from 'dotenv';

dotenv.config()

const MONGO_URL=process.env.MONGO_URL

console.log("🚀 ~ file: db.js:7 ~ MONGO: Connected 🟢")
mongoose.connect('mongodb+srv://tatsuikuroda:H1t4v97wSRg5o8Y9@eips.t7o9c7y.mongodb.net/?retryWrites=true&w=majority', { useNewUrlParser: true });
export const Message = mongoose.model('Message', { chatId: Number, message: String, date: Date });
