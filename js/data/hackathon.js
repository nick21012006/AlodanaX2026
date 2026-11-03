/**
 * ALODANAX TechFest - Flagship 24H Hackathon Data
 * Single Source of Truth for Hackathon domains, problem statements, rules & timeline.
 * Domain names and problem statement contents are placeholders as requested.
 * Supports deep linking via #domain=<slug>.
 */

const HACKATHON_DATA = {
  meta: {
    title: "24-HOUR FLAGSHIP HACKATHON",
    subtitle: "SYNAPSE // PROTOCOL",
    tagline: "Build the next frontier of high-throughput distributed solutions in a relentless 24-hour sprint.",
    date: "[DATE TBA]",
    venue: "[MAIN TECH AUDITORIUM & COMPUTING SUITES]",
    duration: "24 Hours Non-Stop",
    mode: "Offline / On-Campus",
    samplePptUrl: "assets/downloads/hackathon-sample.pptx",
    eventSlug: "hackathon" // References events.js for registrationUrl and dynamic state
  },

  domains: [
    {
      slug: "domain-1",
      name: "[DOMAIN 1: ARTIFICIAL INTELLIGENCE & AUTONOMOUS SYSTEMS]",
      tag: "DOMAIN 01",
      shortDescription: "[DOMAIN 1 SHORT DESCRIPTION: EMBEDDED INTELLIGENCE, NEURAL PIPELINES, AND PREDICTIVE DECISION ENGINES]",
      problemStatements: [
        {
          id: "[PS-01]",
          title: "[PROBLEM STATEMENT 01 TITLE]",
          domainSlug: "domain-1",
          difficulty: "HARD",
          description: "[PROBLEM STATEMENT 01 DETAILED DESCRIPTION: ARCHITECT A RESILIENT, REAL-TIME SYSTEM SOLVING COMPLEX LOGISTICAL OR SENSORY BOTTLENECKS UNDER SUB-OPTIMAL NETWORK CONDITIONS.]",
          expectedOutcome: "[EXPECTED OUTCOME: A FUNCTIONING HIGH-THROUGHPUT PROTOTYPE WITH DOCUMENTED INFERENCE BENCHMARKS, LOCAL REPOSITORY, AND DEPLOYED DEMO INTERFACE.]"
        },
        {
          id: "[PS-02]",
          title: "[PROBLEM STATEMENT 02 TITLE]",
          domainSlug: "domain-1",
          difficulty: "EXTREME",
          description: "[PROBLEM STATEMENT 02 DETAILED DESCRIPTION: IMPLEMENT AN AUTONOMOUS PIPELINE CAPABLE OF AUTOMATED ANOMALY DETECTION AND ADAPTIVE MITIGATION IN DISTRIBUTED STREAM DATA.]",
          expectedOutcome: "[EXPECTED OUTCOME: AN OPEN-SOURCE SERVICE WITH LIVE SIMULATION HARNESS, TELEMETRY DASHBOARD, AND REPRODUCIBLE EVALUATION METRICS.]"
        }
      ]
    },
    {
      slug: "domain-2",
      name: "[DOMAIN 2: CLOUD INFRASTRUCTURE & DECENTRALIZED SYSTEMS]",
      tag: "DOMAIN 02",
      shortDescription: "[DOMAIN 2 SHORT DESCRIPTION: FAULT-TOLERANT ARCHITECTURES, HIGH-CONCURRENCY MICROSERVICES, AND CRYPTOGRAPHIC REGISTRIES]",
      problemStatements: [
        {
          id: "[PS-03]",
          title: "[PROBLEM STATEMENT 03 TITLE]",
          domainSlug: "domain-2",
          difficulty: "MEDIUM",
          description: "[PROBLEM STATEMENT 03 DETAILED DESCRIPTION: BUILD A LOW-LATENCY VERIFIABLE DATA REGISTRY DELIVERING HIGH THROUGHPUT WITHOUT SINGLE POINTS OF FAILURE.]",
          expectedOutcome: "[EXPECTED OUTCOME: DEPLOYED SMART CONTRACTS OR CONSENSUS NODES WITH INTERACTIVE VERIFIER WEB APP AND BENCHMARK REPORT.]"
        },
        {
          id: "[PS-04]",
          title: "[PROBLEM STATEMENT 04 TITLE]",
          domainSlug: "domain-2",
          difficulty: "HARD",
          description: "[PROBLEM STATEMENT 04 DETAILED DESCRIPTION: DESIGN A SELF-HEALING SERVICE MESH WITH AUTONOMOUS FAILOVER PROTOCOLS FOR CLOUD-NATIVE DEPLOYMENTS.]",
          expectedOutcome: "[EXPECTED OUTCOME: CONTAINERIZED DAEMON WITH COMPREHENSIVE CHAOS TESTING SUITE AND CONFIGURABLE ROUTING RULES.]"
        }
      ]
    },
    {
      slug: "domain-3",
      name: "[DOMAIN 3: SMART CAMPUS & OPEN INNOVATION]",
      tag: "DOMAIN 03",
      shortDescription: "[DOMAIN 3 SHORT DESCRIPTION: SUSTAINABLE CAMPUS INFRASTRUCTURE, DIGITAL ACCESSIBILITY, AND CITIZEN TECH TOOLS]",
      problemStatements: [
        {
          id: "[PS-05]",
          title: "[PROBLEM STATEMENT 05 TITLE]",
          domainSlug: "domain-3",
          difficulty: "MEDIUM",
          description: "[PROBLEM STATEMENT 05 DETAILED DESCRIPTION: CREATE AN ACCESSIBLE CAMPUS RESOURCE ORCHESTRATOR OPTIMIZING PHYSICAL SPACES AND UTILITY CONSUMPTION.]",
          expectedOutcome: "[EXPECTED OUTCOME: RESPONSIVE CROSS-PLATFORM APPLICATION WITH ROLE-BASED ACCESS CONTROL AND REAL-TIME TELEMETRY CHARTS.]"
        },
        {
          id: "[PS-06]",
          title: "[PROBLEM STATEMENT 06 TITLE]",
          domainSlug: "domain-3",
          difficulty: "HARD",
          description: "[PROBLEM STATEMENT 06 DETAILED DESCRIPTION: DEVELOP AN ASSISTIVE WAYFINDING AND SAFETY SYSTEM FOR DIVERSE CAMPUS ENVIRONMENTS WITHOUT REQUIRING SPECIALIZED BEACONS.]",
          expectedOutcome: "[EXPECTED OUTCOME: ACCESSIBLE MOBILE/WEB CLIENT WITH SPATIAL GUIDANCE, WCAG AAA CONTRAST COMPLIANCE, AND VOICE PROMPTS.]"
        }
      ]
    }
  ],

  timeline: [
    { time: "09:00 AM", title: "CHECK-IN & SQUAD ONBOARDING", desc: "Hardware verification, desk assignments, and developer kit distribution." },
    { time: "10:30 AM", title: "KEYNOTE & ARENA UNVEILING", desc: "Briefing by faculty chair and technical partner mentors." },
    { time: "11:00 AM", title: "HACKATHON COMMENCES (CLOCK STARTS)", desc: "24-hour sprint begins. Problem statement selection locks." },
    { time: "04:00 PM", title: "CHECKPOINT 1: ARCHITECTURE AUDIT", desc: "Mandatory squad review with industry technical mentors." },
    { time: "09:00 PM", title: "EVENING FUEL & LIGHTNING TRIVIA", desc: "Dinner, caffeine re-supply, and high-energy developer trivia." },
    { time: "02:00 AM", title: "CHECKPOINT 2: MIDNIGHT RUN", desc: "Core API integrations and minimum viable prototype review." },
    { time: "08:00 AM", title: "BREAKFAST & CODE FREEZE WARNING", desc: "Final sprint for deployment, documentation, and presentation polish." },
    { time: "11:00 AM", title: "CODE FREEZE & REPOSITORY LOCK", desc: "Submission links locked on portal. Testing concludes." },
    { time: "12:00 PM", title: "PITCH STAGE & GRAND JURY EVALUATION", desc: "7-minute live demo and 3-minute Q&A before the industry jury." },
    { time: "04:30 PM", title: "VALEDICTORY & WINNER CELEBRATION", desc: "Cash awards, trophies, and partner internship offerings announced." }
  ],

  rules: [
    "Maximum team size is 2 to 4 members. Inter-college teams are permitted and encouraged.",
    "All code, designs, and digital assets must be authored during the 24-hour hackathon period.",
    "Teams must commit source code regularly to a newly initialized public repository with verifiable commit timestamps.",
    "Open-source libraries and public cloud APIs are permitted if documented in the submission repository.",
    "Hardware prototypes must be demonstrated live during the jury round.",
    "Any form of plagiarism, harassment, or code of conduct violation leads to immediate team disqualification."
  ],

  heads: [
    {
      name: "[HACKATHON HEAD 01]",
      role: "Student Lead",
      phone: "[PHONE TBA]",
      email: "[EMAIL TBA]"
    },
    {
      name: "[HACKATHON HEAD 02]",
      role: "Operations Lead",
      phone: "[PHONE TBA]",
      email: "[EMAIL TBA]"
    },
    {
      name: "[HACKATHON FACULTY HEAD]",
      role: "Faculty Convenor",
      phone: "[PHONE TBA]",
      email: "[EMAIL TBA]"
    }
  ]
};

if (typeof window !== 'undefined') {
  window.HACKATHON_DATA = HACKATHON_DATA;
}
