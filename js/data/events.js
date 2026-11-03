/**
 * ALODANAX TechFest - Events Data
 * Single Source of Truth for all competition arenas and workshops.
 * Schema per event:
 * slug, name, category, shortDescription, image, date, venue, intro, description,
 * format, rules[], requirements[], teamSize, instructions[],
 * coordinators[{name, phone, email}], registrationUrl, extraLink.
 *
 * DO NOT invent facts. Unfilled values remain bracketed placeholders.
 */

const EVENTS_DATA = [
  // =========================================================================
  // CATEGORY A: TECHNICAL
  // =========================================================================
  {
    slug: "hackathon",
    name: "Hackathon",
    category: "technical",
    tag: "FLAGSHIP SPRINT",
    featured: true,
    image: "assets/images/events/hackathon.jpg",
    date: "[DATE TBA]",
    venue: "[MAIN AUDITORIUM & COMPUTER LABS]",
    shortDescription: "A relentless 24-hour product engineering sprint challenging squads to build distributed, fault-tolerant prototypes under real-world constraints.",
    intro: "The flagship 24-Hour Hackathon convenes elite student developers, system architects, and creative designers from across the nation to build impactful technology solutions.",
    description: "Participants will collaborate overnight across three designated domains (AI & Autonomous Systems, Cloud Infrastructure & Web3, and Smart Campus Innovation). Mentors from industry and academia will conduct scheduled review checkpoints throughout the 24 hours before final jury presentations.",
    format: "24-Hour continuous offline sprint with 2 mandatory mentor review checkpoints, code freeze at hour 24, followed by 7-minute live stage presentations and 3-minute jury Q&A.",
    rules: [
      "All code, designs, and documentation must be created exclusively during the official 24-hour hackathon window.",
      "Open-source libraries, frameworks, and public APIs are permitted provided they are disclosed in the project README.",
      "Teams must push source code with verifiable commit logs to a newly initialized public repository.",
      "Hardware components must be brought by the teams and demonstrated live during jury evaluation.",
      "Plagiarism, pre-built applications, or code violation results in instantaneous squad disqualification."
    ],
    requirements: [
      "Laptops with required SDKs, Docker, and developer environments pre-installed.",
      "Valid institutional student identity cards for all participants.",
      "Personal multi-plug extension cords and necessary hardware peripherals."
    ],
    teamSize: "[2 TO 4 PARTICIPANTS]",
    instructions: [
      "Check-in desk opens 90 minutes prior to keynote kickoff.",
      "Wi-Fi credentials, workstation power, and rest lounge access will be issued upon badge verification.",
      "Midnight meals, caffeine stations, and emergency first-aid will be staffed throughout the night."
    ],
    coordinators: [
      {
        name: "[STUDENT COORDINATOR 01]",
        role: "Student Lead",
        phone: "[PHONE TBA]",
        email: "[EMAIL TBA]"
      },
      {
        name: "[FACULTY COORDINATOR 01]",
        role: "Faculty Mentor",
        phone: "[PHONE TBA]",
        email: "[EMAIL TBA]"
      }
    ],
    registrationUrl: "[GOOGLE FORM URL HACKATHON]",
    extraLink: {
      label: "Problem Statements & Rules",
      url: "hackathon.html"
    }
  },

  {
    slug: "bit-bash-bonanza",
    name: "Bit Bash Bonanza",
    category: "technical",
    tag: "SPEED CODING",
    featured: true,
    image: "assets/images/events/bit-bash-bonanza.jpg",
    date: "[DATE TBA]",
    venue: "[CENTRAL COMPUTER LAB 101]",
    shortDescription: "A high-octane competitive programming duel testing algorithmic intuition, memory efficiency, and speed under strict clock limits.",
    intro: "Bit Bash Bonanza is a multi-stage algorithmic tournament testing algorithmic precision, dynamic programming, and computational geometry under rapid-fire constraints.",
    description: "Competitors will solve increasingly difficult problem sets hosted on a dedicated competitive platform. Fast execution, clean code, and zero time-limit-exceeded (TLE) submissions determine the leaderboard.",
    format: "Round 1: 45-minute speed preliminary screening. Round 2: 90-minute advanced algorithmic finals with live leaderboard projection.",
    rules: [
      "Permitted languages: C++, Java 17+, Python 3.10+.",
      "No external IDE auto-completes, LLMs, or unauthorized web browsing.",
      "Ties broken by earliest accepted submission and lowest cumulative penalty points."
    ],
    requirements: [
      "Institutional student ID card.",
      "Familiarity with standard I/O competitive judge formats."
    ],
    teamSize: "[INDIVIDUAL (1 PARTICIPANT)]",
    instructions: [
      "Lab terminals will be configured with standard gcc, openjdk, and python3 runtimes.",
      "Report to Lab 101 at least 20 minutes before Round 1."
    ],
    coordinators: [
      {
        name: "[STUDENT COORDINATOR 02]",
        role: "Technical Lead",
        phone: "[PHONE TBA]",
        email: "[EMAIL TBA]"
      }
    ],
    registrationUrl: "[GOOGLE FORM URL BIT BASH]",
    extraLink: null
  },

  // =========================================================================
  // CATEGORY B: NON-TECHNICAL
  // =========================================================================
  {
    slug: "ideathon",
    name: "Ideathon",
    category: "non-technical",
    tag: "VENTURE PITCH",
    featured: true,
    image: "assets/images/events/ideathon.jpg",
    date: "[DATE TBA]",
    venue: "[SEMINAR HALL A]",
    shortDescription: "A technology venture pitching competition evaluating architecture viability, market impact, and disruptive product execution.",
    intro: "The ALODANAX Ideathon provides a stage for student visionaries to pitch groundbreaking product concepts to venture investors and faculty leaders.",
    description: "Teams present their ideas addressing sustainability, healthcare, fintech, or education technology. Pitches are scrutinized on problem relevance, architectural feasibility, revenue models, and scalability.",
    format: "7-minute slide presentation followed by 3 minutes of rigorous jury question-and-answer.",
    rules: [
      "Presentations must use the standardized slide structure outlined in the handbook.",
      "Both hardware and software venture concepts are eligible.",
      "All presented ideas must be original work of the registered team members."
    ],
    requirements: [
      "Pitch deck in PDF or PPTX format submitted 2 hours prior to the event.",
      "At least one team member present for presentation synchronization."
    ],
    teamSize: "[2 TO 3 PARTICIPANTS]",
    instructions: [
      "Presentation remotes and wireless lapel mics will be provided.",
      "Teams must be seated in Seminar Hall A at the scheduled briefing call."
    ],
    coordinators: [
      {
        name: "[STUDENT COORDINATOR 03]",
        role: "Pitch Liaison",
        phone: "[PHONE TBA]",
        email: "[EMAIL TBA]"
      }
    ],
    registrationUrl: "[GOOGLE FORM URL IDEATHON]",
    extraLink: null
  },

  // =========================================================================
  // CATEGORY C: GAMING
  // =========================================================================
  {
    slug: "bgmi",
    name: "BGMI",
    category: "gaming",
    tag: "TACTICAL BATTLE ROYALE",
    featured: true,
    image: "assets/images/events/bgmi.jpg",
    date: "[DATE TBA]",
    venue: "[ESPORTS ARENA / AUDIO-VISUAL LAB]",
    shortDescription: "Squad-based mobile battle royale showdown across Erangel and Miramar testing rotations, clutch utility, and gunplay.",
    intro: "The official ALODANAX BGMI Championship tests collegiate squads in custom room lobbies managed by dedicated referees.",
    description: "Squads will battle through qualifier matches to secure points on the official tournament board. Only the top squads advance to the LAN Grand Finals broadcast live on the arena displays.",
    format: "3 Qualifier Erangel matches, top 16 squads advance to 4-match Grand Finals (Erangel, Miramar, Sanhok, Erangel).",
    rules: [
      "Mobile devices only. Strictly no emulators, iPads/tablets, triggers, or modified configs.",
      "Tournament scoring follows standard esports placement and kill point tables.",
      "Any player found using third-party scripts or exploiting map glitches faces immediate squad disqualification."
    ],
    requirements: [
      "Personal mobile devices with latest official game client installed.",
      "Personal wired or wireless headphones/earphones.",
      "Active high-speed mobile data connection (backup campus Wi-Fi provided)."
    ],
    teamSize: "[SQUAD (4 PLAYERS + 1 SUB)]",
    instructions: [
      "Room ID and passwords will be distributed in the verified team Discord/WhatsApp channel 15 minutes before match kickoff.",
      "Squad captains must verify roster nicknames with officials at check-in."
    ],
    coordinators: [
      {
        name: "[STUDENT COORDINATOR 04]",
        role: "Esports Referee",
        phone: "[PHONE TBA]",
        email: "[EMAIL TBA]"
      }
    ],
    registrationUrl: "[GOOGLE FORM URL BGMI]",
    extraLink: null
  },

  {
    slug: "discovering-derlicts",
    name: "Discovering Derlicts",
    category: "gaming",
    tag: "GEO-CACHED CIPHER HUNT",
    featured: true,
    image: "assets/images/events/discovering-derlicts.jpg",
    date: "[DATE TBA]",
    venue: "[DEPARTMENT AMPHITHEATRE & CAMPUS GROUNDS]",
    shortDescription: "A high-intensity campus-wide puzzle quest decoding cryptographic beacons, vintage computing hardware, and cryptic riddles.",
    intro: "Discovering Derlicts blends alternate reality gaming, hardware repair puzzles, and geo-located riddles scattered across the university campus.",
    description: "Squads navigate cryptic steganography clues, extract encoded hex strings from retired circuit boards, and locate hidden beacons before rival squads decipher the master key.",
    format: "Multi-checkpoint time trial. Checkpoints must be cleared sequentially with QR verification.",
    rules: [
      "Teams must clear checkpoints in designated order; bypasses forfeit checkpoint points.",
      "Interfering with checkpoint physical apparatus or other squads results in immediate disqualification.",
      "Digital clues must be decoded on designated squad devices."
    ],
    requirements: [
      "At least one smartphone per squad with camera scanner and cellular connectivity.",
      "Comfortable shoes for outdoor campus navigation."
    ],
    teamSize: "[3 TO 4 PARTICIPANTS]",
    instructions: [
      "The initial briefing and cipher key distribution commences at the Dept Amphitheatre.",
      "Emergency campus boundaries and out-of-bounds facilities will be explicitly briefed."
    ],
    coordinators: [
      {
        name: "[STUDENT COORDINATOR 05]",
        role: "Quest Master",
        phone: "[PHONE TBA]",
        email: "[EMAIL TBA]"
      }
    ],
    registrationUrl: "[GOOGLE FORM URL DERLICTS]",
    extraLink: null
  }
];

if (typeof window !== 'undefined') {
  window.EVENTS_DATA = EVENTS_DATA;
}
