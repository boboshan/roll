// prettier-ignore
const emojis = [
  '🌟', '🚀', '🎉', '🌈', '🦄', '🍕', '🎸', '🌺', 
  '🐱', '🐶', '🦊', '🐼', '🐨', '🐯', '🦁', '🐸',
  '🌍', '🌎', '🌏', '🌕', '🌙', '☀️', '⭐', '🌠',
  '🍎', '🍇', '🍓', '🍒', '🥑', '🍔', '🍟', '🍦',
  '🏀', '⚽', '🏈', '🎾', '🏓', '🎳', '🎯', '🎨',
  '🚗', '✈️', '🚂', '🚢', '🚁', '🚀', '🛸', '🎢',
  '📱', '💻', '🖥️', '🎮', '🕹️', '📷', '🔭', '⏰',
  '🎭', '🎬', '🎼', '🎧', '🎤', '🪗', '🥁', '🎻',
  '🧠', '❤️', '💡', '💥', '🔥', '💧', '🌊', '🍃',
  '🏆', '🥇', '🎖️', '🧩', '🎁', '🎈', '🪄', '🔮'
];

export class Emoji {
  current = $state("");
  isBurst = $state(false);

  constructor(emoji = "🌟") {
    this.current = emoji;
  }

  toggleBurst() {
    this.isBurst = !this.isBurst;
  }
  burst() {
    this.isBurst = true;
  }

  reset() {
    this.isBurst = false;
  }

  random() {
    this.current = emojis[Math.floor(Math.random() * emojis.length)];
  }
}

export const createEmoji = (emoji = "🌟") => new Emoji(emoji);

export const emoji = new Emoji("🌟");
