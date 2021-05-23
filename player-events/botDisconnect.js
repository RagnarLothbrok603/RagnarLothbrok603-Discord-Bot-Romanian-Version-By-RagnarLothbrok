module.exports = (bot, message, queue) => {

    const { MessageEmbed } = require('discord.js') 
    const embed = new   MessageEmbed()
    .setColor(bot.color)
    .setDescription('Am fost deconectat din canalul voice.')

    message.channel.send(embed);

};
