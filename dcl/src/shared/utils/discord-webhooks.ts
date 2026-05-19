
// Put this somewhere re-usable
const WEBHOOK_URL = "https://discord.com/api/webhooks/1493214981133566072/8IiG5biH0FTMKUOjJUEJKDjTGvG4PiqRPAJ8mTo-mTkNq-ojE-E1VHr0EyX5PuGWaIBY"
const GAME_NAME   = "Sky Chaser"
const WORLD      = "stom.dcl.eth"

const buildMessage = (title: string, description: string) => {
	return {embeds: [
		{
			title: title,
			description: description,
			color: 16776960,
			thumbnail: {
				url: "https://cdn.discordapp.com/emojis/1474816925954609164.webp?size=128&animated=true"
			}
		}
	]}
}


export const DiscordNotifyNewPlayer = (username: string, userId: string) => {
	const title = `Sky Chaser :balloon: ${username} has joined the game!`
	const description = `${userId}`
	
	const body = buildMessage(title, description);
	
	sendDiscordMessage(body);
}

// This is the function to use
async function sendDiscordMessage(body: any) {
	try {
		const response = await fetch(WEBHOOK_URL, {
			method : "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify(body)
		})
		
		if (!response.ok) {
			console.log("sendDiscordMessage: Webhook failed:", response.status, response.statusText)
		} else {
			console.log("sendDiscordMessage: Message sent to Discord!")
		}
	} catch (error) {
		console.log("sendDiscordMessage: Error sending webhook:", error)
	}
}