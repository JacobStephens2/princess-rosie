import type { FamilyGuest, StarStop } from "../domain/journey";

export type { FamilyGuest };

export interface StorybookStampInfo {
  title: string;
  icon: string;
  description: string;
}

export interface StopStory {
  id: StarStop;
  place: string;
  guest: FamilyGuest;
  moment: string;
  icon: string;
  sky: number;
  ground: number;
  placeIllustration?: string;
  stamp: StorybookStampInfo;
}

export const STOP_STORIES: readonly StopStory[] = [
  {
    id: "garden",
    place: "Rosalia’s Rose Garden",
    guest: "Mom",
    moment: "Mom found a Star among Rosalia’s roses!",
    icon: "🌹",
    sky: 0x8bd8f1,
    ground: 0x76bd7a,
    placeIllustration: "/assets/rose-garden-place-illustration.png",
    stamp: {
      title: "Mom’s Rose Stamp",
      icon: "🌹",
      description: "Awakened the waking roses of Rosalia’s Rose Garden",
    },
  },
  {
    id: "lacewood",
    place: "Zélie’s Lacewood",
    guest: "Gram",
    moment: "Gram followed the silver ribbons through Zélie’s Lacewood!",
    icon: "🎀",
    sky: 0xb4ddee,
    ground: 0x5fa273,
    placeIllustration: "/assets/lacewood-place-illustration.png",
    stamp: {
      title: "Gram’s Lace Ribbon Stamp",
      icon: "🎀",
      description: "Followed the silver ribbons through Zélie’s Lacewood",
    },
  },
  {
    id: "abbey",
    place: "Golden Bell Abbey",
    guest: "Pop",
    moment: "Pop rang the bells of the Golden Bell Abbey!",
    icon: "🔔",
    sky: 0x92d9f6,
    ground: 0xd4aa68,
    placeIllustration: "/assets/abbey-place-illustration.png",
    stamp: {
      title: "Pop’s Golden Bell Stamp",
      icon: "🔔",
      description: "Rang the golden bells of Golden Bell Abbey",
    },
  },
  {
    id: "clouds",
    place: "Cloister of Clouds",
    guest: "Beasley",
    moment: "Beasley pounced through the soft clouds!",
    icon: "🐈",
    sky: 0x76ccef,
    ground: 0xe8f7ff,
    placeIllustration: "/assets/cloister-place-illustration.png",
    stamp: {
      title: "Beasley’s Cloud Paws Stamp",
      icon: "🐈",
      description: "Pounced through the soft Cloister of Clouds",
    },
  },
  {
    id: "peak",
    place: "Pellegrino Peak",
    guest: "Aunt",
    moment: "Aunt waved from the flowers of Pellegrino Peak!",
    icon: "🌸",
    sky: 0x8ecff3,
    ground: 0x829a71,
    placeIllustration: "/assets/pellegrino-peak-place-illustration.png",
    stamp: {
      title: "Aunt’s Mountain Flower Stamp",
      icon: "🌸",
      description: "Waved from the flowers of Pellegrino Peak",
    },
  },
  {
    id: "sea",
    place: "Sapphire Sea",
    guest: "Uncle",
    moment: "Uncle waited beside the sparkling Sapphire Sea!",
    icon: "🌊",
    sky: 0x6fd3ef,
    ground: 0x168fc4,
    placeIllustration: "/assets/sapphire-sea-place-illustration.png",
    stamp: {
      title: "Uncle’s Sea Wave Stamp",
      icon: "🌊",
      description: "Waited beside the sparkling Sapphire Sea",
    },
  },
  {
    id: "castle",
    place: "Birthday Castle gates",
    guest: "Dad",
    moment: "Dad held the final Birthday Star at the castle gates!",
    icon: "🏰",
    sky: 0xf6b6cf,
    ground: 0xe6ae55,
    placeIllustration: "/assets/castle-approach-place-illustration.png",
    stamp: {
      title: "Dad’s Castle Gate Stamp",
      icon: "🏰",
      description: "Kept the Castle Star safe at the Birthday Castle gates",
    },
  },
] as const;

export const OPENING_STORYBOOK_MOMENTS_AFTER_COVER = [
  {
    eyebrow: "Once upon a birthday…",
    title: "A celebration across the sea",
    copy: "Far across the sparkling Sapphire Sea, Princess Zélie’s very first birthday celebration was almost ready. Gigi hung roses and ribbons from every golden arch.",
    image: "/assets/storybook-celebration-preparations.webp",
    imagePosition: "50% 42%",
  },
  {
    eyebrow: "Then—WHOOSH!",
    title: "Seven Stars flew away",
    copy: "A playful wind scattered seven Birthday Stars across Fairytale Sicily. The Rainbow Paths to the castle vanished!",
    image: "/assets/storybook-scattered-stars.webp",
    imagePosition: "50% 42%",
  },
  {
    eyebrow: "A brave big sister",
    title: "Rosie and Stella can help",
    copy: "Princess Rosie climbed onto Stella, her flying unicorn. “We’ll find every Star and bring everyone to the celebration!”",
    image: "/assets/storybook-rosie-stella-departure.webp",
    imagePosition: "50% 42%",
  },
] as const;
