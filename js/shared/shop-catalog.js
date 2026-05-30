/* ===========================================================
   shop-catalog.js — what's for sale in the Star Shop.
   Pure data, read by both the hub (to render the pet) and the
   shop page. To add an item: add an entry here.
   Costs are in ⭐ stars. cost 0 = free starter.
   =========================================================== */

export const PETS = [
  { id: 'dog', emoji: '🐶', name: 'Puppy', cost: 0 },
  { id: 'cat', emoji: '🐱', name: 'Kitten', cost: 0 },
  { id: 'chick', emoji: '🐥', name: 'Chick', cost: 25 },
  { id: 'bunny', emoji: '🐰', name: 'Bunny', cost: 30 },
  { id: 'frog', emoji: '🐸', name: 'Froggy', cost: 30 },
  { id: 'bear', emoji: '🐻', name: 'Bear', cost: 40 },
  { id: 'fox', emoji: '🦊', name: 'Fox', cost: 40 },
  { id: 'penguin', emoji: '🐧', name: 'Penguin', cost: 50 },
  { id: 'unicorn', emoji: '🦄', name: 'Unicorn', cost: 90 },
  { id: 'dragon', emoji: '🐉', name: 'Dragon', cost: 130 },
];

// slot ∈ { hat, face, neck, held }
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
  // neck
  { id: 'bowtie', emoji: '🎀', name: 'Bow Tie', slot: 'neck', cost: 10 },
  { id: 'scarf', emoji: '🧣', name: 'Scarf', slot: 'neck', cost: 15 },
  { id: 'necklace', emoji: '💎', name: 'Necklace', slot: 'neck', cost: 50 },
  // held
  { id: 'balloon', emoji: '🎈', name: 'Balloon', slot: 'held', cost: 10 },
  { id: 'ball', emoji: '⚽', name: 'Ball', slot: 'held', cost: 10 },
  { id: 'icecream', emoji: '🍦', name: 'Ice Cream', slot: 'held', cost: 15 },
  { id: 'teddy', emoji: '🧸', name: 'Teddy', slot: 'held', cost: 20 },
  { id: 'wand', emoji: '🪄', name: 'Magic Wand', slot: 'held', cost: 20 },
];

export const SLOTS = ['hat', 'face', 'neck', 'held'];
export const SLOT_LABELS = { hat: '🎩 Hats', face: '👓 Glasses', neck: '🎀 Neck', held: '🎈 Toys' };

export const PET_BY_ID = Object.fromEntries(PETS.map(p => [p.id, p]));
export const ITEM_BY_ID = Object.fromEntries(ACCESSORIES.map(a => [a.id, a]));
