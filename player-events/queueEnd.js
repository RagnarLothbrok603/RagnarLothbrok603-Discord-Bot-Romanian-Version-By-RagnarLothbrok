module.exports = (bot, message, queue) => {
    const {MessageEmbed} = require('discord.js')
    const embed = new MessageEmbed()
    .setColor(bot.color)
    .setDescription(` Muzica sa oprit deoarece nu mai există muzică în coadă !`)
    message.channel.send(embed);

};