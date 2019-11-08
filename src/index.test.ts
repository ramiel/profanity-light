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
    });

    describe('replace profanity', () => {
      test('can replace one profanity', () => {
        filter.addWords(['flower', 'bees']);
        expect(filter.sanitize('a flower')).toEqual('a ***');
      });

      test('can replace more profanity', () => {
        filter.addWords(['flower', 'bees']);
        expect(
          filter.sanitize('a flower is just a flower and nothing else'),
        ).toEqual('a *** is just a *** and nothing else');
      });

      test('can replace more profanity with some changed letter', () => {
        filter.addWords(['flowers?']);
        expect(
          filter.sanitize('a flower$ is just a fl0wer and nothing else'),
        ).toEqual('a *** is just a *** and nothing else');
      });
    });
  });
});
