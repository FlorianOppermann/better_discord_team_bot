require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessageReactions,
    ],
    partials: ['MESSAGE', 'CHANNEL', 'REACTION'],
});

client.once('ready', () => {
    console.log(`Eingeloggt als ${client.user.tag}`);
});

/*
  Wir speichern die zuletzt generierten Team-Daten in einem Map,
  wobei der Schlüssel die ID des Voice-Channels ist.
  Der Wert enthält:
    - players: das Array der Spielernamen
    - timestamp: wann die Teams generiert wurden
    - message: die gesendete Embed-Nachricht (vom /generateteams-Befehl)
*/
const lastTeamData = new Map();

/**
 * Generiert ein Embed und den Spieler-Array basierend auf den Mitgliedern eines Voice-Channels.
 * Gibt ein Objekt { embed, players } zurück oder null, wenn zu wenige Spieler vorhanden sind.
 */
async function generateTeamsEmbed(voiceChannel) {
    // Filtere alle (nicht-Bot) Mitglieder aus dem Voice-Channel
    let players = voiceChannel.members
        .filter(m => !m.user.bot)
        .map(m => m.user.username);

    if (players.length < 2) return null;

    // Mische die Spieler zufällig (Fisher-Yates Shuffle)
    players = shuffleArray(players);

    // Teile in zwei Teams – bei ungerader Anzahl bekommt Team 1 ggf. einen Spieler mehr
    const half = Math.ceil(players.length / 2);
    const team1 = players.slice(0, half);
    const team2 = players.slice(half);

    const embed = new EmbedBuilder()
        .setTitle('Team-Aufteilung')
        .setColor(0x0099ff)
        .addFields(
            { name: 'Team 1', value: team1.join('\n') || 'Keine Spieler', inline: true },
            { name: 'Team 2', value: team2.join('\n') || 'Keine Spieler', inline: true }
        )
        .setFooter({ text: `Gesamtzahl der Spieler im Voice-Channel: ${players.length}` });

    return { embed, players };
}

/**
 * Erzeugt ein neues Teams-Embed aus einem gegebenen Array von Spielern.
 */
function generateTeamsEmbedFromPlayers(players) {
    // Klone und mische das Array, um die Originalreihenfolge nicht zu verändern.
    let shuffled = shuffleArray([...players]);
    const half = Math.ceil(shuffled.length / 2);
    const team1 = shuffled.slice(0, half);
    const team2 = shuffled.slice(half);
    const embed = new EmbedBuilder()
        .setTitle('Team-Aufteilung (Reroll)')
        .setColor(0x0099ff)
        .addFields(
            { name: 'Team 1', value: team1.join('\n') || 'Keine Spieler', inline: true },
            { name: 'Team 2', value: team2.join('\n') || 'Keine Spieler', inline: true }
        )
        .setFooter({ text: `Gesamtzahl der Spieler: ${players.length}` });
    return embed;
}

/**
 * Fisher-Yates Shuffle – mischt ein Array zufällig.
 */
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

/**
 * Verarbeitung der Slash-Commands.
 * - /generateteams: Generiert Teams und speichert die Spieler plus Zeitstempel und Nachricht.
 * - /reroll: Nutzt die gespeicherten Spieler, um (innerhalb von 2 Minuten) ein neues Team zu generieren und löscht die alte Nachricht.
 */
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    // Befehl: /generateteams
    if (interaction.commandName === 'generateteams') {
        if (!interaction.member.voice.channel) {
            await interaction.reply({
                content: 'Du musst in einem Voice-Channel sein, um Teams zu bilden.',
                ephemeral: true,
            });
            return;
        }
        const voiceChannel = interaction.member.voice.channel;
        const result = await generateTeamsEmbed(voiceChannel);
        if (!result) {
            await interaction.reply({
                content: 'Nicht genügend Spieler im Voice-Channel, um Teams zu bilden.',
                ephemeral: true,
            });
            return;
        }
        const { embed, players } = result;
        // Speichere die Team-Daten (Spieler-Array, Zeitstempel und die Nachricht) unter Verwendung der Voice-Channel-ID
        await interaction.reply({ embeds: [embed] });
        const sentMessage = await interaction.fetchReply();
        lastTeamData.set(voiceChannel.id, { players, timestamp: Date.now(), message: sentMessage });
    }

    // Befehl: /reroll
    else if (interaction.commandName === 'reroll') {
        if (!interaction.member.voice.channel) {
            await interaction.reply({
                content: 'Du musst in einem Voice-Channel sein, um ein Reroll durchzuführen.',
                ephemeral: true,
            });
            return;
        }
        const voiceChannel = interaction.member.voice.channel;
        const teamData = lastTeamData.get(voiceChannel.id);
        if (!teamData) {
            await interaction.reply({
                content: 'Es wurden noch keine Teams generiert. Bitte nutze zuerst /generateteams.',
                ephemeral: true,
            });
            return;
        }
        const now = Date.now();
        if (now - teamData.timestamp > 2 * 60 * 1000) {
            await interaction.reply({
                content: 'Die 2-Minuten-Frist für ein Reroll ist abgelaufen. Bitte generiere neue Teams mit /generateteams.',
                ephemeral: true,
            });
            return;
        }
        // Alte Nachricht löschen
        try {
            await teamData.message.delete();
        } catch (err) {
            console.error('Fehler beim Löschen der alten Nachricht:', err);
        }
        // Erzeuge ein neues Teams-Embed basierend auf dem gespeicherten Spieler-Array
        const newEmbed = generateTeamsEmbedFromPlayers(teamData.players);
        // Sende die neue Nachricht
        await interaction.reply({ embeds: [newEmbed] });
        // Aktualisiere den Zeitstempel und die Nachricht in der Map (optional, falls ein erneutes Reroll erfolgen soll)
        const newMessage = await interaction.fetchReply();
        lastTeamData.set(voiceChannel.id, { players: teamData.players, timestamp: Date.now(), message: newMessage });
    }
});

client.login(process.env.DISCORD_BOT_TOKEN);
