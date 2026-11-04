import type { Lang } from "./content";

/**
 * Photography: Pexels (free licence, https://www.pexels.com/license/).
 * Replace with consented UMAPIDO photos when available: drop files in /public/images
 * and swap the values below for "/images/<file>.jpg".
 */
const px = (id: string) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=2400`;

export type PhotoSlide = {
  image: string;
  pos: string; // object-position keeping the subject clear of the text
  align: "left" | "right"; // side the text sits on (the green blend sits behind it)
  title: string;
  body: string;
};

const slides: Record<Lang, PhotoSlide[]> = {
  en: [
    { image: px("16341045"), pos: "20% 40%", align: "right", title: "Every rider, recognised", body: "Bodaboda riders with a trusted digital profile, kept by their own association." },
    { image: px("33135796"), pos: "25% 50%", align: "right", title: "Bajaji and boda, side by side", body: "Owners kept separate from the people who operate each vehicle." },
    { image: px("37483951"), pos: "70% 35%", align: "left", title: "Your kijiwe, organised", body: "Members grouped by association, group and parking point." },
    { image: px("33679981"), pos: "20% 35%", align: "right", title: "Verified riders. Safer roads.", body: "Every check records what was verified, by whom and when." },
  ],
  sw: [
    { image: px("16341045"), pos: "20% 40%", align: "right", title: "Kila dereva, anatambulika", body: "Madereva wa bodaboda wenye wasifu wa kidijitali unaoaminika, unaotunzwa na chama chao." },
    { image: px("33135796"), pos: "25% 50%", align: "right", title: "Bajaji na boda, bega kwa bega", body: "Wamiliki wanatenganishwa na wanaoendesha kila chombo." },
    { image: px("37483951"), pos: "70% 35%", align: "left", title: "Kijiwe chako, kwa mpangilio", body: "Wanachama wanapangwa kwa chama, kikundi na kijiwe." },
    { image: px("33679981"), pos: "20% 35%", align: "right", title: "Madereva waliohakikiwa. Barabara salama.", body: "Kila ukaguzi unarekodi kilichohakikiwa, na nani na lini." },
  ],
};

export const getPhotoSlides = (l: Lang) => slides[l];

export const heroUi: Record<
  Lang,
  { badgeLeft: [string, string]; badgeMid: string; badgeRight: [string, string]; prev: string; next: string; pause: string; play: string; credit: string }
> = {
  en: {
    badgeLeft: ["UMAPIDO", "Wadonge Group"],
    badgeMid: "Dodoma's first digital rider registry",
    badgeRight: ["1,000", "riders"],
    prev: "Previous slide",
    next: "Next slide",
    pause: "Pause slideshow",
    play: "Play slideshow",
    credit: "Photos: Pexels",
  },
  sw: {
    badgeLeft: ["UMAPIDO", "Wadonge Group"],
    badgeMid: "Daftari la kwanza la kidijitali la madereva Dodoma",
    badgeRight: ["1,000", "madereva"],
    prev: "Picha iliyopita",
    next: "Picha inayofuata",
    pause: "Simamisha",
    play: "Endelea",
    credit: "Picha: Pexels",
  },
};
