import { brand } from "../config";

export default function BrandLogo({ onClick, light = false }: {
  onClick?: () => void;
  light?: boolean;
}) {
  const content = <>
    <span className="aryan-emblem"><img src="/brand/aryan-emblem.png" alt="" width="64" height="64" /></span>
    <span className="aryan-wordmark">
      <span className="aryan-name">ARYAN</span>
      <span className="aryan-descriptor">TOUR AND TRAVEL</span>
      <span className="aryan-promise" lang="hi">सुरक्षित सफर, हमारा वादा</span>
    </span>
  </>;
  const className = `aryan-logo${light ? " aryan-logo-light" : ""}`;
  return onClick ? (
    <button type="button" className={className} onClick={onClick} aria-label={`${brand.name} home`}>{content}</button>
  ) : (
    <a className={className} href="/" aria-label={`${brand.name} home`}>{content}</a>
  );
}
