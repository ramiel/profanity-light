'use strict';

/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */

function __spreadArrays() {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
}

var buildRegexp = function (dictionary) {
    var content = dictionary.words
        .map(function (word) {
        if (!dictionary.symbolAlternatives)
            return word;
        Object.entries(dictionary.symbolAlternatives).forEach(function (_a) {
            var char = _a[0], replaces = _a[1];
            word = word.replace(new RegExp("" + char, 'gmi'), "(" + replaces.join('|') + ")");
        });
        return word;
    })
        .join('|');
    return new RegExp("(\\W+|^)(" + content + ")\\W+", 'gmi');
};
var defaultDictionary = {
    name: 'default',
    words: [],
    regexp: null,
    symbolAlternatives: null,
};
var defaultConfig = {
    dictionary: defaultDictionary,
    replaceByWord: false,
    replacer: '*',
};
var ProfanityFactory = function (_a) {
    var _b = _a === void 0 ? defaultConfig : _a, _c = _b.dictionary, dictionary = _c === void 0 ? defaultDictionary : _c, _d = _b.replaceByWord, _e = _b.replacer;
    var dictionaries = new Map();
    var getOrCreateDictionary = function (key) {
        return dictionaries.get(key) || defaultDictionary;
    };
    var checkWord = function (word, dictionary) { var _a; return ((_a = dictionary.regexp) === null || _a === void 0 ? void 0 : _a.test(word)) || false; };
    return {
        addWords: function (words, dictName) {
            var key = dictName || dictionary.name;
            var dict = getOrCreateDictionary(key);
            dict.words = __spreadArrays(dict.words, words);
            dict.regexp = buildRegexp(dict);
        },
        check: function (text, dictionaryName) {
            if (dictionaryName === void 0) { dictionaryName = dictionary.name; }
            var dict = getOrCreateDictionary(dictionaryName);
            var words = text.split(' ');
            var found = false;
            var count = 0;
            while (found === false && count < words.length - 1) {
                found = checkWord(words[count], dict);
                count += 1;
            }
            return found;
        },
        sanitize: function (t) { return t; },
    };
};

module.exports = ProfanityFactory;
