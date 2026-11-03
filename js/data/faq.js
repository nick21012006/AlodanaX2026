/**
 * ALODANAX TechFest - FAQ Data
 * 8 common questions regarding participation, registration, rules, and venue.
 */

const FAQ_DATA = [
  {
    q: "Who is eligible to participate in ALODANAX?",
    a: "Undergraduate and postgraduate students enrolled in recognized universities and colleges pursuing Computer Science, Information Technology, Computer Applications, or related engineering disciplines are eligible. A valid student ID card is mandatory at physical check-in."
  },
  {
    q: "How does the registration process work?",
    a: "Registration is conducted on a per-event basis via official Google Forms linked on each event's card. If an event registration link is pending announcement, it will display 'Registration Opening Soon'. Once live, complete the form with your squad details to reserve your slot."
  },
  {
    q: "Is there an entry or registration fee?",
    a: "Participation guidelines and any fee specifics (if applicable) are detailed on each event's Google Form. Most flagship technical arenas, including competitive programming and keynotes, are free for verified students."
  },
  {
    q: "Can I participate in multiple events?",
    a: "Yes, provided the scheduled event slots do not overlap. The flagship 24-Hour Hackathon runs continuously, so hackathon participants are advised not to enroll in simultaneous day-time arenas."
  },
  {
    q: "What hardware or software should I bring for technical events?",
    a: "For the Hackathon, Web Design, and CTF challenges, participants must bring their personal laptops, chargers, and any specialized hardware. Workstation labs with compiler environments are provided for Bit Bash Bonanza."
  },
  {
    q: "Will accommodation and meals be arranged for overnight participants?",
    a: "Registered participants of the 24-Hour Hackathon and outstation attendees will have designated rest lounges, high-speed Wi-Fi, midnight snacks, and breakfast on campus. Detailed hostel accommodation protocols are shared post-registration confirmation."
  },
  {
    q: "When and how are certificates and cash prizes distributed?",
    a: "Official certificates of participation and merit credentials will be issued digitally to verified attendees. Cash prizes and trophies are awarded on stage during the grand valedictory ceremony on the final evening."
  },
  {
    q: "How do I reach the college campus and venue?",
    a: "The college campus is well-connected by local metro, suburban transit lines, and cab services. Campus gates, parking zones, and orientation signs will be staffed by the ALODANAX student logistics team."
  }
];

if (typeof window !== 'undefined') {
  window.FAQ_DATA = FAQ_DATA;
}

