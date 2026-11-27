import React from 'react';

/*
 * Reaction icons, loaded from /public/reactions/<type>.png
 * <ReactionIcon type="like" size={40} />
 * types: like, love, care, haha, wow, sad, angry
 */
export default function ReactionIcon({ type, size = 24 }) {
  return (
    <img
      className="rx-icon"
      src={`${process.env.PUBLIC_URL || ''}/reactions/${type}.png`}
      width={size}
      height={size}
      alt=""
      draggable={false}
    />
  );
}