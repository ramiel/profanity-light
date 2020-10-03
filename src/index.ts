type Replacer = string | ((word: string) => string);

interface ProfanityConfig {
  dictionary?: Dictionary;
  replacer?: Replacer;
  replaceByWord?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface OverridableProfanityConfig
  extends Pick<ProfanityConfig, 'replacer' | 'replaceByWord'> {}

export interface ProfanityFilter {
  /**
   * Check if a text contains profanity. Return true if so.
   */
  check: (text: string, dictionaryName?: string) => boolean;
  /**
   * Sanitize a text replacing all profanity with the configured replacer options.
   * The replacement options can be overwritten through the last parameter, i.e.
   * sanitize('a text to check', 'en', {replacer: '#!@', replaceByWord: true})
   */
  sanitize: (
    text: string,
    dictionaryName?: string,
    override?: OverridableProfanityConfig,
  ) => string;

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
   * Return true if the dictionary exists
   */
  hasDictionary: (dictionaryName: string) => boolean;
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

  /**
   * Return a filter with a similar set of functions where the dictionaryName parameter is already defined
   */
  getFilterByDictionary: (
    dictionaryName?: string,
  ) => {
    check: (text: string) => boolean;
    sanitize: (text: string, override?: OverridableProfanityConfig) => string;
    addWords: (words: string[]) => void;
    removeWords: (words: string[]) => void;
    getDictionary: () => Dictionary;
    cleanDictionary: () => void;
  };
}

type ProfanityFactoryType = (cfg?: ProfanityConfig) => ProfanityFilter;

type Dictionary = {
  name: string;
  words: string[];
  regexp?: RegExp | null;
  symbolAlternatives?: { [c: string]: string[] } | null;
};

const buildRegexp = (dictionary: Dictionary): RegExp => {
  const content = dictionary.words
    .map((word) => {
      // i.e. replace 'o' with '(o|0)'
      if (!dictionary.symbolAlternatives) return word;
      Object.entries(dictionary.symbolAlternatives).forEach(
        ([char, replaces]) => {
          word = word.replace(
            new RegExp(`(?<!\\\\)${char}`, 'gmi'),
            `(?:${replaces.concat(char).join('|')})`,
          );
        },
      );
      return word;
    })
    .join('|');
  return new RegExp(`(?<=\\W+|^)(${content})(?=\\W+|$)`, 'gmi');
};

const checkWord = (word: string, dictionary: Dictionary): boolean =>
  dictionary.regexp?.test(word) || false;

export const getDefaultDictionary: (name?: string) => Dictionary = (name) => ({
  name: name || 'default',
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

type GetReplacer = (
  replacer: Replacer,
  replaceByWord: boolean,
) => (word: string) => string;
const getReplacer: GetReplacer = (replacer, replaceByWord) => {
  if (replacer instanceof Function) {
    return replacer;
  }
  return replaceByWord
    ? () => replacer
    : (word: string) => replacer.repeat(word.length);
};

const defaultConfig = {
  replaceByWord: false,
  replacer: '*',
};

const DEF_DICT_NAME = 'default';

export const ProfanityFactory: ProfanityFactoryType = (
  config = defaultConfig,
) => {
  const { dictionary, replaceByWord, replacer } = {
    ...defaultConfig,
    ...config,
  };
  const dictionaries = new Map<string, Dictionary>();

  if (dictionary) {
    dictionaries.set(dictionary.name || DEF_DICT_NAME, dictionary);
  }

  const getOrCreateDictionary = (key: string) => {
    if (dictionaries.has(key)) {
      return dictionaries.get(key) as Dictionary;
    }
    const dict = getDefaultDictionary(key);
    dictionaries.set(dict.name, dict);
    return dict;
  };

  const filter: ProfanityFilter = {
    addWords: (words, dictionaryName = DEF_DICT_NAME) => {
      const dict = getOrCreateDictionary(dictionaryName);
      dict.words = [...dict.words, ...words];
      dict.regexp = buildRegexp(dict);
    },
    removeWords: (words, dictionaryName = DEF_DICT_NAME) => {
      const dict = getOrCreateDictionary(dictionaryName);
      dict.words = dict.words.filter((w) => words.indexOf(w) === -1);
      dict.regexp = buildRegexp(dict);
    },
    check: (text, dictionaryName = DEF_DICT_NAME) => {
      const dict = getOrCreateDictionary(dictionaryName);
      return checkWord(text, dict);
    },
    sanitize: (text, dictionaryName = DEF_DICT_NAME, override = {}) => {
      const dict = getOrCreateDictionary(dictionaryName);
      if (!dict.regexp) return text;
      const replaceFunc = getReplacer(
        override.replacer || replacer,
        override.replaceByWord !== undefined
          ? override.replaceByWord
          : replaceByWord,
      );
      return text.replace(dict.regexp, replaceFunc);
    },
    hasDictionary: (dictionaryName) => {
      return dictionaries.has(dictionaryName);
    },
    addDictionary: (dictionary) => {
      if (dictionaries.has(dictionary.name)) {
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

    getFilterByDictionary: (dictionaryName = DEF_DICT_NAME) => ({
      check: (text) => filter.check(text, dictionaryName),
      sanitize: (text, override) =>
        filter.sanitize(text, dictionaryName, override),
      cleanDictionary: () => filter.cleanDictionary(dictionaryName),
      addWords: (words) => filter.addWords(words, dictionaryName),
      getDictionary: () => filter.getDictionary(dictionaryName),
      removeWords: (words) => filter.removeWords(words, dictionaryName),
    }),
  };

  return filter;
};

export default ProfanityFactory;
