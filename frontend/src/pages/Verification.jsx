import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SellerVerification from '../components/seller/SellerVerification';

function Icon({ name, className = '' }) {
  return <span className={`material-symbols-outlined ${className}`}>{name}</span>;
}

export default function Verification() {
  const { user } = useAuth();
  return (
    <div className="bg-background min-h-screen">
      <main className="max-w-2xl mx-auto px-gutter-mobile md:px-gutter-desktop py-2xl">
        <div className="flex flex-col items-center text-center mb-xl">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-md">
            <Icon name="verified_user" className="text-primary text-3xl" />
          </div>
          <h1 className="text-headline-lg font-headline-lg text-on-surface">Get Verified</h1>
          <p className="text-on-surface-variant text-body-md mt-1 max-w-md">
            Upload your documents to earn a verified badge. Verified sellers build instant trust and get more inquiries.
          </p>
        </div>

        <SellerVerification user={user} />

        <p className="text-center text-label-sm text-on-surface-variant mt-lg">
          Documents are reviewed by our team within 24–48 hours. Need help? <Link to="/help" className="text-primary hover:underline">Visit the Help Center</Link>.
        </p>
      </main>
    </div>
  );
}
