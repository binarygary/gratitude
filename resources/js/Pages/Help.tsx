import { Head } from '@inertiajs/react';
import AppShell from '../Components/AppShell';
import BrandName from '../Components/BrandName';

export default function Help() {
    return (
        <AppShell>
            <Head title="Help" />

            <div className="card rounded-2xl border border-base-300/50 bg-white shadow-sm">
                <div className="card-body gap-4 p-6">
                    <h1 className="text-3xl font-semibold text-base-content">Help</h1>
                    <p className="text-sm text-base-content/70">
                        <BrandName /> is local-first. Your entries are stored on your device, and export is always available.
                    </p>
                </div>
            </div>

            <div className="card rounded-2xl border border-base-300/50 bg-white shadow-sm">
                <div className="card-body gap-3 p-6">
                    <h2 className="text-lg font-medium text-base-content">How saving works</h2>
                    <p className="text-sm text-base-content/70">
                        Entries are saved locally in your browser so you can keep writing even before signing in.
                    </p>
                    <p className="text-sm text-base-content/70">
                        Export is always available, so you can download your entries whenever you want.
                    </p>
                </div>
            </div>

            <div className="card rounded-2xl border border-base-300/50 bg-white shadow-sm">
                <div className="card-body gap-3 p-6">
                    <h2 className="text-lg font-medium text-base-content">What happens when you create an account</h2>
                    <p className="text-sm text-base-content/70">
                        Creating an account syncs your current local entries to our database so your journal is available across devices.
                    </p>
                </div>
            </div>

            <div className="card rounded-2xl border border-base-300/50 bg-white shadow-sm">
                <div className="card-body gap-3 p-6">
                    <h2 className="text-lg font-medium text-base-content">Personal data and email</h2>
                    <p className="text-sm text-base-content/70">
                        We do not use your personal data for anything other than sending your magic sign-in link.
                    </p>
                </div>
            </div>
        </AppShell>
    );
}
