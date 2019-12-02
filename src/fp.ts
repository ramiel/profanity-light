import ProfanityFactory, {
  OverridableProfanityConfig,
  ProfanityConfig,
  Dictionary,
} from '.';

interface FPProfanityFilter {
  /**
   * Check if a text contains profanity. Return true if so.
   */
  check: (dictionaryName: string, text: string) => boolean;
  /**
   * Sanitize a text replacing all profanity with the configured replacer options.
   * The replacement options can be overwritten through the last parameter, i.e.
   * sanitize('a text to check', 'en', {replacer: '#!@', replaceByWord: true})
   */
  sanitize: (
    dictionaryName: string,
    override: OverridableProfanityConfig,
    text: string,
  ) => string;

  /**
   * Add an array of words to a dictionary.
   * Words can contain regexp like character
   * i.e.
   * "flowers?", "bee\w{1}", "d(u|*)cks"
   */
  addWords: (dictionaryName: string, words: string[]) => void;
  /**
   * Remove an array of words from a dictionary.
   */
  removeWords: (dictionaryName: string, words: string[]) => void;
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
}

// @ts-ignore
const curry = (fn, ...args) =>
  args.length >= fn.length ? fn(...args) : curry.bind(null, fn, ...args);

const createFPProfanity: (cfg?: ProfanityConfig) => FPProfanityFilter = (
  cfg,
) => {
  const profanity = ProfanityFactory(cfg);
  return {
    ...profanity,
    check: curry((dictionaryName: string, text: string) =>
      profanity.check(text, dictionaryName),
    ),
    sanitize: curry(
      (
        dictionaryName: string,
        override: OverridableProfanityConfig,
        text: string,
      ) => profanity.sanitize(text, dictionaryName, override),
    ),
    addWords: curry((dictionaryName: string, words: string[]) =>
      profanity.addWords(words, dictionaryName),
    ),
    removeWords: curry((dictionaryName: string, words: string[]) =>
      profanity.removeWords(words, dictionaryName),
    ),
  };
};

export default createFPProfanity;
