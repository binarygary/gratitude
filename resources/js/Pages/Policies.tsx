import { Link } from '@inertiajs/react';
import type { ReactNode } from 'react';
import AppShell from '../Components/AppShell';
import BrandName from '../Components/BrandName';
import SeoHead from '../Components/SeoHead';

const effectiveDate = 'February 14, 2026';

function Section({
    id,
    title,
    children,
}: {
    id: string;
    title: string;
    children: ReactNode;
}) {
    return (
        <section id={id} className="card scroll-mt-24 rounded-2xl border border-base-300/50 bg-white shadow-sm">
            <div className="card-body gap-3 p-6">
                <h2 className="text-lg font-medium text-base-content">{title}</h2>
                {children}
            </div>
        </section>
    );
}

export default function Policies() {
    return (
        <AppShell>
            <SeoHead
                title="Policies"
                description="Privacy policy, terms of service, data retention, and security information for consider.today."
                canonicalPath="/policies"
            />

            <div className="card rounded-2xl border border-base-300/50 bg-white shadow-sm">
                <div className="card-body gap-4 p-6">
                    <h1 className="text-3xl font-semibold text-base-content">Policies</h1>
                    <p className="text-sm text-base-content/70">Effective date: {effectiveDate}</p>
                    <p className="text-sm text-base-content/70">
                        This page includes Privacy Policy and Terms of Service for <BrandName />.
                    </p>
                    <p className="text-sm text-base-content/70">
                        The tl;dr is this is an app I built for myself and thought others might find it useful too. I don't have any interest in selling your data or showing you ads, and I built the app to work well without an account so you can use it without sharing anything if you want. <strong>Thank you for checking it out and I hope you find it useful!</strong>
                    </p>
                    <div className="flex flex-wrap gap-2">
                        <Link href="/policies#privacy" className="link link-hover text-sm">
                            Privacy
                        </Link>
                        <Link href="/policies#terms" className="link link-hover text-sm">
                            Terms
                        </Link>
                        <Link href="/policies#cookies" className="link link-hover text-sm">
                            Cookies
                        </Link>
                        <Link href="/policies#retention" className="link link-hover text-sm">
                            Retention
                        </Link>
                        <Link href="/policies#security" className="link link-hover text-sm">
                            Security
                        </Link>
                        <Link href="/policies#rights" className="link link-hover text-sm">
                            Rights Requests
                        </Link>
                        <Link href="/policies#email" className="link link-hover text-sm">
                            Email
                        </Link>
                        <Link href="/policies#children" className="link link-hover text-sm">
                            Children
                        </Link>
                        <Link href="/policies#ai" className="link link-hover text-sm">
                            AI
                        </Link>
                    </div>
                </div>
            </div>

            <Section id="privacy" title="Privacy Policy">
                <p className="text-sm text-base-content/70">
                    Journal entries may contain personal reflections that you type into the app.
                </p>
                <p className="text-sm text-base-content/70">
                    If you sign in, we collect your email address to create your account and send one-time magic sign-in links.
                </p>
                <p className="text-sm text-base-content/70">
                    <BrandName /> is local-first. Entries are stored in your browser on your device and synced to our server only after sign in.
                </p>
                <p className="text-sm text-base-content/70">
                    We use data to provide app features such as save, sync, sign-in, history, and settings. We do not sell personal data.
                </p>
            </Section>

            <Section id="terms" title="Terms of Service">
                <p className="text-sm text-base-content/70">
                    By using <BrandName />, you agree to use the service for lawful purposes and in compliance with these terms.
                </p>
                <p className="text-sm text-base-content/70">
                    You are responsible for content you enter into your journal and for keeping access to your email account secure.
                </p>
                <p className="text-sm text-base-content/70">
                    We may modify, suspend, or discontinue features at any time. Continued use after updates means you accept the revised terms.
                </p>
            </Section>

            <Section id="cookies" title="Cookie and Tracking Notice">
                <p className="text-sm text-base-content/70">
                    We use essential session/csrf cookies required for authentication and secure operation of the app.
                </p>
                <p className="text-sm text-base-content/70">
                    We do not use advertising cookies within core app functionality.
                </p>
            </Section>

            <Section id="retention" title="Data Retention and Deletion">
                <p className="text-sm text-base-content/70">
                    Local browser data remains on your device until you clear browser storage or overwrite entries.
                </p>
                <p className="text-sm text-base-content/70">
                    Server-synced entries and account data are retained while your account is active or as needed for service operation and legal obligations.
                </p>
                <p className="text-sm text-base-content/70">
                    You can export entries at any time using Export in the app footer.
                </p>
            </Section>

            <Section id="security" title="Security Policy">
                <p className="text-sm text-base-content/70">
                    Magic-link tokens are stored as hashes, are single-use, and expire.
                </p>
                <p className="text-sm text-base-content/70">
                    Standard web session metadata may include IP address and user-agent for security and reliability.
                </p>
                <p className="text-sm text-base-content/70">
                    No system is perfectly secure; you should avoid storing secrets you cannot risk disclosing.
                </p>
            </Section>

            <Section id="rights" title="Data Subject Rights and Contact">
                <p className="text-sm text-base-content/70">
                    You can request access, correction, export, or deletion of account-linked server data by contacting support.
                </p>
                <p className="text-sm text-base-content/70">
                    You can always email me at support@consider.today
                </p>
            </Section>

            <Section id="email" title="Email Communications Policy">
                <p className="text-sm text-base-content/70">
                    We send transactional emails needed for sign-in (magic links). We do not use these emails for advertising.
                </p>
            </Section>

            <Section id="children" title="Children's Privacy">
                <p className="text-sm text-base-content/70">
                    <BrandName /> is not directed to children under 13. If you believe a child has provided personal data, contact support so we can review and remove it.
                </p>
            </Section>

            <Section id="ai" title="AI Use and Model Access Policy">
                <p className="text-sm text-base-content/70">
                    I used AI tools to help build parts of <BrandName />.
                </p>
                <p className="text-sm text-base-content/70">
                    I will not knowingly send user journal content to third-party AI systems for training, analysis, or prompt processing.
                </p>
                <p className="text-sm text-base-content/70">
                    If this policy changes in the future, this page will be updated with a new effective date.
                </p>
            </Section>
        </AppShell>
    );
}
