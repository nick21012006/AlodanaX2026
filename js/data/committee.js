/**
 * ALODANAX TechFest - Organizing Committee Data
 * Single Source of Truth for fest governance.
 * Structure:
 * 1. Head of the Department (ONE large full-width featured card)
 * 2. Chief Patron
 * 3. Patron
 * 4. Chairperson
 * 5. Staff Convenors
 * 6. Student Convenors
 * 7. Other Organizing Leadership
 * (Only groups that have entries will be rendered)
 * DO NOT invent facts. Placeholders remain bracketed.
 */

const COMMITTEE_DATA = {
  // 1. Head of the Department: ONE large full-width featured card
  hod: {
    name: "[DR. HOD NAME]",
    designation: "[PROFESSOR & HEAD OF DEPARTMENT]",
    department: "[DEPT OF INFORMATION TECHNOLOGY / COMPUTER SCIENCE]",
    intro: "[WELCOME TO ALODANAX 2026. OUR DEPARTMENT HAS ALWAYS CHAMPIONED THE PURSUIT OF RIGOROUS ENGINEERING AND CREATIVE INNOVATION. WE INVITE TALENTED MINDS FROM ACROSS THE NATION TO COMPETE, COLLABORATE, AND REDEFINE WHAT IS POSSIBLE.]",
    photo: "assets/images/committee/hod.jpg"
  },

  // Remaining tiers in strict required order
  tiers: [
    {
      tierId: "chief-patron",
      title: "Chief Patron",
      layout: "featured-tier", // larger card layout
      members: [
        {
          name: "[CHIEF PATRON NAME]",
          designation: "[PRINCIPAL / DEAN OF ENGINEERING]",
          department: "[COLLEGE NAME]",
          intro: "[ACADEMIC LEADER CHAMPIONING TECHNICAL RIGOR, RESEARCH CULTURE, AND STATE-OF-THE-ART COMPUTING FACILITIES.]",
          photo: "assets/images/committee/chief-patron.jpg"
        }
      ]
    },
    {
      tierId: "patron",
      title: "Patron",
      layout: "featured-tier",
      members: [
        {
          name: "[PATRON NAME]",
          designation: "[VICE PRINCIPAL / DIRECTOR OF ACADEMICS]",
          department: "[COLLEGE NAME]",
          intro: "[GUIDING INTERDISCIPLINARY COOPERATION, INSTITUTIONAL PARTNERSHIPS, AND QUALITY STANDARDS.]",
          photo: "assets/images/committee/patron.jpg"
        }
      ]
    },
    {
      tierId: "chairperson",
      title: "Chairperson",
      layout: "featured-tier",
      members: [
        {
          name: "[CHAIRPERSON NAME]",
          designation: "[DEAN OF STUDENT AFFAIRS / SENIOR PROFESSOR]",
          department: "[COLLEGE NAME]",
          intro: "[OVERSEEING FESTIVAL STRATEGY, ARENA SAFETY PROTOCOLS, AND STUDENT ENGAGEMENT.]",
          photo: "assets/images/committee/chairperson.jpg"
        }
      ]
    },
    {
      tierId: "staff-convenors",
      title: "Staff Convenors",
      layout: "grid-tier", // refined grid
      members: [
        {
          name: "[STAFF CONVENOR 01]",
          designation: "[ASSOCIATE PROFESSOR, IT/CS]",
          department: "[DEPT OF IT/CS]",
          intro: "[CHIEF FACULTY LIAISON COORDINATING ACADEMIC COMPETITIONS, MENTORSHIP, AND JUDGING PANELS.]",
          photo: "assets/images/committee/staff-convenor-1.jpg"
        },
        {
          name: "[STAFF CONVENOR 02]",
          designation: "[ASSISTANT PROFESSOR, IT/CS]",
          department: "[DEPT OF IT/CS]",
          intro: "[CO-CONVENOR MANAGING TECHNICAL INFRASTRUCTURE, HIGH-SPEED LAB NETWORKING, AND SECURITY.]",
          photo: "assets/images/committee/staff-convenor-2.jpg"
        }
      ]
    },
    {
      tierId: "student-convenors",
      title: "Student Convenors",
      layout: "grid-tier",
      members: [
        {
          name: "[STUDENT CONVENOR 01]",
          designation: "[PRESIDENT, IT/CS STUDENT COUNCIL]",
          department: "[DEPT OF IT/CS]",
          intro: "[LEAD STUDENT ORGANIZER DIRECTING ARENA OPERATIONS, REGISTRATION INTEGRATION, AND TEAM DEPLOYMENTS.]",
          photo: "assets/images/committee/student-convenor-1.jpg"
        },
        {
          name: "[STUDENT CONVENOR 02]",
          designation: "[VICE PRESIDENT, IT/CS STUDENT COUNCIL]",
          department: "[DEPT OF IT/CS]",
          intro: "[CO-CONVENOR OVERSEEING STAGE LOGISTICS, PARTICIPANT EXPERIENCE, AND TECHFEST COMMISSIONS.]",
          photo: "assets/images/committee/student-convenor-2.jpg"
        }
      ]
    },
    {
      tierId: "other-leadership",
      title: "Other Organizing Leadership",
      layout: "compact-grid",
      members: [
        {
          name: "[ORGANIZING SECRETARY]",
          designation: "[GENERAL SECRETARY]",
          department: "[DEPT OF IT/CS]",
          intro: "[COORDINATING SCHEDULE MASTER SYNCHRONIZATION AND VOLUNTEER DISPATCH.]",
          photo: "assets/images/committee/secretary.jpg"
        },
        {
          name: "[FINANCE & TREASURY LEAD]",
          designation: "[STUDENT TREASURER]",
          department: "[DEPT OF IT/CS]",
          intro: "[MANAGING FESTIVAL BUDGETS, SPONSOR AUDITING, AND PRIZE DISBURSEMENT.]",
          photo: "assets/images/committee/treasurer.jpg"
        }
      ]
    }
  ]
};

if (typeof window !== 'undefined') {
  window.COMMITTEE_DATA = COMMITTEE_DATA;
}
