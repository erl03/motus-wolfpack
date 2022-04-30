const VALID_LENGTHS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12' ,'13', '14', '15', '16', '17', '18', '19'];
const LETTERS = Array.from('ãâáabcdeééèëfghiïjklmnñoôöòpqrstuùvwxyýz');
const RESPONSE_EMOJI = {

  0: ':black_large_square:',
  1: ':yellow_square:',
  2: ':green_square:',
};

const defaultState = (started = false, length = -1, word = '', guesses = -1) => ({
  started,
  length,
  word,
  guesses,
  letters: new Set(),
});

const pingFunc = (_args, _wordsByLength, gameState) => ({
  reply: 'pong',
  gameState,
});

const startFunc = (args, wordsByLength, gameState) => {
  if (gameState.started) {
    return {
      reply: 'Un jeu est déjà en cours !',
      gameState,
    };
  }
  const wordLength = args[0];
  if (!VALID_LENGTHS.includes(wordLength)) {
    throw new Error(`Je ne peux pas démarrer le jeu avec un mot d'une longueur de : ${wordLength}. Merci de choisir un chiffre entre 2 & 19 inclus.`);
  }
  const words = wordsByLength[wordLength];
  const randomWord = words[Math.floor(Math.random() * words.length)];
  console.log(`random word ${randomWord} selected`);
  return {
    reply: `On démarre avec un mot d'une longueur de ${wordLength} lettres .`,
    gameState: defaultState(true, parseInt(wordLength, 10), randomWord, 0),
  };
};

const testWord = (guess, answer) => {
  const results = [];
  const letters = new Set();
  for (let i = 0; i < guess.length; i += 1) {
    const char = guess[i];
    if (char === answer[i]) {
      results.push('2');
    } else if (answer.includes(char)) {
      results.push('1');
    } else {
      results.push('0');
      letters.add(char);
    }
  }
  return [results, letters];
};

// const letterText = (failedSet) => \
// LETTERS.map((l) => (failedSet.has(l) ? `~~${l}~~` : l)).join(' ');

const letterText = (failedSet) => LETTERS.filter((l) => !failedSet.has(l)).join(' ');

const guessFunc = (args, _wordsByLength, gameState) => {
  if (gameState.started) {
    const guess = args[0];
    if (guess.length !== gameState.length) {
      return {
        reply: `Ton choix n'est pas de la longueur demandée , recommence!'\u{1F928}'
        `,
        gameState,
      };
    }
    const [testResult, letters] = testWord(args[0], gameState.word);
    const newLetters = new Set([...gameState.letters, ...letters]);
    const numSuccess = testResult.reduce((a, b) => (b === '2' ? a + 1 : a), 0);
    const success = numSuccess === gameState.length;
    const guessCount = gameState.guesses + 1;
    let reply = testResult.map((r) => RESPONSE_EMOJI[r]).join('');
    let newState = {};
    if (success) {
      reply += `\nBravo tu as gagné(e) après ${guessCount} ${guessCount === 1 ? 'tentative' : 'tentatives'} !'\u{1F4A5}'`;
      newState = defaultState();
    } else {
      reply += `\n${letterText(newLetters)}`;
      newState = { ...gameState, guesses: guessCount, letters: newLetters };
    }
    return {
      reply,
      gameState: newState,
    };
  }
  return {
    reply: `Merci de commencer le jeu avec la commande !start {et un chiffre entre 2 & 19 inclus} avant de deviner!`,
    gameState,
  };
};

const stateFunc = (_args, _wordsByLength, gameState) => {
  if (gameState.started) {
    return {
      reply: `Jeu démarré, longueur : ${gameState.length}, Tentative(s) : ${gameState.guesses}`,
      gameState,
    };
  }
  return {
    reply: `Merci de commencer le jeu avec !start {et un chiffre entre 2 & 19 inclus} .`,
    gameState,
  };
};

module.exports = {
  defaultState,
  commands: {
    ping: pingFunc,
    start: startFunc,
    guess: guessFunc,
    state: stateFunc,
  },
};

