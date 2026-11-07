export const INITIAL_FORM_DATA = {
  name: "",
  email: "",
  phone: "",
  subject: "",
  message: "",
} as const;

// Official brand profiles only.
export const SOCIAL_LINKS = {
  instagram: "https://www.instagram.com/capella.uae/",
  facebook: "https://www.facebook.com/people/Capellauae/61589604975656/",
  tiktok: "https://www.tiktok.com/@capella.uae4",
} as const;

export const MAP_CONFIG = {
  embedUrl: "https://www.google.com/maps?q=Dubai%2C%20United%20Arab%20Emirates&z=11&output=embed",
  directionsUrl: "https://www.google.com/maps/search/?api=1&query=Dubai%2C%20United%20Arab%20Emirates",
  height: 250,
} as const;
