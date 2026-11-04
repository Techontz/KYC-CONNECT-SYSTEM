import type { Lang } from "./content";

/** Copy for the Safiri-style feature bands, footer and store-style buttons. */
const bands = {
  en: {
    vehicle: {
      accent: "Owner or operator?",
      title: "Every vehicle gets the right record.",
      before: "Ride a bajaji or boda owned by someone else? BodaConnect OS keeps ",
      link: "owner and operator records",
      after: " separate, with a full history of who rode which vehicle and when.",
    },
    rider: {
      title: "Register once. Ride with confidence.",
      chips: ["Bodaboda riders", "Bajaji operators", "Vehicle owners", "Group leaders", "Field agents", "UMAPIDO members"],
      body: "Join BodaConnect OS through your UMAPIDO group. A trained field agent registers you at your kijiwe, your membership is confirmed by your leader, and an independent verifier checks your details.",
      learn: "Learn more",
      join: "Register as a rider",
    },
    lanes: {
      title: "From the kijiwe to a trusted record",
      callouts: [
        { title: "Get notified when you are verified", body: "Know the moment a verifier confirms your phone, membership or vehicle." },
        { title: "Follow your profile status", body: "See what is complete, what is missing and what happens next, in plain Swahili." },
        { title: "Request a correction", body: "Spotted a mistake? Send a correction request and track it until it is resolved." },
      ],
    },
    mission: {
      quote: "A boda rider should be able to prove who they are, what they ride and where they belong, and decide who gets to see it.",
      by: "The BodaConnect mission",
      steps: [
        { accent: "Prove", rest: "who you are", body: "Register once with a trained field agent. Your phone number is confirmed by a one-time code, and every identity check records what was checked, by whom and when, so your profile is something you can stand behind.", left: ["Phone", "+255 7•• ••• 214"], right: ["Verified", "Phone · OTP"] },
        { accent: "Show", rest: "what you ride", body: "Your motorcycle or bajaji is recorded with its plate, and the owner is kept separate from the person who operates it. Change vehicles or owners and the full history stays intact.", left: ["Vehicle", "MC 482 DFT · Bajaji"], right: ["Operator", "Owner ≠ Operator"] },
        { accent: "Know", rest: "where you belong", body: "Your UMAPIDO membership, group and kijiwe are on record. Your group leader confirms your membership and sees only the roster they manage.", left: ["Group", "Jamatini"], right: ["Kijiwe", "Majengo Stand"] },
        { accent: "Decide", rest: "who sees it", body: "Consent is recorded per purpose and can be withdrawn. Every export and every disclosure is logged with its purpose, and rider data is never sold.", left: ["Consent", "Insurance referral"], right: ["Audit", "Export logged"] },
      ],
    },
    pilot: {
      accent: "Pilot",
      title: "partners in Dodoma",
      body: "BodaConnect OS is built by Wadonge Group Limited with UMAPIDO, starting with riders, groups and vijiwe across Dodoma's wards.",
      stats: [
        { value: "1,000", title: "Pilot riders", body: "UMAPIDO members onboarded through their own groups and vijiwe." },
        { value: "12", title: "Target wards", body: "Starting in Dodoma city, ready to grow to more associations and regions." },
      ],
      orgRoles: ["Product owner", "Pilot association"],
      wardLabel: "Target ward",
      more: [
        ["More associations", "Next phase"],
        ["More regions", "Later"],
      ],
      place: "Dodoma, Tanzania",
    },
    faq: {
      title: "Frequently asked questions",
      subtitle: "Find out how registration, verification and your privacy work in BodaConnect OS.",
    },
    footer: {
      tagline: "We help bodaboda and bajaji riders prove who they are, what they ride and where they belong.",
      copyright: "Copyright © {year} KYC Connect",
      powered: "Powered by",
      rights: "All Rights Reserved",
      company: "Company",
      companyLinks: [
        ["About Wadonge", "#top"],
        ["UMAPIDO pilot", "#roadmap"],
        ["How it works", "#how"],
        ["Who it's for", "#roles"],
        ["Roadmap", "#roadmap"],
      ],
      resources: "Resources",
      resourceLinks: [
        ["Platform", "#platform"],
        ["Trust & privacy", "#trust"],
        ["FAQs", "#faq"],
      ],
      contact: "Contact",
      open: "Open the system",
      staff: "Staff login",
      privacy: "Privacy Policy",
      terms: "Terms & Conditions",
      data: "Data protection",
      madeIn: "Built in Dodoma, Tanzania",
    },
  },
  sw: {
    vehicle: {
      accent: "Mmiliki au dereva?",
      title: "Kila chombo, rekodi yake sahihi.",
      before: "Unaendesha bajaji au boda inayomilikiwa na mtu mwingine? BodaConnect OS inatunza ",
      link: "rekodi za mmiliki na dereva",
      after: " kando kando, pamoja na historia kamili ya nani aliendesha chombo kipi na lini.",
    },
    rider: {
      title: "Jisajili mara moja. Endesha kwa uhakika.",
      chips: ["Madereva wa bodaboda", "Waendesha bajaji", "Wamiliki wa vyombo", "Viongozi wa vikundi", "Mawakala wa uwandani", "Wanachama wa UMAPIDO"],
      body: "Jiunge na BodaConnect OS kupitia kikundi chako cha UMAPIDO. Wakala aliyefunzwa anakusajili kijiweni, kiongozi wako anathibitisha uanachama, na mhakiki huru anakagua taarifa zako.",
      learn: "Jifunze zaidi",
      join: "Jisajili kama dereva",
    },
    lanes: {
      title: "Kutoka kijiweni hadi rekodi ya kuaminika",
      callouts: [
        { title: "Pata taarifa ukihakikiwa", body: "Jua papo hapo mhakiki anapothibitisha simu, uanachama au chombo chako." },
        { title: "Fuatilia hali ya wasifu wako", body: "Ona kilichokamilika, kinachokosekana na hatua inayofuata, kwa Kiswahili rahisi." },
        { title: "Omba marekebisho", body: "Umeona kosa? Tuma ombi la marekebisho na ulifuatilie hadi litatuliwe." },
      ],
    },
    mission: {
      quote: "Dereva wa boda anapaswa kuweza kuthibitisha yeye ni nani, anaendesha nini na anahusika wapi, na kuamua nani aone taarifa hizo.",
      by: "Dhamira ya BodaConnect",
      steps: [
        { accent: "Thibitisha", rest: "wewe ni nani", body: "Jisajili mara moja kwa msaada wa wakala aliyefunzwa. Namba yako ya simu inathibitishwa kwa nambari ya siri ya mara moja, na kila ukaguzi unarekodi kilichokaguliwa, na nani na lini, ili wasifu wako uwe wa kuaminika.", left: ["Simu", "+255 7•• ••• 214"], right: ["Imehakikiwa", "Simu · OTP"] },
        { accent: "Onyesha", rest: "unachoendesha", body: "Pikipiki au bajaji yako inarekodiwa pamoja na namba yake, na mmiliki anatenganishwa na anayeiendesha. Ukibadilisha chombo au mmiliki, historia kamili inabaki salama.", left: ["Chombo", "MC 482 DFT · Bajaji"], right: ["Dereva", "Mmiliki ≠ Dereva"] },
        { accent: "Jua", rest: "unakohusika", body: "Uanachama wako wa UMAPIDO, kikundi na kijiwe chako vinarekodiwa. Kiongozi wa kikundi anathibitisha uanachama wako na anaona orodha anayoisimamia tu.", left: ["Kikundi", "Jamatini"], right: ["Kijiwe", "Majengo Stand"] },
        { accent: "Amua", rest: "nani aone", body: "Ridhaa inarekodiwa kwa kila madhumuni na inaweza kuondolewa. Kila ripoti na kila utoaji wa taarifa unarekodiwa na madhumuni yake, na taarifa za madereva haziuzwi kamwe.", left: ["Ridhaa", "Rufaa ya bima"], right: ["Ukaguzi", "Ripoti imerekodiwa"] },
      ],
    },
    pilot: {
      accent: "Washirika",
      title: "wa majaribio Dodoma",
      body: "BodaConnect OS imejengwa na Wadonge Group Limited pamoja na UMAPIDO, ikianza na madereva, vikundi na vijiwe katika kata za Dodoma.",
      stats: [
        { value: "1,000", title: "Madereva wa majaribio", body: "Wanachama wa UMAPIDO wanaosajiliwa kupitia vikundi na vijiwe vyao." },
        { value: "12", title: "Kata zinazolengwa", body: "Kuanzia jiji la Dodoma, tayari kukua kwa vyama na mikoa zaidi." },
      ],
      orgRoles: ["Mmiliki wa bidhaa", "Chama cha majaribio"],
      wardLabel: "Kata lengwa",
      more: [
        ["Vyama zaidi", "Awamu ijayo"],
        ["Mikoa zaidi", "Baadaye"],
      ],
      place: "Dodoma, Tanzania",
    },
    faq: {
      title: "Maswali yanayoulizwa mara kwa mara",
      subtitle: "Jua jinsi usajili, uhakiki na faragha yako vinavyofanya kazi ndani ya BodaConnect OS.",
    },
    footer: {
      tagline: "Tunawasaidia madereva wa bodaboda na bajaji kuthibitisha wao ni nani, wanaendesha nini na wanahusika wapi.",
      copyright: "Hakimiliki © {year} KYC Connect",
      powered: "Inaendeshwa na",
      rights: "Haki Zote Zimehifadhiwa",
      company: "Kampuni",
      companyLinks: [
        ["Kuhusu Wadonge", "#top"],
        ["Majaribio ya UMAPIDO", "#roadmap"],
        ["Inavyofanya kazi", "#how"],
        ["Kwa nani", "#roles"],
        ["Mpango", "#roadmap"],
      ],
      resources: "Rasilimali",
      resourceLinks: [
        ["Mfumo", "#platform"],
        ["Usalama na faragha", "#trust"],
        ["Maswali", "#faq"],
      ],
      contact: "Mawasiliano",
      open: "Fungua mfumo",
      staff: "Ingia kwa watumishi",
      privacy: "Sera ya Faragha",
      terms: "Vigezo na Masharti",
      data: "Ulinzi wa taarifa",
      madeIn: "Imejengwa Dodoma, Tanzania",
    },
  },
};

export type Bands = (typeof bands)["en"];
export const getBands = (l: Lang): Bands => bands[l] as Bands;
