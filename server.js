import { Message } from './backend/db.js';
import { discordClient, discordWebhookClient } from './backend/discord.js';
import { telegram, telegramGetFileURL, telegramGetProfilePic } from './backend/telegram.js';

const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const DISCORD_CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;
const DISCORD_FORWARD_BOT = (process.env.DISCORD_FORWARD_BOT === 'true')

// Discord -> Telegram handler
discordClient.on("message", async (message) => {

    if (message.channel.id !== DISCORD_CHANNEL_ID || (message.author.bot && !DISCORD_FORWARD_BOT)) {
        return;
    }

    const msg = message.content;

    let mentioned_usernames = []
    for (let mention of message.mentions.users) {
        mentioned_usernames.push("@" + mention[1].username);
    }
    var attachmentUrls = []
    for (let attachment of message.attachments) {
        attachmentUrls.push(attachment[1].url);
    }

    // attachmentUrls is empty when there are no attachments so we can be just lazy
    var finalMessageContent = message.content.replace(/<@.*>/gi, '');
    // convert bold text for telegram markdown
    finalMessageContent = finalMessageContent.replace(/\*\*/g, '*');

    var text = `(${message.author.username}:*\n`;
    text += finalMessageContent
    text += ` ${attachmentUrls.join(' ')}`;
    text += mentioned_usernames.join(" ");

    if (message.reference) {
        const referenceMessage = await message.channel.messages.fetch(message.reference.messageID);

        if (referenceMessage.author.bot) {
            const replyToMessageId = referenceMessage.content.split(':')[0];
            try {
                console.log("sending message...")
                telegram.sendMessage({
                        chat_id: TELEGRAM_CHAT_ID,
                        text: text,
                        reply_to_message_id: replyToMessageId,
                    })
                    .catch((err) => console.error('Error sending message to Telegram:', err));

            } catch (err) {
                console.log("Error");
                return;
            }
        }
    } else {
        try {
            console.log("sending message...")
            telegram.sendMessage({
                    chat_id: TELEGRAM_CHAT_ID,
                    text: text
                })
                .catch((err) => console.error('Error sending message to Telegram:', err));

        } catch (err) {
            console.log("Error");
            return;
        }
    }

});

// Telegram -> Discord handler
telegram.on("message", async (message) => {
    if (message.chat.id.toString() != "-1001863441549") {
        return;
    }

    // Ignore messages from bots
    if (message.from.is_bot) {
        return;
    }

    var username = `[4337 Mafia] ${message.from.first_name}`;
    const mes = new Message({
        chatId: message.chat.id,
        message: message.text,
        date: new Date(message.date * 1000)
    });
    mes.save();

    if (message.from.last_name) {
        username += ` ${message.from.last_name}`;
    }
    if (message.from.username) {
        username += ` (@${message.from.username})`;
    }

    let profileUrl = await telegramGetProfilePic(message);

    var text;
    var fileId;

    if (!message.document && !message.photo && !message.sticker) {
        if (!message.text) {
            console.log("tryin1.s.");
            return;
        }
        text = message.text;

        // convert bold, italic & hyperlink Telegram text for Discord markdown
        if (message.entities) {
            text = convert_text_telegram_to_discord(text, message.entities);
        }

    } else {
        text = message.caption;

        // convert bold, italic & hyperlink Telegram text for Discord markdown
        if (message.caption_entities) {
            text = convert_text_telegram_to_discord(text, message.caption_entities);
        }

        if (message.document) {
            fileId = message.document.file_id;
        } else if (message.sticker) {
            fileId = message.sticker.file_id;
        } else if (message.photo) {
            // pick the last/largest picture in the list
            fileId = message.photo[message.photo.length - 1].file_id;
        }
    }

    if (text) {
        text = text.replace(/@everyone/g, "[EVERYONE]").replace(/@here/g, "[HERE]");
    }

    try {
        var fileUrl = "";
        if (fileId) {
            var file = await telegram.getFile(fileId);
            fileUrl = telegramGetFileURL(file.file_path);

            if (fileUrl != "") {
                console.log("tryin2..");
                discordWebhookClient.send(text, {
                    username: username,
                    avatarURL: profileUrl,
                    files: [fileUrl]
                });
            }
        }
        if (!fileId || fileUrl == "") {
            console.log("tryin1..");
            await discordWebhookClient.send(text, {
                username: username,
                avatarURL: profileUrl
            });
        }
    } catch (err) {
        console.log("err 2");
        return;
    }
});

// Listen for incoming messages

// Check for missed messages every hour
setInterval(() => {
    // Retrieve all messages that were received in the last hour
    const oneHourAgo = new Date(Date.now() - 3600000);
    Message.find({
        date: {
            $gte: oneHourAgo
        }
    }, (err, messages) => {
        if (err) {
            console.error(err);
            return;
        }

        // Process each missed message
        messages.forEach(async (msg) => {
            var username = `[4337 Mafia] ${message.from.first_name}`;
            let profileUrl = await telegramGetProfilePic(message);

            await discordWebhookClient.send(msg.message, {
                username: username,
                avatarURL: profileUrl
            });

        });
    });
}, 3600000); // Every hour

// When the bot starts, process any missed messages

telegram.on('webhook_error', (error) => {
    console.error(error);
});

telegram.on('message', (msg) => {
    console.log('New message:', msg.text);
});


function convert_text_telegram_to_discord(text, entities) {
    var convert;
    var start_format;
    var end_format;
    var section_offset = 0
    var section_end;
    var section_start;

    entities.forEach(({
        type,
        offset,
        length,
        url
    }) => {
        convert = true;
        if (type == 'bold') {
            start_format = '\*\*';
            end_format = '\*\*';
        } else if (type == 'italic') {
            start_format = '\_';
            end_format = '\_';
        } else if (type == 'text_link') {
            start_format = '\*\*';
            end_format = '\*\* (<' + url + '>)';
        } else {
            // Don't convert other entities
            convert = false;
        }

        if (convert) {
            section_start = offset + section_offset;
            section_end = offset + length + section_offset;
            // First add end_format, so it won't mess up the string indexes for start_format
            text = text.slice(0, section_end) + end_format + text.slice(section_end);
            text = text.slice(0, section_start) + start_format + text.slice(section_start);
            section_offset += start_format.length + end_format.length;
        }
    });

    return text
}