import type { Lang } from "./content";

/**
 * Photography: Pexels (free licence, https://www.pexels.com/license/).
 * Replace with consented local photos when available.
 */
const px = (id: string) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=2400`;

export type PhotoSlide = { image: string; pos: string; align: "left" | "right"; title: string; body: string };

const slides: Record<Lang, PhotoSlide[]> = {
  en: [
    { image: px("16341045"), pos: "20% 40%", align: "right", title: "Identity and documentation", body: "Guidance on organising records and navigating relevant documentation processes." },
    { image: px("33135796"), pos: "25% 50%", align: "right", title: "Bodaboda and bajaji, together", body: "Riders, vehicle owners and operators, each with the right record." },
    { image: px("37483951"), pos: "70% 35%", align: "left", title: "Stronger associations", body: "Working with rider leaders to coordinate members and services." },
    { image: px("33679981"), pos: "20% 35%", align: "right", title: "Training and road safety", body: "Coordinated training, requirements and upcoming sessions." },
  ],
  sw: [
    { image: px("16341045"), pos: "20% 40%", align: "right", title: "Utambulisho na nyaraka", body: "Mwongozo wa kupanga kumbukumbu na kupitia michakato ya nyaraka." },
    { image: px("33135796"), pos: "25% 50%", align: "right", title: "Bodaboda na bajaji, pamoja", body: "Madereva, wamiliki na waendesha vyombo, kila mmoja na rekodi sahihi." },
    { image: px("37483951"), pos: "70% 35%", align: "left", title: "Vyama imara", body: "Tunafanya kazi na viongozi wa madereva kuratibu wanachama na huduma." },
    { image: px("33679981"), pos: "20% 35%", align: "right", title: "Mafunzo na usalama barabarani", body: "Mafunzo yaliyoratibiwa, mahitaji na vipindi vijavyo." },
  ],
};

export const getPhotoSlides = (l: Lang) => slides[l];

export const heroUi: Record<
  Lang,
  { badgeLeft: [string, string]; badgeMid: string; badgeRight: [string, string]; phase: string; prev: string; next: string; pause: string; play: string; credit: string }
> = {
  en: {
    badgeLeft: ["UMAPIDO", "Strategic partner"],
    badgeMid: "Dodoma pilot since March 2026",
    badgeRight: ["2,000", "phase-one target"],
    phase: "Phase 1",
    prev: "Previous slide",
    next: "Next slide",
    pause: "Pause slideshow",
    play: "Play slideshow",
    credit: "Photos: Pexels",
  },
  sw: {
    badgeLeft: ["UMAPIDO", "Mshirika wa kimkakati"],
    badgeMid: "Majaribio Dodoma tangu Machi 2026",
    badgeRight: ["2,000", "lengo la awamu ya 1"],
    phase: "Awamu 1",
    prev: "Picha iliyopita",
    next: "Picha inayofuata",
    pause: "Simamisha",
    play: "Endelea",
    credit: "Picha: Pexels",
  },
};
