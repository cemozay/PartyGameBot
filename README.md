# PartyGameBot 🎮

A fun Discord bot that brings interactive party games to your server! Play Spyfall, Truth or Dare, and more with your friends using easy slash commands.

## ✨ What Can This Bot Do?

**🎮 Games Available:**
- **Spyfall** 🕵️ - Find the spy among your friends!
- **Truth or Dare** 💫 - Classic party game with fun questions
- **Who Am I?** ❓ - Guess the mystery person

**🚀 Features:**
- Easy-to-use slash commands
- Beautiful interactive messages
- No setup required - just invite and play!
- Works in any Discord server

## 🎯 How to Use

Once the bot is in your server, try these commands:

```
/help           - See all available commands
/spyfall create - Start a new Spyfall game
/truthordare start - Begin Truth or Dare
/whoami start   - Play Who Am I
```

## � Setup Guide

### What You Need First

Before you start, make sure you have:
- **Node.js 18 or newer**
- **A Discord Bot Token**

### Step 1: Get the Code

```bash
git clone <repository_url>
cd PartyGameBot
```

### Step 2: Install Everything

```bash
npm install
```

### Step 3: Setup Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` in any text editor and add your bot details:
   ```
   TOKEN=bot_token_here
   CLIENT_ID=client_id_here
   ```

### Step 4: Register Commands

```bash
npm run deploy
```

### Step 5: Start The Bot

   ```bash
   # For production
   npm start

   # For development (auto-restart on changes)
   npm run dev
   ```

That's it! Your bot should now be online and ready to play games! 🎉

## 🛠️ For Developers

### Development Commands

```bash
npm run dev      # Start with auto-restart on code changes
npm run lint     # Check code style
npm run test     # Run tests
```

### Adding New Games

1. Create a new file in `src/commands/games/`
2. Follow the existing game patterns
3. Use the GameManager for handling game state
4. Test your game thoroughly!

## 📋 Bot Permissions

Make sure your bot has these Discord permissions:
- Send Messages
- Use Slash Commands  
- Embed Links
- Read Message History


## 🤝 Contributing

Want to help make this bot better?

1. Fork this repository
2. Create a new branch: `git checkout -b my-new-feature`
3. Make your changes and test them
4. Commit: `git commit -m 'Add some feature'`
5. Push: `git push origin my-new-feature`  
6. Submit a pull request!

## � License

This project is open source under the MIT License. See [LICENSE](LICENSE) for details.

## 🆘 Support

- Create an issue for bug reports
- Join our Discord server for help
- Check the logs for troubleshooting

## 🎯 Roadmap

- [ ] Database integration for persistent game stats
- [ ] Web dashboard for bot management
- [ ] More party games (Mafia, Codenames, etc.)
- [ ] Custom game creation
- [ ] Tournament modes
- [ ] User profiles and achievements

---

**Made with ❤️ for Discord communities everywhere!**
