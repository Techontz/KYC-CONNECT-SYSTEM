export type Lang = "sw" | "en";

const content = {
  en: {
    nav: {
      platform: "Platform",
      how: "How it works",
      roles: "Who it's for",
      trust: "Trust",
      roadmap: "Roadmap",
      faq: "FAQ",
      open: "Open BodaKonnect",
    },
    hero: {
      eyebrow: "UMAPIDO Dodoma pilot",
      title: "Every rider. One trusted record.",
      subtitle:
        "KYC Connect brings bodaboda and bajaji riders, their vehicles and their associations onto one secure digital platform: BodaKonnect.",
      primary: "Open BodaKonnect",
      secondary: "See how it works",
      trustTitle: "Pilot target",
      trustBody: "2,000 riders in phase one, towards a 20,000-rider training target in Dodoma",
    },
    chips: {
      verified: "Membership confirmed",
      verifiedSub: "Checked by verifier · 14:32",
      group: "Group assigned",
      groupSub: "Jamatini · Majengo",
      vehicle: "Operator linked",
      vehicleSub: "MC 482 DFT · Bajaji",
    },
    features: {
      eyebrow: "What BodaKonnect does",
      title: "Do more. Ride with confidence.",
      subtitle:
        "One platform that turns paper registers and scattered WhatsApp lists into reliable, searchable and protected records.",
      cta: "Explore the platform",
      items: [
        {
          title: "Rider registration",
          body: "Assisted onboarding by trained field agents, in short Swahili steps, with duplicate checks built in.",
          chipLabel: "Registration",
          chip: "Profile BC-DOD-000214 created",
        },
        {
          title: "Vehicle records",
          body: "Motorcycles and bajajis recorded with the owner kept separate from the person who operates the vehicle.",
          chipLabel: "Vehicle",
          chip: "Owner ≠ Operator",
        },
        {
          title: "Associations & groups",
          body: "Organise members by association, group and parking point. Every leader sees only what they manage.",
          chipLabel: "Roster",
          chip: "48 active members",
        },
        {
          title: "Accountable verification",
          body: "Each decision records what was checked, by whom and when. Nobody approves their own submission.",
          chipLabel: "Verification",
          chip: "Decision logged",
        },
      ],
      note: "Registration alone is never presented as official government identity or vehicle verification.",
    },
    how: {
      title: "How BodaKonnect works",
      subtitle: "From the parking point to a trusted digital profile in four clear steps.",
      steps: [
        { title: "Register", body: "A field agent helps the rider create a profile and explains the privacy notice in Swahili." },
        { title: "Link", body: "Connect the rider to their UMAPIDO group, parking point and the vehicle they own or operate." },
        { title: "Verify", body: "An independent verifier reviews evidence and records the outcome, reason and method." },
        { title: "Grow", body: "Verified riders become ready for future services such as insurance, savings and fair finance through licensed partners." },
      ],
      phone: {
        greeting: "Habari, Juma",
        status: "Profile verified",
        completeness: "Profile complete",
        group: "Group",
        vehicle: "Vehicle",
        action: "View my profile",
      },
    },
    roles: {
      eyebrow: "Who it's for",
      title: "Built for everyone on the road",
      subtitle: "Least-privilege access: every role sees exactly what it needs, nothing more.",
      items: [
        {
          key: "rider",
          name: "Rider",
          points: ["See your profile, membership and vehicle links", "Know exactly what is missing and why", "Request a correction when details are wrong"],
        },
        {
          key: "leader",
          name: "Group leader",
          points: ["Help members register at the parking point", "Confirm group membership", "See a limited roster for your group only"],
        },
        {
          key: "assoc",
          name: "Association admin",
          points: ["Manage groups and parking points", "Track onboarding progress and backlog", "Run scoped, purpose-labelled reports"],
        },
        {
          key: "agent",
          name: "Field agent",
          points: ["Capture records on any Android phone", "Get instant duplicate warnings", "Submit for independent review"],
        },
        {
          key: "verifier",
          name: "Verifier",
          points: ["Work a clear review queue", "Record method, reason and evidence", "Separation of duties enforced"],
        },
        {
          key: "admin",
          name: "Platform admin",
          points: ["Manage organisations, users and roles", "Revoke access instantly", "Review audit and security events"],
        },
      ],
    },
    trust: {
      title: "Trust & privacy by design",
      subtitle:
        "Rider data belongs to riders. BodaKonnect is built around Tanzania's Personal Data Protection Act principles: minimum data, clear purpose and full accountability.",
      cta: "Read our privacy approach",
      stats: [
        { value: "20,000", label: "rider training target in Dodoma" },
        { value: "7", label: "verification statuses, every one audited" },
        { value: "100%", label: "of exports permission-gated and logged" },
        { value: "0", label: "rider records sold, ever" },
      ],
      points: [
        "Role and organisation scope checked on every request",
        "Documents in private storage, never public links",
        "Consent and disclosures recorded with purpose and time",
        "Encrypted backups with tested restores",
      ],
    },
    roadmap: {
      eyebrow: "Roadmap",
      title: "Start focused. Grow responsibly.",
      subtitle: "Financial and partner services arrive only once core records are stable and the right licences and agreements are in place.",
      items: [
        { phase: "MVP", title: "Core registry", body: "Riders, vehicles, groups, verification, reports, privacy and audit.", status: "Now" },
        { phase: "2A", title: "Payments & SMS", body: "SMS reminders and approved fee payments with receipts and reconciliation.", status: "Next" },
        { phase: "2B", title: "Insurance", body: "Quotes, referrals and renewal reminders with authorised insurers.", status: "Planned" },
        { phase: "2C", title: "Fair finance", body: "Loan referrals where a licensed partner owns every credit decision.", status: "Planned" },
        { phase: "3A", title: "Marketplace", body: "Garages, dealers, service requests and member offers.", status: "Later" },
        { phase: "3B", title: "Insights", body: "Aggregated dashboards for authorised institutions only.", status: "Later" },
      ],
    },
    dodoma: {
      title: "Built in Dodoma, for riders across Tanzania",
      subtitle: "The pilot starts with UMAPIDO groups and parking points across the capital.",
    },
    mission: {
      quote:
        "“A boda rider should be able to prove who they are, what they ride and where they belong, and decide who gets to see it.”",
      by: "The BodaKonnect mission",
    },
    partners: {
      title: "Pilot partners",
      subtitle: "Designed with the people who keep Dodoma moving.",
      list: [
        { name: "KYC CONNECT LTD", role: "Company, BRELA 211723971" },
        { name: "UMAPIDO", role: "Pilot association, Dodoma" },
      ],
      future: "Future partners: licensed insurers · lenders · payment providers · garages",
    },
    faq: {
      title: "Questions riders ask",
      items: [
        {
          q: "Is BodaKonnect a government registration?",
          a: "No. BodaKonnect is an association and rider registry. It does not replace LATRA, TRA, NIDA or police records, and a BodaKonnect status is never presented as official government verification.",
        },
        {
          q: "Do I need a smartphone or an app?",
          a: "No app store needed. BodaKonnect runs in the browser on common Android phones and can be installed to the home screen. Riders without a phone register with help from a field agent or group leader.",
        },
        {
          q: "Who can see my information?",
          a: "Only authorised people for a clear purpose: your group leader sees a limited roster, verifiers see what they review. Every export and disclosure is logged. Your data is never sold.",
        },
        {
          q: "What does “verified” mean?",
          a: "Each verified status records exactly what was checked (phone, membership, identity document or vehicle), the method used, who checked it and when.",
        },
        {
          q: "Can I correct wrong details?",
          a: "Yes. Submit a correction request from your profile. You can follow its status, and protected fields are changed only by authorised staff.",
        },
        {
          q: "Will BodaKonnect give me a loan?",
          a: "BodaKonnect is not a bank, lender or insurer. Future services will be offered only through licensed partners, with your clear consent.",
        },
      ],
    },
    cta: {
      title: "Ready to see BodaKonnect?",
      body: "Sign in with your phone number. Staff, leaders and riders each get their own view.",
      primary: "Open BodaKonnect",
      secondary: "Talk to the pilot team",
    },
    footer: {
      tagline: "The overview of BodaKonnect, the digital operating system for bodaboda and bajaji riders.",
      product: "Platform",
      productLinks: ["Rider registration", "Vehicle records", "Groups & parking points", "Verification", "Reports"],
      company: "Company",
      companyLinks: ["About KYC CONNECT", "UMAPIDO pilot", "Privacy approach", "Contact"],
      legal:
        "BodaKonnect is the flagship platform of KYC CONNECT LTD (BRELA 211723971). KYC CONNECT LTD is not a bank, lender, insurer, payment service provider or government verification authority.",
      rights: "All rights reserved.",
      privacy: "Privacy notice",
      terms: "Terms of use",
    },
  },
  sw: {
    nav: {
      platform: "Mfumo",
      how: "Inavyofanya kazi",
      roles: "Kwa nani",
      trust: "Usalama",
      roadmap: "Mpango",
      faq: "Maswali",
      open: "Fungua BodaKonnect",
    },
    hero: {
      eyebrow: "Majaribio ya UMAPIDO Dodoma",
      title: "Kila dereva. Rekodi moja ya kuaminika.",
      subtitle:
        "KYC Connect inawaleta madereva wa bodaboda na bajaji, vyombo vyao na vyama vyao kwenye mfumo mmoja salama wa kidijitali: BodaKonnect.",
      primary: "Fungua BodaKonnect",
      secondary: "Angalia unavyofanya kazi",
      trustTitle: "Lengo la majaribio",
      trustBody: "Madereva 2,000 awamu ya kwanza, kuelekea lengo la mafunzo la madereva 20,000 Dodoma",
    },
    chips: {
      verified: "Uanachama umethibitishwa",
      verifiedSub: "Imekaguliwa na mhakiki · 14:32",
      group: "Kikundi kimepangwa",
      groupSub: "Jamatini · Majengo",
      vehicle: "Dereva ameunganishwa",
      vehicleSub: "MC 482 DFT · Bajaji",
    },
    features: {
      eyebrow: "BodaKonnect inafanya nini",
      title: "Fanya zaidi. Endesha kwa uhakika.",
      subtitle:
        "Mfumo mmoja unaogeuza madaftari ya karatasi na orodha za WhatsApp kuwa rekodi za kuaminika, zinazotafutika na zilizolindwa.",
      cta: "Gundua mfumo",
      items: [
        {
          title: "Usajili wa madereva",
          body: "Usajili kwa msaada wa mawakala waliofunzwa, kwa hatua fupi za Kiswahili, na ukaguzi wa marudio.",
          chipLabel: "Usajili",
          chip: "Wasifu BC-DOD-000214 umeundwa",
        },
        {
          title: "Rekodi za vyombo",
          body: "Pikipiki na bajaji zinarekodiwa huku mmiliki akitenganishwa na anayeendesha chombo.",
          chipLabel: "Chombo",
          chip: "Mmiliki ≠ Dereva",
        },
        {
          title: "Vyama na vikundi",
          body: "Panga wanachama kwa chama, kikundi na kijiwe. Kila kiongozi anaona anachosimamia tu.",
          chipLabel: "Orodha",
          chip: "Wanachama hai 48",
        },
        {
          title: "Uhakiki wenye uwajibikaji",
          body: "Kila uamuzi unarekodi kilichokaguliwa, na nani na lini. Hakuna anayeidhinisha alichowasilisha mwenyewe.",
          chipLabel: "Uhakiki",
          chip: "Uamuzi umehifadhiwa",
        },
      ],
      note: "Usajili pekee hauonyeshwi kamwe kama uthibitisho rasmi wa serikali wa utambulisho au chombo.",
    },
    how: {
      title: "BodaKonnect inavyofanya kazi",
      subtitle: "Kutoka kijiweni hadi wasifu wa kidijitali unaoaminika kwa hatua nne wazi.",
      steps: [
        { title: "Jisajili", body: "Wakala anamsaidia dereva kuunda wasifu na kumweleza taarifa ya faragha kwa Kiswahili." },
        { title: "Unganisha", body: "Unganisha dereva na kikundi chake cha UMAPIDO, kijiwe na chombo anachomiliki au kuendesha." },
        { title: "Hakiki", body: "Mhakiki huru anapitia ushahidi na kurekodi matokeo, sababu na njia iliyotumika." },
        { title: "Kua", body: "Madereva waliohakikiwa wanakuwa tayari kwa huduma za baadaye kama bima, akiba na mikopo ya haki kupitia washirika wenye leseni." },
      ],
      phone: {
        greeting: "Habari, Juma",
        status: "Wasifu umehakikiwa",
        completeness: "Wasifu umekamilika",
        group: "Kikundi",
        vehicle: "Chombo",
        action: "Angalia wasifu wangu",
      },
    },
    roles: {
      eyebrow: "Kwa nani",
      title: "Imejengwa kwa kila mtu barabarani",
      subtitle: "Ruhusa ndogo kabisa: kila jukumu linaona kile tu linachohitaji.",
      items: [
        {
          key: "rider",
          name: "Dereva",
          points: ["Ona wasifu, uanachama na chombo chako", "Jua kinachokosekana na kwa nini", "Omba marekebisho taarifa zikiwa si sahihi"],
        },
        {
          key: "leader",
          name: "Kiongozi wa kikundi",
          points: ["Saidia wanachama kujisajili kijiweni", "Thibitisha uanachama wa kikundi", "Ona orodha ya kikundi chako tu"],
        },
        {
          key: "assoc",
          name: "Msimamizi wa chama",
          points: ["Simamia vikundi na vijiwe", "Fuatilia maendeleo ya usajili", "Toa ripoti zenye madhumuni maalum"],
        },
        {
          key: "agent",
          name: "Wakala wa uwandani",
          points: ["Sajili kwa simu yoyote ya Android", "Pata tahadhari za marudio papo hapo", "Wasilisha kwa uhakiki huru"],
        },
        {
          key: "verifier",
          name: "Mhakiki",
          points: ["Fanya kazi kwenye foleni ya uhakiki", "Rekodi njia, sababu na ushahidi", "Mgawanyo wa majukumu unazingatiwa"],
        },
        {
          key: "admin",
          name: "Msimamizi wa mfumo",
          points: ["Simamia taasisi, watumiaji na majukumu", "Ondoa ruhusa mara moja", "Kagua kumbukumbu za ukaguzi na usalama"],
        },
      ],
    },
    trust: {
      title: "Usalama na faragha tangu mwanzo",
      subtitle:
        "Taarifa za dereva ni mali ya dereva. BodaKonnect imejengwa kwa misingi ya Sheria ya Ulinzi wa Taarifa Binafsi ya Tanzania: taarifa chache, madhumuni wazi na uwajibikaji kamili.",
      cta: "Soma mtazamo wetu wa faragha",
      stats: [
        { value: "20,000", label: "lengo la mafunzo ya madereva Dodoma" },
        { value: "7", label: "hali za uhakiki, zote zinakaguliwa" },
        { value: "100%", label: "ya ripoti zinadhibitiwa na kurekodiwa" },
        { value: "0", label: "rekodi za madereva zilizouzwa, kamwe" },
      ],
      points: [
        "Jukumu na taasisi vinakaguliwa kila ombi",
        "Nyaraka kwenye hifadhi binafsi, si viungo vya umma",
        "Ridhaa na utoaji wa taarifa vinarekodiwa na madhumuni",
        "Nakala rudufu zilizosimbwa na urejeshaji uliojaribiwa",
      ],
    },
    roadmap: {
      eyebrow: "Mpango",
      title: "Anza kwa umakini. Kua kwa uwajibikaji.",
      subtitle: "Huduma za kifedha na washirika zinakuja pale tu rekodi kuu zitakapokuwa imara na leseni na mikataba sahihi ipo.",
      items: [
        { phase: "MVP", title: "Daftari kuu", body: "Madereva, vyombo, vikundi, uhakiki, ripoti, faragha na ukaguzi.", status: "Sasa" },
        { phase: "2A", title: "Malipo na SMS", body: "Vikumbusho vya SMS na malipo ya ada yaliyoidhinishwa na stakabadhi.", status: "Ijayo" },
        { phase: "2B", title: "Bima", body: "Nukuu, rufaa na vikumbusho vya kuhuisha kupitia bima walioidhinishwa.", status: "Imepangwa" },
        { phase: "2C", title: "Mikopo ya haki", body: "Rufaa za mikopo ambapo mshirika mwenye leseni anafanya kila uamuzi.", status: "Imepangwa" },
        { phase: "3A", title: "Soko", body: "Gereji, wauzaji, maombi ya huduma na ofa kwa wanachama.", status: "Baadaye" },
        { phase: "3B", title: "Takwimu", body: "Dashibodi za jumla kwa taasisi zilizoidhinishwa tu.", status: "Baadaye" },
      ],
    },
    dodoma: {
      title: "Imejengwa Dodoma, kwa madereva kote Tanzania",
      subtitle: "Majaribio yanaanza na vikundi na vijiwe vya UMAPIDO katika makao makuu.",
    },
    mission: {
      quote:
        "“Dereva wa boda anapaswa kuweza kuthibitisha yeye ni nani, anaendesha nini na anahusika wapi, na kuamua nani aone taarifa hizo.”",
      by: "Dhamira ya BodaKonnect",
    },
    partners: {
      title: "Washirika wa majaribio",
      subtitle: "Imeundwa pamoja na wanaoifanya Dodoma isonge.",
      list: [
        { name: "KYC CONNECT LTD", role: "Kampuni, BRELA 211723971" },
        { name: "UMAPIDO", role: "Chama cha majaribio, Dodoma" },
      ],
      future: "Washirika wa baadaye: bima wenye leseni · wakopeshaji · watoa huduma za malipo · gereji",
    },
    faq: {
      title: "Maswali ya madereva",
      items: [
        {
          q: "Je, BodaKonnect ni usajili wa serikali?",
          a: "Hapana. BodaKonnect ni daftari la chama na madereva. Haichukui nafasi ya rekodi za LATRA, TRA, NIDA au polisi, na hali ya BodaKonnect haionyeshwi kamwe kama uthibitisho rasmi wa serikali.",
        },
        {
          q: "Je, nahitaji simu janja au programu?",
          a: "Huhitaji Play Store. BodaKonnect inafanya kazi kwenye kivinjari cha simu za kawaida za Android na inaweza kuwekwa kwenye skrini ya mwanzo. Wasio na simu wanasajiliwa kwa msaada wa wakala au kiongozi wa kikundi.",
        },
        {
          q: "Nani anaweza kuona taarifa zangu?",
          a: "Watu walioidhinishwa tu kwa madhumuni maalum: kiongozi wa kikundi anaona orodha fupi, wahakiki wanaona wanachokagua. Kila utoaji wa taarifa unarekodiwa. Taarifa zako haziuzwi kamwe.",
        },
        {
          q: "“Imehakikiwa” ina maana gani?",
          a: "Kila hali ya uhakiki inarekodi kilichokaguliwa (simu, uanachama, kitambulisho au chombo), njia iliyotumika, nani alikagua na lini.",
        },
        {
          q: "Naweza kurekebisha taarifa zisizo sahihi?",
          a: "Ndiyo. Tuma ombi la marekebisho kutoka kwenye wasifu wako. Unaweza kufuatilia hali yake, na sehemu zinazolindwa hubadilishwa na watumishi walioidhinishwa tu.",
        },
        {
          q: "Je, BodaKonnect itanipa mkopo?",
          a: "BodaKonnect si benki, mkopeshaji wala kampuni ya bima. Huduma za baadaye zitatolewa kupitia washirika wenye leseni tu, kwa ridhaa yako.",
        },
      ],
    },
    cta: {
      title: "Uko tayari kuiona BodaKonnect?",
      body: "Ingia kwa namba yako ya simu. Watumishi, viongozi na madereva kila mmoja anapata mwonekano wake.",
      primary: "Fungua BodaKonnect",
      secondary: "Ongea na timu ya majaribio",
    },
    footer: {
      tagline: "Muhtasari wa BodaKonnect, mfumo wa kidijitali kwa madereva wa bodaboda na bajaji.",
      product: "Mfumo",
      productLinks: ["Usajili wa madereva", "Rekodi za vyombo", "Vikundi na vijiwe", "Uhakiki", "Ripoti"],
      company: "Kampuni",
      companyLinks: ["Kuhusu KYC CONNECT", "Majaribio ya UMAPIDO", "Mtazamo wa faragha", "Mawasiliano"],
      legal:
        "BodaKonnect ni jukwaa kinara la KYC CONNECT LTD (BRELA 211723971). KYC CONNECT LTD si benki, mkopeshaji, kampuni ya bima, mtoa huduma za malipo wala mamlaka ya uthibitisho ya serikali.",
      rights: "Haki zote zimehifadhiwa.",
      privacy: "Taarifa ya faragha",
      terms: "Masharti ya matumizi",
    },
  },
} as const;

export type Content = (typeof content)["en"];
export const getContent = (lang: Lang): Content => content[lang] as unknown as Content;

export const wards = [
  "Majengo", "Uhuru", "Kiwanja cha Ndege", "Makole", "Kilimani", "Chamwino",
  "Kikuyu Kusini", "Ipagala", "Nkuhungu", "Mnadani", "Viwandani", "Tambukareli",
];
