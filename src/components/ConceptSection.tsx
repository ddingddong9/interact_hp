import type { ReactNode } from 'react';
type Comparison = { headers: string[]; rows: string[][] };
type Props = { title: string; text: string; advanced?: boolean; comparison?: Comparison; children?: ReactNode };
export default function ConceptSection({ title, text, advanced, comparison, children }: Props) {
  const content = <><p>{text}</p>{comparison && <div className="concept-table-scroll"><table><thead><tr>{comparison.headers.map(header => <th key={header} scope="col">{header}</th>)}</tr></thead><tbody>{comparison.rows.map(row => <tr key={row[0]}>{row.map((cell, i) => i === 0 ? <th key={i} scope="row">{cell}</th> : <td key={i}>{cell}</td>)}</tr>)}</tbody></table></div>}{children}</>;
  return advanced ? <details className="concept-details"><summary><span className="concept-chevron" aria-hidden="true">›</span><h2>{title}</h2></summary><div className="concept-details-content">{content}</div></details> : <article><h2>{title}</h2>{content}</article>;
}
