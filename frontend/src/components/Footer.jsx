import { Link } from 'react-router-dom';

const COLUMNS = [
  {
    title: 'Explore',
    links: [
      ['Browse Cars', '/cars'],
      ['New Cars', '/new-cars'],
      ['Dealer Directory', '/dealers'],
      ['Sell My Car', '/sell'],
      ['Ryderr Certified', '/inspection-services'],
      ['Financing', '/financing'],
      ['Compare', '/compare'],
    ],
  },
  {
    title: 'Support',
    links: [
      ['Help Center', '/help'],
      ['Report a Dispute', '/report-dispute'],
      ['Safe Buying Guide', '/safe-buying'],
      ['Ownership Transfer', '/ownership-transfer'],
      ['Terms of Service', '/terms'],
      ['Privacy Policy', '/privacy'],
    ],
  },
  {
    title: 'For Dealers',
    links: [
      ['Dealer Platform', '/for-dealers'],
      ['Founding Dealer Program', '/for-dealers/founding'],
      ['Apply as Dealer', '/dealer/apply'],
      ['Book a Demo', '/book-demo'],
    ],
  },
];

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-border-subtle bg-surface-container-lowest py-3xl pb-24 md:pb-3xl">
      <div className="max-w-container-max mx-auto px-gutter-mobile md:px-gutter-desktop grid grid-cols-2 md:grid-cols-5 gap-xl">
        <div className="col-span-2 space-y-md">
          <span className="text-headline-md font-bold text-primary-container dark:text-primary-fixed-dim block">Ryderr</span>
          <p className="text-body-sm text-on-surface-variant leading-relaxed max-w-xs">
            The Philippines' premier automotive marketplace for verified, inspection-ready vehicle transactions.
          </p>
          <div className="flex gap-md">
            <a href="#" aria-label="Website" className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center hover:bg-primary hover:text-on-primary transition-all text-on-surface-variant">
              <span className="material-symbols-outlined">public</span>
            </a>
            <a href="#" aria-label="Email" className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center hover:bg-primary hover:text-on-primary transition-all text-on-surface-variant">
              <span className="material-symbols-outlined">alternate_email</span>
            </a>
          </div>
        </div>

        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h5 className="text-label-md font-label-md text-on-surface mb-lg uppercase tracking-wider">{col.title}</h5>
            <ul className="flex flex-col gap-sm">
              {col.links.map(([label, to]) => (
                <li key={to}>
                  <Link to={to} className="text-on-surface-variant font-body-sm hover:text-primary transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="max-w-container-max mx-auto px-gutter-mobile md:px-gutter-desktop mt-3xl pt-xl border-t border-border-subtle flex flex-col md:flex-row justify-between items-center gap-md">
        <p className="text-on-surface-variant font-label-sm">© {year} AutoBentaPH Inc. — Ryderr™ automotive marketplace.</p>
        <span className="text-label-sm text-on-surface-variant">Metro Manila, PH</span>
      </div>
      <div className="max-w-container-max mx-auto px-gutter-mobile md:px-gutter-desktop mt-md">
        <p className="text-[11px] text-on-surface-variant/60 leading-relaxed">
          All manufacturer names, logos, and brands are the property of their respective owners. Ryderr is an independent marketplace and is not affiliated with, endorsed by, or sponsored by any vehicle manufacturer.
        </p>
      </div>
    </footer>
  );
}
