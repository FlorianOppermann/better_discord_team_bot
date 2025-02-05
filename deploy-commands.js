// deploy-commands.js
require('dotenv').config();
const { REST, Routes } = require('discord.js');

const commands = [
    {
        name: 'generateteams',
        description: 'Erstellt zwei zufällige Teams basierend auf den Mitgliedern im Voice-Channel',
    },
    {
        name: 'reroll',
        description: 'Generiert erneut die letzten Teams, falls vorhanden',
    }
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);

(async () => {
    try {
        console.log('Registriere Slash-Commands...');
        // Registriere den Befehl global (oder verwende applicationGuildCommands für einen Test-Server)
        await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });
        console.log('Slash-Commands erfolgreich registriert.');
    } catch (error) {
        console.error(error);
    }
})();
