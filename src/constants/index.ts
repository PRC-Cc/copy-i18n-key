export const I18N_KEYS: ("zh_CN" | "zh_TW" | "en")[] = ["zh_CN", "zh_TW", "en"];
export const TRANS_KEYS: TTrans[] = ["cht", "en"];
export const NAME_MAP: Record<TTrans, string> = {
  en: "英文",
  cht: "繁体",
};
export const COMMAND_PREFIX = "copyI18nKey";
export const COMMAND_KEYS = {
  copyI18nKey: `${COMMAND_PREFIX}.copyI18nKey`,
  translate: `${COMMAND_PREFIX}.translate`,
  reloadTranslate: `${COMMAND_PREFIX}.reloadTranslate`,
  gotoI18n_: `${COMMAND_PREFIX}.gotoI18n_`,
};
