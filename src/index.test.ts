import ProfanityFactory from './index';

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
});
