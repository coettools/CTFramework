const CreateLandscape = (sky, light, far, near, horizon) => `data:image/svg+xml,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675">
    <defs><linearGradient id="sky" x2="0" y2="1"><stop stop-color="${sky}"/><stop offset="1" stop-color="${light}"/></linearGradient></defs>
    <path fill="url(#sky)" d="M0 0h1200v675H0z"/>
    <circle cx="920" cy="165" r="66" fill="${light}"/>
    <path fill="${far}" d="M0 450 180 250 300 390 520 160 750 415 950 310 1200 445V675H0z"/>
    <path fill="${near}" d="M0 515 230 430 400 520 620 365 810 475 1200 380V675H0z"/>
    <path fill="${horizon}" d="M0 570Q300 460 610 570T1200 540V675H0z"/>
    <path fill="none" stroke="${light}" stroke-opacity=".3" stroke-width="2" d="M50 608h190m370 24h280m120-50h160"/>
  </svg>
`)}`;

export const CarouselImages = [
  {
    Src: CreateLandscape("#0a2637", "#9ed8db", "#436c80", "#183e52", "#092a3d"),
    Alt: "Blue mountain ridges beneath a pale moon",
    Caption: "Northern ridge"
  },
  {
    Src: CreateLandscape("#452c38", "#f1be83", "#9d6570", "#654d62", "#263b52"),
    Alt: "Rose-coloured peaks above a dark coastline at dusk",
    Caption: "Coastal dusk"
  },
  {
    Src: CreateLandscape("#163f41", "#d7dfb2", "#71948a", "#356158", "#1b423e"),
    Alt: "Green highland ridges beneath a soft yellow sky",
    Caption: "Highland mist"
  }
];
