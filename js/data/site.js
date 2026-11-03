/**
 * ALODANAX TechFest - Global Site Data
 * Single Source of Truth for Brand, College Details, Socials, Collaborator
 * DO NOT invent facts. Unfilled details remain bracketed placeholders.
 */

const SITE_DATA = {
  brand: {
    name: "ALODANAX",
    edition: "2026",
    tagline: "[TAGLINE]",
    subtagline: "Annual National Level IT/CS TechFest",
    theme: "Precision Engineering Meets Cyber Evolution"
  },
  college: {
    name: "[COLLEGE NAME]",
    department: "[DEPARTMENT OF INFORMATION TECHNOLOGY / COMPUTER SCIENCE]",
    fullTitle: "[DEPARTMENT, COLLEGE]",
    address: "[CAMPUS ADDRESS, CITY, STATE, PIN]",
    affiliation: "[AFFILIATED UNIVERSITY / ACCREDITATION]",
    dates: "[DATE TBA]",
    venue: "[VENUE TBA]"
  },
  contacts: {
    email: "[EMAIL TBA]",
    phone: "[PHONE TBA]",
    inquiryEmail: "[INQUIRY EMAIL TBA]"
  },
  socials: {
    instagram: "[INSTAGRAM TBA]",
    linkedin: "[LINKEDIN TBA]",
    github: "[GITHUB TBA]",
    youtube: "[YOUTUBE TBA]",
    x: "[X / TWITTER TBA]"
  },
  map: {
    embedUrl: "", // If empty or placeholder, graceful card fallback
    link: ""      // Google Maps external link
  },
  inquiryEndpoint: "[ENDPOINT TBA]", // If placeholder, form submission shows preview note
  about: {
    shortIntro: "ALODANAX is the premier annual technical symposium orchestrated by the Department of Information Technology & Computer Science at [COLLEGE NAME]. Built at the intersection of precision engineering and raw creativity, the symposium convenes student developers, algorithmic designers, cybersecurity operatives, and competitive gamers from across the nation.",
    vision: "To cultivate an elite competitive forum that bridges foundational computer science with production-grade engineering, accelerating student innovation across artificial intelligence, cybersecurity, and distributed systems.",
    purpose: "Empowering the next generation of technologists through rigorous hackathons, competitive problem-solving arenas, creative digital showcases, and direct industry collaboration.",
    stats: [
      { value: "[50+]", label: "UNIVERSITIES & COLLEGES" },
      { value: "[15+]", label: "FLAGSHIP COMPETITIONS" },
      { value: "[₹1,00,000+]", label: "TOTAL CASH PRIZE POOL" }
    ]
  },
  collaborator: {
    name: "[COLLABORATOR COMPANY NAME]",
    logo: "assets/images/collaborator/logo.png",
    intro: "[COLLABORATOR INTRO - A LEADING TECHNOLOGY INNOVATOR EMPOWERING ACADEMIC EXCELLENCE, CLOUD ARCHITECTURE, AND STUDENT RESEARCH]",
    info: [
      "[INDUSTRY PARTNER IN CLOUD & AI RESEARCH]",
      "[SPONSOR OF FLAGSHIP 24H HACKATHON ARENA]",
      "[OFFERING INTERNSHIP PATHWAYS & EXPERT MENTORSHIP]"
    ],
    link: "[COLLABORATOR WEBSITE URL]",
    guests: [
      {
        name: "[GUEST NAME 01]",
        designation: "[KEYNOTE SPEAKER / SENIOR CLOUD ARCHITECT]",
        photo: "assets/images/collaborator/guest-1.jpg"
      },
      {
        name: "[GUEST NAME 02]",
        designation: "[INDUSTRY MENTOR / VP ENGINEERING]",
        photo: "assets/images/collaborator/guest-2.jpg"
      },
      {
        name: "[GUEST NAME 03]",
        designation: "[HACKATHON JURY CHAIR / PRINCIPAL AI RESEARCHER]",
        photo: "assets/images/collaborator/guest-3.jpg"
      }
    ]
  },
  why: [
    {
      pillar: "Innovation",
      title: "GROUNDBREAKING TECH",
      description: "Push beyond theoretical boundaries with emerging frameworks, neural pipelines, and decentralized systems."
    },
    {
      pillar: "Creativity",
      title: "UNBOUND DESIGN",
      description: "Engineering meets aesthetic mastery: intuitive human interfaces, generative media, and fluid motion design."
    },
    {
      pillar: "Collaboration",
      title: "SYNERGISTIC SQUADS",
      description: "Unite with cross-functional talent across universities to solve urgent infrastructure and social challenges."
    },
    {
      pillar: "Competition",
      title: "ELITE BATTLEGROUNDS",
      description: "Test your mental limits against national-caliber coders, security analysts, and tactical esports champions."
    }
  ]
};

if (typeof window !== 'undefined') {
  window.SITE_DATA = SITE_DATA;
}

