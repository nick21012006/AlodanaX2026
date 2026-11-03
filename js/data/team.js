/**
 * ALODANAX TechFest - Student Team Data
 * 40 structured student team profile entries.
 * Schema: id, name, role, department, photo, social: { linkedin, instagram, github }
 * DO NOT invent facts. Placeholders remain bracketed.
 */

const TEAM_DATA = [
  { id: 1, name: "[NAME 01]", role: "[TECHNICAL LEAD]", department: "Technical", photo: "assets/images/team/member-01.jpg", social: { linkedin: "[LINKEDIN TBA]", instagram: "[INSTAGRAM TBA]", github: "[GITHUB TBA]" } },
  { id: 2, name: "[NAME 02]", role: "[SYSTEMS ARCHITECT]", department: "Technical", photo: "assets/images/team/member-02.jpg", social: { linkedin: "[LINKEDIN TBA]", instagram: "[INSTAGRAM TBA]", github: "[GITHUB TBA]" } },
  { id: 3, name: "[NAME 03]", role: "[CYBERSEC SPECIALIST]", department: "Technical", photo: "assets/images/team/member-03.jpg", social: { linkedin: "[LINKEDIN TBA]", instagram: "[INSTAGRAM TBA]", github: "[GITHUB TBA]" } },
  { id: 4, name: "[NAME 04]", role: "[COMPETITIVE CODE LEAD]", department: "Technical", photo: "assets/images/team/member-04.jpg", social: { linkedin: "[LINKEDIN TBA]", instagram: "[INSTAGRAM TBA]", github: "[GITHUB TBA]" } },
  { id: 5, name: "[NAME 05]", role: "[HACKATHON TRACK LEAD]", department: "Technical", photo: "assets/images/team/member-05.jpg", social: { linkedin: "[LINKEDIN TBA]", instagram: "[INSTAGRAM TBA]", github: "[GITHUB TBA]" } },
  { id: 6, name: "[NAME 06]", role: "[HARDWARE/IOT SPECIALIST]", department: "Technical", photo: "assets/images/team/member-06.jpg", social: { linkedin: "[LINKEDIN TBA]", instagram: "[INSTAGRAM TBA]", github: "[GITHUB TBA]" } },
  { id: 7, name: "[NAME 07]", role: "[LEAD FULL-STACK DEV]", department: "Web", photo: "assets/images/team/member-07.jpg", social: { linkedin: "[LINKEDIN TBA]", instagram: "[INSTAGRAM TBA]", github: "[GITHUB TBA]" } },
  { id: 8, name: "[NAME 08]", role: "[FRONT-END ENGINEER]", department: "Web", photo: "assets/images/team/member-08.jpg", social: { linkedin: "[LINKEDIN TBA]", instagram: "[INSTAGRAM TBA]", github: "[GITHUB TBA]" } },
  { id: 9, name: "[NAME 09]", role: "[BACK-END DEVELOPER]", department: "Web", photo: "assets/images/team/member-09.jpg", social: { linkedin: "[LINKEDIN TBA]", instagram: "[INSTAGRAM TBA]", github: "[GITHUB TBA]" } },
  { id: 10, name: "[NAME 10]", role: "[DEVOPS & CLOUD ARCHITECT]", department: "Web", photo: "assets/images/team/member-10.jpg", social: { linkedin: "[LINKEDIN TBA]", instagram: "[INSTAGRAM TBA]", github: "[GITHUB TBA]" } },
  { id: 11, name: "[NAME 11]", role: "[QA & TEST AUTOMATION]", department: "Web", photo: "assets/images/team/member-11.jpg", social: { linkedin: "[LINKEDIN TBA]", instagram: "[INSTAGRAM TBA]", github: "[GITHUB TBA]" } },
  { id: 12, name: "[NAME 12]", role: "[DATABASE ADMINISTRATOR]", department: "Web", photo: "assets/images/team/member-12.jpg", social: { linkedin: "[LINKEDIN TBA]", instagram: "[INSTAGRAM TBA]", github: "[GITHUB TBA]" } },
  { id: 13, name: "[NAME 13]", role: "[CREATIVE DIRECTOR]", department: "Design", photo: "assets/images/team/member-13.jpg", social: { linkedin: "[LINKEDIN TBA]", instagram: "[INSTAGRAM TBA]", github: "[GITHUB TBA]" } },
  { id: 14, name: "[NAME 14]", role: "[LEAD UI/UX DESIGNER]", department: "Design", photo: "assets/images/team/member-14.jpg", social: { linkedin: "[LINKEDIN TBA]", instagram: "[INSTAGRAM TBA]", github: "[GITHUB TBA]" } },
  { id: 15, name: "[NAME 15]", role: "[3D & MOTION DESIGNER]", department: "Design", photo: "assets/images/team/member-15.jpg", social: { linkedin: "[LINKEDIN TBA]", instagram: "[INSTAGRAM TBA]", github: "[GITHUB TBA]" } },
  { id: 16, name: "[NAME 16]", role: "[BRAND & GRAPHIC DESIGNER]", department: "Design", photo: "assets/images/team/member-16.jpg", social: { linkedin: "[LINKEDIN TBA]", instagram: "[INSTAGRAM TBA]", github: "[GITHUB TBA]" } },
  { id: 17, name: "[NAME 17]", role: "[CINEMATOGRAPHER & VIDEO LEAD]", department: "Media", photo: "assets/images/team/member-17.jpg", social: { linkedin: "[LINKEDIN TBA]", instagram: "[INSTAGRAM TBA]", github: "[GITHUB TBA]" } },
  { id: 18, name: "[NAME 18]", role: "[AUDIO & SFX ENGINEER]", department: "Media", photo: "assets/images/team/member-18.jpg", social: { linkedin: "[LINKEDIN TBA]", instagram: "[INSTAGRAM TBA]", github: "[GITHUB TBA]" } },
  { id: 19, name: "[NAME 19]", role: "[LIVE STREAM PRODUCER]", department: "Media", photo: "assets/images/team/member-19.jpg", social: { linkedin: "[LINKEDIN TBA]", instagram: "[INSTAGRAM TBA]", github: "[GITHUB TBA]" } },
  { id: 20, name: "[NAME 20]", role: "[PHOTOGRAPHY LEAD]", department: "Media", photo: "assets/images/team/member-20.jpg", social: { linkedin: "[LINKEDIN TBA]", instagram: "[INSTAGRAM TBA]", github: "[GITHUB TBA]" } },
  { id: 21, name: "[NAME 21]", role: "[CHIEF OPERATIONS OFFICER]", department: "Operations", photo: "assets/images/team/member-21.jpg", social: { linkedin: "[LINKEDIN TBA]", instagram: "[INSTAGRAM TBA]", github: "[GITHUB TBA]" } },
  { id: 22, name: "[NAME 22]", role: "[VENUE & LAB COORDINATOR]", department: "Operations", photo: "assets/images/team/member-22.jpg", social: { linkedin: "[LINKEDIN TBA]", instagram: "[INSTAGRAM TBA]", github: "[GITHUB TBA]" } },
  { id: 23, name: "[NAME 23]", role: "[HOSPITALITY LEAD]", department: "Operations", photo: "assets/images/team/member-23.jpg", social: { linkedin: "[LINKEDIN TBA]", instagram: "[INSTAGRAM TBA]", github: "[GITHUB TBA]" } },
  { id: 24, name: "[NAME 24]", role: "[STAGE & AUDIO-VISUAL TECH]", department: "Operations", photo: "assets/images/team/member-24.jpg", social: { linkedin: "[LINKEDIN TBA]", instagram: "[INSTAGRAM TBA]", github: "[GITHUB TBA]" } },
  { id: 25, name: "[NAME 25]", role: "[SECURITY & PROTOCOL HEAD]", department: "Operations", photo: "assets/images/team/member-25.jpg", social: { linkedin: "[LINKEDIN TBA]", instagram: "[INSTAGRAM TBA]", github: "[GITHUB TBA]" } },
  { id: 26, name: "[NAME 26]", role: "[REGISTRATION DESK LEAD]", department: "Operations", photo: "assets/images/team/member-26.jpg", social: { linkedin: "[LINKEDIN TBA]", instagram: "[INSTAGRAM TBA]", github: "[GITHUB TBA]" } },
  { id: 27, name: "[NAME 27]", role: "[EQUIPMENT INVENTORY MGR]", department: "Operations", photo: "assets/images/team/member-27.jpg", social: { linkedin: "[LINKEDIN TBA]", instagram: "[INSTAGRAM TBA]", github: "[GITHUB TBA]" } },
  { id: 28, name: "[NAME 28]", role: "[EMERGENCY & FIRST-AID REP]", department: "Operations", photo: "assets/images/team/member-28.jpg", social: { linkedin: "[LINKEDIN TBA]", instagram: "[INSTAGRAM TBA]", github: "[GITHUB TBA]" } },
  { id: 29, name: "[NAME 29]", role: "[HEAD OF CORPORATE RELATIONS]", department: "Public Relations", photo: "assets/images/team/member-29.jpg", social: { linkedin: "[LINKEDIN TBA]", instagram: "[INSTAGRAM TBA]", github: "[GITHUB TBA]" } },
  { id: 30, name: "[NAME 30]", role: "[INDUSTRY PARTNERSHIP LEAD]", department: "Public Relations", photo: "assets/images/team/member-30.jpg", social: { linkedin: "[LINKEDIN TBA]", instagram: "[INSTAGRAM TBA]", github: "[GITHUB TBA]" } },
  { id: 31, name: "[NAME 31]", role: "[CAMPUS AMBASSADOR MGR]", department: "Public Relations", photo: "assets/images/team/member-31.jpg", social: { linkedin: "[LINKEDIN TBA]", instagram: "[INSTAGRAM TBA]", github: "[GITHUB TBA]" } },
  { id: 32, name: "[NAME 32]", role: "[PUBLIC RELATIONS OFFICER]", department: "Public Relations", photo: "assets/images/team/member-32.jpg", social: { linkedin: "[LINKEDIN TBA]", instagram: "[INSTAGRAM TBA]", github: "[GITHUB TBA]" } },
  { id: 33, name: "[NAME 33]", role: "[SOCIAL MEDIA STRATEGIST]", department: "Public Relations", photo: "assets/images/team/member-33.jpg", social: { linkedin: "[LINKEDIN TBA]", instagram: "[INSTAGRAM TBA]", github: "[GITHUB TBA]" } },
  { id: 34, name: "[NAME 34]", role: "[CONTENT & COPY LEAD]", department: "Public Relations", photo: "assets/images/team/member-34.jpg", social: { linkedin: "[LINKEDIN TBA]", instagram: "[INSTAGRAM TBA]", github: "[GITHUB TBA]" } },
  { id: 35, name: "[NAME 35]", role: "[ESPORTS ARENA DIRECTOR]", department: "Gaming", photo: "assets/images/team/member-35.jpg", social: { linkedin: "[LINKEDIN TBA]", instagram: "[INSTAGRAM TBA]", github: "[GITHUB TBA]" } },
  { id: 36, name: "[NAME 36]", role: "[BGMI TOURNAMENT ADMIN]", department: "Gaming", photo: "assets/images/team/member-36.jpg", social: { linkedin: "[LINKEDIN TBA]", instagram: "[INSTAGRAM TBA]", github: "[GITHUB TBA]" } },
  { id: 37, name: "[NAME 37]", role: "[PC GAMING & LAN SPECIALIST]", department: "Gaming", photo: "assets/images/team/member-37.jpg", social: { linkedin: "[LINKEDIN TBA]", instagram: "[INSTAGRAM TBA]", github: "[GITHUB TBA]" } },
  { id: 38, name: "[NAME 38]", role: "[ESPORTS LIVE COMMENTATOR]", department: "Gaming", photo: "assets/images/team/member-38.jpg", social: { linkedin: "[LINKEDIN TBA]", instagram: "[INSTAGRAM TBA]", github: "[GITHUB TBA]" } },
  { id: 39, name: "[NAME 39]", role: "[FAIR PLAY & ANTI-CHEAT JURY]", department: "Gaming", photo: "assets/images/team/member-39.jpg", social: { linkedin: "[LINKEDIN TBA]", instagram: "[INSTAGRAM TBA]", github: "[GITHUB TBA]" } },
  { id: 40, name: "[NAME 40]", role: "[BRACKET & SCORING MANAGER]", department: "Gaming", photo: "assets/images/team/member-40.jpg", social: { linkedin: "[LINKEDIN TBA]", instagram: "[INSTAGRAM TBA]", github: "[GITHUB TBA]" } }
];

if (typeof window !== 'undefined') {
  window.TEAM_DATA = TEAM_DATA;
}
