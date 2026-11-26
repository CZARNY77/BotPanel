// Own i18n (no library): EN/PL dictionaries, language in localStorage, default from navigator.language.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { en, type MessageKey } from "./en";
import { pl } from "./pl";

export type Lang = "en" | "pl";
export type { MessageKey };
type Vars = Record<string, string | number>;

/** Keys that have plural forms (`base.one`, `base.other`; Polish adds `.few`, `.many`). */
export type PluralKey = MessageKey extends infer K ? (K extends `${infer B}.other` ? B : never) : never;

const STORAGE_KEY = "conqbot.lang";
const dicts: Record<Lang, Record<string, string>> = { en, pl };

const detect = (): Lang => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "en" || saved === "pl") return saved;
  } catch {
    /* storage blocked */
  }
  return typeof navigator !== "undefined" && navigator.language?.toLowerCase().startsWith("pl") ? "pl" : "en";
};

let current: Lang = detect();

/** Current language for plain helpers (date formatting) called during render. */
export const getLang = () => current;
export const localeOf = (lang: Lang = current) => (lang === "pl" ? "pl-PL" : "en-GB");

const fill = (text: string, vars?: Vars) =>
  vars ? text.replace(/\{(\w+)\}/g, (match, name: string) => (name in vars ? String(vars[name]) : match)) : text;

const lookup = (lang: Lang, key: string) => dicts[lang][key] ?? en[key as MessageKey] ?? key;

export const translate = (key: MessageKey, vars?: Vars, lang: Lang = current) => fill(lookup(lang, key), vars);

export const translatePlural = (base: PluralKey, count: number, vars?: Vars, lang: Lang = current) => {
  const rule = new Intl.PluralRules(localeOf(lang)).select(count);
  const key = dicts[lang][`${base}.${rule}`] !== undefined ? `${base}.${rule}` : `${base}.other`;
  return fill(lookup(lang, key), { n: count, ...vars });
};

type I18n = {
  lang: Lang;
  locale: string;
  setLang: (lang: Lang) => void;
  t: (key: MessageKey, vars?: Vars) => string;
  tn: (base: PluralKey, count: number, vars?: Vars) => string;
};

const I18nContext = createContext<I18n | null>(null);

export const LangProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<Lang>(current);

  useEffect(() => {
    current = lang;
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    current = next;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* storage blocked */
    }
    setLangState(next);
  }, []);

  const value = useMemo<I18n>(
    () => ({
      lang,
      locale: localeOf(lang),
      setLang,
      t: (key, vars) => translate(key, vars, lang),
      tn: (base, count, vars) => translatePlural(base, count, vars, lang),
    }),
    [lang, setLang]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useT = (): I18n => {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useT must be used within LangProvider");
  return context;
};
