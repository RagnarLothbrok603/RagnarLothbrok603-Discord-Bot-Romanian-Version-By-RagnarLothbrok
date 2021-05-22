module.exports = (bot, message, query) => {
    const { MessageEmbed } = require('discord.js')
   
    const embed = new MessageEmbed()
    .setColor(bot.color)
    .setDescription(`Nu am gasit nici un rezultat pe YouTube pentru ${query} !`)
    message.channel.send(embed);

};