/**
 * ALODANAX TechFest - Content Data Store
 * All editable copy and bracketed placeholders live here.
 * DO NOT invent facts. Unfilled details remain bracketed placeholders.
 */

const SITE_CONTENT = {
  meta: {
    festName: "ALODANAX",
    edition: "2026",
    department: "[DEPARTMENT, COLLEGE]",
    departmentPresents: "[DEPARTMENT, COLLEGE] PRESENTS",
    tagline: "[TAGLINE]",
    dateVenue: "[DATE] · [VENUE]",
    date: "[DATE]",
    venue: "[VENUE]"
  },

  nav: {
    brand: "ALODANAX",
    links: [
      { label: "ABOUT", href: "#about" },
      { label: "EVENTS", href: "#events" },
      { label: "SCHEDULE", href: "#schedule" },
      { label: "REGISTER", href: "#register" }
    ]
  },

  hero: {
    scrollCue: "SCROLL",
    presenter: "[DEPARTMENT, COLLEGE] PRESENTS",
    tagline: "[TAGLINE]",
    dateVenue: "[DATE] · [VENUE]",
    ctaRegister: "REGISTER NOW",
    ctaEvents: "VIEW EVENTS"
  },

  about: {
    sectionTag: "ABOUT THE TECHFEST",
    titlePrimary: "THE GENESIS OF",
    titleSecondary: "ALODANAX",
    description: "ALODANAX is the premier annual technical festival organized by [DEPARTMENT, COLLEGE]. Built at the intersection of precision engineering and raw creativity, the symposium convenes student developers, algorithmic designers, cybersecurity operatives, and competitive gamers from across the nation.",
    stats: [
      { value: "[50+]", label: "UNIVERSITIES & COLLEGES" },
      { value: "[15+]", label: "FLAGSHIP COMPETITIONS" },
      { value: "[₹1,00,000+]", label: "TOTAL CASH PRIZE POOL" }
    ]
  },

  events: {
    sectionTag: "EVENTS",
    title: "ARENAS OF COMPETITION",
    categories: [
      {
        id: "technical",
        name: "TECHNICAL",
        description: "High-stakes algorithmic challenges, overnight architecture sprints, and security vulnerability discovery.",
        items: [
          {
            title: "[TECHNICAL: 24H HACKATHON]",
            tag: "FLAGSHIP",
            desc: "[RAPID PRODUCT DEVELOPMENT CHALLENGE SOLVING REAL-WORLD IT INFRASTRUCTURE PROBLEMS]",
            prize: "[PRIZE: ₹30,000]",
            team: "[TEAM: 2-4]"
          },
          {
            title: "[TECHNICAL: CODE COMBAT]",
            tag: "SPEED CODING",
            desc: "[ALGORITHMIC PROBLEM SOLVING UNDER EXTREME TIME PRESSURE WITH COMPLEX DATA STRUCTURES]",
            prize: "[PRIZE: ₹15,000]",
            team: "[SOLO]"
          },
          {
            title: "[TECHNICAL: WEB DESIGN CRUCIBLE]",
            tag: "CREATIVE CODE",
            desc: "[FAST-PACED UI/UX ENGINEERING CHALLENGE EVALUATING ACCESSIBILITY, SPEED AND AESTHETICS]",
            prize: "[PRIZE: ₹10,000]",
            team: "[TEAM: 1-2]"
          },
          {
            title: "[TECHNICAL: CTF SECURITY HUNT]",
            tag: "CYBERSEC",
            desc: "[JEOPARDY-STYLE CAPTURE THE FLAG SPANNING CRYPTOGRAPHY, FORENSICS, AND REVERSE ENGINEERING]",
            prize: "[PRIZE: ₹15,000]",
            team: "[TEAM: 2]"
          }
        ]
      },
      {
        id: "non-technical",
        name: "NON-TECHNICAL",
        description: "Strategic mind games, high-stakes technology pitching, and multimedia visual storytelling.",
        items: [
          {
            title: "[NON-TECHNICAL: TECH QUIZ]",
            tag: "TRIVIA",
            desc: "[RAPID TRIVIA ARENA COVERING COMPUTING HISTORY, SILICON INNOVATIONS, AND TECH CULTURE]",
            prize: "[PRIZE: ₹8,000]",
            team: "[TEAM: 2]"
          },
          {
            title: "[NON-TECHNICAL: STARTUP PITCH PIT]",
            tag: "ENTREPRENEURSHIP",
            desc: "[CONVINCE A PANEL OF INDUSTRY INVESTORS WITH A VIABLE TECH PRODUCT STRATEGY & P&L]",
            prize: "[PRIZE: ₹15,000]",
            team: "[TEAM: 2-4]"
          },
          {
            title: "[NON-TECHNICAL: DIGITAL CREATIVE SPRINT]",
            tag: "DESIGN & EDITING",
            desc: "[SPOT GRAPHIC DESIGN AND MOTION GRAPHICS CREATION USING CREATIVE PRODUCTION SUITES]",
            prize: "[PRIZE: ₹7,000]",
            team: "[SOLO]"
          }
        ]
      },
      {
        id: "gaming",
        name: "GAMING",
        description: "Zero-latency competitive esports brackets hosted on dedicated high-refresh battle rigs.",
        items: [
          {
            title: "[GAMING: VALORANT TOURNAMENT]",
            tag: "TACTICAL FPS",
            desc: "[5V5 DOUBLE ELIMINATION ESPORTS SHOWDOWN ON HIGH-REFRESH RATE LAN RIGS]",
            prize: "[PRIZE: ₹25,000]",
            team: "[5 + 1 SUB]"
          },
          {
            title: "[GAMING: BGMI CLAN SHOWDOWN]",
            tag: "BATTLE ROYALE",
            desc: "[CUSTOM SQUAD LOBBIES TESTING TACTICAL ROTATIONS, COMBAT ACCURACY, AND SURVIVAL]",
            prize: "[PRIZE: ₹15,000]",
            team: "[SQUAD]"
          },
          {
            title: "[GAMING: EA FC 26 CUP]",
            tag: "SPORTS SIM",
            desc: "[1V1 TOURNAMENT BRACKET PLAYED ON OFFICIAL COMPETITIVE CONTROLLER STATIONS]",
            prize: "[PRIZE: ₹8,000]",
            team: "[SOLO]"
          }
        ]
      }
    ]
  },

  schedule: {
    sectionTag: "ITINERARY",
    title: "MISSION TIMELINE",
    days: [
      {
        day: "DAY 01 · [DATE 1]",
        events: [
          { time: "09:00 AM", title: "OPENING CEREMONY & KEYNOTE", venue: "[MAIN AUDITORIUM]" },
          { time: "10:30 AM", title: "HACKATHON COMMENCEMENT", venue: "[LAB COMPLEX A]" },
          { time: "11:00 AM", title: "CODE COMBAT: ROUND 1", venue: "[CS LAB 3]" },
          { time: "02:00 PM", title: "VALORANT GROUP STAGES", venue: "[ESPORTS ARENA]" },
          { time: "04:30 PM", title: "TECH QUIZ PRELIMS", venue: "[SEMINAR HALL 1]" }
        ]
      },
      {
        day: "DAY 02 · [DATE 2]",
        events: [
          { time: "09:30 AM", title: "CTF CYBERSECURITY FINALS", venue: "[SEC LAB]" },
          { time: "11:00 AM", title: "STARTUP PITCH SHOWDOWN", venue: "[INCUBATION CELL]" },
          { time: "01:30 PM", title: "HACKATHON JURY EVALUATION", venue: "[LAB COMPLEX A]" },
          { time: "04:00 PM", title: "VALORANT & BGMI GRAND FINALS", venue: "[MAIN AUDITORIUM]" },
          { time: "06:00 PM", title: "VALEDICTORY & PRIZE DISTRIBUTION", venue: "[MAIN AUDITORIUM]" }
        ]
      }
    ]
  },

  register: {
    sectionTag: "REGISTRATION",
    title: "CLAIM YOUR PASS",
    note: "Preview Mode: No live backend connected. Submissions are verified on client-side only.",
    eventOptions: [
      { category: "Technical", name: "[TECHNICAL: 24H HACKATHON]" },
      { category: "Technical", name: "[TECHNICAL: CODE COMBAT]" },
      { category: "Technical", name: "[TECHNICAL: WEB DESIGN CRUCIBLE]" },
      { category: "Technical", name: "[TECHNICAL: CTF SECURITY HUNT]" },
      { category: "Non-Technical", name: "[NON-TECHNICAL: TECH QUIZ]" },
      { category: "Non-Technical", name: "[NON-TECHNICAL: STARTUP PITCH PIT]" },
      { category: "Non-Technical", name: "[NON-TECHNICAL: DIGITAL CREATIVE SPRINT]" },
      { category: "Gaming", name: "[GAMING: VALORANT TOURNAMENT]" },
      { category: "Gaming", name: "[GAMING: BGMI CLAN SHOWDOWN]" },
      { category: "Gaming", name: "[GAMING: EA FC 26 CUP]" }
    ]
  },

  contact: {
    email: "[EMAIL / PHONE / INSTAGRAM]",
    phone: "[PHONE TBA]",
    instagram: "@[INSTAGRAM_HANDLE]",
    discord: "[DISCORD SERVER LINK]",
    address: "[DEPARTMENT, COLLEGE], [VENUE ADDRESS]"
  },

  footer: {
    department: "[DEPARTMENT, COLLEGE]",
    year: "2026",
    tagline: "[TAGLINE]",
    rights: "ALL RIGHTS RESERVED"
  }
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = SITE_CONTENT;
}

