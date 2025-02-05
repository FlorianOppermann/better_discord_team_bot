// index.js
require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');

// Erstelle einen neuen Client mit den notwendigen Intents
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates, // Wichtig, um Voice-Channel-Informationen zu erhalten
        // Weitere Intents können hier hinzugefügt werden, falls benötigt
    ],
});

client.once('ready', () => {
    console.log(`Eingeloggt als ${client.user.tag}`);
});

// Event: Verarbeitung von Slash-Commands
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'generateteams') {
        // Schritt 3: Prüfe, ob der User in einem Voice-Channel ist
        const member = interaction.member;
        if (!member.voice || !member.voice.channel) {
            await interaction.reply({
                content: 'Du musst in einem Voice-Channel sein, um Teams zu generieren!',
                ephemeral: true,
            });
            return;
        }

        const voiceChannel = member.voice.channel;

        // Schritt 4: Ermittle alle (nicht-Bot) Mitglieder im Voice-Channel
        let players = voiceChannel.members.filter(m => !m.user.bot).map(m => m.user.username);
        if (players.length < 2) {
            await interaction.reply({
                content: 'Nicht genügend Spieler im Voice-Channel, um Teams zu bilden.',
                ephemeral: true,
            });
            return;
        }

        // Schritt 5-7: Mische die Spieler zufällig und bilde zwei Teams
        players = shuffleArray(players); // Funktion, die das Array zufällig mischt

        // Berechne die Größe der ersten Gruppe – bei ungerader Anzahl bekommt Team 1 ggf. einen Spieler mehr
        const half = Math.ceil(players.length / 2);
        const team1 = players.slice(0, half);
        const team2 = players.slice(half);

        // Schritt 8: Erstelle ein Embed mit der Team-Aufteilung
        const embed = new EmbedBuilder()
            .setTitle('Team-Aufteilung')
            .setColor(0x0099ff)
            .addFields(
                { name: 'Team 1', value: team1.join('\n'), inline: true },
                { name: 'Team 2', value: team2.join('\n'), inline: true }
            )
            .setFooter({ text: `Gesamtzahl der Spieler im Voice-Channel: ${players.length}` });

        await interaction.reply({ embeds: [embed] });
    }
});

// Hilfsfunktion: Fisher-Yates Shuffle-Algorithmus
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

client.login(process.env.DISCORD_BOT_TOKEN);
