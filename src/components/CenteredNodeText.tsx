type Props = {
  primary: string;
  secondary?: string;
  primaryClass?: string;
  secondaryClass?: string;
  gap?: number;
  maxWidth?: number;
};
export default function CenteredNodeText({ primary, secondary, primaryClass, secondaryClass, gap = 24, maxWidth = 98 }: Props) {
  const characters = Array.from(secondary ?? '');
  const lines = secondary === undefined ? [] : characters.length > 5
    ? [characters.slice(0, 4).join(''), characters.slice(4).join('')]
    : [secondary];
  const count = 1 + lines.length;
  return <>
    <text x="0" y={-(count - 1) * gap / 2} textAnchor="middle" dominantBaseline="central" className={["node-number", primaryClass].filter(Boolean).join(' ')}
      textLength={primary.length > 7 ? maxWidth : undefined} lengthAdjust="spacingAndGlyphs">{primary}</text>
    {lines.map((line, index) => <text key={index} x="0" y={(index + 1 - (count - 1) / 2) * gap}
      textAnchor="middle" dominantBaseline="central" className={secondaryClass}>{line}</text>)}
  </>;
}
