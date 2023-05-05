import { Client, WebhookClient } from "discord.js";


const DISCORD_TOKEN = process.env.DISCORD_BOT_TOKEN;
const DISCORD_WEBHOOK_ID = process.env.DISCORD_WEBHOOK_ID;
const DISCORD_WEBHOOK_TOKEN = process.env.DISCORD_WEBHOOK_TOKEN;

export const discordClient = new Client();

export const discordWebhookClient = new WebhookClient(
	DISCORD_WEBHOOK_ID,
	DISCORD_WEBHOOK_TOKEN
);

discordClient.once("ready", () => {
	console.log("🚀 ~ Connected to Discord Client");
});

discordClient.login(DISCORD_TOKEN);
