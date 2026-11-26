// Polish dictionary. Every English key must be here (checked by the type); plurals add `.few` / `.many`.
import type { MessageKey } from "./en";
import { app } from "./pl/app";
import { features } from "./pl/features";
import { landing } from "./pl/landing";

export const pl: Record<MessageKey, string> & Record<string, string> = { ...app, ...features, ...landing };
