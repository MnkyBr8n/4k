export const CHARACTERS = {
  "Anton": {
    id: "Anton Wagnor",
    template: "passport",          // passport | storycard | roblox | fortnite | dandy | classic
    name: "Anton Weiss",
    role: "Informatik-Student (B.Sc.)",
    portrait: "images/anton1.png",
    fullArt: "images/anton1.png",
    link: "oc-pages/oc-anton.html", // full page
    website: "https://4k-art.com/anton", // personal site (optional)

    // Passport-specific fields (used by the passport template)
    university: "TUM",
    faculty: "Fakultät für Informatik",
    studentId: "TUM-23-A-01745",
    nationality: "Deutsch",
    placeOfBirth: "München, Bayern",
    dateOfBirth: "1999-11-11",
    age: 25,
    advisor: "Dr.Conrad Weiss",
    semester: "3. Semester",
    motto: "Code ist Poesie, Maschinen sind die Bühne.",
    aboutQuick: "Ruhig, methodisch; liebt Systems-Programming & Klettern.",
    aboutLong: "Fokus auf Low-Level, Sicherheit und Robotik. Nachtmensch mit Club-Mate."
 },
    // “fun” templates may also read:
    highlights: ["C++ • Rust", "Robotics", "Bouldering"],
    backstoryTeaser: "Vom Bastler zum Systems-Engineer in Ausbildung."
  },

  "Conrad": {
    id: "Conrad",
    template: "passport",
    name: "Conrad Wagnor",
    role: "Maschinenbau-Student (B.Sc.)",
    portrait: "componets/conrad1.png",
    fullArt: "componets/conrad1.png",
    link: "oc-pages/oc-conrad.html",
    website: "https://4k-art.com/conrad",
    university: "RWTH Aachen",
    faculty: "Fakultät für Maschinenwesen",
    nationality: "Deutsch",
    placeOfBirth: "Aachen, NRW",
    dateOfBirth: "1994-10-23",
    age: 31,
    motto: "Präzision zuerst. Geschwindigkeit folgt.",
    aboutQuick: "Neugierig, hands-on; liebt CAD & Fahrradtouren.",
    aboutLong: "Leichtbau-Tüftler, Fertigungstechnik-Fan, baut am E-Bike-Umbau.",
    highlights: ["CAD", "Fertigung", "Werkstatt"]
  },

  "Fatigue": {
    id: "fatigue",
    template: "Dandy",             // or "storycard" if you prefer
    name: "Fatigue",
    role: "Artist / OC",
    portrait: "images/fatigue.jpg",
    fullArt: "images/fatigue.jpg",
    link: "oc-fatigue.html",
    website: "https://4k-art.com/fatigue",
    aboutQuick:/ "Vodoo doll, ",
    backstoryTeaser: "The sketchbook hums at midnight…",
    highlights: ["Vodoo doll, Vodoo doll creator],
    stats: { hearts: 2, skill: 4, move: 5, stealth: 3, stamina: 0.85, extract: 0.5 }
  }
};

"4K": {
    id: "4K",
    template: "classic",  // ← Use the classic template
    category: "ocs",
    name: "4K",
    portrait: "images/4k.jpg",
    link: "oc-pages/oc-4k.html",
    website: "https://4k-art.com",
    
    // Classic template fields
    age: 13,
    dateOfBirth: "Nov 27, 2011",
    placeOfBirth: "Barcelona, Spain",
    aboutQuick: "Your bio paragraph here...",
    
    // Thumbnail gallery
    images: [
      { src: "images/4k1.jpg", title: "Artwork 1" },
      { src: "images/4k2.jpg", title: "Artwork 2" },
      { src: "images/4k3.jpg", title: "Artwork 3" }
    ],
    
    tags: ["Artist", "Creator", "Designer"]
  },