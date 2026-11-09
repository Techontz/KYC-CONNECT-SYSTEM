export type Lang = "sw" | "en";

/** True only once the registration portal is operational (brief: use "Get Registration Updates" until then). */
export const PORTAL_LIVE = process.env.NEXT_PUBLIC_PORTAL_LIVE === "true";

const content = {
  en: {
    nav: {
      home: "Home",
      about: "About",
      services: "Services",
      associations: "For Associations",
      partners: "For Partners",
      updates: "Updates",
      contact: "Contact",
      login: "Log In",
      register: PORTAL_LIVE ? "Register" : "Get Updates",
    },
    hero: {
      eyebrow: "Dodoma pilot since March 2026",
      title: "Connecting Tanzania's Bodaboda and Bajaji Ecosystem",
      subtitle:
        "BodaKonnect brings riders, associations and service providers together to support digital identity, documentation, compliance and access to services and economic opportunities.",
      primary: PORTAL_LIVE ? "Register on BodaKonnect" : "Get Registration Updates",
      secondary: "Explore Our Services",
      login: "Already registered? Log in to your account.",
      trustTitle: "Phase-one target",
      trustBody: "2,000 riders in Dodoma, working with UMAPIDO",
    },
    chips: {
      verified: "Documents checked",
      verifiedSub: "By BodaKonnect staff · 14:32",
    },
    features: {
      eyebrow: "What is BodaKonnect",
      title: "One connected platform for every ride.",
      subtitle:
        "BodaKonnect is an integrated digital platform connecting Tanzania's bodaboda and bajaji ecosystem. Developed and operated by KYC CONNECT LTD, it combines digital tools with community engagement to support better organised records, documentation processes and connections to economic opportunities.",
      cta: "Explore Our Services",
      items: [
        {
          title: "Rider registration",
          body: "Start with your phone number and finish your documents later, online or with a field officer at your kijiwe.",
          chipLabel: "Registration",
          chip: "Profile created",
        },
        {
          title: "Vehicle records",
          body: "Motorcycles and bajajis recorded with the owner kept separate from the person who operates the vehicle.",
          chipLabel: "Vehicle",
          chip: "Owner ≠ Operator",
        },
        {
          title: "Associations & groups",
          body: "Organise members by association, group and kijiwe, and see who has completed documents and training.",
          chipLabel: "Members",
          chip: "Member status",
        },
        {
          title: "Accountable checks",
          body: "BodaKonnect staff check documents by matching the photo and number. Every decision is recorded.",
          chipLabel: "Verification",
          chip: "Decision logged",
        },
      ],
      note: "BodaKonnect is not a government agency, a lender or an insurer. We do not issue IDs, licences or insurance policies. We help riders reach the institutions that do. \"Verified\" means documents were checked by BodaKonnect staff, never by the government.",
    },
    how: {
      title: "How it works",
      subtitle: "Five steps. They can run in parallel, depending on what each rider already has.",
      steps: [
        { title: "Register", body: "Open your profile with your phone number." },
        { title: "Complete your documents", body: "Upload or bring your NIDA, birth certificate and licence. If you lack one, we guide you." },
        { title: "Get trained", body: "Join driver training that leads to a certificate." },
        { title: "Meet transport requirements", body: "We help you through transport licensing procedures." },
        { title: "Connect to services", body: "Insurance, savings and credit through participating institutions. Providers decide eligibility, pricing and approval." },
      ],
      phone: {
        greeting: "Habari, Juma",
        status: "Documents checked",
        completeness: "Profile complete",
        group: "Group",
        vehicle: "Vehicle",
        action: "View my profile",
      },
    },
    roles: {
      eyebrow: "Access by role",
      title: "Built for everyone on the road",
      subtitle: "Every role sees exactly what it needs, nothing more.",
      items: [
        { key: "rider", name: "Rider", points: ["View your profile, documents and status", "Manage your consents", "Request deletion of your data"] },
        { key: "leader", name: "Partner user", points: ["See riders who consented to you", "Only fields in the data-sharing agreement", "Keep your own statutory KYC duties"] },
        { key: "assoc", name: "Association admin", points: ["See your member list", "Track each member's status", "Send announcements to members"] },
        { key: "agent", name: "Field officer", points: ["Register riders at the kijiwe", "Upload documents for a rider", "Work where coverage is weak"] },
        { key: "verifier", name: "Verifier", points: ["Review submitted documents", "Set each profile's status", "Every action audit-logged"] },
        { key: "admin", name: "Super admin", points: ["Configure the platform", "Manage users and access", "Every action audit-logged"] },
      ],
    },
    trust: {
      title: "Your data, your consent",
      subtitle:
        "BodaKonnect is being built to align with Tanzania's Personal Data Protection Act, 2022: minimum data, clear purpose and full accountability.",
      cta: "Read the questions riders ask",
      stats: [
        { value: "25,000+", label: "riders estimated in Dodoma City by the programme" },
        { value: "20,000", label: "rider training target. A target, not a result" },
        { value: "2,000", label: "riders in the first training phase" },
        { value: "0", label: "rider records sold. We do not sell personal data" },
      ],
      points: [
        "You can view, correct or request deletion of your data",
        "Document images are never public",
        "Partners see only what you agreed to share",
        "Every view, edit and export is logged",
      ],
    },
    services: {
      title: "Support for the business behind every ride.",
      subtitle:
        "Discover support with documentation, training information, relevant operating requirements and connections to service providers. Services are introduced by location and programme phase. Registration does not imply approval for any individual service.",
      statusLabel: "availability",
      items: [
        { title: "Identity and documentation", body: "Guidance on organising records and navigating relevant documentation processes.", status: "Dodoma pilot" },
        { title: "Training and road safety", body: "Information about coordinated training, requirements and upcoming sessions.", status: "Dodoma pilot" },
        { title: "Compliance support", body: "Information about relevant operating requirements and responsible institutions.", status: "Dodoma pilot" },
        { title: "Insurance connections", body: "Access to participating providers and information about obtaining cover.", status: "Dodoma pilot" },
        { title: "Financial connections", body: "Information about participating providers, products and application processes as introduced.", status: "Coming" },
        { title: "Business opportunities", body: "Relevant commercial offers, initiatives and earning opportunities as available.", status: "Coming" },
      ],
    },
    faq: {
      items: [
        { q: "What is BodaKonnect?", a: "BodaKonnect connects bodaboda and bajaji riders, associations and service providers through coordinated activities and a digital platform being introduced in phases. It is operated by KYC CONNECT LTD, a private Tanzanian company." },
        { q: "How do I register?", a: "Select Register on this website to open the BodaKonnect portal and follow the instructions, or register through your association leader or a BodaKonnect officer at your kijiwe." },
        { q: "Where are services available?", a: "The current programme focus is Dodoma. Check published activities or contact the team for information about your area." },
        { q: "What information or documents will I need?", a: "Requirements depend on the registration category and service. The portal explains what is required before you submit information. If you have no NIDA yet, register anyway and we will guide you." },
        { q: "Does BodaKonnect issue official documents?", a: "No. Official documents are issued by the responsible institutions. BodaKonnect supports information, coordination and access to relevant processes." },
        { q: "Are there registration or service fees?", a: "Any registration charges and provider fees will be clearly explained before you pay." },
        { q: "Does registration guarantee a loan or insurance?", a: "No. Availability depends on participating providers and the programme phase. Providers determine eligibility, pricing and approval." },
        { q: "Who can see my information?", a: "You, your association (basic details only), and the institutions you give permission to. We do not sell your data." },
        { q: "Can I delete my information?", a: "Yes. Contact us and we will handle your request." },
      ],
    },
  },
  sw: {
    nav: {
      home: "Mwanzo",
      about: "Kuhusu",
      services: "Huduma",
      associations: "Vyama",
      partners: "Wabia",
      updates: "Taarifa",
      contact: "Mawasiliano",
      login: "Ingia",
      register: PORTAL_LIVE ? "Jisajili" : "Pata Taarifa",
    },
    hero: {
      eyebrow: "Majaribio Dodoma tangu Machi 2026",
      title: "Tunaunganisha mfumo wa bodaboda na bajaji Tanzania",
      subtitle:
        "BodaKonnect inaunganisha madereva, vyama na watoa huduma ili kusaidia utambulisho, nyaraka, uzingatiaji wa mahitaji na upatikanaji wa huduma na fursa za kiuchumi.",
      primary: PORTAL_LIVE ? "Jisajili" : "Pata Taarifa za Usajili",
      secondary: "Fahamu Huduma Zetu",
      login: "Tayari umesajiliwa? Ingia kwenye akaunti yako.",
      trustTitle: "Lengo la awamu ya kwanza",
      trustBody: "Madereva 2,000 Dodoma, kwa ushirikiano na UMAPIDO",
    },
    chips: {
      verified: "Nyaraka zimekaguliwa",
      verifiedSub: "Na wafanyakazi wa BodaKonnect · 14:32",
    },
    features: {
      eyebrow: "BodaKonnect ni nini",
      title: "Jukwaa moja kwa kila safari.",
      subtitle:
        "BodaKonnect ni jukwaa jumuishi la kidijitali linalounganisha mfumo wa bodaboda na bajaji Tanzania. Likiendelezwa na kuendeshwa na KYC CONNECT LTD, linachanganya zana za kidijitali na ushirikishwaji wa jamii ili kusaidia kumbukumbu zilizopangwa, michakato ya nyaraka na muunganiko na fursa za kiuchumi.",
      cta: "Fahamu Huduma Zetu",
      items: [
        {
          title: "Usajili wa madereva",
          body: "Anza na namba yako ya simu na ukamilishe nyaraka baadaye, mtandaoni au kwa afisa kijiweni.",
          chipLabel: "Usajili",
          chip: "Wasifu umeundwa",
        },
        {
          title: "Rekodi za vyombo",
          body: "Pikipiki na bajaji zinarekodiwa huku mmiliki akitenganishwa na anayeendesha chombo.",
          chipLabel: "Chombo",
          chip: "Mmiliki ≠ Dereva",
        },
        {
          title: "Vyama na vikundi",
          body: "Panga wanachama kwa chama, kikundi na kijiwe, na uone waliokamilisha nyaraka na mafunzo.",
          chipLabel: "Wanachama",
          chip: "Hali ya wanachama",
        },
        {
          title: "Ukaguzi wenye uwajibikaji",
          body: "Wafanyakazi wa BodaKonnect wanakagua nyaraka kwa kulinganisha picha na namba. Kila uamuzi unarekodiwa.",
          chipLabel: "Uhakiki",
          chip: "Uamuzi umehifadhiwa",
        },
      ],
      note: "BodaKonnect si taasisi ya serikali, mkopeshaji wala kampuni ya bima. Hatutoi vitambulisho, leseni wala bima. Tunawasaidia madereva kufikia taasisi zinazotoa huduma hizo. \"Imehakikiwa\" inamaanisha nyaraka zimekaguliwa na wafanyakazi wa BodaKonnect, si na serikali.",
    },
    how: {
      title: "Inavyofanya kazi",
      subtitle: "Hatua tano. Zinaweza kufanyika sambamba, kulingana na alichonacho kila dereva.",
      steps: [
        { title: "Jisajili", body: "Fungua wasifu kwa namba yako ya simu." },
        { title: "Kamilisha nyaraka", body: "Pakia au leta NIDA, cheti cha kuzaliwa na leseni. Kama huna, tutakuelekeza jinsi ya kuvipata." },
        { title: "Pata mafunzo", body: "Jiunge na mafunzo ya udereva yanayotoa cheti." },
        { title: "Timiza masharti ya usafirishaji", body: "Tunakusaidia kufuata taratibu za leseni na vibali vya usafirishaji." },
        { title: "Unganishwa na huduma", body: "Bima, akiba na mikopo kupitia taasisi washirika. Watoa huduma ndio wanaoamua vigezo, bei na idhini." },
      ],
      phone: {
        greeting: "Habari, Juma",
        status: "Nyaraka zimekaguliwa",
        completeness: "Wasifu umekamilika",
        group: "Kikundi",
        vehicle: "Chombo",
        action: "Angalia wasifu wangu",
      },
    },
    roles: {
      eyebrow: "Ufikiaji kwa jukumu",
      title: "Imejengwa kwa kila mtu barabarani",
      subtitle: "Kila jukumu linaona kile tu linachohitaji.",
      items: [
        { key: "rider", name: "Dereva", points: ["Ona wasifu, nyaraka na hali yako", "Simamia ridhaa zako", "Omba kufutwa kwa taarifa zako"] },
        { key: "leader", name: "Mtumiaji wa mbia", points: ["Ona madereva waliokuruhusu", "Taarifa zilizo kwenye mkataba tu", "Baki na wajibu wako wa KYC"] },
        { key: "assoc", name: "Msimamizi wa chama", points: ["Ona orodha ya wanachama", "Fuatilia hali ya kila mwanachama", "Tuma matangazo kwa wanachama"] },
        { key: "agent", name: "Afisa wa uwandani", points: ["Sajili madereva kijiweni", "Pakia nyaraka kwa niaba ya dereva", "Fanya kazi hata mtandao ukiwa dhaifu"] },
        { key: "verifier", name: "Mhakiki", points: ["Kagua nyaraka zilizowasilishwa", "Weka hali ya kila wasifu", "Kila hatua inarekodiwa"] },
        { key: "admin", name: "Msimamizi mkuu", points: ["Sanidi mfumo", "Simamia watumiaji na ruhusa", "Kila hatua inarekodiwa"] },
      ],
    },
    trust: {
      title: "Taarifa zako, ridhaa yako",
      subtitle:
        "BodaKonnect inajengwa kuendana na Sheria ya Ulinzi wa Taarifa Binafsi ya Tanzania ya 2022: taarifa chache, madhumuni wazi na uwajibikaji kamili.",
      cta: "Soma maswali ya madereva",
      stats: [
        { value: "25,000+", label: "makadirio ya madereva Jiji la Dodoma, kwa mujibu wa programu" },
        { value: "20,000", label: "lengo la mafunzo ya madereva. Ni lengo, si matokeo" },
        { value: "2,000", label: "madereva katika awamu ya kwanza ya mafunzo" },
        { value: "0", label: "rekodi za madereva zilizouzwa. Hatuuzi taarifa binafsi" },
      ],
      points: [
        "Unaweza kuona, kurekebisha au kuomba kufutwa kwa taarifa zako",
        "Picha za nyaraka haziwekwi hadharani",
        "Wabia wanaona ulichokubali kushiriki tu",
        "Kila kuangalia, kuhariri na kutoa taarifa kunarekodiwa",
      ],
    },
    services: {
      title: "Msaada kwa biashara iliyo nyuma ya kila safari.",
      subtitle:
        "Pata msaada wa nyaraka, taarifa za mafunzo, mahitaji ya uendeshaji na muunganiko na watoa huduma. Huduma zinaanzishwa kulingana na eneo na awamu ya programu. Usajili haumaanishi umeidhinishwa kwa huduma yoyote.",
      statusLabel: "upatikanaji",
      items: [
        { title: "Utambulisho na nyaraka", body: "Mwongozo wa kupanga kumbukumbu na kupitia michakato ya nyaraka.", status: "Majaribio Dodoma" },
        { title: "Mafunzo na usalama barabarani", body: "Taarifa kuhusu mafunzo yaliyoratibiwa, mahitaji na vipindi vijavyo.", status: "Majaribio Dodoma" },
        { title: "Msaada wa uzingatiaji", body: "Taarifa kuhusu mahitaji ya uendeshaji na taasisi zinazohusika.", status: "Majaribio Dodoma" },
        { title: "Muunganiko wa bima", body: "Kufikia watoa huduma washiriki na taarifa za kupata bima.", status: "Majaribio Dodoma" },
        { title: "Muunganiko wa kifedha", body: "Taarifa kuhusu watoa huduma washiriki, bidhaa na michakato ya maombi zinapoanzishwa.", status: "Inakuja" },
        { title: "Fursa za biashara", body: "Ofa za kibiashara, miradi na fursa za kipato zinapopatikana.", status: "Inakuja" },
      ],
    },
    faq: {
      items: [
        { q: "BodaKonnect ni nini?", a: "BodaKonnect inaunganisha madereva wa bodaboda na bajaji, vyama na watoa huduma kupitia shughuli zilizoratibiwa na jukwaa la kidijitali linaloanzishwa kwa awamu. Inaendeshwa na KYC CONNECT LTD, kampuni binafsi ya Kitanzania." },
        { q: "Ninajisajili vipi?", a: "Chagua Jisajili kwenye tovuti hii kufungua portal ya BodaKonnect na ufuate maelekezo, au jisajili kupitia kiongozi wa chama chako au afisa wa BodaKonnect kijiweni." },
        { q: "Huduma zinapatikana wapi?", a: "Kwa sasa programu inalenga Dodoma. Angalia shughuli zilizochapishwa au wasiliana na timu yetu kwa taarifa za eneo lako." },
        { q: "Nitahitaji taarifa au nyaraka gani?", a: "Mahitaji yanategemea aina ya usajili na huduma. Portal inaeleza kinachohitajika kabla hujawasilisha taarifa. Kama bado huna NIDA, jisajili hata hivyo na tutakuelekeza." },
        { q: "BodaKonnect inatoa nyaraka rasmi?", a: "Hapana. Nyaraka rasmi zinatolewa na taasisi husika. BodaKonnect inasaidia taarifa, uratibu na kufikia michakato husika." },
        { q: "Kuna ada za usajili au huduma?", a: "Gharama zozote za usajili na ada za watoa huduma zitaelezwa wazi kabla hujalipa." },
        { q: "Kujisajili kunanihakikishia mkopo au bima?", a: "Hapana. Upatikanaji unategemea watoa huduma washiriki na awamu ya programu. Watoa huduma ndio wanaoamua vigezo, bei na idhini." },
        { q: "Taarifa zangu zinaonwa na nani?", a: "Wewe, chama chako (taarifa za msingi), na taasisi utakazozipa ruhusa tu. Hatuuzi taarifa zako." },
        { q: "Naweza kufuta taarifa zangu?", a: "Ndiyo. Wasiliana nasi na tutashughulikia ombi lako." },
      ],
    },
  },
};

export type Content = (typeof content)["en"];
export const getContent = (lang: Lang): Content => content[lang] as unknown as Content;
