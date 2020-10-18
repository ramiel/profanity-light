import ProfanityFactory, { ProfanityFilter } from './index';

describe('Profanity Light', () => {
  test('can be instantiated without arguments', () => {
    expect(() => ProfanityFactory()).not.toThrowError();
  });

  test('can add word to the default dictionary', () => {
    const filter = ProfanityFactory();
    filter.addWords(['flower', 'bees']);
    const dict = filter.getDictionary();
    expect(dict).toHaveProperty('words');
    expect(dict.words).toHaveLength(2);
    expect(dict.words).toEqual(['flower', 'bees']);
  });

  describe('Working with the default dictionary', () => {
    const filter = ProfanityFactory();

    beforeEach(() => {
      filter.cleanDictionary();
    });

    describe('check profanity', () => {
      test('reports a bad word', () => {
        filter.addWords(['flower', 'bees']);
        expect(filter.check('a flower')).toBe(true);
      });

      test('reports a bad word followed by a symbol', () => {
        filter.addWords(['flower', 'bees']);
        expect(filter.check('a flower!')).toBe(true);
      });

      test('reports a bad word before a diacritic sign', () => {
        filter.addWords(['flower', 'bees']);
        expect(filter.check('a flower!')).toBe(true);
      });

      test('reports a bad word after a diacritic sign', () => {
        filter.addWords(['flower', 'bees']);
        expect(filter.check('a !flower')).toBe(true);
      });

      test('given the word "flowers?" reports "flower"', () => {
        filter.addWords(['flowers?', 'bees']);
        expect(filter.check('a flower')).toBe(true);
      });

      test('can report twice', () => {
        filter.addWords(['flower', 'bees']);
        expect(filter.check('a flower')).toBe(true);
        expect(filter.check('a flower!')).toBe(true);
        expect(filter.check('a flower and a bee on it')).toBe(true);
      });

      test('given the word "flowers?" reports "flowers"', () => {
        filter.addWords(['flowers?', 'bees']);
        expect(filter.check('a flowers')).toBe(true);
      });

      test('given the word "flower" reports "fl0wer"', () => {
        filter.addWords(['flowers?', 'bees']);
        expect(filter.check('a fl0wers')).toBe(true);
      });

      test('given the word "flowers" reports "fl0wer$"', () => {
        filter.addWords(['flowers']);
        expect(filter.check('a fl0wer$')).toBe(true);
      });

      test('given the word "flower" reports "flow&r"', () => {
        filter.addWords(['flower']);
        expect(filter.check('a flow&r')).toBe(true);
      });

      test('reports two bad words (same)', () => {
        filter.addWords(['flower', 'bees']);
        expect(filter.check('a flower and another flower')).toBe(true);
      });

      test('reports two bad word (different)', () => {
        filter.addWords(['flower', 'bees']);
        expect(filter.check('two bees on flower')).toBe(true);
      });

      test('do not report a bad word contained in another', () => {
        filter.addWords(['ass']);
        expect(filter.check('assassin')).toBe(false);
      });

      test('can report a word with spaces', () => {
        filter.addWords(['sun flower', 'car']);
        expect(
          filter.check('two bees are on the sun flower in the night'),
        ).toBe(true);
      });

      test('can report a word with multiple spaces spaces', () => {
        filter.addWords(['sun\\s+flower', 'car']);
        expect(
          filter.check('two bees are on the sun   flower in the night'),
        ).toBe(true);
      });

      test('a word removed from a dictionary is not considered profanity anymore', () => {
        filter.addDictionary({ name: 'fr', words: ['fountain', 'verde'] });
        filter.addWords(['flower', 'bees']);
        filter.removeWords(['flower']);
        expect(filter.check('a flower is a flower')).toBe(false);
      });
    });

    describe('replace profanity', () => {
      test('can replace one profanity: flower -> ******', () => {
        filter.addWords(['flower', 'bees']);
        expect(filter.sanitize('a flower')).toEqual('a ******');
      });

      test('can replace more profanity: flower -> ******', () => {
        filter.addWords(['flower', 'bees']);
        expect(
          filter.sanitize('a flower is just a flower and nothing else'),
        ).toEqual('a ****** is just a ****** and nothing else');
      });

      test('can replace multiple times', () => {
        filter.addWords(['flower', 'bees']);
        expect(
          filter.sanitize('a flower is just a flower and nothing else'),
        ).toEqual('a ****** is just a ****** and nothing else');
        expect(filter.sanitize('a flower')).toEqual('a ******');
      });

      test('can replace more profanity with some changed letter:  flower$ or flo0wer -> ******', () => {
        filter.addWords(['flowers?']);
        expect(
          filter.sanitize('two flower$ are just a fl0wer and another flower'),
        ).toEqual('two ******* are just a ****** and another ******');
      });

      test('can replace profanity by word when the configuration "replaceByWord" is true: flower -> ***', () => {
        const newFilter = ProfanityFactory({
          replaceByWord: true,
          replacer: '***',
        });
        newFilter.addWords(['flower']);
        expect(
          newFilter.sanitize('a flower is just a flower and nothing else'),
        ).toEqual('a *** is just a *** and nothing else');
      });

      test('can replace profanity using a custom replacer: flower -> rewolf', () => {
        const newFilter = ProfanityFactory({
          replacer: (word) =>
            word
              .split('')
              .reverse()
              .join(''),
        });
        newFilter.addWords(['flower']);
        expect(
          newFilter.sanitize('a flower is just a flower and nothing else'),
        ).toEqual('a rewolf is just a rewolf and nothing else');
      });

      test('can override option for a single call only', () => {
        const newFilter = ProfanityFactory({
          replaceByWord: true,
          replacer: '**',
        });
        newFilter.addWords(['flower']);
        expect(
          newFilter.sanitize(
            'a flower is just a flower and nothing else',
            undefined,
            { replaceByWord: false },
          ),
        ).toEqual('a ************ is just a ************ and nothing else');
      });

      test('can replace a profanity repeated', () => {
        filter.addWords(['flowers?']);
        expect(filter.sanitize('flower flower and flower')).toEqual(
          '****** ****** and ******',
        );
      });

      test('can replace a profanity that contains a space', () => {
        filter.addWords(['sun flower']);
        expect(
          filter.sanitize(
            'the sun flower is yellow but the sun flower is not red',
          ),
        ).toEqual('the ********** is yellow but the ********** is not red');
      });

      test('can replace a profanity that contains arbitrary spaces', () => {
        filter.addWords(['sun\\s+flower']);
        expect(
          filter.sanitize(
            'the sun    flower is yellow but the $un flower is not red',
          ),
        ).toEqual('the ************* is yellow but the ********** is not red');
      });

      test('with no word, the orginal text is returned', () => {
        expect(filter.sanitize('a flower')).toEqual('a flower');
      });
    });

    describe('use more dictionaries', () => {
      beforeEach(() => {
        filter.removeDictionary('fr');
      });

      test('a new dictionary can be added', () => {
        expect(() =>
          filter.addDictionary({ name: 'fr', words: ['fountain', 'verde'] }),
        ).not.toThrow();
      });

      test('the same dictionary cannot be added twice', () => {
        filter.addDictionary({ name: 'fr', words: ['fountain', 'verde'] });

        expect(() =>
          filter.addDictionary({ name: 'fr', words: ['fountain', 'verde'] }),
        ).toThrow(`Dictionary "fr" already exists`);
      });

      test('a dictionary existence can be checked', () => {
        filter.addDictionary({ name: 'fr', words: ['fountain', 'verde'] });
        expect(filter.hasDictionary('fr')).toBe(true);
      });

      test('a disctionary can be added at definition time', () => {
        const myfilter = ProfanityFactory({
          dictionary: {
            name: 'fr',
            words: ['fleur'],
          },
        });
        expect(myfilter.hasDictionary('fr')).toBe(true);
      });

      test('given two dictionary, a word is considered profanity only in one', () => {
        filter.addDictionary({ name: 'fr', words: ['fountain', 'verde'] });
        expect(filter.check('fountain')).toBe(false);
        expect(filter.check('fountain', 'fr')).toBe(true);
      });

      test('a word removed from a dictionary is not considered profanity anymore', () => {
        filter.addDictionary({ name: 'fr', words: ['fountain', 'verde'] });
        filter.removeWords(['fountain'], 'fr');
        expect(filter.check('fountain', 'fr')).toBe(false);
      });
    });
  });

  describe('Working with a pre-chosen dictionary', () => {
    let profanity: ProfanityFilter;

    beforeAll(() => {
      profanity = ProfanityFactory();
      profanity.addWords(['fiore', 'ape'], 'it');
      profanity.addWords(['flower', 'bees']);
    });

    test('return a subset of functions for the default dictionary', () => {
      const filter = profanity.getFilterByDictionary();
      expect(filter).toHaveProperty('check');
      expect(filter).toHaveProperty('sanitize');
      expect(filter).toHaveProperty('addWords');
      expect(filter).toHaveProperty('removeWords');
      expect(filter).toHaveProperty('getDictionary');
      expect(filter).toHaveProperty('cleanDictionary');
    });

    test('return a subset of functions for the "it" dictionary', () => {
      const filter = profanity.getFilterByDictionary('it');
      expect(filter).toHaveProperty('check');
      expect(filter).toHaveProperty('sanitize');
      expect(filter).toHaveProperty('addWords');
      expect(filter).toHaveProperty('removeWords');
      expect(filter).toHaveProperty('getDictionary');
      expect(filter).toHaveProperty('cleanDictionary');
    });

    test('"it" dictionary matches fiore', () => {
      const filter = profanity.getFilterByDictionary('it');
      expect(filter.check('fiore')).toBe(true);
    });

    test('"it" dictionary doesnt match flower', () => {
      const filter = profanity.getFilterByDictionary('it');
      expect(filter.check('flower')).toBe(false);
    });

    test('"it" dictionary can sanitize a word', () => {
      const filter = profanity.getFilterByDictionary('it');
      expect(filter.sanitize('un fiore per te')).toEqual('un ***** per te');
    });

    test('"it" dictionary can be cleaned', () => {
      const filter = profanity.getFilterByDictionary('it');
      filter.cleanDictionary();
      expect(filter.getDictionary().words).toHaveLength(0);
    });

    test('a word can be added to "it" dictionary', () => {
      const filter = profanity.getFilterByDictionary('it');
      filter.addWords(['mela']);
      expect(filter.check('mela')).toBe(true);
    });

    test('a word can be removed to "it" dictionary', () => {
      const filter = profanity.getFilterByDictionary('it');
      filter.removeWords(['fiore']);
      expect(filter.check('fiore')).toBe(false);
    });
  });
});
