import React from 'react';

interface MarqueeProps {
  items: { text: string; amount: number; type: 'income' | 'expense' }[];
}

export default function TransactionMarquee({ items }: MarqueeProps) {
  if (items.length === 0) return null;

  return (
    <div className="rfm-marquee-container bg-surface border-y border-border py-3 mb-6" style={{ '--duration': '25s' } as React.CSSProperties}>
      <div className="rfm-marquee">
        {items.concat(items).map((item, i) => (
          <div key={i} className="flex items-center gap-3 mr-12 shrink-0">
            <span className="font-text text-zinc-500 text-[10px] uppercase font-bold tracking-widest">{item.text}</span>
            <span className={`font-mono font-bold ${item.type === 'income' ? 'text-pop-green' : 'text-pop-red'}`}>
              {item.type === 'income' ? '+' : '-'}${item.amount.toLocaleString()}
            </span>
            <span className="text-zinc-300">✦</span>
          </div>
        ))}
      </div>
    </div>
  );
}
