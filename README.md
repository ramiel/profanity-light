# Profanity Light

[![NPM version](https://badgen.net/npm/v/profanity-light)](https://www.npmjs.com/package/profanity-light)
[![CircleCI](https://circleci.com/gh/ramiel/profanity-light.svg?style=shield&circle-token=a021f959a4ef34279c2ac4ac0e5070ed27e2d264)](https://circleci.com/gh/ramiel/profanity-light)
[![Minified + zipped size](https://badgen.net/bundlephobia/minzip/profanity-light)](https://bundlephobia.com/result?p=profanity-light)

A lightweight and highly customizable profanity cheker. No dictionary is included to reduce the bundle size, and you can add you dictionary fo words with its set of rules!


## Features

- ☁️ Lightweight. No dictionary included to keep the bundle size limited ~1kb!
- ⚙️ Customizable: each language is different from another so the rule to find bad words. Customize your dictionary to be efficient. Not everyone speaks English 🙂
- 🔋 Batteries included. Sanitize a word changing each letter or the whole word. Pass your custom replacer. Define any alternative symbol to a letter ( e = e,3,&,é,è...and so on)
- 💐 Overwrite the single option on each call without the needs to re-instantiate the filter!
- I mentioned it's written in Typescript?!

## Install

`yarn add profanity-light`

or 

`npm i profanity-light`

## Usage

Profanity light comes with an empty dictionary. After you instantiate a filter you can add words to the default dictionary or add one or more dictionaries. Each dictionary comes with its own set of rules. For the moment let's see how to use the default dictionary

```js
import filterFactory from 'profanity-light';

// Instantiate a filter
const filter = filterFactory();

// This filter has an empty dictionary included. Let's add some word
filter.addWords(['flower']);

// Use check to know if a text contains any forbidden word
filter.check('A flower is just a flower');
// the above returns true
```

## Adding words: a deep dive

The words you add are checked with a case-insensitive alghoritm, so don't bother to add the upper-case variant. Each word can have many declination like plurals or masculin/feminine. To cover all the cases you can consider that you can add little regural expressions parts in your word

```js
filter.addWords(['flowers?']);

// In this case both the singular and plural version of the word are found
filter.check('a flower'); // true
filter.check('two flowers'); // true
```

Another example in Italian

```js
filter.addWords(['can(e|i|gn.+)']);
filter.check('il cane mi morse'); // true
filter.check('i cani abbaiarono'); // true
filter.check('le cagne ebbero dei cuccioli'); // true
filter.check('il cagnolone era immenso'); // true
```

This very expressive way of defining words will cover most of the cases. Then remember that people is smart... they will find a way 😉

## Symbol replacement

Usually a word can be spelled with different characters to overcame a limitation. For example `flower` can be spelled `fl0wer`. Each dictionary, included the standard one, has a set of symbol replacements

```
o = 0
a = 4 @
s = $
e = e é è 3 € &
... and so on
```

Don't worry to define all the possible characters when defining a word. For example the word `flowers?` will be matched also against `fl0wer` and `fl0wer$`!

Each dictionary can have a different set of symbol replacement, but we'll see this later when we'll add custom dictionaried.

**NOTE**: If a symbol has a meaning in a regexp, it must be escaped, i.e. '\\$'  '\\{'

## Sanitize

Sanitize is a function to replace bad words in a text

```js
filter.sanitize('A flower is a flower');

// this outputs "A ****** is a ******"
```

You can change the replacement character with the option `replacer`.

```js
const filter = filterFactory({replacer: 'X'})
filter.sanitize('A flower is a flower');

// this outputs "A XXXXXX is a XXXXXX"
```

You can decide to replace the entire word with a symbol

```js
const filter = filterFactory({replacer: '***', replaceByWord: true})
filter.sanitize('A flower is a flower');

// this outputs "A *** is a ***"
```

You can also provide your replace function

```js
const filter = filterFactory({replacer: w => w.split('').reverse().join('')})
filter.sanitize('A flower is a flower');

// this outputs "A rewolf is a rewolf"
```

The options can also be changed on each call to `sanitize`

```js
const filter = filterFactory({replacer: 'X'});
// change option on the fly just for this call
filter.sanitize('A flower is a flower', undefined, {replacer: '*'});

// this outputs "A ****** is a ******"
```

## Wroking with more dictionaries

You may wat to work with several dictionaries, for example to address different languages. A simple way to do this is to pass a second parameter to each function and specify a dictionary.

```js
filter.addWords(['fiore', 'ape'], 'it');
```

Since we never created a dictionary called 'it', it is created on the fly here and then reused. The name has no particular meaning, it's just for you. The dictionary is based on the default one. We'll see later how to create a completely different one, for example to define a different set of symbol replacements.

Here an example of check with two different dictionaries.

```js
filter.addWords(['fiore', 'ape'], 'it');
filter.addWords(['fluer', 'abeille'], 'fr');

filter.check('fiore', 'it'); // true, this is a forbidden word in dictionary 'it'

filter.check('fiore', 'fr'); // false, this is allowed in dictionary 'fr'
```

## Add a dictionary with its rules

You can create a new dictionary with a set of rules

```js
filter.addDictionary('{
  name: 'it',
  words:['fiore', 'ape'],
  symbolAlternatives: {
    a: ['4', '@'],
    // ...
  }
});
```

A good way to create a dictionary is to directly extend the default one

```js
import { getDefaultDictionary } from 'profanity-light';

const defaultDict = getDefaultDictionary();

filter.addDictionary({
  ...defaultDict,
  name: 'it',
  words: ['fiore', 'ape'],
  symbolAlternatives: {
    ...defaultDict,
    a: [...defaultDict.symbolAlternatives.a, '4', '@'],
    // ...
  }
});
```


## Use a filter bound to a dictionary

If you plan to use one specific dictionary you may find annoying to pass everytime the dictionary.
You can obtain a filter that is bound to a specific dictionary by using `getFilterByDictionary`.

```js
import filterFactory from 'profanity-light';

// Instantiate a filter
const filter = filterFactory();

// This filter has an empty dictionary included. Let's add some word
filter.addWords(['flower'], 'en');
filter.addWords(['fiore'], 'it');

// Now every method is bound to the 'it' dictionary and you don't need to specify it anymore
const italianFilter = filter.getFilterByDictionary('it');

italianFilter.check('Un fiore per voi, mia signora'); // true
```

NOTE: The bounded filters miss the `addDictionary` and `removeDictionary` methods.

## API

`profanityFactory` is a function that create a filter. It accept an optionl `configuration` object with the following properties

- `dictionary?: Dictionary`  an optional initial dictionary
- `replacer?: Replacer` A replacer string or function.    
      i.e. `'***'` or `(word) => word.slice(0,2)`    
      Default: **'*'**
- `replaceByWord?: boolean` If true use the replacer to replace the entire word, otherwise the replace will replace each letter of the word. If the replacer is a function this option is ignored.    
      Default: **true**

A `Dictionary` is an object with the following properties

- `name: string` A mandatory name
- `words: string[]` A list of words. Can be empty
- `symbolAlternatives?: { [c: string]: string[] } | null` An optional symbol alternatives list

The `filter` object has the following methods

```js
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
```
