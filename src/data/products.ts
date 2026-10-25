export type Bit = { num: string; title: string; body: string }

export type Product = {
  /** slug: used for keys, icon file, privacy/support paths and the mailto subject */
  id: string
  name: string
  status: string
  summary: string
  /** first paragraph inside the expanded card */
  intro: string
  /** shows `${id}-icon.png` next to the intro */
  icon?: boolean
  /** render the <li> with id={id} so it can be linked to (#empsize) */
  anchor?: boolean
  bits: Bit[]
  funFact?: { label: string; quote: string; author: string; source: string }
  /** big "open …" button */
  cta?: { label: string; href: string }
  /** testflight footer: reach-out line + privacy / support / github */
  beta?: { github: string }
}

export const products: Product[] = [
  {
    id: 'stackd',
    name: 'stackd',
    status: 'draft live',
    summary:
      'three-sided marketplace for str hosts, local experience and restaurant vendors, and guests, with jc, the trip planner, built in.',
    intro: 'one marketplace. three sides. an agent that plans inside it, not beside it.',
    bits: [
      { num: '01', title: 'hosts', body: 'short-term rental hosts who want guests to experience the neighborhood, not just occupy a unit. upsell local, deepen stays, keep trust close.' },
      { num: '02', title: 'vendors', body: 'restaurants, guides, and experience makers listed where demand already lives: next to the stay, with booking that does not feel bolted on.' },
      { num: '03', title: 'guests', body: 'guests who want a trip that feels composed, not crowded. discover, book, and wander with less friction and more taste.' },
      { num: '04', title: 'jc', body: 'an in-product trip planner. it reads preferences, inventory, and context, then proposes days that feel personal, not generic.' },
      { num: '05', title: 'trust & booking', body: 'one loop from discovery to confirmation. clear roles, clear handoffs, and a record everyone can stand behind.' },
    ],
    cta: { label: 'open stackd draft', href: 'https://stackddraft.lovable.app' },
  },
  {
    id: 'mars',
    name: 'mars',
    status: 'live',
    summary: 'weekend project: spin mars, drop your birthday and look up. share your poster with me :)',
    intro: 'built for fun. real nasa pixels. your birthday, from another planet.',
    bits: [
      { num: '01', title: 'spin the globe', body: 'a full mars you can drag around. viking mosaic, valles facing you, no toy texture.' },
      { num: '02', title: 'birthday dive', body: 'type your full birthday and the camera drops you onto jezero looking up.' },
      { num: '03', title: 'night from mars', body: 'same iau constellations as earth, just oriented from the crater. phobos and deimos tagging along.' },
      { num: '04', title: 'real ground', body: 'perseverance mastcam-z photos underfoot. built for fun, with real nasa pixels.' },
    ],
    cta: { label: 'open birthday in mars', href: 'https://gmunoz512.github.io/mars-sky/' },
  },
  {
    id: 'intergalactic-scale',
    name: 'intergalactic scale',
    status: 'live',
    summary: 'swipe from a dwarf planet to the edge of the observable universe, one object at a time, all at true scale.',
    intro:
      'a slideshow of space, smallest to biggest. each slide puts one object next to the one before it at true size, from a dwarf planet up to the whole observable universe, so you can actually feel how big things get.',
    bits: [
      { num: '01', title: 'true scale', body: 'ceres to the observable universe, 48 stops. each one sits next to the last at real relative size.' },
      { num: '02', title: 'drag it around', body: 'spin planets, stars, galaxies and nebulae in 3d. flares rise and sink back into the hottest stars.' },
      { num: '03', title: 'real pixels', body: "hubble, webb and eso images where they exist, hand-built renders where they don't." },
      { num: '04', title: 'still growing', body: 'the last slide slowly expands, because the universe does too.' },
    ],
    funFact: {
      label: 'fun fact',
      quote: '“if the sun were the size of a hot tub, earth would be the size of a sesame seed.”',
      author: 'neil degrasse tyson & lindsey nyx walker',
      source: 'lost in space: 5,000 facts for navigating the universe',
    },
    cta: { label: 'open intergalactic scale', href: 'https://gmunoz512.github.io/intergalactic-scale/' },
  },
  {
    id: 'safekeep',
    name: 'safekeep',
    status: 'testflight beta',
    summary: 'add a voice note to a photo, remember it forever.',
    intro:
      'a native iphone app (swiftui, ios 16+). it saves a voice note into a live photo copy of your picture, so you can press and hold to hear it.',
    icon: true,
    bits: [
      { num: '01', title: 'press and hold', body: 'the voice note lives inside a live photo copy of your picture. hold the photo, hear the moment.' },
      { num: '02', title: 'from messages', body: 'an imessage app: copy a voice note in the thread, add it to a photo without leaving the chat.' },
      { num: '03', title: 'from voice memos', body: 'share a memo to safekeep and pick the photo it belongs to.' },
      { num: '04', title: 'original untouched', body: 'your original photo is never changed. safekeep only saves a new copy.' },
    ],
    beta: { github: 'https://github.com/gmunoz512/safekeep' },
  },
  {
    id: 'empsize',
    name: 'empsize',
    status: 'testflight beta',
    summary: 'bolds the start of every word so your eyes glide through text.',
    intro: 'a safari and chrome extension. it bolds the first part of each word on any page, so you read with less effort.',
    icon: true,
    anchor: true,
    bits: [
      { num: '01', title: 'safari and chrome', body: 'works in safari on iphone, ipad and mac, plus chrome.' },
      { num: '02', title: 'one big switch', body: 'tap the icon, flip it on for the site you are on.' },
      { num: '03', title: 'tune the bold', body: 'choose how much of each word gets bolded.' },
      { num: '04', title: 'stays out of the way', body: 'leaves code, inputs and links alone. no tracking, no network.' },
    ],
    beta: { github: 'https://github.com/gmunoz512/focus-reader' },
  },
]
