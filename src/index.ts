interface ProfanityConfig {
  dictionary?: Dictionary;
  replacer?: string;
  replaceByWord?: boolean;
}

interface OverridableProfanityConfig extends ProfanityConfig {}

type ProfanityFactoryType = (
  cfg?: ProfanityConfig,
) => {
  /**
   * Check if a text contains profanity. Return true if so.
   */
  check: (text: string, dictionaryName?: string) => boolean;
  /**
   * Sanitize a text replacing all profanity with the configured replacer
   */
  sanitize: (text: string, dictionaryName?: string) => string;

  /**
   * Add an array of words to a dictionary.
   * Words can contain regexp like character
   * i.e.
   * "flowers?", "bee\w{1}", "s(u|*)cks"
   */
  addWords: (words: string[], dictName?: string) => void;
  /**
   * Return a dictionary. If no name is provided, the default dictionary is returned
   */
  getDictionary: (name?: string) => Dictionary;
  /**
   * Remove a dictionary from the list of dictionaries
   */
  removeDictionary: (name?: string) => void;
  /**
   * Clean the content of the dictionary by removing all the saved words and regular expression
   */
  cleanDictionary: (name?: string) => void;
};

type Dictionary = {
  name: string;
  words: string[];
  regexp: RegExp | null;
  symbolAlternatives: { [c: string]: string[] } | null;
};

const buildRegexp = (dictionary: Dictionary) => {
  const content = dictionary.words
    .map((word) => {
      // i.e. replace 'o' with '(o|0)'
      if (!dictionary.symbolAlternatives) return word;
      Object.entries(dictionary.symbolAlternatives).forEach(
        ([char, replaces]) => {
          word = word.replace(
            new RegExp(`${char}`, 'gmi'),
            `(${replaces.concat(char).join('|')})`,
          );
        },
      );
      return word;
    })
    .join('|');
  return new RegExp(`(\\W+|^)(${content})(\\W+|$)`, 'gmi');
};

const checkWord = (word: string, dictionary: Dictionary) =>
    dictionary.regexp?.test(word) || false; // eslint-disable-line prettier/prettier

export const getDefaultDictionary: () => Dictionary = () => ({
  name: 'default',
  words: [],
  regexp: null,
  symbolAlternatives: {
    o: ['0'],
    e: ['3', '&', '€', 'é', 'è'],
    a: ['4'],
    s: ['\\$'],
  },
});

const defaultConfig: ProfanityConfig = {
  replaceByWord: false,
  replacer: '***',
};

const DEF_DICT_NAME = 'default';

const ProfanityFactory: ProfanityFactoryType = (config = defaultConfig) => {
  const {
    dictionary,
    // replaceByWord,
    replacer,
  } = { ...defaultConfig, ...config };
  const dictionaries = new Map<string, Dictionary>();

  if (dictionary) {
    dictionaries.set(dictionary.name || DEF_DICT_NAME, dictionary);
  }

  const getOrCreateDictionary = (key: string) => {
    if (dictionaries.has(key)) {
      return dictionaries.get(key) as Dictionary;
    }
    const dict = getDefaultDictionary();
    dictionaries.set(dict.name, dict);
    return dict;
  };

  

  return {
    addWords: (words, dictionaryName = DEF_DICT_NAME) => {
      const dict = getOrCreateDictionary(dictionaryName);
      dict.words = [...dict.words, ...words];
      dict.regexp = buildRegexp(dict);
    },
    check: (text, dictionaryName = DEF_DICT_NAME) => {
      const dict = getOrCreateDictionary(dictionaryName);
      const words = text.split(' ');
      let found = false;
      let count = 0;
      while (found === false && count < words.length) {
        found = checkWord(words[count], dict);
        count += 1;
      }
      return found;
    },
    sanitize: (text, dictionaryName = DEF_DICT_NAME) => {
      const words = text.split(' ');
      const dict = getOrCreateDictionary(dictionaryName);
      return words
        .map((word) => (checkWord(word, dict) ? replacer : word))
        .join(' ');
    },

    getDictionary: (name = DEF_DICT_NAME) => getOrCreateDictionary(name),
    removeDictionary: (name = DEF_DICT_NAME) => dictionaries.delete(name),
    cleanDictionary: (name = DEF_DICT_NAME) => {
      const dict = getOrCreateDictionary(name);
      dict.words = [];
      dict.regexp = buildRegexp(dict);
    },
  };
};

export default ProfanityFactory;
