const Discord = require("discord.js");
const client = new Discord.Client({ restRequestTimeout: 60000 });
const { token, prefix } = require("./src/config.json");

const chalk = require("chalk");

const dayjs = require("dayjs")
const utc = require("dayjs/plugin/utc")
const timezone = require("dayjs/plugin/timezone")
dayjs.extend(utc)
dayjs.extend(timezone);

const lib = require("./src/lib")
client.lib = lib;

lib.initialize(client)

const commandHandler = require("./src/handlers/command.handler")

commandHandler(client)


const { log } = console;
global.log = log;
global.prefix = prefix

const Database = require("better-sqlite3");
const db = new Database("./src/database/DarkGen.db", /*{ verbose: log }*/);

global.db = db

client.on("ready", () => {
    console.clear()
	log(chalk.bold.cyan(`Pomyślnie połączono!`))
	log(chalk.bold.blue(`Bot ${client.user.username} jest gotowy!`))

	global.footer2 = `Mobilna sekretarka ${client.user.username} - 2021 || ${client.lib.data.info.version} || by GetisekPL#9497`;
    global.client = client

    client.user.setStatus('online');

	let activities_list = [
		`Najlepszy generator kont w Polsce!`,
		`Posiadamy wiele kont, sprawdź kanał Stock`
	];

	let int = 0;
	setInterval(() => {
		if (int > activities_list.length - 1) int = 0;
		client.user.setActivity(activities_list[int], { type: "GAMING" });
		int++
	}, 10 * 1000);

	
	setInterval(async () => {
	
		const time = dayjs().tz("Europe/Warsaw").format('DD.MM.YYYY HH:mm:ss')
	
		const waitID = db.prepare(`SELECT waitID FROM waitAccounts`).get()
	
		let updateEmbed = new Discord.MessageEmbed()

		let timeUpdateEmbed = new Discord.MessageEmbed()
			.setColor(client.lib.data.colors.bot)
			.setDescription(`Ostatnio sprawdzane: ${time}`)
			.setFooter(footer2)
	
		let e
	
		const channel = client.channels.cache.get(client.lib.data.channels.stockUpdate)
	
		if (waitID) {
	
			let names = ""
			let bNum = ""
			let aNum = ""
	
			const waitAccs = db.prepare(`SELECT * FROM waitAccounts WHERE waitID = ?`).all(waitID.waitID)
	
			let beforeNum
			let afterNum
	
			for (const x of waitAccs) {
				if (!names.includes(x.accName)) {
					beforeNum = db.prepare(`SELECT accName FROM waitAccounts WHERE accName = ?`).all(x.accName).length
					afterNum = db.prepare(`SELECT accName FROM accounts WHERE accName = ?`).all(x.accName).length + beforeNum
	
					let emojiID = client.guilds.cache.get(client.lib.data.info.guildID).emojis.cache.find(emoji => emoji.name === x.accName).id
					let emoji = `<:${x.accName}:${emojiID}>`
	
					names += `\n> ${emoji} ${x.accName}`
					bNum += `\n> ${beforeNum}`
					aNum += `\n> ${afterNum}`
				}
	
				db.prepare(`INSERT INTO accounts VALUES (?, ?, ?, ?)`).run(x.accName, x.accGroup, x.checkRank, x.accData)
				db.prepare(`DELETE FROM waitAccounts WHERE accData = ?`).run(x.accData)
			}
	
			updateEmbed
				.setColor(client.lib.data.colors.bot)
				.setTitle(client.lib.data.status.success + ` - restock gotowy`)
				.setDescription(`Drodzy użytkownicy, stock został zaktualizowany.\n\nPoniżej znajdziecie tabelkę z danymi.`)
				.addFields(
					{name: `Konto:`, value: names, inline: true},
					{name: `Dodanych:`, value: bNum, inline: true},
					{name: `Łącznie:`, value: aNum, inline: true},
				)
				.setFooter(footer2)
	
			await channel.send(updateEmbed)
			e = await channel.send(timeUpdateEmbed)
	
			const lastMsgID = await db.prepare(`SELECT param1 FROM botData WHERE function = ?`).get(`addAccUpdatesTime`).param1
			await client.channels.cache.get(channel.id).messages.fetch(lastMsgID).then(msg => msg.delete());
	
			await db.prepare(`UPDATE botData SET param1 = ?, param2 = ? WHERE function = ?`)
				.run(e.id, channel.id, `addAccUpdatesTime`)
	
			await setTimeout(async function() {
				const freeTab = client.lib.data.accounts.freeVariaont
				const bronzeTab = client.lib.data.accounts.bronzeVariant
				const silverTab = client.lib.data.accounts.silverVariant
				const goldTab = client.lib.data.accounts.goldVariant

				const time = dayjs().tz("Europe/Warsaw").format('DD.MM.YYYY HH:mm:ss')

				let free = "", bronze = "", silver = "", gold = ""

				for (let accNameOnTab of freeTab) {
					let num = numOfAcc(accNameOnTab)
					let emojiID = client.guilds.cache.get(client.lib.data.info.guildID).emojis.cache.find(emoji => emoji.name === accNameOnTab).id
					let emoji = `<:${accNameOnTab}:${emojiID}>`
					free += `> ${emoji} ${accNameOnTab}: ${num}\n`
				}

				for (let accNameOnTab of bronzeTab) {
					let num = numOfAcc(accNameOnTab)
					let emojiID = client.guilds.cache.get(client.lib.data.info.guildID).emojis.cache.find(emoji => emoji.name === accNameOnTab).id
					let emoji = `<:${accNameOnTab}:${emojiID}>`
					bronze += `> ${emoji} ${accNameOnTab}: ${num}\n`
				}

				for (let accNameOnTab of silverTab) {
					let num = numOfAcc(accNameOnTab)
					let emojiID = client.guilds.cache.get(client.lib.data.info.guildID).emojis.cache.find(emoji => emoji.name === accNameOnTab).id
					let emoji = `<:${accNameOnTab}:${emojiID}>`
					silver += `> ${emoji} ${accNameOnTab}: ${num}\n`
				}

				for (let accNameOnTab of goldTab) {
					let num = numOfAcc(accNameOnTab)
					let emojiID = client.guilds.cache.get(client.lib.data.info.guildID).emojis.cache.find(emoji => emoji.name === accNameOnTab).id
					let emoji = `<:${accNameOnTab}:${emojiID}>`
					gold += `> ${emoji} ${accNameOnTab}: ${num}\n`
				}

				let stockEmbed = new Discord.MessageEmbed()
					.setColor(client.lib.data.colors.bot)
					.setTitle(client.lib.data.status.success + ` - stock`)
					.setDescription(`Poniżej znajduje się aktualny stan kont w generatorze!\n\nOstatnia aktualizacja ${time}`)
					.addFields(
						{name: `Free Generator:`, value: `${free}`, inline: true},
						{name: `Bronze Generator:`, value: `${bronze}`, inline: true},
						{name: `Silver Generator:`, value: `${silver}`, inline: true},
						{name: `Gold Generator:`, value: `${gold}`, inline: true},
					)
					.setFooter(footer2)

				let getID = db.prepare(`SELECT * FROM botData WHERE function = ?`).get('stockUpdate')
				let msgID = getID.param1 // msg ID
				let channelID = getID.param2 // channel ID
				
				await client.channels.cache.get(channelID).messages.fetch(msgID).then(msg => msg.edit(stockEmbed));

				function numOfAcc(accName) {
					let a = db.prepare(`SELECT * FROM accounts WHERE accName = ?`).all(accName)
					return a.length
				}
			}, 5 * 1000)
	
		}
		const msgID = db.prepare(`SELECT param1 FROM botData WHERE function = ?`).get(`addAccUpdatesTime`).param1
	
		

		if (msgID) {
			timeUpdateEmbed
				.setColor(client.lib.data.colors.bot)
				.setDescription(`Ostatnie sprawdzenie: ${time}`)
			await client.channels.cache.get(channel.id).messages.fetch(msgID).then(msg => msg.edit(timeUpdateEmbed));
		}
	
	}, 60 * 60 * 1000)



})

client.on("debug", debug => {
	// errFunction(debug, msg, client)
})

client.on("warn", warn => {
	// errFunction(warn, msg, client)
})

client.on("error", error => {
	// errFunction(error, msg, client)
})

client.login(token);
