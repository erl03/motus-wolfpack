// Run dotenv
require('dotenv').config();
const fs = require('fs');
const readline = require('readline');
const { Client, Intents } = require('discord.js');
const { defaultState, commands } = require('./commands');

const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
  ],
});
const CORPUS_PATH = 'corpus.txt';
const stream = fs.createReadStream(CORPUS_PATH);
const myInterface = readline.createInterface({
  input: stream,
});

const gamesByChannel = {
};

const wordsByLength = {};

const loadCorpus = async () => {
  console.log('starting...');
  for await (const line of myInterface) {
    const lengthStr = line.length.toString();
    if (Object.keys(wordsByLength).includes(lengthStr)) {
      wordsByLength[lengthStr].push(line);
    } else {
      wordsByLength[lengthStr] = [line];
    }
  }
  console.log('corpus word statistics:');
  console.table(Object.entries(wordsByLength).map((e) => ({ length: e[0], count: e[1].length })));
};
loadCorpus();

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

const parse = (msg) => {
  const tokens = msg.content.split(' ');
  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];
    if (token.startsWith('!')) {
      const command = token.substring(1);
      if (command === 'ping' || command === 'state') {
        return {
          command,
          args: [],
          errorMsg: '',
        };
      }
      if (i + 1 < tokens.length) {
        return {
          command,
          args: tokens.slice(i + 1),
          errorMsg: 'il ya une erreur de saisie',
        };
      }
      return {
        command: 'Merci de commencer le jeu avec la commande !start {et un chiffre entre 2 & 19 inclus} avant de deviner!',
        args: [],
        errorMsg: `Could not find arguments for command ${command}.`,
      };
    }
  }
  return {
    command: ' il ya une erreur de saisie',
    args: [],
    errorMsg: 'Could not find a valid command in message',
  };
};

const executeCommand = (msg, commandObj) => {
  const commandFunc = commands[commandObj.command];
  if (commandFunc != null) {
    const gameState = gamesByChannel[msg.channelId] || defaultState();
    const replyObj = commandFunc(commandObj.args, wordsByLength, gameState);
    gamesByChannel[msg.channelId] = replyObj.gameState;
    return replyObj.reply;
  }
  return `${commandObj.command}`;
};

client.on('messageCreate', (msg) => {
  const botMentioned = Boolean(msg.mentions.users.get(client.user.id));
  const messageNotBot = msg.author.id !== client.user.id;
  if (botMentioned && messageNotBot) {
    const commandObj = parse(msg);
    try {
      if (commandObj.command === 'error') {
        throw commandObj.errorMsg;
      } else {
        msg.reply(executeCommand(msg, commandObj));
      }
    } catch (error) {
      console.error(error);
      msg.reply(`'\u{1F62A}'Je ne peux pas démarrer le jeu avec un mot de cette longueur`);
    }
  }
});

client.login(process.env.TOKEN);