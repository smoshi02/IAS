/*
 * Facebook-style reaction artwork as plain SVG markup (viewBox 0 0 40 40).
 * reactionSvg(type, id) -> inner SVG string. `id` makes gradient ids unique per icon.
 */
const INK = '#5b2f00';
const BROW = '#CC7A14';
const HEART = 'M12 21s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.6A4.5 4.5 0 0 1 20 10c0 5.8-8 11-8 11z';
const THUMB = 'M2 21h4V9H2v12zM22 10c0-1.1-.9-2-2-2h-6.3l1-4.6v-.3c0-.4-.2-.8-.4-1.1L13.2 1 6.6 7.6C6.2 8 6 8.5 6 9v10c0 1.1.9 2 2 2h9c.8 0 1.5-.5 1.8-1.2l3-7c.1-.2.2-.5.2-.8v-2z';

const line = (o = {}) => `fill="none" stroke="${o.stroke || INK}" stroke-width="${o.w || 2.1}" stroke-linecap="round" stroke-linejoin="round"`;

export function reactionSvg(type, id) {
  const face = `<defs><radialGradient id="${id}f" cx="50%" cy="30%" r="78%"><stop offset="0" stop-color="#FFE483"/><stop offset=".55" stop-color="#FFCB3E"/><stop offset="1" stop-color="#F6A22F"/></radialGradient></defs><circle cx="20" cy="20" r="19" fill="url(#${id}f)"/>`;
  const eye = (cx, cy, rx = 2.5, ry = 3.4) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#2b2a44"/><circle cx="${cx + 0.9}" cy="${cy - 1.2}" r="0.95" fill="#9fc4ff"/>`;

  switch (type) {
    case 'like':
      return `<defs><linearGradient id="${id}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#18AFFF"/><stop offset="1" stop-color="#0062DF"/></linearGradient></defs>
<circle cx="20" cy="20" r="19" fill="url(#${id}g)"/>
<path d="${THUMB}" fill="#fff" transform="translate(8.6 9.4) scale(1)"/>`;
    case 'love':
      return `<defs><linearGradient id="${id}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FF6680"/><stop offset="1" stop-color="#E61739"/></linearGradient></defs>
<circle cx="20" cy="20" r="19" fill="url(#${id}g)"/>
<path d="${HEART}" fill="#fff" transform="translate(6.2 5) scale(1.15)"/>`;
    case 'care':
      return `${face}
<path d="M10.6 16.6q2.7-3 5.4 0M24 16.6q2.7-3 5.4 0" ${line({ w: 1.9 })}/>
<path d="M17 21.6q3 2.6 6 0" ${line({ w: 1.9 })}/>
<ellipse cx="9.2" cy="21.2" rx="2.8" ry="1.9" fill="#FF8A9B" opacity=".55"/>
<ellipse cx="30.8" cy="21.2" rx="2.8" ry="1.9" fill="#FF8A9B" opacity=".55"/>
<defs><linearGradient id="${id}h" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FF5A74"/><stop offset="1" stop-color="#E0183E"/></linearGradient></defs>
<path d="${HEART}" fill="url(#${id}h)" transform="translate(2.2 18.4) scale(1.05)"/>
<g fill="#FFC53A" stroke="#E48A1E" stroke-width=".9">
<ellipse cx="21.5" cy="28.6" rx="7.2" ry="3.5" transform="rotate(-28 21.5 28.6)"/>
<ellipse cx="17.2" cy="33.4" rx="7" ry="3.2" transform="rotate(-12 17.2 33.4)"/>
</g>`;
    case 'haha':
      return `${face}
<defs><clipPath id="${id}m"><path d="M10.2 22.2H29.8C29.8 30.4 25.6 34.8 20 34.8S10.2 30.4 10.2 22.2Z"/></clipPath></defs>
<path d="M9.4 16.6q3.2-4.6 6.6 0M24 16.6q3.2-4.6 6.6 0" ${line()}/>
<path d="M10.2 22.2H29.8C29.8 30.4 25.6 34.8 20 34.8S10.2 30.4 10.2 22.2Z" fill="#7B1A28"/>
<g clip-path="url(#${id}m)"><rect x="8" y="21" width="24" height="4.4" fill="#fff"/><ellipse cx="20" cy="34" rx="7" ry="4.6" fill="#FF6E88"/></g>`;
    case 'wow':
      return `${face}
<path d="M8.6 11.4q3.2-2.8 7 -1.2M24.4 10.2q3.8-1.6 7 1.2" ${line({ stroke: BROW, w: 2 })}/>
${eye(13.8, 17.2)}${eye(26.2, 17.2)}
<ellipse cx="20" cy="28.4" rx="3.7" ry="5.7" fill="#7B1220"/>
<ellipse cx="20" cy="31.2" rx="2.3" ry="2.3" fill="#D6384C"/>`;
    case 'sad':
      return `${face}
<path d="M8.6 15.6Q12.4 12.6 16.4 12.8M31.4 15.6Q27.6 12.6 23.6 12.8" ${line({ stroke: BROW, w: 1.8 })}/>
<path d="M10.6 20.6q2.8 2.5 5.6 0M23.8 20.6q2.8 2.5 5.6 0" ${line({ w: 1.9 })}/>
<path d="M15.4 29.4q4.6-3.8 9.2 0" ${line({ w: 1.9 })}/>`;
    case 'angry':
      return `<defs><radialGradient id="${id}a" cx="50%" cy="30%" r="80%"><stop offset="0" stop-color="#FFBE4A"/><stop offset=".6" stop-color="#F99A38"/><stop offset="1" stop-color="#EF7A2C"/></radialGradient></defs>
<circle cx="20" cy="20" r="19" fill="url(#${id}a)"/>
<path d="M8.4 12.2L17.2 15.8M31.6 12.2L22.8 15.8" fill="none" stroke="#6b2f08" stroke-width="2.6" stroke-linecap="round"/>
${eye(13.8, 20.4, 2.4, 3.1)}${eye(26.2, 20.4, 2.4, 3.1)}
<ellipse cx="20" cy="28.6" rx="2.3" ry="3" fill="#7B1220"/>`;
    default:
      return '';
  }
}