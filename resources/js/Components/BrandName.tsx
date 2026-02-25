type Props = {
    className?: string;
};

export default function BrandName({ className }: Props) {
    const classes = ['inline-flex items-center whitespace-nowrap', className].filter(Boolean).join(' ');

    return (
        <span className={classes}>
            <span>consider</span>
            <span className="mx-1 inline-block h-[0.4em] w-[0.4em] rounded-full bg-primary align-middle" />
            <span>today</span>
        </span>
    );
}
