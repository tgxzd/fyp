import { requireAuth } from '@/lib/session';
// import { redirect } from 'next/navigation';
import NavHeader from '@/components/ui/nav-header';
import LocationPermissionHandler from '@/components/LocationPermissionHandler';
import { LocationProvider } from '@/contexts/LocationContext';
import Background from '@/components/Background';
import DashboardContent from '@/components/ui/DashboardContent';

export default async function DashboardPage() {
  // Ensure user is authenticated
  await requireAuth();
  
  // Get Google Maps API key from env
  const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  return (
    <LocationProvider>
      <Background variant="web3-emerald" />
      <div className="relative min-h-screen">
        <LocationPermissionHandler />
        
        {/* Content */}
        <div className="relative z-10 min-h-screen flex flex-col">
          <header className="w-full py-3 sm:py-4 lg:py-6 bg-black/40 backdrop-blur-md border-b border-emerald-500/20">
            <NavHeader/>
          </header>
          
          <DashboardContent mapsApiKey={mapsApiKey} />
        </div>
      </div>
    </LocationProvider>
  );
} 