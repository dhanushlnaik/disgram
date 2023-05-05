import TelegramBot from "telegram-bot-api";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

console.log("🚀 ~ Connected to telegram Bot");

export var telegram = new TelegramBot({
    token: TELEGRAM_BOT_TOKEN
});


export function telegramGetFileURL(filePath) {
    try {
        return "https://api.telegram.org/file/bot" + TELEGRAM_BOT_TOKEN + "/" + filePath;
    } catch (err) {
        console.log(err.message);
        return "";
    }
}

export async function telegramGetProfilePic(message) {
    try {
        var profilePhotos = await telegram.getUserProfilePhotos(message.from.id);

        if (profilePhotos.total_count > 0) {
            var file = await telegram.getFile(profilePhotos.photos[0][0].file_id);
            return telegramGetFileURL(file.file_path);
        }
    } catch (err) {
        console.log(err.message);
    }

    // Send back the Telegram Logo if no profile picture could be fetched
    return "https://telegram.org/img/t_logo.png";
}