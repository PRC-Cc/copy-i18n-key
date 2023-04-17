export const I18N_KEYS: ("zh_CN" | "zh_TW" | "en")[] = ["zh_CN", "zh_TW", "en"];
export const TRANS_KEYS: TTrans[] = ["cht", "en"];
export const NAME_MAP: Record<TTrans, string> = {
  en: "en",
  cht: "zh_TW",
};
export const COMMAND_PREFIX = "copyI18nKey";
export const COMMAND_KEYS = {
  copyI18nKey: `${COMMAND_PREFIX}.copyI18nKey`,
  addI18n: `${COMMAND_PREFIX}.addI18n`,
  gotoI18n_: `${COMMAND_PREFIX}.gotoI18n_`,
  reloadI18nGoto: `${COMMAND_PREFIX}.reloadI18nGoto`,
};
