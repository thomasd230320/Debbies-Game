/* ===========================================================
   shop-catalog.js — what's for sale in the Star Shop.
   Pure data, read by the hub (to render the pet), the shop page,
   and the theme system. To add an item: add an entry here.
   Costs are in ⭐ stars. cost 0 = free starter.
   =========================================================== */

export const PETS = [
  { id: 'chick', emoji: '🐥', name: 'Chick', cost: 0 },      // free starter
  { id: 'frog', emoji: '🐸', name: 'Froggy', cost: 20 },
  { id: 'cat', emoji: '🐱', name: 'Kitten', cost: 25 },
  { id: 'bunny', emoji: '🐰', name: 'Bunny', cost: 30 },
  { id: 'hamster', emoji: '🐹', name: 'Hamster', cost: 35 },
  { id: 'fox', emoji: '🦊', name: 'Fox', cost: 45 },
  { id: 'bear', emoji: '🐻', name: 'Bear', cost: 50 },
  { id: 'penguin', emoji: '🐧', name: 'Penguin', cost: 60 },
  { id: 'pony', emoji: '🐴', name: 'Pony', cost: 80 },
  { id: 'unicorn', emoji: '🦄', name: 'Unicorn', cost: 110 },
  { id: 'dragon', emoji: '🐉', name: 'Dragon', cost: 150 },
  { id: 'dog', emoji: '🐶', name: 'Puppy', cost: 250 },      // her dream pet ✨
];

// slot ∈ { hat, face, collar, neck, lead, held }
// CSS-drawn items (collars, leads) use { css: true, color } instead of an emoji.
export const ACCESSORIES = [
  // hats
  { id: 'cap', emoji: '🧢', name: 'Cap', slot: 'hat', cost: 10 },
  { id: 'bow', emoji: '🎀', name: 'Hair Bow', slot: 'hat', cost: 10 },
  { id: 'flower', emoji: '🌸', name: 'Flower', slot: 'hat', cost: 10 },
  { id: 'grad', emoji: '🎓', name: 'Smarty Cap', slot: 'hat', cost: 15 },
  { id: 'tophat', emoji: '🎩', name: 'Top Hat', slot: 'hat', cost: 20 },
  { id: 'crown', emoji: '👑', name: 'Crown', slot: 'hat', cost: 40 },
  // face
  { id: 'glasses', emoji: '👓', name: 'Glasses', slot: 'face', cost: 10 },
  { id: 'shades', emoji: '🕶️', name: 'Cool Shades', slot: 'face', cost: 15 },
  // collars (CSS bands)
  { id: 'collar-pink', name: 'Pink Collar', slot: 'collar', cost: 10, css: true, color: '#FFA8D2' },
  { id: 'collar-blue', name: 'Blue Collar', slot: 'collar', cost: 10, css: true, color: '#7FC6EE' },
  { id: 'collar-red', name: 'Red Collar', slot: 'collar', cost: 12, css: true, color: '#FF7A7A' },
  { id: 'collar-mint', name: 'Mint Collar', slot: 'collar', cost: 12, css: true, color: '#8DE0A0' },
  { id: 'collar-gold', name: 'Gold Collar', slot: 'collar', cost: 18, css: true, color: '#FFD86B' },
  { id: 'collar-rainbow', name: 'Rainbow Collar', slot: 'collar', cost: 25, css: true,
    color: 'linear-gradient(90deg,#FF7A7A,#FFD86B,#8DE0A0,#7FC6EE,#C9A7FF)' },
  // neck
  { id: 'bowtie', emoji: '🎀', name: 'Bow Tie', slot: 'neck', cost: 10 },
  { id: 'scarf', emoji: '🧣', name: 'Scarf', slot: 'neck', cost: 15 },
  { id: 'necklace', emoji: '💎', name: 'Necklace', slot: 'neck', cost: 50 },
  // leads (CSS leashes)
  { id: 'lead-pink', name: 'Pink Lead', slot: 'lead', cost: 12, css: true, color: '#FFA8D2' },
  { id: 'lead-blue', name: 'Blue Lead', slot: 'lead', cost: 12, css: true, color: '#7FC6EE' },
  { id: 'lead-red', name: 'Red Lead', slot: 'lead', cost: 14, css: true, color: '#FF7A7A' },
  // held
  { id: 'bone', emoji: '🦴', name: 'Bone', slot: 'held', cost: 10 },
  { id: 'meat', emoji: '🍖', name: 'Meaty Bone', slot: 'held', cost: 12 },
  { id: 'balloon', emoji: '🎈', name: 'Balloon', slot: 'held', cost: 10 },
  { id: 'ball', emoji: '⚽', name: 'Ball', slot: 'held', cost: 10 },
  { id: 'icecream', emoji: '🍦', name: 'Ice Cream', slot: 'held', cost: 15 },
  { id: 'teddy', emoji: '🧸', name: 'Teddy', slot: 'held', cost: 20 },
  { id: 'wand', emoji: '🪄', name: 'Magic Wand', slot: 'held', cost: 20 },
];

export const SLOTS = ['hat', 'face', 'collar', 'neck', 'lead', 'held'];
export const SLOT_LABELS = {
  hat: '🎩 Hats', face: '👓 Glasses', collar: '🦴 Collars',
  neck: '🎀 Neck', lead: '🐾 Leads', held: '🎈 Toys',
};

export const PET_BY_ID = Object.fromEntries(PETS.map(p => [p.id, p]));
export const ITEM_BY_ID = Object.fromEntries(ACCESSORIES.map(a => [a.id, a]));

/* ===========================================================
   Colour themes — recolour the whole app. `vars` override the
   palette CSS variables on :root. 'default' is free and owned.
   =========================================================== */
export const THEMES = [
  {
    id: 'default', name: 'Baby Blue & Pink', emoji: '🩵', cost: 0,
    vars: {
      '--blue': '#AEDFF7', '--blue-deep': '#7FC6EE',
      '--pink': '#FFD1E8', '--pink-deep': '#FFA8D2',
      '--lilac': '#E6D7FF', '--star': '#FFD86B',
      '--grad-soft': 'linear-gradient(160deg, #EAF7FF 0%, #FFF0F8 100%)',
    },
  },
  {
    id: 'unicorn', name: 'Unicorn', emoji: '🦄', cost: 60,
    vars: {
      '--blue': '#E3D1FF', '--blue-deep': '#B49BE6',
      '--pink': '#FFD6F0', '--pink-deep': '#FF9FD8',
      '--lilac': '#F0E4FF', '--star': '#FFD86B',
      '--grad-soft': 'linear-gradient(160deg, #F3ECFF 0%, #FFE9F7 100%)',
    },
  },
  {
    id: 'candy', name: 'Candy', emoji: '🍭', cost: 60,
    vars: {
      '--blue': '#FFC9DE', '--blue-deep': '#FF8FB6',
      '--pink': '#FFE0B8', '--pink-deep': '#FFB36B',
      '--lilac': '#FFD9EC', '--star': '#FF6FA5',
      '--grad-soft': 'linear-gradient(160deg, #FFE9F1 0%, #FFF3E2 100%)',
    },
  },
  {
    id: 'ocean', name: 'Ocean', emoji: '🌊', cost: 70,
    vars: {
      '--blue': '#A8E6E2', '--blue-deep': '#5FC9C3',
      '--pink': '#BFE6FF', '--pink-deep': '#7FB8E6',
      '--lilac': '#CFF0EC', '--star': '#FFD86B',
      '--grad-soft': 'linear-gradient(160deg, #E3FAF7 0%, #E6F4FF 100%)',
    },
  },
  {
    id: 'mint', name: 'Mint', emoji: '🌿', cost: 50,
    vars: {
      '--blue': '#BFEAD0', '--blue-deep': '#7FD49C',
      '--pink': '#E6F5C9', '--pink-deep': '#BfE08A',
      '--lilac': '#D7F0DD', '--star': '#FFD86B',
      '--grad-soft': 'linear-gradient(160deg, #E6FAEC 0%, #F3FBE0 100%)',
    },
  },
  {
    id: 'rainbow', name: 'Rainbow', emoji: '🌈', cost: 100,
    vars: {
      '--blue': '#BFE3FF', '--blue-deep': '#FF9FD8',
      '--pink': '#FFE3A8', '--pink-deep': '#9BD98C',
      '--lilac': '#E6D7FF', '--star': '#FF6FA5',
      '--grad-soft': 'linear-gradient(160deg, #FFE9F1 0%, #E9F6FF 50%, #EAFBE6 100%)',
    },
  },
];

export const THEME_BY_ID = Object.fromEntries(THEMES.map(t => [t.id, t]));
