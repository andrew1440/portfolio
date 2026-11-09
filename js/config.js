// Scroll progress p (0..1) is mapped onto the road curve parameter u.
export const U0 = 0.075;
export const U1 = 1.009;
export const pToU = (p) => U0 + (U1 - U0) * p;

// Visibility windows (in scroll progress) for the HTML overlays.
export const RANGES = {
  intro: [0, 0.07],
  about: [0.11, 0.29],
  skills: [0.365, 0.54],
  projects: [0.57, 0.87],
  contact: [0.92, 1.01],
};

export const NAV = [
  { id: 'intro', label: 'Home', p: 0 },
  { id: 'about', label: 'About', p: 0.17 },
  { id: 'skills', label: 'Skills', p: 0.4 },
  { id: 'projects', label: 'Projects', p: 0.63 },
  { id: 'contact', label: 'Contact', p: 1 },
];

// Where things stand in the world, expressed as the scroll progress at which the rider passes them.
export const STATIONS = {
  about: 0.205,
  gate: 0.352,
  skills: [0.39, 0.43, 0.47, 0.51],
  projectsTitle: 0.585,
  projects: [0.665, 0.77, 0.85],
};

export const PROJECT_SPLITS = [0.705, 0.78];

export const SKILLS = [
  { title: 'Core', color: '#ff7a3d' },
  { title: 'Frontend', color: '#37c47b' },
  { title: 'Backend', color: '#4fa8ff' },
  { title: 'AI & Agents', color: '#e04fd8' },
];

export const PROJECTS = [
  {
    index: '01',
    title: 'Naree AI',
    tag: 'AI research tool',
    stack: 'React · Next.js · LangChain · OpenAI',
    url: 'https://github.com/andrew1440/Naree',
    image: 'img/project_ai_search.png',
    art: 'ai',
  },
  {
    index: '02',
    title: 'Mtaani Sports',
    tag: 'Sports & youth',
    stack: 'Python · LangChain · Agents · Vector DB',
    url: 'https://github.com/andrew1440/Mtaani-Sports-Ai',
    art: 'sports',
  },
  {
    index: '03',
    title: 'UIGen',
    tag: 'AI development',
    stack: 'Next.js · React · AI · Radix',
    url: 'https://github.com/andrew1440/UI-Gen',
    art: 'code',
  },
];

// Camera rig keyframes, relative to the rider: distance behind (negative = in front), height,
// lateral offset, how far down the road to look, look-at height and look-at lateral offset.
export const CAMERA_KEYS = [
  { p: 0, back: -8.5, height: 2.4, side: -3.4, ahead: 0, lookH: 1.5, lookSide: 3.2 },
  { p: 0.035, back: 0, height: 4.6, side: -5.5, ahead: 12, lookH: 1.4 },
  { p: 0.075, back: 7.5, height: 3.4, side: 2.2, ahead: 20, lookH: 2 },
  { p: 0.3, back: 7.5, height: 3.4, side: 2.2, ahead: 20, lookH: 2 },
  { p: 0.335, back: 10, height: 5.5, side: 0.6, ahead: 18, lookH: 5 },
  { p: 0.37, back: 7.5, height: 3.6, side: 2.2, ahead: 20, lookH: 2.4 },
  { p: 0.55, back: 7.5, height: 3.4, side: 2.2, ahead: 20, lookH: 2 },
  { p: 0.6, back: 7.5, height: 3.4, side: 2.2, ahead: 20, lookH: 2, lookSide: 4 },
  { p: 0.87, back: 7.5, height: 3.4, side: 2.2, ahead: 20, lookH: 2, lookSide: 4 },
  { p: 0.95, back: 16, height: 9, side: 6, ahead: 30, lookH: 5 },
  { p: 1, back: 26, height: 18, side: 9, ahead: 35, lookH: 6 },
];
