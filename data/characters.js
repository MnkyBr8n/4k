// data/characters.js
export const CHARACTERS = {
  "Anton": {
    id: "Anton Wagner",
    template: "passport",
    name: "Anton Wagner",
    role: "Informatik-Student (B.Sc.)",
    portrait: "oc/anton-wagner/anton.png",
    fullArt: "oc/anton-wagner/anton1.png",
    link: "university.html",
    website: "https://4k-art.com/university.html",

    // Passport-specific fields
    university: "TUM",
    faculty: "Fakultät für Informatik",
    studentId: "TUM-23-A-01745",
    nationality: "Deutsch",
    placeOfBirth: "München, Bayern",
    dateOfBirth: "1999-11-11",
    age: 25,
    advisor: "Dr.Conrad Wagner",
    semester: "3. Semester",
    motto: "Code ist Poesie, Maschinen sind die Bühne.",
    aboutQuick: "Ruhig, methodisch; liebt Systems-Programming & Klettern.",
    aboutLong: "Fokus auf Low-Level, Sicherheit und Robotik. Nachtmensch mit Club-Mate.",
    highlights: ["C++ • Rust", "Robotics", "Bouldering"],
    backstoryTeaser: "Vom Bastler zum Systems-Engineer in Ausbildung."
  },

  "Conrad": {
    id: "Conrad",
    template: "passport",
    name: "Conrad Wagnor",
    role: "Maschinenbau-Student (B.Sc.)",
    portrait: "oc/conrad-wagner/conrad.png",
    fullArt: "oc/conrad-wagner/conrad.png",
    link: "university.html",
    website: "",
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
    template: "dandy",
    name: "Fatigue",
    role: "Artist / OC",
    portrait: "oc/fatigue/fatigue.jpg",
    fullArt: "oc/fatigue/fatigue.jpg",
    link: "dandy.html",
    website: "https://4k-art.com/",
    aboutQuick: "Vodoo doll",
    backstoryTeaser: "The sketchbook hums at midnight…",
    highlights: ["Vodoo doll", "Vodoo doll creator"],
    stats: { hearts: 2, skill: 4, move: 5, stealth: 3, stamina: 0.85, extract: 0.5 }
  },

  "4K": {
    id: "4K",
    template: "classic",
    category: "ocs",
    name: "4K",
    portrait: "oc/4k/4k.jpg",
    link: "oc-4k.html",
    website: "https://4k-art.com",
    
    // Classic template fields
    age: 13,
    dateOfBirth: "Nov 27, 2011",
    placeOfBirth: "Springfield, Massachusetts",
    aboutQuick: "Your bio paragraph here...",
    
    // Thumbnail gallery
    images: [
      { src: "oc/4k/4k1.jpg", title: "Artwork 1" },
      { src: "oc/4k/4k2.jpg", title: "Artwork 2" },
      { src: "oc/4k/4k3.jpg", title: "Artwork 3" }
    ],
    
    tags: ["Artist", "Creator", "Designer"]
  }
};
