// Marca d'água de fundo: ícones sociais espalhados, bem suaves (no tom da IARA).
// Decorativo — fica atrás do conteúdo (use dentro de um container `relative overflow-hidden`).
import { SiInstagram, SiTiktok, SiYoutube, SiFacebook, SiPinterest, SiThreads } from 'react-icons/si';
import { FaHeart, FaRegComment, FaAt, FaRegStar, FaCamera } from 'react-icons/fa6';
import type { IconType } from 'react-icons';

const T = '#C2693F'; // terracota
const O = '#8A9A5B'; // oliva
const I = '#2E2A26'; // ink

const ITEMS: { Icon: IconType; top: string; left: string; size: number; color: string; op: number }[] =
  [
    { Icon: SiInstagram, top: '5%', left: '4%', size: 56, color: T, op: 0.07 },
    { Icon: FaHeart, top: '26%', left: '17%', size: 30, color: O, op: 0.08 },
    { Icon: SiYoutube, top: '9%', left: '82%', size: 60, color: T, op: 0.06 },
    { Icon: SiTiktok, top: '40%', left: '46%', size: 40, color: I, op: 0.05 },
    { Icon: FaAt, top: '58%', left: '88%', size: 34, color: T, op: 0.07 },
    { Icon: SiPinterest, top: '76%', left: '8%', size: 46, color: T, op: 0.06 },
    { Icon: FaRegComment, top: '80%', left: '70%', size: 36, color: O, op: 0.07 },
    { Icon: SiFacebook, top: '88%', left: '40%', size: 44, color: I, op: 0.05 },
    { Icon: FaCamera, top: '52%', left: '30%', size: 32, color: O, op: 0.06 },
    { Icon: FaRegStar, top: '66%', left: '56%', size: 28, color: T, op: 0.07 },
    { Icon: SiThreads, top: '20%', left: '62%', size: 34, color: I, op: 0.05 },
  ];

export function SocialWatermark() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {ITEMS.map((it, i) => {
        const Icon = it.Icon;
        return (
          <span
            key={i}
            style={{ position: 'absolute', top: it.top, left: it.left, color: it.color, opacity: it.op }}
          >
            <Icon size={it.size} />
          </span>
        );
      })}
    </div>
  );
}
