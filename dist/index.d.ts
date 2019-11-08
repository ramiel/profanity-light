interface ProfanityConfig {
    dictionary?: Dictionary;
    replacer?: string;
    replaceByWord?: boolean;
}
interface OverridableProfanityConfig extends ProfanityConfig {
}
declare type ProfanityFactoryType = (cfg: ProfanityConfig) => {
    check: (text: string, dictionaryName?: string) => boolean;
    sanitize: (text: string, cfg?: OverridableProfanityConfig) => string;
    addWords: (words: string[], dictName?: string) => void;
};
declare type Dictionary = {
    name: string;
    words: string[];
    regexp: RegExp | null;
    symbolAlternatives: {
        [c: string]: string[];
    } | null;
};
declare const ProfanityFactory: ProfanityFactoryType;
export default ProfanityFactory;
