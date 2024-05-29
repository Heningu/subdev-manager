const { Client, GatewayIntentBits, Collection, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, ChannelType, EmbedBuilder, PermissionsBitField } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { token, clientId, guildId } = require('./config.json'); // Ensure you have a config.json file with your bot token, clientId, and guildId

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildVoiceStates,
    ]
});

client.commands = new Collection();

const commands = [
    {
        name: 'giveaway-setup',
        description: 'Setup a giveaway through an admin-only channel',
    },
    {
        name: 'ticket-setup',
        description: 'Sets up the ticket system',
    },
    {
        name: 'create-embed',
        description: 'Create a custom embedded message',
        options: [
            {
                name: 'title',
                type: 3, // STRING
                description: 'The title of the embedded message',
                required: false,
            },
            {
                name: 'description',
                type: 3, // STRING
                description: 'The description of the embedded message',
                required: false,
            },
        ],
    },
];

const rest = new REST({ version: '9' }).setToken(token);

(async () => {
    try {
        console.log('Started refreshing application (/) commands.');

        await rest.put(
            Routes.applicationGuildCommands(clientId, guildId),
            { body: commands },
        );

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();

client.once('ready', () => {
    console.log('Logged in as ' + client.user.tag);
});

// Assign a role on join
client.on('guildMemberAdd', async member => {
    const role = member.guild.roles.cache.find(role => role.name === 'Community'); // Replace "Community" with the role name
    if (role) {
        try {
            await member.roles.add(role);
            console.log(`Assigned role ${role.name} to ${member.user.tag}`);
        } catch (error) {
            console.error(`Failed to assign role: ${error}`);
        }
    } else {
        console.log(`Role not found`);
    }
});

// Slash command interaction handler
client.on('interactionCreate', async interaction => {
    if (interaction.isCommand()) {
        const { commandName } = interaction;

        // Permission check for admin-only commands
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }

        if (commandName === 'giveaway-setup') {
            const embed = new EmbedBuilder()
                .setTitle('Giveaway Setup')
                .setDescription('Click the button below to start setting up a giveaway.')
                .setColor(0x00FF00);

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('start-giveaway-setup')
                        .setLabel('Start Giveaway Setup')
                        .setStyle(ButtonStyle.Primary)
                );

            await interaction.reply({ embeds: [embed], components: [row], ephemeral: false });
        } else if (commandName === 'ticket-setup') {
            const embed = new EmbedBuilder()
                .setTitle('Create a Ticket')
                .setDescription('Need help or have an issue to report? Click the button below to create a ticket and provide the details of your problem. Our dedicated staff team will assist you as soon as possible.\n\n' +
                    'Please be patient and avoid spamming. We aim to respond promptly, but some issues may take time to resolve. Remember to respect the server rules and treat our staff and other members with courtesy.\n\n' +
                    'For non-gamebreaking bugs and suggestions, please use the appropriate sections in our forum instead of creating a ticket. This helps us manage and address your input more effectively.\n\n' +
                    'Thank you for your understanding and cooperation!')
                .setColor(0x00FF00); // Optional: Set the color of the embed

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('create-ticket')
                        .setLabel('Create Ticket')
                        .setStyle(ButtonStyle.Primary)
                );

            await interaction.channel.send({ embeds: [embed], components: [row] });
            await interaction.reply({ content: 'Ticket system setup complete.', ephemeral: true });
        } else if (commandName === 'create-embed') {
            const title = interaction.options.getString('title') || '';
            const description = interaction.options.getString('description') || '';

            const embed = new EmbedBuilder()
                .setTitle(title)
                .setDescription(description)
                .setColor(0x00FF00) // Optional: Set the color of the embed
                .setTimestamp()
                .setFooter({ text: `Sent by ${interaction.user.tag}` });

            await interaction.channel.send({ embeds: [embed] });
            await interaction.reply({ content: 'Embedded message sent.', ephemeral: true });
        }
    } else if (interaction.isButton()) {
        if (interaction.customId === 'start-giveaway-setup') {
            const modal = new ModalBuilder()
                .setCustomId('giveaway-setup-modal')
                .setTitle('Giveaway Setup')
                .addComponents(
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('giveaway-title')
                            .setLabel('Giveaway Title')
                            .setStyle(TextInputStyle.Short)
                            .setPlaceholder('Enter the title of the giveaway')
                            .setRequired(true)
                    ),
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('giveaway-description')
                            .setLabel('Giveaway Description')
                            .setStyle(TextInputStyle.Paragraph)
                            .setPlaceholder('Enter the description of the giveaway')
                            .setRequired(true)
                    ),
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('giveaway-duration')
                            .setLabel('Giveaway Duration (in minutes)')
                            .setStyle(TextInputStyle.Short)
                            .setPlaceholder('Enter the duration of the giveaway in minutes')
                            .setRequired(true)
                    )
                );

            await interaction.showModal(modal);
        } else if (interaction.customId === 'create-ticket') {
            const modal = new ModalBuilder()
                .setCustomId('ticket-modal')
                .setTitle('Create a Ticket')
                .addComponents(
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('ticket-reason')
                            .setLabel('Reason for Ticket')
                            .setStyle(TextInputStyle.Short)
                            .setPlaceholder('Describe the reason for your ticket')
                            .setRequired(true)
                    ),
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('ticket-description')
                            .setLabel('Detailed Description')
                            .setStyle(TextInputStyle.Paragraph)
                            .setPlaceholder('Provide more details about your issue')
                            .setRequired(true)
                    )
                );

            await interaction.showModal(modal);
        } else if (interaction.customId.startsWith('close-ticket-user:')) {
            const [, channelId] = interaction.customId.split(':');
            const ticketChannel = interaction.guild.channels.cache.get(channelId);

            if (ticketChannel) {
                const confirmButton = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`confirm-close:${channelId}`)
                            .setLabel('Confirm')
                            .setStyle(ButtonStyle.Danger),
                        new ButtonBuilder()
                            .setCustomId('cancel-close')
                            .setLabel('Cancel')
                            .setStyle(ButtonStyle.Secondary)
                    );

                await interaction.reply({ content: 'Are you sure you want to close this ticket?', components: [confirmButton], ephemeral: true });
            }
        } else if (interaction.customId.startsWith('confirm-close:')) {
            const [, channelId] = interaction.customId.split(':');
            const ticketChannel = interaction.guild.channels.cache.get(channelId);

            if (ticketChannel) {
                const archiveChannel = interaction.guild.channels.cache.find(channel => channel.name === 'ticket-archives');

                let messages = await ticketChannel.messages.fetch();
                messages = messages.sort((a, b) => a.createdTimestamp - b.createdTimestamp);
                const messageContent = messages.map(m => `${m.author.tag}: ${m.content}`).join('\n');
                const archiveEmbed = new EmbedBuilder()
                    .setTitle(`Ticket from ${interaction.user.username}`)
                    .setDescription(messageContent)
                    .setColor(0x00FF00); // Optional: Set the color of the embed

                await archiveChannel.send({ embeds: [archiveEmbed] });

                await ticketChannel.delete();
                await interaction.reply({ content: 'Ticket closed and archived.', ephemeral: true });
            }
        } else if (interaction.customId === 'cancel-close') {
            await interaction.reply({ content: 'Ticket closure cancelled.', ephemeral: true });
        } else if (interaction.customId.startsWith('close-ticket-staff:')) {
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                return interaction.reply({ content: 'You do not have permission to use this button.', ephemeral: true });
            }

            const [, channelId] = interaction.customId.split(':');
            const modal = new ModalBuilder()
                .setCustomId(`close-ticket-staff-modal:${channelId}`)
                .setTitle('Close Ticket')
                .addComponents(
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('ticket-topic')
                            .setLabel('Admin Topic')
                            .setStyle(TextInputStyle.Short)
                            .setPlaceholder('Enter the ticket topic (optional)')
                            .setRequired(false)
                    ),
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('ticket-summary')
                            .setLabel('Admin Summary')
                            .setStyle(TextInputStyle.Paragraph)
                            .setPlaceholder('Enter a short summary (optional)')
                            .setRequired(false)
                    )
                );

            await interaction.showModal(modal);
        } else if (interaction.customId === 'enter-giveaway') {
            const giveawayId = interaction.message.id;

            const giveaway = client.giveaways[giveawayId];
            if (!giveaway) {
                return interaction.reply({ content: 'This giveaway no longer exists.', ephemeral: true });
            }

            giveaway.entrants.add(interaction.user.id);

            // Update the participant counter
            const participantCount = giveaway.entrants.size;

            const embed = new EmbedBuilder()
                .setTitle(giveaway.title)
                .setDescription(`${giveaway.description}\n\nTo participate in this giveaway, click the button below.\n\nParticipants: ${participantCount}`)
                .setColor(0x00FF00)
                .setTimestamp()
                .setFooter({ text: `Started by ${giveaway.startedBy}` });

            await interaction.update({ embeds: [embed], components: interaction.message.components });
        }
    } else if (interaction.isModalSubmit()) {
        if (interaction.customId === 'ticket-modal') {
            const reason = interaction.fields.getTextInputValue('ticket-reason');
            const description = interaction.fields.getTextInputValue('ticket-description');
            const categoryId = '1244658429117595769'; // Replace with your category ID

            const ticketChannel = await interaction.guild.channels.create({
                name: `ticket-${interaction.user.username}`,
                type: ChannelType.GuildText,
                parent: categoryId,
                permissionOverwrites: [
                    {
                        id: interaction.guild.id,
                        deny: ['ViewChannel'],
                    },
                    {
                        id: interaction.user.id,
                        allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'],
                    },
                    {
                        id: interaction.guild.roles.cache.find(role => role.name === 'ticket-admin').id, // Replace with your staff role name
                        allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'],
                    }
                ],
            });

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`close-ticket-user:${ticketChannel.id}`)
                        .setLabel('Close Ticket')
                        .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setCustomId(`close-ticket-staff:${ticketChannel.id}`)
                        .setLabel('Close Ticket (Staff)')
                        .setStyle(ButtonStyle.Primary)
                );

            const ticketAdminRole = interaction.guild.roles.cache.find(role => role.name === 'ticket-admin'); // Replace with your staff role name
            const embed = new EmbedBuilder()
                .setTitle('Ticket Information')
                .setDescription(`**Reason:** ${reason}\n**Description:**\n${description}\n\n**Please be patient for a staff member to assist you.**`)
                .setColor(0x00FF00); // Optional: Set the color of the embed

            await ticketChannel.send({
                content: `${ticketAdminRole}`,
                embeds: [embed],
                components: [row]
            });
            await interaction.reply({ content: `Ticket created: ${ticketChannel}`, ephemeral: true });
        } else if (interaction.customId.startsWith('close-ticket-staff-modal:')) {
            const [, channelId] = interaction.customId.split(':');
            const ticketChannel = interaction.guild.channels.cache.get(channelId);

            if (ticketChannel) {
                const topic = interaction.fields.getTextInputValue('ticket-topic') || 'No topic provided';
                const summary = interaction.fields.getTextInputValue('ticket-summary') || 'No summary provided';
                const archiveChannel = interaction.guild.channels.cache.find(channel => channel.name === 'ticket-archives');

                let messages = await ticketChannel.messages.fetch();
                messages = messages.sort((a, b) => a.createdTimestamp - b.createdTimestamp);
                const messageContent = messages.map(m => `${m.author.tag}: ${m.content}`).join('\n');

                const archiveEmbed = new EmbedBuilder()
                    .setTitle(`Ticket from ${interaction.user.username}`)
                    .setDescription(messageContent)
                    .addFields(
                        { name: 'Admin Topic', value: topic },
                        { name: 'Admin Summary', value: summary }
                    )
                    .setColor(0x00FF00); // Optional: Set the color of the embed

                await archiveChannel.send({ embeds: [archiveEmbed] });

                await ticketChannel.delete();
                await interaction.reply({ content: 'Ticket closed and archived.', ephemeral: true });
            }
        } else if (interaction.customId === 'giveaway-setup-modal') {
            const title = interaction.fields.getTextInputValue('giveaway-title');
            const description = interaction.fields.getTextInputValue('giveaway-description');
            const duration = parseInt(interaction.fields.getTextInputValue('giveaway-duration'), 10) * 60 * 1000;

            const giveawayRole = interaction.guild.roles.cache.find(role => role.name === 'giveaway');

            const embed = new EmbedBuilder()
                .setTitle(`Giveaway: ${title}`)
                .setDescription(`${description}\n\nTo participate in this giveaway, click the button below.\n\nParticipants: 0`)
                .setColor(0x00FF00)
                .setTimestamp()
                .setFooter({ text: `Started by ${interaction.user.tag}` });

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('enter-giveaway')
                        .setLabel('Enter Giveaway')
                        .setStyle(ButtonStyle.Primary)
                );

            const giveawayChannel = interaction.guild.channels.cache.get('1244704256640946307');
            const giveawayMessage = await giveawayChannel.send({ content: `${giveawayRole}`, embeds: [embed], components: [row] });

            const giveawayData = {
                messageId: giveawayMessage.id,
                title: title,
                description: description,
                duration: duration,
                entrants: new Set(),
                startedBy: interaction.user.tag
            };

            client.giveaways = client.giveaways || {};
            client.giveaways[giveawayMessage.id] = giveawayData;

            setTimeout(async () => {
                await endGiveaway(giveawayMessage.id);
            }, duration);

            await interaction.reply({ content: 'Giveaway setup complete.', ephemeral: true });
        }
    }
});

async function endGiveaway(giveawayId) {
    const giveaway = client.giveaways[giveawayId];
    if (!giveaway) {
        return;
    }

    const giveawayChannel = client.channels.cache.get('1244704256640946307');
    const giveawayMessage = await giveawayChannel.messages.fetch(giveawayId);

    const participants = Array.from(giveaway.entrants);
    let winner = 'No participants';

    if (participants.length > 0) {
        const winnerId = participants[Math.floor(Math.random() * participants.length)];
        winner = `<@${winnerId}>`;
    }

    const embed = new EmbedBuilder()
        .setTitle(`Giveaway Ended: ${giveaway.title}`)
        .setDescription(`${giveaway.description}\n\nWinner: ${winner}`)
        .setColor(0x00FF00)
        .setTimestamp()
        .setFooter({ text: `Ended by ${client.user.tag}` });

    await giveawayMessage.edit({ content: 'The giveaway has ended!', embeds: [embed], components: [] });

    const teamRole = giveawayMessage.guild.roles.cache.find(role => role.name === 'TEAM');
    const resultChannel = client.channels.cache.get('1242205779164008559');
    await resultChannel.send({ content: `${teamRole}\nThe giveaway has ended! Winner: ${winner}` });

    delete client.giveaways[giveawayId];
}

// Create a custom temporary voice channel
client.on('voiceStateUpdate', async (oldState, newState) => {
    // Check if a user joined the "Join->Temp-VC" channel
    if (newState.channelId && newState.channel.name === 'Join->Temp-VC') { // Replace with the appropriate channel name
        const guild = newState.guild;
        const member = newState.member;
        const categoryId = '1244650919702823072'; // Replace with your category ID

        try {
            const tempChannel = await guild.channels.create({
                name: `VC ${member.user.username}`,
                type: ChannelType.GuildVoice,
                parent: categoryId,
            });

            await member.voice.setChannel(tempChannel);
            console.log(`Created temporary channel ${tempChannel.name} for ${member.user.tag}`);
        } catch (error) {
            console.error(`Failed to create temporary channel: ${error}`);
        }
    }

    // Check if a user left a voice channel and it is now empty
    if (oldState.channelId) {
        const oldChannel = oldState.channel;
        if (oldChannel.members.size === 0 && oldChannel.name.startsWith('VC ')) {
            try {
                await oldChannel.delete();
                console.log(`Deleted temporary channel ${oldChannel.name} because it was empty.`);
            } catch (error) {
                console.error(`Failed to delete temporary channel: ${error}`);
            }
        }
    }
});

client.login(token);
