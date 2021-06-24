const Discord = require("discord.js")
const fs = require("fs");
const request = require("request")

const dayjs = require("dayjs")
const utc = require("dayjs/plugin/utc")
const timezone = require("dayjs/plugin/timezone")
dayjs.extend(utc)
dayjs.extend(timezone)

module.exports.run = async (msg, args) => {
    const time = dayjs().tz("Europe/Warsaw").format('DD-MM-YYYY_HH-mm-ss')

    db.prepare(`CREATE TABLE IF NOT EXISTS accounts(
       accName VARCHAR NOT NULL,
       accGroup VARCHAR NOT NULL,
       checkRank VARCHAR NOT NULL,
       accData VARCHAR NOT NULL
    );`).run()

    db.prepare(`CREATE TABLE IF NOT EXISTS waitAccounts(
       accName VARCHAR NOT NULL,
       accGroup VARCHAR NOT NULL,
       checkRank VARCHAR NOT NULL,
       accData VARCHAR NOT NULL,
       waitID VARCHAR NOT NULL
    );`).run()

    const free = client.lib.data.accounts.freeVariaont
    const bronze = client.lib.data.accounts.bronzeVariant.concat(free)
    const silver = client.lib.data.accounts.silverVariant.concat(bronze)
    const gold = client.lib.data.accounts.goldVariant.concat(silver)

    let group, rank

    const game = client.lib.data.accounts.gameGroup
    const stream = client.lib.data.accounts.streamGroup
    const music = client.lib.data.accounts.musicGroup
    const other = client.lib.data.accounts.otherGroup

    const nameAcc = args[0].toLowerCase()

    if (game.includes(nameAcc)) group = "game"
    else if (stream.includes(nameAcc)) group = "stream"
    else if (music.includes(nameAcc)) group = "music"
    else if (other.includes(nameAcc)) group = "other"
    else {
        const errEmbed = new Discord.MessageEmbed()
            .setColor(client.lib.data.colors.error)
            .setTitle(client.lib.data.status.error + ` - nie rozpoznano konta!`)
            .setDescription(`Nie posiadamy w swojej ofercie kont o nazwie **\`${nameAcc}\`**!`)
            .setFooter(footer)
        return msg.channel.send(errEmbed)
    }

    if (free.includes(nameAcc)) rank = "free";
    else if (bronze.includes(nameAcc)) rank = "bronze"
    else if (silver.includes(nameAcc)) rank = "silver"
    else if (gold.includes(nameAcc)) rank = "gold"
    else {
        const errEmbed = new Discord.MessageEmbed()
            .setColor(client.lib.data.colors.error)
            .setTitle(client.lib.data.status.error + ` - nie rozpoznano konta!`)
            .setDescription(`Nie posiadamy w swojej ofercie kont o nazwie **\`${nameAcc}\`**!`)
            .setFooter(footer)
        return msg.channel.send(errEmbed)
    }

    const file = msg.attachments.first()

    if (!file) {
        const errEmbed = new Discord.MessageEmbed()
            .setColor(client.lib.data.colors.error)
            .setTitle(client.lib.data.status.error + ` - brak pliku z kontami!`)
            .setDescription(`Nie dodałeś/-aś pliku z kontami!`)
            .setFooter(footer)
        return msg.channel.send(errEmbed)
    }

    const nameFile = file.name

    if (!nameFile.endsWith(".txt")) {
        const errEmbed = new Discord.MessageEmbed()
            .setColor(client.lib.data.colors.error)
            .setTitle(client.lib.data.status.error + ` - błędne rozszerzenie pliku!`)
            .setDescription(`Wysłano plik z nieobsługiwanym rozszerzeniem\nObsługiwane rozszerzenie to **\`.txt\`**`)
            .setFooter(footer)
        return msg.channel.send(errEmbed)
    }

    const waitEmbed = new Discord.MessageEmbed()
        .setColor(client.lib.data.colors.warn)
        .setTitle(client.lib.data.emojis.loading + ` Wczytywanie kont do bazy`)
        .setDescription(`Trwa wczytywanie kont do bazy danych, proszę czekać!`)
        .setFooter(footer)
    const wait = await msg.channel.send(waitEmbed)

    await download(file.url)

    const randomsChars = "abcdefghijklmnoprstuwvxyz1234567890"
    let randomID = ""

    if (args[1]) {
        const waitID = db.prepare(`SELECT waitID FROM waitAccounts WHERE waitID = ?`).get(args[1])

        randomID = args[1]

        if (!waitID) {
            const errEmbed = new Discord.MessageEmbed()
                .setColor(client.lib.data.colors.error)
                .setTitle(client.lib.data.status.error + ` - błędny identyfikator dodawania kont!`)
                .setDescription(`Brak oczekujących kont w bazie z podanym identyfikatorem!`)
                .setFooter(footer)
            return msg.channel.send(errEmbed)
        }
    } else {
        for (let i = 0; i <= 6; i++) {
            randomID += randomsChars[Math.floor(Math.random() * (randomsChars.length - 1))]
        }
    }


    setTimeout(async function() {

        const data = fs.readFileSync(`otherFiles/accountsFiles/acc_${nameAcc}_${time}.txt`, 'utf8')

        const tab = data.split("\n")

        const oldSize = db.prepare(`SELECT * FROM accounts WHERE accName = ?`).all(nameAcc).length
        const afterSize = tab.length + oldSize

        let i = 1;

        for (const line of tab) {

            db.prepare(`INSERT INTO waitAccounts VALUES (?, ?, ?, ?, ?)`).run(nameAcc, group, rank, line, randomID)

            if (i % 25 === 0) {
                waitEmbed
                    .setDescription(
                        `Trwa wczytywanie kont do bazy danych, proszę czekać!
                
                    Progres: ${i} / ${tab.length}`
                    )
                await wait.edit(waitEmbed)
            }

            i++
        }

        msg.delete()

        const goodEmbed = new Discord.MessageEmbed()
            .setColor(client.lib.data.colors.bot)
            .setTitle(client.lib.data.status.success)
            .setDescription(`Podane konta zostały pomyślnie dodane do bazy tymczasowej!\n\nIdentyfikator dodawania kont: **\`${randomID}\`**`)
            .addFields(
                {name: `Nazwa:`, value: `> ${nameAcc}`, inline: true},
                {name: `Dodanych:`, value: `> ${tab.length}`, inline: true},
                {name: `Łącznie:`, value: `> ${afterSize}`, inline: true},
            )
            .setFooter(footer)
        await wait.edit(goodEmbed)

    }, 3000);

    async function download(url){
        await request.get(url)
            .on('error', console.error)
            .pipe(fs.createWriteStream(`otherFiles/accountsFiles/acc_${nameAcc}_${time}.txt`));
    }
}

module.exports.config = {
    name: "addacc",
    cooldown: 3,
    onlyOwner: true,
    aliases: ['add'],
    // checkRoles: [],
    // checkChannels: [],
}

module.exports.help = {
    description: 'Dodawanie kont do bazy danych',
    category: 'admin',
    usage: [ '<konto>' ],
}
