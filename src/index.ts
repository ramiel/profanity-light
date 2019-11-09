type Replacer = string | ((word: string) => string);

interface ProfanityConfig {
  dictionary?: Dictionary;
  replacer?: Replacer;
  replaceByWord?: boolean;
}

interface OverridableProfanityConfig extends Pick<ProfanityConfig, 'replacer' | 'replaceByWord'> {}

type ProfanityFactoryType = (
  cfg?: ProfanityConfig,
) => {
  /**
   * Check if a text contains profanity. Return true if so.
   */
  check: (text: string, dictionaryName?: string) => boolean;
  /**
   * Sanitize a text replacing all profanity with the configured replacer options.
   * The replacement options can be overwritten through the last parameter, i.e.
   * sanitize('a text to check', 'en', {replacer: '#!@', replaceByWord: true})
   */
  sanitize: (text: string, dictionaryName?: string, override?: OverridableProfanityConfig) => string;

  /**
   * Add an array of words to a dictionary.
   * Words can contain regexp like character
   * i.e.
   * "flowers?", "bee\w{1}", "d(u|*)cks"
   */
  addWords: (words: string[], dictionaryName?: string) => void;
  /**
   * Remove an array of words from a dictionary.
   */
  removeWords: (words: string[], dictionaryName?: string) => void;
  /**
   * Return a dictionary. If no name is provided, the default dictionary is returned
   */
  getDictionary: (dictionaryName?: string) => Dictionary;
  /**
   * Add a dictionary to the list of dictionaries
   */
  addDictionary: (dictionary: Dictionary) => void;
  /**
   * Remove a dictionary from the list of dictionaries
   */
  removeDictionary: (dictionaryName?: string) => void;
  /**
   * Clean the content of the dictionary by removing all the saved words and regular expression
   */
  cleanDictionary: (dictionaryName?: string) => void;
};

type Dictionary = {
  name: string;
  words: string[];
  regexp?: RegExp | null;
  symbolAlternatives?: { [c: string]: string[] } | null;
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
    a: ['4', 'à'],
    e: ['3', '&', '€', 'é', 'è'],
    i: ['1', 'ì', '\\|'],
    o: ['0', 'ò'],
    b: ['8'],
    s: ['\\$'],
    t: ['7', '\\+'],
  },
});

type GetReplacer = (replacer: Replacer, replaceByWord: boolean) => ((word: string) => string);
const getReplacer: GetReplacer = (replacer, replaceByWord) => {
  if(replacer instanceof Function) {
    return replacer;
  }
  return replaceByWord 
    ? () => replacer
    : (word: string) => replacer.repeat(word.length);
}


const defaultConfig = {
  replaceByWord: false,
  replacer: '*',
};

const DEF_DICT_NAME = 'default';

export const ProfanityFactory: ProfanityFactoryType = (config = defaultConfig) => {
  const {
    dictionary,
    replaceByWord,
    replacer,
  } = { ...defaultConfig, ...config  };
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
    removeWords: (words, dictionaryName = DEF_DICT_NAME) => {
      const dict = getOrCreateDictionary(dictionaryName);
      dict.words = dict.words.filter(w => words.indexOf(w) === -1);
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
    sanitize: (text, dictionaryName = DEF_DICT_NAME, override = {}) => {
      const words = text.split(' ');
      const dict = getOrCreateDictionary(dictionaryName);
      const replaceFunc = getReplacer(
        override.replacer || replacer, 
        override.replaceByWord !== undefined ? override.replaceByWord : replaceByWord
      );
      return words
        .map((word) => (checkWord(word, dict) ? replaceFunc(word) : word))
        .join(' ');
    },
    addDictionary: (dictionary) => {
      if(dictionaries.has(dictionary.name)) {
        throw new Error(`Dictionary "${dictionary.name}" already exists`);
      }
      dictionary.regexp = buildRegexp(dictionary);
      dictionaries.set(dictionary.name, dictionary);
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
