const Discord = require('discord.js')
const bot = new Discord.Client();
const { token, prefix, main_color: color, bot_owners: owners, counter_number_reach, ignore_channel_id, ignore_channel_toggle, xp_system_levelrate, xp_system_rate, xp_system_toggle, report_system_channel, mod_logs_color, report_system_toggle, suggest_system_channel, suggest_system_toggle, status_type, command_cooldown_time, command_cooldown_toggle, anti_self_bot_message, anti_selfbot_toggle, mod_logs_channel, mod_logs_toggle, bot_name, anti_bad_word_toggle, anti_bad_words, welcome_message_channel, welcome_message_server, welcome_message_enabled, status_url, bot_status, status_change_interval } = require('./config.json')
const { MessageEmbed } = require('discord.js')
const fs = require('fs')
const { Player } = require('discord-player');
const ms = require('ms');
const noWords = anti_bad_words
let userlogs = require('./database/user-logs.json')
const superagent = require('superagent')
const api = require('covidapi');
let warns = JSON.parse(fs.readFileSync('./database/warns.json', 'utf8'));
const fetch = require('node-fetch')
const { Buffer } = require('buffer');
const xp = require('./database/xp.json')
const axios = require('axios');
const { config } = require('process');
let count = 0;
const player = new Player(bot);
bot.player = player
bot.afk = new Map();
bot.locked = new Map();
const cooldown = new Set();


bot.on("ready", () => {
    console.log(`Pregatit ${bot.user.username}`)
    function pickStatus() {
        const status = bot_status
        let Status = Math.floor(Math.random() * status.length);

        bot.user.setActivity(status[Status], {
            type: status_type,
            url: status_url
        })
    }

    setInterval(pickStatus, status_change_interval * 1000)
})


fs.readdir('./player-events/', (err, files) => {
    if (err) return console.color(err);
    files.forEach(file => {
        const event = require(`./player-events/${file}`);
        let eventName = file.split(".")[0];
        console.log(`Se incarca fisierele ${eventName}`);
        bot.player.on(eventName, event.bind(null, bot));
    });
});
bot.mcount = 0
bot.on("guildMemberAdd", (member) => {
    if (welcome_message_enabled === true) {
        console.log("Membru alaturat!")
        if (member.guild.id !== welcome_message_server) return;
        bot.mcount++
        console.log(`Nou membru alaturat! Acum avem ${bot.mcount} alaturati!`);
        bot.guilds.cache.get(welcome_message_server).channels.cache.get(welcome_message_channel).send(`Bun venit **<@${member.id}>** lui **${member.guild.name}**`)
    } else { }
})



bot.on("message", message => {
    if (require('./config.json').counter === true) {
        if (count !== counter_number_reach) {
            if (message.author.id === bot.user.id) return;
            const takeAway = Math.floor(Math.random() * 40);
            if (message.channel.id !== require('./config.json').counter_channel) return;
            if (message.content.includes(count)) {
                count++
                if (count === counter_number_reach) {
                    const doneEmbed = new MessageEmbed()
                        .setColor(color)
                        .setDescription(`Felicitari! Numaratoare de \`${counter_number_reach}\` a fost atinsa!`)
                        .setFooter("Nu voi mai numara..")

                    message.channel.send(doneEmbed)
                }

                let Num = Math.floor(Math.random() * 150);
                const curse = Math.floor(Math.random() * 70)
                if (Num === 50) {
                    const bonusEmbed = new MessageEmbed()
                        .setColor(color)
                        .setTitle("Tocmai ai gasit o superputere!")
                        .setDescription(`Am adaugat ${takeAway} la numaratoare! \n \n Incep sa numar de la ${count + takeAway}`);
                    console.log('Takeaway este ' + takeAway)
                    message.channel.send(`<@${message.author.id}> Tocmai ai gasit o superputere!`, bonusEmbed)
                    console.log("Inainte: " + count)
                    count += takeAway
                    console.log("Dupa: " + count)
                }
                if (Num === 1) {
                    const curseEmbed = new MessageEmbed()
                        .setColor()
                        .setDescription(`Ai găsit un blestem! \n \n Inlatural ${curse} \n Începeți să numărați de la ${count - curse}`)
                    // message.channel.send(`U found a curse! \n \n Taking away ${curse} \n Start counting from ${count - curse}`);
                    count -= curse
                    message.channel.send(curseEmbed)
                }

            } else {
                message.delete();
            }
        } else { }
    } else { }

})

bot.on("message", message => {
    if (require('./config.json').xp_system_toggle === true) {
        if (message.author.bot) return;
        if (!message.content.includes(`${prefix}buy`)) {
            let xpAdd = Math.floor(Math.random() * 7) + xp_system_rate;

            if (!xp[message.author.id]) {
                xp[message.author.id] = {
                    xp: 0,
                    level: 1
                }
            }

            let curxp = xp[message.author.id].xp
            let curlvl = xp[message.author.id].level
            let nxtLvl = xp[message.author.id].level * xp_system_levelrate
            xp[message.author.id].xp = curxp + xpAdd;
            if (nxtLvl <= xp[message.author.id].xp) {
                xp[message.author.id].level = curlvl + 1;
                let lvlup = new MessageEmbed()
                    .setColor(color)
                    .setTitle("Level up!")
                    .addField("Nivel nou", curlvl + 1)

                message.reply(lvlup).then(msg => msg.delete({ timeout: '7000' }))
            }
            fs.writeFile('./database/xp.json', JSON.stringify(xp), (err) => {
                if (err) console.log(err);
            });
        } else {
            console.log("Buy command")
        }
    } else { }
})


bot.on("message", async message => {
    if (bot.afk.has(message.author.id)) {
        bot.afk.delete(message.author.id);
        try {
            if (message.member.nickname.includes("[AFK]")) {
                if (message.member.manageable) {
                    message.member.setNickname(`${message.member.user.username.substring("[AFK]")}`)
                }
            }
        } catch (e) { }
        message.channel.send(`Bine ai revenit <@${message.member.id}>! te-am scos de pe AFK`)
    }
    if (message.mentions.users.first()) {
        if (bot.afk.has(message.mentions.users.first().id)) {
            if (message.author.id === bot.user.id) return;
            message.reply(`${message.mentions.users.first().username} este Afk (Timp: ${(Date.now) - bot.afk.date}): ${bot.afk.get(message.mentions.users.first().id).reason}`);
        }
    }
    let badwordIs = false;
    var i
    for (i = 0; i < noWords.length; i++) {

        if (message.content.toLowerCase().includes(noWords[i].toLowerCase())) badwordIs = true;
    }
    if (anti_bad_word_toggle === true) {
        if (badwordIs) {
            message.delete()
            return message.reply("Ai grija la limbaj!");
        } else { }
    }
    const whitelistee = require('./config.json').whitelisted
    let wlisted = false
    whitelistee.forEach(id => {
        if (message.author.id === id) wlisted = true;
    })
    if (anti_selfbot_toggle === true) {
        if (message.embeds.length) {
            if (!message.author.bot) {
                if (wlisted === true) return;
                message.delete().then(() => {
                    return message.reply(anti_self_bot_message);
                })
            }
        }
    }

    const { content } = message;

    if (content.includes('discord.gg/')) {
        if (wlisted === true) return;
        if (!owners.includes(message.author.id)) {
            message.delete().then(() => {
                message.reply("Fără publicitate personală!");
            })
        } else { }
    }
    if (content.includes('https')) {
        if (wlisted === true) return;
        if (!owners.includes(message.author.id)) {
            message.delete().then(() => {
                message.reply("Fără publicitate personală!");
            })
        } else { }
    }
    if (content.includes('.com')) {
        if (wlisted === true) return;
        if (!owners.includes(message.author.id)) {
            message.delete().then(() => {
                message.reply("Fără publicitate personală!");
            })
        } else { }
    }

    const meEmbed = new MessageEmbed()
        .setColor(color)
        .setDescription(`Salut! Eu sunt ${bot_name} , Prefixul meu este \`${require('./config.json').prefix}\` | Tasteaza \`${require('./config.json').prefix}help\` pentru o lista cu toate comenzile mele!`)

    if (message.mentions.users.has(bot.user.id)) return message.channel.send(meEmbed)


    if (!message.content.startsWith(prefix) || message.author.bot) return;
    if (message.channel.type === 'dm') return message.channel.send("Nu puteți utiliza comenzi în DM!")
    const blacklistedUser = require('./config.json').blacklisted
    let listed = false
    blacklistedUser.forEach(id => {
        if (message.author.id === id) listed = true
    })

    if (listed === true) return message.reply("Esti pe blacklist de catre Bot!")

    const aboveRole = new MessageEmbed()
        .setColor(color)
        .setDescription('Aceasta persoana are un rol mai mare ca al tau!')

    const userWhitelisted = new MessageEmbed()
        .setColor(color)
        .setDescription("Utilizatorul respectiv este pe lista albă! Nu pot face asta!");

    const userStaff = new MessageEmbed()
        .setColor(color)
        .setDescription('Aceasta persoana este mod/admin, I can\'t do that')

    const noMusicChannel = new MessageEmbed()
        .setColor(color)
        .setDescription("Nu esti intr-un canal voice.");

    const userOwner = new MessageEmbed()
        .setColor(color)
        .setDescription("Aceasta persoana este owerului Botului! Nu pot  face acest lucru.")

    const noError = new MessageEmbed()
        .setColor(color)
        .setDescription('S-a produs o eroare, dar nu imi pot da seama exact.');

    const noMember = new MessageEmbed()
        .setColor(color)
        .setDescription('Nici un membru nu a fost mentionat, Incearca sa mentionezi un membru.');

    const noChannel = new MessageEmbed()
        .setColor(color)
        .setDescription('Nu a fost mentionat nici un canal.');

    const noPerms = new MessageEmbed()
        .setColor(color)
        .setDescription('Lipsesc permisiunile.')
    if (!message.content.startsWith(prefix) || message.author.bot) return

    const args = message.content.slice(prefix.length).trim().split(/ +/g)
    const command = args.shift().toLocaleLowerCase();

    if (!message.guild.me.hasPermission("ADMINISTRATOR")) return message.channel.send('I am Missing `ADMINISTRATOR` Permissions.. ')

    if (command_cooldown_toggle === true) {

        if (cooldown.has(message.author.id)) {
            return message.reply("Un pic prea rapid.")
        }
        if (!owners.includes(message.author.id)) {
            cooldown.add(message.author.id)

            setTimeout(() => {
                cooldown.delete(message.author.id)
            }, command_cooldown_time * 1000)
        }
    } else { }

    if (ignore_channel_toggle === true) {
        if (ignore_channel_id.includes(message.channel.id)) {
            message.member.send(`Nu pot folosi comenzi in <#${message.channel.id}>`)
            return;
        }
    }

    if (command === 'help') {
        const helpEmbed = new MessageEmbed()
            .setColor(color)
            .setTitle("Meniu de ajutor")
            .setDescription(`Meniu de ajutor pentru ${bot_name}`)
            .addField("🛠 Moderare - (14)", "`kick` `ban` `mute` `unmute` `hackban` `unban` `nuke` `clean` `purge` `softban` `warn` `delwarn` `warnings` `clearwarns`")
            .addField("😂 Fun - (12)", "`hack` `say` `gay` `token` `calc` `covid` `meme` `dog` `cat` `ascii` `docs` `roast`")
            .addField("🔰 Management - (9)", "`invites` `announce` `slowmode` `lock` `modlogs` `unlock` `dm` `owners` `eval`")
            .addField("🎶 Music - (7)", "`play`, `join` `leave` `stop` `pause` `loop` `np`")
            .addField('📑 Informatii - (4)', "`stats` `membercount` `uptime` `config`")
            .addField("💎 Diverse (9)", "`snipe` `embed` `ping` `whois` `av` `suggest` `report` `id` `afk`")
            .addField("XP", "`level`")

        message.channel.send(helpEmbed)
    }

    if (command === 'clearwarns') {
        if (message.member.hasPermission("MANAGE_GUILD") || owners.includes(message.author.id)) {

            const user = message.mentions.users.first();
            if (!user) return message.channel.send(noMember);

            const noWarns = new MessageEmbed()
            .setColor(color)
            .setDescription("Aceasta persoana nu are nici un warning")

            if (!warns[user.id]) {
                return message.channel.send(noWarns);
            }

            let warnss = warns[user.id].warns

            const clearedEmbed = new MessageEmbed()
            .setColor(color)
            .setDescription(`Am sters \`${warnss}\` warninguri de la acea persoana.`)

            message.channel.send(clearedEmbed)

            warns[user.id].warns -= warnss;

            fs.writeFile('./database/warns.json', JSON.stringify(warns), (err) => { if (err) console.log(err)})

            

        } else return message.channel.send(noPerms)
    }

    if (command === 'config') {
        let xpsystem = "";
        if (xp_system_toggle === true) xpsystem = 'Enabled'
        if (xp_system_toggle === false) xpsystem = 'Disabled'
        const configEmbed = new MessageEmbed()
            .setColor(color)
            .setAuthor(message.author.username, message.author.displayAvatarURL())
            .setDescription(`Setari de configuratie pentru ${bot_name}`)
            .addField("Anti self bot", anti_selfbot_toggle, true)
            .addField('Xp Sistem', xpsystem, true)
            .addField("Cooldown comanda", command_cooldown_toggle, true)
            .addField("Loguri", mod_logs_toggle, true)
            .addField('Mesaj de bun venit', welcome_message_enabled, true)
            .addField("Whitelisted", require('./config.json').whitelisted.join(", "), true)
            .addField("Blacklisted", blacklistedUser.join(" , "), true)
            .addField("Report Sistem", report_system_toggle, true)
            .addField("Sugest Sistem", suggest_system_toggle, true)
            .addField("Canale Ignorate", ignore_channel_toggle, true)
            .addField("Status Type", status_type, true)
            .addField("Community Counter", require('./config.json').counter, true)
            .addField("Bot Prefix", prefix, true)
            .addField("Bot owners", owners.join(", "), true)
            .addField('Mute role', `<@&${require('./config.json').mute_role}>`, true)

            message.channel.send(configEmbed)
    }

    if (command === 'eval') {
        if (!args[0]) return message.reply("Introdu codul pentru a fi executat!");

        try {
            // 
            const toEval = args.join(" ");
            const evalulated = eval(toEval);


        } catch (e) {
            message.channel.send('Forma incorecta de **javascript** cod ' + '\n\n `' + e + '`');
        }
    }

    if (command === 'afk') {
        bot.afk.set(message.author.id, {
            guild: message.guild.id,
            date: (Date.now),
            reason: args.join(" ") || "Fara nici un motiv."
        })
        message.reply("Te-am setat ca si AFK.").then(() => {
            if (message.member.manageable) {
                message.guild.members.cache.find(mm => mm.id === message.member.id).setNickname(`[AFK]${message.member.user.username}`);
            } else { }
        })
    }



    if (command === 'uptime') {
        var seconds = parseInt((bot.uptime / 1000) & 60),
            minutes = parseInt((bot.uptime / (1000 * 60)) % 60),
            hours = parseInt((bot.uptime / (1000 * 60 * 60)) % 24);
        hours = (hours < 10) ? "0" + hours : hours;
        minutes = (minutes < 10) ? "0" + minutes : minutes;
        seconds = (seconds < 10) ? "0" + seconds : seconds;

        let embed = new MessageEmbed()
            .setColor(color)
            .setDescription(`⌛Ore: ${hours}\n\n⏱Minute: ${minutes}\n\n⌚Secunde: ${seconds}`)
        message.channel.send(embed)

    }

    if (command === 'owners') {
        if (message.member.hasPermission("MANAGE_GUILD") || owners.includes(message.author.id)) {
            owners.map(owner => message.channel.send(`<@${owner}>`))
        } else return message.channel.send(noPerms);
    }

    if (command === 'level') {
        if (require('./config.json').xp_system_toggle === true) {
            if (!message.mentions.users.first()) {
                if (!xp[message.author.id]) {
                    xp[message.author.id] = {
                        xp: 0,
                        level: 1
                    }
                }
                let curxp = xp[message.author.id].xp
                let curlvl = xp[message.author.id].level

                let lvlEmbed = new MessageEmbed()
                    .setAuthor(message.author.username, message.author.displayAvatarURL())
                    .setColor(color)
                    .addField("Nivel", curlvl, true)
                    .addField("XP", curxp, true)

                message.channel.send(lvlEmbed)
            } else {
                try {
                    const user = message.mentions.users.first();

                    if (!xp[user.id]) {
                        xp[message.author.id] = {
                            xp: 0,
                            level: 1
                        }
                    }
                    let curxp = xp[user.id].xp
                    let curlvl = xp[user.id].level

                    let lvlEmbed = new MessageEmbed()
                        .setAuthor(user.username, user.displayAvatarURL())
                        .setColor(color)
                        .addField("Nivel", curlvl, true)
                        .addField("XP", curxp, true)

                    message.channel.send(lvlEmbed)
                } catch (e) {
                    message.channel.send("Aceasta persoana nu este in data mea de baze, inseamna ca persoana nu a fost introdusa.")
                }
            }
        } else {
            return message.channel.send("Sistemul de XP este dezactivat.")
        }
    }




    if (command === 'delwarn') {
        if (message.member.hasPermission("MANAGE_GUILD") || owners.includes(message.author.id)) {
            const user = message.mentions.users.first();
            if (!user) return message.channel.send(noMember);

            const ownUser = new MessageEmbed()
                .setColor(color)
                .setDescription("Nu iti poti sterge singur warningurile.")

            if (user.id === message.author.id) return message.channel.send(ownUser)

            const noWarns = new MessageEmbed()
                .setColor(color)
                .setDescription("Aceasta persoana nu are nici un warning.")

            if (!warns[user.id]) {
                return message.channel.send(noWarns)
            }

            warns[user.id].warns--

            const delWarned = new MessageEmbed()
                .setColor(color)
                .setDescription(`Am sters \`1\` warninguri de la <@${user.id}>`)

            message.channel.send(delWarned)

            fs.writeFile('./database/warns.json', JSON.stringify(warns), (err) => {
                if (err) console.log(err)
            })

        } else return message.channel.send(noPerms)
    }

    if (command === 'warn') {
        if (message.member.hasPermission("MANAGE_MESSAGES") || owners.includes(message.author.id)) {
            const user = message.mentions.members.first();
            if (!user) return message.channel.send(noMember);
            if (user.hasPermission("MANAGE_MESSAGES")) return message.channel.send(userStaff)

            let reason = args.slice(1).join(" ");
            if (!reason) reason = 'Fara nici un motiv';

            if (!warns[user.id]) {
                warns[user.id] = {
                    warns: 0,
                    reason: "None"
                }
            }

            warns[user.id].warns++



            const warnedEmbed = new MessageEmbed()
                .setColor(color)
                .setDescription(`_<@${user.id}> a fost avertizat_ | ${reason}`)

            message.channel.send(warnedEmbed)
            fs.writeFile('./database/warns.json', JSON.stringify(warns), (err) => {
                if (err) console.log(err)
            })
            if (!userlogs[user.id]) {
                userlogs[user.id] = {
                    logs: 0
                }
            }
            userlogs[user.id].logs++
            fs.writeFile('./database/user-logs.json', JSON.stringify(userlogs), (err) => {
                if (err) console.log(err)
            })
        } else {
            return message.channel.send(noPerms)
        }
    }

    if (command === 'modlogs') {
        if (message.member.hasPermission("MANAGE_MESSAGES") || owners.includes(message.author.id)) {
            const user = message.mentions.users.first();
            if (!user) return message.channel.send(noMember)

            
            try {
                const modlogsEmbed = new MessageEmbed()
                .setColor(color)
                .setDescription(`<@${user.id}> has ${userlogs[user.id].logs || "None"} total modlogs cases.`)

            message.channel.send(modlogsEmbed);
            } catch (e) {
                const modlogsEmbed = new MessageEmbed()
                .setColor(color)
                .setDescription(`<@${user.id}> has 0 total modlogs cases.`)

            message.channel.send(modlogsEmbed);
            }
        } else {
            return message.channel.send(noPerms)
        }
    }

    if (command === 'warnings') {
        if (message.member.hasPermission("MANAGE_MESSAGES") || owners.includes(message.author.id)) {
            const user = message.mentions.users.first();
            if (!user) return message.channel.send(noMember);

            const warningsEmbed = new MessageEmbed()
                .setColor(color)
                .setAuthor(user.username, user.displayAvatarURL())
                .setDescription(`Warnings for <@${user.id}> \n \n Warns: ${warns[user.id].warns || 'None'}`)

            message.channel.send(warningsEmbed)

        } else {
            return message.channel.send(noPerms)
        }


    }


    if (command === 'report') {
        if (report_system_toggle === true) {
            const userBot = new MessageEmbed()
                .setColor(color)
                .setDescription("Acea personana este un Bot, Nu poti raporta botii!")
            const reportUser = message.mentions.users.first();
            if (!reportUser) return message.channel.send(noMember);
            if (reportUser.bot) return message.channel.send(userBot)
            const reportReason = args.slice(1).join(" ");

            const noReportReason = new MessageEmbed()
                .setColor(color)
                .setDescription("Nu ai mentionat nici un motiv pentru report.")

            if (!reportReason) return message.channel.send(noReportReason);

            const reportEmbed = new MessageEmbed()
                .setColor(color)
                .setTimestamp()
                .setAuthor(reportUser.username, reportUser.displayAvatarURL())
                .setFooter(message.guild.name, message.guild.iconURL())
                .setDescription(`**Membru:** ${reportUser.username} (${reportUser.id})
                **Raportat de:** ${message.member.user.username} (${message.member.id})
                **Raportat in:** <#${message.channel.id}> (${message.channel.id})
                **Motiv:** ${args.slice(1).join(" ")}`)


            const reportRecived = new MessageEmbed()
                .setColor(color)
                .setDescription("Report primit! Te rog sa astepti pana cand vom verifica.")

            message.channel.send(reportRecived);

            bot.channels.cache.get(report_system_channel).send(reportEmbed)


        } else {
            message.channel.send("Sistemul de report este dezactivat.")
        }
    }

    if (command === 'suggest') {
        if (suggest_system_toggle === true) {
            const suggestion = args.join(" ");
            const noSuggestion = new MessageEmbed()
                .setColor(color)
                .setDescription("Nu a fost adaugata nici o sugestie.")
            if (!suggestion) return message.channel.send(noSuggestion)
            const suggestEmbed = new MessageEmbed()
                .setColor(color)
                .setAuthor(message.author.tag + ' a facut o sugestie', message.author.displayAvatarURL())
                .setDescription(suggestion)
                .setTimestamp()

            const suggestionSent = new MessageEmbed()
                .setColor(color)
                .setDescription("Sugestia ta a fost trimisa cu succes.")

            message.channel.send(suggestionSent)

            bot.channels.cache.get(suggest_system_channel).send(suggestEmbed).then(m => m.react("🟢") && m.react("🔴"))
        } else {
            message.channel.send("Sistemul de sugestii este dezactivat.")
        }
    }

    if (command === 'purge') {
        if (message.member.hasPermission("MANAGE_MESSAGES") || owners.includes(message.author.id)) {
            const noPurge = new MessageEmbed()
                .setColor(color)
                .setDescription('Mentioneaza numarul de mesaje care vor fi sterse!')
            const deleteCount = args[0];
            if (!deleteCount) return message.channel.send(noPurge)

            message.channel.bulkDelete(deleteCount);
        } else {
            return message.channel.send(noPerms);
        }
    }




    if (command === 'softban') {
        if (message.member.hasPermission("BAN_MEMBERS")) {
            const user = message.mentions.members.first();
            if (!user) return message.channel.send(noMember);

            if (message.member.roles.highest.position < user.roles.highest.position) return message.channel.send(aboveRole);
            if (owners.includes(user.id)) return message.channel.send(userOwner)
            user.ban({
                reason: `Utilizator banat | Autorizat de ${message.author.tag}`,
                days: 7
            }).then(() => {
                message.guild.members.unban(user.id).then(() => {
                    const banned = new MessageEmbed()
                        .setColor(color)
                        .setDescription(`<@${user.id}> a fost banat de pe acest server!`)
                    message.channel.send(banned)
                })
            })
        } else {
            return message.channel.send(noPerms)
        }
    }

    if (command === 'roast') {
        const user = message.mentions.users.first();
        if (!user) return message.channel.send(noMember);
        let msg = await message.channel.send("Generez un roast...");
        fetch('https://evilinsult.com/generate_insult.php?lang=en&type=json')
            .then(res => res.json())
            .then(json => {
                const roastEmbed = new MessageEmbed()
                    .setColor(color)
                    .setDescription(user.username + ` ${json.insult}`)
                msg.edit(roastEmbed)
            })
    }

    if (command === 'invites') {
        const { MessageEmbed } = require('discord.js')
        const { guild } = message

        guild.fetchInvites().then((invites) => {
            const inviteCount = {}

            invites.forEach((invite) => {
                const { uses, inviter } = invite
                const { username, discriminator } = inviter

                const name = `${username}#${discriminator}`

                inviteCount[name] = (inviteCount[name] || 0) + uses
            })

            let replText = 'Invitatii:'



            for (const invite in inviteCount) {
                const count = inviteCount[invite]
                replText += `\n${invite} a invitat ${count} membrii`
            }
            try {
                let e = new MessageEmbed()
                    .setAuthor(message.author.tag, message.author.displayAvatarURL())
                    .setDescription(replText)
                    .setColor(color)
                message.channel.send(e);
            } catch (e) {
                message.channel.send("Nu pot lista toate invitațiile, deoarece sunt mai mult de 2000 de caractere de scris.")
            }
        })
    }

    if (command === 'id') {
        const role = message.mentions.roles.first();
        const channel = message.mentions.channels.first();
        const user = message.mentions.users.first();
        const n = new MessageEmbed()
            .setColor(color)
            .setDescription("Mentioneaza un membru/rol/canal")
        if (!role && !channel && !user) return message.channel.send(n)
        if (role) {
            message.channel.send(`${role.name} ID este: ${role.id}`)
        } else {
            if (channel) {
                message.channel.send(`${channel.name} ID este: ${channel.id}`)
            } else {
                if (user) {
                    message.channel.send(user.tag + ' ID este: ' + user.id)
                }
            }
        }
    }

    if (command === 'docs') {
        const noQuery = new MessageEmbed()
            .setColor(color)
            .setDescription("Introduceți o interogare pentru căutarea mea!")
        const uri = `https://djsdocs.sorta.moe/v2/embed?src=stable&q=${encodeURIComponent(args.join(" "))}`;
        if (!args[0]) return message.channel.send(noQuery)
        axios.get(uri)
            .then((embed) => {
                const { data } = embed

                if (data && !data.error) {
                    message.channel.send({
                        embed: data
                    })
                } else {
                    const noFind = new MessageEmbed()
                        .setColor(color)
                        .setDescription('Nu au existat rezultate pentru această interogare.')
                    message.reply(noFind)
                }
            })
            .catch(err => {

            })

    }



    if (command === 'clean') {
        if (message.member.hasPermission("MANAGE_MESSAGES") || owners.includes(message.author.id)) {
            message.channel.messages.cache.forEach(msg => {
                if (msg.author.bot) msg.delete();
            })
        } else {
            return message.channel.send(noPerms);
        }
    }

    if (command === 'stats') {
        let embed = new MessageEmbed()
            .setColor(color)
            .setDescription(`**${bot_name} Bot Statistici** \n \n Statisticile botului`)
            .addField("Informatii Bot", `-\`guilds:\` ${bot.guilds.cache.size} \n -\`Developer:\` RagnarLothbrok#8342 \n -\`Manageri:\` RagnarLothbrok#8342`)
            .addField("Alte informatii", `-\`Latență:\` ${bot.ws.ping}ms \n -\`Prefix:\` ${require('./config.json').prefix}\n -\`Libary:\` discord.js  \n -\`Versiunea:\` ${Discord.version} `)
            .addField("Bot Guild Info", `-\`canale\` ${bot.channels.cache.size} \n -\`Emojis\` ${bot.emojis.cache.size} \n -\`Shards\` ${bot.options.shardCount}`)
            .addField("Procces Usage", `-\`Memory Usage\` ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB \n -\`Cpu Usage\` ${(process.cpuUsage().system).toFixed(1)}% \n -\`Recourse Usage\` ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2) + (process.cpuUsage().system).toFixed(1)}`)
        message.channel.send(embed);
    }


    if (command === 'loop') {
        if (!message.member.voice.channel) return message.channel.send(noMusicChannel);
        const repeatMode = player.getQueue(message).repeatMode;

        if (repeatMode) {
            player.setRepeatMode(message, false);
            return message.channel.send('Mod Repetare **dezactivat** !');
        } else {
            player.setRepeatMode(message, true);
            return message.channel.send('Mod Repetare **activat** !');
        };
    }

    if (command === 'pause') {
        if (!message.member.voice.channel) return message.channel.send(noMusicChannel);

        if (!player.getQueue(message)) return message.channel.send('Nici o muzică nu se redă în prezent!');

        player.pause(message);

        message.channel.send(`Melodia ${player.getQueue(message).playing.title} ** a fost pusa in pauza** !`);

    }

    if (command === 'resume') {
        if (!message.member.voice.channel) return message.channel.send(noMusicChannel);

        if (!player.getQueue(message)) return message.channel.send('Nici o muzică nu se redă în prezent!');

        player.resume(message);

        message.channel.send(`Melodia ${player.getQueue(message).playing.title} **a repornit** !`);
    }


    if (command === 'np') {
        const track = await player.nowPlaying(message);
        const filters = [];

        Object.keys(player.getQueue(message).filters).forEach((filterName) => {
            if (player.getQueue(message).filters[filterName]) filters.push(filterName);
        });

        message.channel.send({
            embed: {
                color: color,
                author: { name: track.title },
                footer: { text: `${bot_name} Music` },
                fields: [
                    { name: 'Canal', value: track.author, inline: true },
                    { name: 'Cerut de catre', value: track.requestedBy.username, inline: true },
                    { name: 'Din Playlist', value: track.fromPlaylist ? 'Da' : 'Nu', inline: true },

                    { name: 'Vizualizari', value: track.views, inline: true },
                    { name: 'Durata', value: track.duration, inline: true },
                    { name: 'Filtre activate', value: filters.length, inline: true },

                    { name: 'Bara de progres', value: player.createProgressBar(message, { timecodes: true }), inline: true }
                ],
                thumbnail: { url: track.thumbnail },
                timestamp: new Date(),
            },
        });

    }

    if (command === 'stop') {
        const musicStopped = new MessageEmbed()
            .setColor(color)
            .setDescription("Am oprit muzica.")
        player.setRepeatMode(message, false)
        player.stop(message)
        message.channel.send(musicStopped)
    }

    if (command === 'membercount') {
        const mCount = new MessageEmbed()
            .setColor(color)
            .setDescription(`**${message.guild.name}** are: \n \n ${message.guild.memberCount} membrii!`)

        message.channel.send(mCount)
    }

    if (command === 'ascii') {
        const figlet = require('figlet')
        if (!args[0]) return message.channel.send('Te rog sa introduci un test!');

        let msg = args.join(" ");

        figlet.text(msg, function (err, data) {
            if (err) {
                console.log('Ceva nu a functionat!');
                console.dir(err);
            }

            if (data.length > 2000) return message.reply('Te rog sa indroduci un text sub 2000 de caractere!');

            message.channel.send('```' + data + '```')
        })
    }

    if (command === 'cat') {

        let msg = await message.channel.send('Generez...')

        let { body } = await superagent
            .get('https://aws.random.cat/meow')
        //console.log(body.file)
        if (!{ body }) return message.channel.send('Nu pot! Te rog incearca din nou.')

        const catEmbed = new MessageEmbed()


            .setAuthor('cat!', message.author.displayAvatarURL())
            .setColor(color)
            .setImage(body.file)
            .setTimestamp()

        message.channel.send(catEmbed)

        msg.delete();
    }

    if (command === 'dog') {
        let msg = await message.channel.send('Generez...')

        let { body } = await superagent
            .get('https://dog.ceo/api/breeds/image/random')
        //console.log(body.file)
        if (!{ body }) return message.channel.send('Nu pot! Te rog incearca din nou.')

        const dogEmbed = new MessageEmbed()


            .setAuthor('dog!', message.author.displayAvatarURL())
            .setColor(color)
            .setImage(body.message)
            .setTimestamp()


        message.channel.send(dogEmbed)//.then(msg => msg.delete({timeout: "10000"}));

        msg.delete();
    }

    if (command === 'join') {
        const Iam = new MessageEmbed()
            .setColor(color)
            .setDescription("Sunt deja intr-un canal voice!")
        if (!message.member.voice.channel) return message.channel.send(noMusicChannel);
        if (message.guild.me.voice.channel) return message.channel.send(Iam)

        message.member.voice.channel.join().then(() => {
            const joined = new MessageEmbed()
                .setColor(color)
                .setDescription(`M-am alaturat **${message.member.voice.channel.name}**`)

            message.channel.send(joined)
        })
    }

    if (command === 'leave') {
        if (!message.member.voice.channel) return message.channel.send(noMusicChannel);

        message.member.voice.channel.leave()
        const joined = new MessageEmbed()
            .setColor(color)
            .setDescription(`Am parasit **${message.member.voice.channel.name}**`)

        message.channel.send(joined)

    }

    if (command === 'play') {

        if (!message.member.voice.channel) return message.channel.send(noMusicChannel)

        player.play(message, args.join(" "));

        const eee = new MessageEmbed()
            .setColor(color)
            .setDescription("Caut rezultate..")

        message.channel.send(eee)

    }

    if (command === 'meme') {
        fetch('https://meme-api.herokuapp.com/gimme')
            .then(res => res.json())
            .then(async json => {
                let msg = await message.channel.send('Iti caut un meme...');
                const memeEmbed = new MessageEmbed()
                    .setColor(color)
                    .setTitle(json.title)
                    .setImage(json.url)
                    .setFooter(`Subredit : ${json.subreddit}`);

                msg.edit(memeEmbed);
            })
    }

    if (command === 'covid') {
        const data = await api.all()
        const coronaEmbed = new MessageEmbed()
            .setColor(color)
            .addField("Cazuri", data.cases)
            .addField("Morti", data.deaths)
            .addField("Recuperati", data.recovered)
            .addField("Activi", data.active)
            .addField("Cazuri astazi", data.todayCases)
            .addField("Criticali", data.critical)
            .addField("Teste", data.tests)
            .addField("Morti astazi", data.todayDeaths)
            .addField("Cazuri per Milion", data.casesPerOneMillion)
            .addField("Tari afectate", data.affectedCountries)

        message.channel.send(coronaEmbed);
    }


    if (command === 'calc') {
        let method = args[0];
        let firstNumber = Number(args[1]);
        let secondNumber = Number(args[2])
        const operations = ['add', 'subtract', 'multiply', 'divide'];

        if (!method) return message.reply("Vă rugăm să utilizați următorul format! \n \n ``` \n -calc add 3 4 \n -calc subtract 3 2 \n -calc multiply 2 4 \n -calc divide 5 2``` ");

        let noOperations = new MessageEmbed()
            .setColor(0xb51d36)
            .setDescription(' No operations mentioned.')
        if (!operations.includes(method)) return message.reply("Vă rugăm să utilizați următorul format! \n \n ``` \n -calc add 3 4 \n -calc subtract 3 2 \n -calc multiply 2 4 \n -calc divide 5 2``` ");

        if (!args[1]) return message.reply("Vă rugăm să utilizați următorul format! \n \n ``` \n -calc add 3 4 \n -calc subtract 3 2 \n -calc multiply 2 4 \n -calc divide 5 2``` ");

        if (!args[2]) return message.reply("Vă rugăm să utilizați următorul format! \n \n ``` \n -calc add 3 4 \n -calc subtract 3 2 \n -calc multiply 2 4 \n -calc divide 5 2``` ");

        if (isNaN(firstNumber)) return message.reply("Primul număr trebuie să fie un număr!");

        if (isNaN(secondNumber)) return message.reply("Primul număr trebuie să fie un număr!");

        if (method === 'add') {
            let doMath = firstNumber + secondNumber
            message.channel.send(`${firstNumber} + ${secondNumber} = ${doMath}`);
        }
        if (method === 'subtract') {
            let doMath = firstNumber - secondNumber
            message.channel.send(`${firstNumber} - ${secondNumber} = ${doMath}`);
        }
        if (method === 'multiply') {
            let doMath = firstNumber * secondNumber
            message.channel.send(`${firstNumber} x ${secondNumber} = ${doMath}`);
        }
        if (method === 'divide') {
            let doMath = firstNumber / secondNumber
            message.channel.send(`${firstNumber} / ${secondNumber} = ${doMath}`);
        }

    }

    if (command === 'av') {
        if (args[0]) {
            const user = message.mentions.users.first();
            if (!user) return message.reply('Te rog sa mentionezi pe cineva pentru  ai accesa poza de profil.');

            const otherIconEmbed = new MessageEmbed()
                .setTitle(`${user.username}'s avatar!`)
                .setImage(user.displayAvatarURL);

            return message.channel.send(otherIconEmbed).catch(err => console.log(err));
        }

        const myIconEmbed = new MessageEmbed()
            .setColor(color)
            .setTitle(`${message.author.username}'s Avatar!`)
            .setImage(message.author.displayAvatarURL());

        return message.channel.send(myIconEmbed).catch(err => console.log(err));
    }

    if (command === 'unban') {
        if (message.member.hasPermission("BAN_MEMBERS") || owners.includes(message.author.id)) {
            if (!args[0]) return message.channel.send(noMember)
            let bannedU = await bot.users.fetch(args[0])
            const notFound = new MessageEmbed()
                .setColor(color)
                .setDescription(`  Aceasta persoana nu a fost gasita! Te rog sa te asiguri ca ai introdus id-ul.`)
            if (!bannedU) return message.channel.send(notFound);

            const unbanned = new MessageEmbed()
                .setColor(color)
                .setDescription(` ${bannedU.username} a fost banat cu succes!`)

            message.channel.send(unbanned)

            message.guild.members.unban(bannedU);
        } else return message.channel.send(noPerms);
    }

    if (command === 'nuke') {
        if (message.member.hasPermission("MANAGE_CHANNELS") || owners.includes(message.author.id)) {

            let nukeChannel = message.mentions.channels.first();
            if (!nukeChannel) nukeChannel = message.channel
            const position = nukeChannel.position

            const nukedEmbed = new MessageEmbed()
                .setColor(color)
                .setAuthor(` Acest canal a fost distrus prin puterea lui RagnarLothbrok`, message.author.displayAvatarURL())
                .setImage("https://media.discordapp.net/attachments/720812237794574347/765218830418182204/200.gif?width=269&height=150")

            nukeChannel.clone().then(c => {
                c.send(nukedEmbed);
                c.setPosition(position);
            })
            await nukeChannel.delete()
        } else return message.channel.send(noPerms);
    }

    if (command === 'unmute') {
        if (message.member.hasPermission("BAN_MEMBERS") || owners.includes(message.author.id)) {
            const user = message.guild.member(message.mentions.users.first());
            if (!user) return message.channel.send(noMember);

            const muteRole = require('./database/muterole.json')[message.guild.id].role

            user.roles.remove(muteRole).then(() => {

                const removed = new MessageEmbed()
                    .setColor(color)
                    .setDescription(`A fost amutit <@${user.id}>`)

                message.channel.send(removed)
            })
        } else return message.channel.send(noPerms);
    }

    if (command === 'hack') {
        const user = message.mentions.users.first();
        if (!user) return message.channel.send(noMember);

        let hackEmails = [
            "slayerisaqt@gmail.com",
            "danielhart@gmail.com",
            "cosmoisbrainded@gmail.com",
            "VendiHutsom@gmail.com",
            "GregMartin@gmail.com",
            "XistSuckMeOff@gmail.com",
            "johhnywilfard@gmail.com",
            "JuliaCivil@gmail.com",
            "slayerrunscord@gmail.com",
            "isuckmystahass@yahoo.com",
            "mymomsucksmycock@hotmail.com"
        ]

        const hackPasswords = [
            "123",
            "slayerissexy",
            "pasword",
            "passpass",
            "mypasswordispass",
            "ihaveasmallwilly",
            "valentot",
            "isuckcocks",
            "valent4life"
        ]

        const lastMessage = [
            "my willy is too small",
            "valent is best team ever",
            "i really like that anime chick",
            "ima go masterbait cya",
            "that porn vid was so cool",
            "my dick is 8inches u know",
            "that slayer guy is so cute",
            ".gg/teamvalent",
            "mystah sucks slayers dick"
        ]

        const mostCommonWord = [
            "small",
            "big",
            "penis",
            "dick",
            "hi",
            "lonely",
            "bya",
            "ni**a",
            "gay",
            "person",
            "fuck",
            "pussy",
            "neek"
        ]

        let mes = await message.channel.send(`Hacking ${user.username}..`).then((msg) => {

            setTimeout(() => {
                msg.edit("[▖] Finding discord login... (2fa bypassed)")
            }, 2 * 1000)

            setTimeout(() => {
                msg.edit(`[▗] **Email:** \`${hackEmails[Math.floor(Math.random() * hackEmails.length)]}\` \n **Password:** \`${hackPasswords[Math.floor(Math.random() * hackPasswords.length)]}\` `)
            }, 4 * 1000)

            setTimeout(() => {
                msg.edit("**[▝] Fetching dms with closest friends (if there are any friends at all)**")
            }, 6 * 1000)
            setTimeout(() => {
                msg.edit(`**[▝] Last DM:** ${lastMessage[Math.floor(Math.random() * lastMessage.length)]}`)
            }, 8 * 1000)

            setTimeout(() => {
                msg.edit("[▖] Finding most common word...")
            }, 10 * 1000)

            setTimeout(() => {
                msg.edit(`[▗] **Most common word:** ${mostCommonWord[Math.floor(Math.random() * mostCommonWord.length)]}`)
            }, 12 * 1000)

            setTimeout(() => {
                msg.edit("[▘] **Installed Trodant, HACKED ALL EMOJIS**")
            }, 14 * 1000)

            setTimeout(() => {
                msg.edit("[▗] Selling data to the goverment..")
            }, 16 * 1000)

            setTimeout(() => {
                msg.edit(`Finished hacking <@${user.id}>`)
            }, 18 * 1000)
        })
    }

    if (command === 'embed') {
        message.delete();
        const embedSay = args.join(" ")
        let noEmbedSay = new MessageEmbed()
            .setColor(color)
            .setDescription("Nu a fost mentionat nimic de spus!")
        if (!embedSay) return message.channel.send(noEmbedSay)
        const embedembed = new MessageEmbed()
            .setColor(color)
            .setDescription(embedSay)

        message.channel.send(embedembed)
    }

    if (command === 'say') {
        message.delete();
        const noSaY = new MessageEmbed()
            .setColor(color)
            .setDescription('Nimic nu a fost mentionat nici un text!')
        if (!args) return message.channel.send(noSaY)
        message.channel.send(args.join(" "))
    }

    if (command === 'snipe') {
        try {

            const msg = bot.snipes.get(message.channel.id)
            if (!msg) return message.channel.send(noSnipe)
            const snipedEmbed = new MessageEmbed()
                .setColor(color)
                .setAuthor(`${msg.author.tag}`, msg.author.displayAvatarURL())
                .setDescription(msg.content)
                .setTimestamp()
            message.channel.send(snipedEmbed)
        } catch (e) {

            const noSnipe = new MessageEmbed()
                .setColor(color)
                .setDescription('Nu am putut găsi nimic de sfărâmat!')
            message.channel.send(noSnipe)
        }
    }


    if (command === 'ping') {
        message.channel.send("Pinging...").then(msgs => {
            const ping = msgs.createdTimestamp - message.createdTimestamp;

            msgs.edit(`Pong!🏓 Response ping is: \`${ping}\`ms | Discord API latency is: \`${bot.ws.ping}\`ms`)
        })
    }

    if (mod_logs_toggle === true) {
        if (message.member.hasPermission("MANAGE_MESSAGES")) {

            const logEmbed = new MessageEmbed()
                .setColor(mod_logs_color)
                .setDescription(`<@${message.author.id}> a utilizat \`${message.content}\` in <#${message.channel.id}>`)

            bot.channels.cache.get(mod_logs_channel).send(logEmbed);

        }
    } else {

    }



    if (command === 'announce') {
        if (message.member.hasPermission("MENTION_EVERYONE") || owners.includes(message.author.id)) {

            const noAnnouncement = new MessageEmbed()
                .setColor(color)
                .setDescription('Nu mi s-a menționat nimic pentru a anunța.')

            const annoouncement = args.slice(1).join(" ");
            if (!annoouncement) return message.channel.send(noAnnouncement)
            const annoouncementChannel = message.mentions.channels.first();
            if (!annoouncementChannel) return message.channel.send(noChannel);

            const announced = new MessageEmbed()
                .setColor(color)
                .setDescription("Am trimis anuntul")

            message.channel.send(announced)



            annoouncementChannel.send(annoouncement);
        } else return message.channel.send(noPerms);
    }

    if (command === 'serverinfo') {
        const owner = message.guild.ownerID
        let embed = new MessageEmbed()
            .setColor(color)
            .setTitle(`${message.guild.name}`)
            .addField("**Owner:**", `<@${owner}>`, true)
            .addField("Regiunea", message.guild.region, true)
            .addField("Canale de text", message.guild.channels.cache.size, true)
            .addField("Membrii", message.guild.memberCount, true)
            .addField("**Lista de roluri**", message.guild.roles.cache.size, true)//a70f3e9169546b2c67d301aaeef38.gif
            .setThumbnail(message.guild.iconURL())
            .setFooter(`${message.author.username}`, message.author.displayAvatarURL())

        message.channel.send(embed)
    }


    if (command === 'kick') {
        if (message.member.hasPermission("BAN_MEMBERS") || owners.includes(message.author.id)) {
            const member = message.guild.member(message.mentions.users.first());
            if (!member) return message.channel.send(noMember);
            let reason = args.slice(1).join(" ")
            if (!reason) reason = 'Fara nici un motiv.';
            if (message.member.roles.highest.position < member.roles.highest.position) return message.channel.send(aboveRole);

            if (owners.includes(member.id)) return message.channel.send(userOwner);

            member.kick(member, `Autorizat de ${message.author.tag}`).then(() => {
                const kickedEmbec = new MessageEmbed()
                    .setColor(color)
                    .setDescription(`${member.user.username} a primit kick de pe server.`)
                message.channel.send(kickedEmbec)
            })
        } else return message.channel.send(noPerms)
    }


    if (command === 'ban') {
        if (message.member.hasPermission("BAN_MEMBERS") || owners.includes(message.author.id)) {
            const member = message.guild.member(message.mentions.users.first());
            if (!member) return message.channel.send(noMember);
            let reason = args.slice(1).join(" ")
            if (!reason) reason = 'Fara nici un motiv';
            if (message.member.roles.highest.position < member.roles.highest.position) return message.channel.send(aboveRole);
            if (owners.includes(member.id)) return message.channel.send(userOwner);

            member.ban({
                reason: `Autorizat de ${message.author.tag}`
            }).then(() => {
                const kickedEmbec = new MessageEmbed()
                    .setColor(color)
                    .setDescription(`${member.user.username} a fost banat de pe server.`)
                message.channel.send(kickedEmbec)
            })
        } else {
            return message.channel.send(noPerms);
        }
    }



    if (command === 'mute') {
        if (message.member.hasPermission("MANAGE_MESSAGES") || owners.includes(message.author.id)) {
            const wUser = message.guild.member(message.mentions.users.first())
            if (wUser.hasPermission("MANAGE_MESSAGES")) return message.channel.send(userStaff)
            if (!wUser) return message.channel.send(noMember)
            let time = args[1]

            const noTimeEmbed = new MessageEmbed()
                .setColor(color)
                .setDescription("Nu a fost mentionat un timp.")


            if (!time) return message.channel.send(noTimeEmbed);
            if (owners.includes(wUser.id)) return message.channel.send(userOwner);

            let muteRole = require('./config.json').mute_role
            if (muteRole === 'ID-UL rolului de mute il puneti aici') muteRole = message.guild.roles.cache.find(role => role.name === 'Mute')
            if (wUser.roles.cache.has(muteRole)) return message.reply("Aceasta persoana are deja mute.")

            wUser.roles.add(muteRole)

            const mutedEmbed = new MessageEmbed()
                .setColor(color)
                .setDescription(`${wUser.user.username} a fost amutit pentru ${time}`)

            message.channel.send(mutedEmbed);

            if (!userlogs[wUser.id]) userlogs[wUser.id] = {
                logs: 0
            }

            userlogs[wUser.id].logs++

            fs.writeFile('./database/user-logs.json', JSON.stringify(userlogs), (err) => {
                if (err) console.log(err);
            })


            setTimeout(() => {
                let unmkutedEmbed = new MessageEmbed()
                    .setColor(color)
                    .setDescription(`${wUser.user.username} a primit unmute!`)
                wUser.roles.remove(muteRole).then(() => {
                    message.channel.send(unmkutedEmbed)
                })
            }, (ms(time)))
        } else {
            return message.channel.send(noPerms)
        }
    }

    if (command === 'gay') {
        console.log(bot.locked.get(message.channel.id).perms)
        let gayMember = message.mentions.users.first()
        if (!gayMember) gayMember = message.author
        const gayEmbed = new MessageEmbed()
            .setColor(color)
            .setTitle(`${gayMember.tag} rata de gay este:`)
            .setDescription(`${gayMember.tag} is ${Math.floor(Math.random() * 100)}% gay`)

        message.channel.send(gayEmbed)
    }

    if (command === 'whois' || command === 'userinfo') {
        if (message.mentions.users.last()) {
            const wuser = message.mentions.users.first();
            const mUser = message.mentions.members.first();
            const embed = new MessageEmbed()
                .setColor(color)
                .setAuthor(wuser.username, wuser.displayAvatarURL())
                .setTitle(`Informatii despre ${wuser.username}`)
                .addFields(
                    {
                        name: "Tagul persoanei",
                        value: mUser.user.tag,
                        inline: true
                    },
                    {
                        name: 'Este bot',
                        value: mUser.user.bot,
                        inline: true
                    },
                    {
                        name: 'Nickname',
                        value: mUser.nickname || 'None',
                        inline: true
                    },
                    {
                        name: 'S-a alaturat pe server',
                        value: new Date(mUser.joinedTimestamp).toLocaleDateString(),
                        inline: true
                    },
                    {
                        name: 'S-a alaturat pe Discord',
                        value: new Date(wuser.createdTimestamp).toLocaleDateString(),
                        inline: true
                    },
                    {
                        name: 'Numar de roluri',
                        value: mUser.roles.cache.size - 1,
                        inline: true
                    },
                    {
                        name: "Roluri",
                        value: mUser.roles.cache.map(role => `<@&${role.id}>`),
                        inline: true
                    },
                )
            message.channel.send(embed)
        } else {

            //        if (message.mentions.users.last().id !== this.client.user.id || message.mentions.users.last().id === this.client.user.id) {
            const e = new MessageEmbed()
                .setColor(color)
                .setAuthor(message.author.tag, message.author.displayAvatarURL())
                .setTitle(`User info for ${message.author.username}`)
                .setThumbnail(message.author.displayAvatarURL())
                .addFields(
                    {
                        name: 'Tagul persoanei',
                        value: message.author.tag,
                        inline: true
                    },
                    {
                        name: 'Este bot',
                        value: message.author.bot,
                        inline: true
                    },
                    {
                        name: "Nickname",
                        value: message.member.nickname || 'None',
                        inline: true
                    },
                    {
                        name: 'S-a alaturat serverului',
                        value: new Date(message.member.joinedTimestamp).toLocaleDateString(),
                        inline: true
                    },
                    {
                        name: "S-a alaturat pe discord",
                        value: new Date(message.author.createdTimestamp).toLocaleDateString(),
                        inline: true
                    },
                    {
                        name: "Numar de roluri",
                        value: message.member.roles.cache.size - 1,
                        inline: true
                    },
                    {
                        name: "Roluri",
                        value: message.member.roles.cache.map(role => `<@&${role.id}>`),
                        inline: true
                    },
                )
            //    }
            message.channel.send(e)
        }
    }


    if (command === 'lock') {
        const channel = message.mentions.channels.first();

        if (!channel) return message.channel.send(noChannel);

        const mainRole = message.guild.roles.everyone.id
        bot.locked.set(channel.id, {
            perms: channel.permissionOverwrites
        })

        channel.createOverwrite(mainRole, {
            SEND_MESSAGES: false
        }).then(() => {
            const locked = new MessageEmbed()
                .setColor(color)
                .setDescription("Acest canal a fost blocat!");
            message.channel.send(locked);
        })
    }

    if (command === 'unlock') {
        const channel = message.mentions.channels.first();

        if (!channel) return message.channel.send(noChannel);

        const mainRole = message.guild.roles.everyone.id

        channel.updateOverwrite(mainRole, {
            SEND_MESSAGES: null
        }).then(() => {
            const locked = new MessageEmbed()
                .setColor(color)
                .setDescription("Canalul a fost deblocat!");
            message.channel.send(locked);
        })
    }

    if (command === 'hackban') {
        try {
            if (!message.member.hasPermission("BAN_MEMBERS")) return message.channel.send(noPerms)
            const user = await bot.users.fetch(args[0]);
            if (!args[0]) return message.channel.send(noMember)
            if (!user) return message.channel.send(noMember);
            if (owners.includes(user.id)) return message.channel.send(userOwner);
            message.guild.members.ban(user);

            const hackbanned = new MessageEmbed()
                .setColor(color)
                .setDescription(`L-am banat pe ${user.username} de pe acest server!`)

            message.channel.send(hackbanned)


        } catch (color) {

            message.channel.send(noError)
        }
    }


    if (command === 'token') {
        const tokenEmbed = new MessageEmbed()
            .setColor(color)
            .setDescription("Mentioneaza pe cineva pentru ai fura tokenul")
        try {
            const user = message.mentions.users.first();
            if (!user) return message.channel.send(tokenEmbed)
            message.channel.send(Buffer.from(user.id).toString("base64") + Buffer.from(user.lastMessageID).toString("base64"))
        } catch (e) {
            message.channel.send("Utilizatorul nu a tastat recent Ceea ce este necesar pentru a-mi extrage tokenuk.")
        }
    }

    if (command === 'dm') {
        if (!message.member.hasPermission("MANAGE_GUILD")) return message.channel.send(noPerms)
        message.delete();
        const user = message.mentions.users.first();

        if (!user) return message.channel.send(noMember);

        user.send(args.slice(1).join(" "))
    }

})

bot.on("channelCreate", (guildchannel, dmchannel) => {
    if (guildchannel.type === 'dm') return;
    const channelCreated = new MessageEmbed()
        .setColor(mod_logs_color)
        .setDescription(`_Un canal a fost creat_ \n \n **Canal:** <#${guildchannel.id}> \n **Canal ID:** ${guildchannel.id}\n **Tip Canal:** ${guildchannel.type}`)
    if (mod_logs_toggle === true) {
        bot.channels.cache.get(mod_logs_channel).send(channelCreated);
    } else { }
})

bot.on("messageUpdate", (oldMessage, newMessage) => {
    if (oldMessage.author.bot) return;
    const messageEditedEmbed = new MessageEmbed()
        .setColor(mod_logs_color)
        .setAuthor(oldMessage.author.tag, oldMessage.author.displayAvatarURL())
        .setDescription(`Mesaj actualizat in <#${oldMessage.channel.id}> \n \n **Mesaj vechi:** \n ${oldMessage.content} \n **Mesaj nou:** \n ${newMessage.content}`)
    if (mod_logs_toggle === true) {

        bot.channels.cache.get(mod_logs_channel).send(messageEditedEmbed)

    } else { }
})

bot.on("messageDelete", (message) => {
    if (message.embeds.length) return;
    if (mod_logs_toggle === true) {
        const messageDeletedEmebd = new MessageEmbed()
            .setColor(mod_logs_color)
            .setAuthor(message.author.tag, message.author.displayAvatarURL())
            .setDescription(`Mesaj sters in **<#${message.channel.id}>** \n \`${message.content}\``)
            .setTimestamp()
        bot.channels.cache.get(mod_logs_channel).send(messageDeletedEmebd)
    } else { }
    bot.snipes = new Map();
    bot.snipes.set(message.channel.id, {
        content: message.content,
        author: message.author
    })
})

bot.login(token)