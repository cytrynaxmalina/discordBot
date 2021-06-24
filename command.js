const Discord = require('discord.js');
const fs = require("fs");
// const ascii = require("ascii-table");

const { prefix } = require('../config.json');
const chalk = require("chalk");

const errFunc = require('../functions/errFunc');

const cooldowns = new Discord.Collection();

module.exports = (client) => {

    client.commands = new Discord.Collection();

    fs.readdirSync("./src/commands/").forEach(dir => {
        const commands = fs.readdirSync(`./src/commands/${dir}/`).filter(file => file.endsWith(".js"));

        for (const file of commands) {
            let command = require(`../commands/${dir}/${file}`);

            if (command.config && command.config.name) {
                client.commands.set(command.config.name, command);
            } else {
                continue;
            }
        }
    });

    client.on('message', async msg => {


        if (!msg.guild) return
        if (msg.author.bot) return


            // Globalne zmienne
        
        global.errFunc = errFunc
        global.author = msg.author.username
        global.imageOpt = { format: "png", dynamic: true, size: 1024 };
        global.authorAv = msg.author.displayAvatarURL(imageOpt)
        global.footer = `${author} || ${client.user.username} - 2021 || ${client.lib.data.info.version} || by GetisekPL#9497`;


            // Komenda bez prefixu

        if (!msg.content.startsWith(prefix)) return;

        const args = msg.content.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();

        const command = client.commands.get(commandName)
            || client.commands.find(cmd => cmd.config.aliases && cmd.config.aliases.includes(commandName));


            // Wiadomość - tylko prefix

        if (msg.content === prefix) return

        
            // Nie rozpoznano komendy
    
        if (!command) return await msg.react(client.lib.data.emojis.IDerror)


            // Komendy tylko dla dev'u
    
        if (command.config.onlyOwner && !client.lib.data.owners.ownersTab.includes(msg.author.id)) {

            const onlyOwnerEmbed = new Discord.MessageEmbed()
                .setColor(client.lib.data.colors.error)
                .setTitle(client.lib.data.status.error + ' - odmowa dostępu')
                .setDescription('Tylko developerzy bota mogą skorzystać z tej komendy!')
                .setFooter(footer)
            return msg.channel.send(onlyOwnerEmbed);

        }


            // Komendy na wyznaczonych kanałach
    
        const checkChannels = command.config.checkChannels
                            
        if (checkChannels && !checkChannels.includes(msg.channel.id)) {
            const channelEmbed = new Discord.MessageEmbed()
                .setColor(client.lib.data.colors.error)
                .setTitle(client.lib.data.status.error)
                .setDescription(`Wybrałeś nieodpowiedni kanał!\nSpróbuj na <#${checkChannels.join(`>, <#`)}>`)
                .setFooter(footer)
            return msg.channel.send(channelEmbed)
        }


            // Wymagane role użytkownika
    
        const checkRoles = command.config.checkRoles;

        function checkRole2() {
            if (client.lib.data.owners.ownersTab.includes(msg.author.id))
                return true

            else
                return msg.member.roles.cache.some(role => checkRoles.includes(role.id))

        }

        if (checkRoles && !checkRole2()) {
            const roleEmbed = new Discord.MessageEmbed()
                .setColor(client.lib.data.colors.error)
                .setTitle(client.lib.data.status.error)
                .setDescription(`Nie posiadasz odpowiedniej roli do użycia tej komendy!\nDozwolone role <@&${checkRoles.join(`>, <@&`)}>`)
                .setFooter(footer)
            return msg.channel.send(roleEmbed)
        }

        
            // Blokowanie komend

        let cmds = command.config.name || command.config.aliases

        const lockCmd = db.prepare('SELECT cmdName FROM lockCmds WHERE cmdName = ?').get(cmds);
        if (!lockCmd) db.prepare(`INSERT INTO lockCmds VALUES (?, ?, ?);`).run(command.config.name, 'false', 'Nie podano')

        const a = db.prepare('SELECT * FROM lockCmds WHERE cmdName = ?').get(cmds);

        if (a.status === 'true' && !client.lib.data.owners.ownersTab.includes(msg.author.id)) {

            const lockCmdEmbed = new Discord.MessageEmbed()
                .setColor(client.lib.data.colors.error)
                .setTitle(client.lib.data.status.error + ' - odmowa dostępu')
                .setDescription('Komenda została zablokowana globalnie przez developerów bota z powodu `' + a.reason + '`!')
                .setFooter(footer)
            return msg.channel.send(lockCmdEmbed);

        }

       
            // Argumenty do komend
    
        if (command.help.usage && !args.length) {

            const argsErrEmbed2 = new Discord.MessageEmbed()
                .setColor(client.lib.data.colors.error)
                .setTitle(client.lib.data.status.error + ' - brakujące argumenty')
                .setDescription(`\`<>\` *- wymagane*, \`[]\` *- opcjonalne*\n
                Prawidłowe użycie:
                \`${prefix}${command.config.name} ${command.help.usage.join(`\n${prefix}${command.config.name} `)}\``)
                .setFooter(footer)
            return msg.channel.send(argsErrEmbed2)
        }


            // Cooldown komendy

        if (!cooldowns.has(command.config.name)) {
            cooldowns.set(command.config.name, new Discord.Collection());
        }

        const now = Date.now();
        const timestamps = cooldowns.get(command.config.name);
        const cooldownAmount = (command.config.cooldown || 3) * 1000;

        function msToTime(duration) {
            let milliseconds = parseInt((duration % 1000) / 100),
                seconds = Math.floor((duration / 1000) % 60),
                minutes = Math.floor((duration / (1000 * 60)) % 60),
                hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

            hours = (hours < 10) ? "0" + hours : hours;
            minutes = (minutes < 10) ? "0" + minutes : minutes;
            seconds = (seconds < 10) ? "0" + seconds : seconds;

            return hours + ":" + minutes + ":" + seconds;
        }

        if (timestamps.has(msg.author.id)) {
            const expirationTime = timestamps.get(msg.author.id) + cooldownAmount;

            if (now < expirationTime && !client.lib.data.owners.ownersTab.includes(msg.author.id)) {
                const timeLeft = (expirationTime - now) / 1000;

                const cooldownEmbed = new Discord.MessageEmbed()

                    .setColor(client.lib.data.colors.error)
                    .setTitle(client.lib.data.status.error + ' - zwolnij')
                    .setDescription('Zbyt szybko piszesz komendy! Spróbuj za `'+ msToTime(timeLeft * 1000) + '`!')
                    .setFooter(footer)

                msg.delete();

                msg.channel.send(cooldownEmbed)
                    .then(msg => {
                        msg.delete({timeout: Math.round(timeLeft) * 1000})
                    });

                return
            }
        }

        timestamps.set(msg.author.id, now);
        setTimeout(() => timestamps.delete(msg.author.id), cooldownAmount);


            // TYMCZASOWE
            // Logi używania komend w konsoli
            // TYMCZASOWE
    
        if (msg.content === prefix + command.config.name || command.config.aliases) {
            log(`\n`)
            log(chalk.bgCyanBright.black(`Aktywowano komende!`))
            log(chalk.blue.bold(`Autor: `), chalk.green(msg.author.tag))
            log(chalk.blue.bold(`Komenda: `), chalk.green(prefix + command.config.name + ' || ' + msg.content))
        }
    
        
            // Wykonywanie komendy

        try {
            command.run(msg, args)
                .catch(error => {
                    errFunc(error, msg)
            })
        } catch (error) {
            errFunc(error, msg)
        };
    });
    
}
