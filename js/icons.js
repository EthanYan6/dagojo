const Icons = {
  location() {
    return `<svg class="icon icon-sm" viewBox="0 0 16 16">
      <circle cx="8" cy="8" r="3"/>
      <line x1="8" y1="1" x2="8" y2="4"/>
      <line x1="8" y1="12" x2="8" y2="15"/>
      <line x1="1" y1="8" x2="4" y2="8"/>
      <line x1="12" y1="8" x2="15" y2="8"/>
    </svg>`;
  },

  sunrise() {
    return `<svg class="icon icon-sm" viewBox="0 0 16 16">
      <path d="M2 12 A6 6 0 0 1 14 12" stroke-linecap="round"/>
      <line x1="8" y1="2" x2="8" y2="5"/>
      <line x1="3" y1="5" x2="5" y2="7"/>
      <line x1="13" y1="5" x2="11" y2="7"/>
      <line x1="1" y1="12" x2="15" y2="12"/>
    </svg>`;
  },

  sunset() {
    return `<svg class="icon icon-sm" viewBox="0 0 16 16">
      <path d="M2 10 A6 6 0 0 1 14 10" stroke-linecap="round"/>
      <line x1="8" y1="14" x2="8" y2="11"/>
      <line x1="3" y1="11" x2="5" y2="9"/>
      <line x1="13" y1="11" x2="11" y2="9"/>
      <line x1="1" y1="10" x2="15" y2="10"/>
    </svg>`;
  }
};
