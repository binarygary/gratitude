type Props = {
    className?: string;
};

export default function BrandName({ className }: Props) {
    return (
        <span className={className}>
            consider
            <span className="mx-1 inline-block h-[0.4em] w-[0.4em] rounded-full bg-primary align-middle" />
            today
        </span>
    );
}
