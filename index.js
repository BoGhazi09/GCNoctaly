const {
  Client,
  GatewayIntentBits,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  Events,
  REST,
  Routes,
  SlashCommandBuilder
} = require('discord.js');

const OWNER_ROLE_ID = "1478554422303916185";

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// register command
client.once(Events.ClientReady, async () => {
  console.log(`Logged in as ${client.user.tag}`);

  const commands = [
    new SlashCommandBuilder()
      .setName('sendmessage')
      .setDescription('Send a message')
  ].map(cmd => cmd.toJSON());

  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

  await rest.put(
    Routes.applicationGuildCommands(
      process.env.CLIENT_ID,
      process.env.GUILD_ID
    ),
    { body: commands }
  );

  console.log("Ready");
});

// interactions
client.on(Events.InteractionCreate, async (interaction) => {

  try {

    // slash command
    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === 'sendmessage') {

        if (!interaction.member.roles.cache.has(OWNER_ROLE_ID)) {
          return interaction.reply({
            content: "No permission",
            ephemeral: true
          });
        }

        const modal = new ModalBuilder()
          .setCustomId('sendModal')
          .setTitle('Send Message');

        const input = new TextInputBuilder()
          .setCustomId('message')
          .setLabel('Enter message')
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true);

        modal.addComponents(
          new ActionRowBuilder().addComponents(input)
        );

        return await interaction.showModal(modal);
      }
    }

    // modal submit
    if (interaction.isModalSubmit()) {
      if (interaction.customId === 'sendModal') {

        await interaction.deferReply({ ephemeral: true });

        const message = interaction.fields.getTextInputValue('message');

        const channel = interaction.channel;

        // webhook
        const webhooks = await channel.fetchWebhooks();
        let webhook = webhooks.find(w => w.owner.id === client.user.id);

        if (!webhook) {
          webhook = await channel.createWebhook({
            name: "Noctaly"
          });
        }

        await webhook.send({
          content: message,
          username: "Noctaly",
          avatarURL: client.user.displayAvatarURL()
        });

        await interaction.editReply("Sent!");
      }
    }

  } catch (err) {
    console.error(err);

    if (interaction.deferred || interaction.replied) {
      interaction.editReply("Error happened");
    } else {
      interaction.reply({ content: "Error happened", ephemeral: true });
    }
  }

});

client.login(process.env.TOKEN);

process.on("unhandledRejection", console.error);
process.on("uncaughtException", console.error);
