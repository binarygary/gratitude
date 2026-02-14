import { Head, usePage } from '@inertiajs/react';

type Props = {
    title: string;
    description: string;
    canonicalPath?: string;
    noIndex?: boolean;
};

type SharedProps = {
    seo?: {
        base_url?: string;
    };
};

export default function SeoHead({ title, description, canonicalPath, noIndex = false }: Props) {
    const { props } = usePage<SharedProps>();

    const appName = 'consider.today';
    const baseUrl = (props.seo?.base_url || window.location.origin).replace(/\/+$/, '');
    const path = canonicalPath ?? window.location.pathname;
    const canonical = `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
    const socialImage = `${baseUrl}/social-preview.png`;
    const fullTitle = `${title} | ${appName}`;
    const robots = noIndex ? 'noindex,nofollow' : 'index,follow';

    return (
        <Head title={fullTitle}>
            <meta head-key="description" name="description" content={description} />
            <meta head-key="robots" name="robots" content={robots} />
            <link head-key="canonical" rel="canonical" href={canonical} />

            <meta head-key="og:type" property="og:type" content="website" />
            <meta head-key="og:site_name" property="og:site_name" content={appName} />
            <meta head-key="og:title" property="og:title" content={fullTitle} />
            <meta head-key="og:description" property="og:description" content={description} />
            <meta head-key="og:url" property="og:url" content={canonical} />
            <meta head-key="og:image" property="og:image" content={socialImage} />
            <meta head-key="og:image:secure_url" property="og:image:secure_url" content={socialImage} />
            <meta head-key="og:image:width" property="og:image:width" content="1200" />
            <meta head-key="og:image:height" property="og:image:height" content="630" />
            <meta head-key="og:image:alt" property="og:image:alt" content="consider.today social preview" />

            <meta head-key="twitter:card" name="twitter:card" content="summary_large_image" />
            <meta head-key="twitter:title" name="twitter:title" content={fullTitle} />
            <meta head-key="twitter:description" name="twitter:description" content={description} />
            <meta head-key="twitter:image" name="twitter:image" content={socialImage} />
            <meta head-key="twitter:url" name="twitter:url" content={canonical} />
        </Head>
    );
}
