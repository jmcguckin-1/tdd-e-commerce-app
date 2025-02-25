import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import signUpFr from "./sign_up/sign_up_fr.json"
import signUpEn from "./sign_up/sign_up_en.json"
import signInEn from "./sign_in_en.json"
import signInFr from "./sign_in_fr.json"
import landingEn from "./landing/landing_en.json"
import landingFr from "./landing/landing_fr.json"
import transactionsEn from "./transactions/transactions_en.json"
import transactionsFr from "./transactions/transactions_fr.json"
import profileEn from "./profile/profile_en.json"
import profileFr from "./profile/profile_fr.json"
import itemEn from "./item/item_en.json"
import itemFr from "./item/item_fr.json"

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
          sign_in: signInEn,
          sign_up: signUpEn,
          landing: landingEn,
          transactions: transactionsEn,
          profile: profileEn,
          item: itemEn
      },
      fr: {
         sign_in: signInFr,
        sign_up: signUpFr,
          landing: landingFr,
          transactions: transactionsFr,
           profile: profileFr,
          item: itemFr
      }
    },
    fallbackLng: "en",
    debug: true,

    ns: ["sign_in", "sign_up", "landing", "item", "transactions", "profile"],

    defaultNS: "translations",

    keySeparator: false,

    interpolation: {
      escapeValue: false
    }
  });

export default i18n;