// English dictionary (source of keys), split by area. Plurals: `key.one` / `key.other` with {n}.
import { app } from "./en/app";
import { features } from "./en/features";
import { landing } from "./en/landing";

export const en = { ...app, ...features, ...landing };

export type MessageKey = keyof typeof en;
