// deploy-commands.js
require('dotenv').config();
const { REST, Routes } = require('discord.js');

const commands = [
    {
        name: 'generateteams',
        description: 'Erstellt zwei zufällige Teams basierend auf den Mitgliedern im Voice-Channel',
    },
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);

(async () => {
    try {
        console.log('Starte das Registrieren der Slash-Commands...');
        // Für globale Commands:
        await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });
        // Für einen Test-Server (Guild): (ersetze GUILD_ID durch deine Server-ID)
        // await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, 'GUILD_ID'), { body: commands });
        console.log('Slash-Commands erfolgreich registriert.');
    } catch (error) {
        console.error(error);
    }
})();
