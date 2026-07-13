type AppPageHeaderProps = {
  title: string;
  description: string;
};

export function AppPageHeader({ title, description }: AppPageHeaderProps) {
  return (
    <header>
      <h1 className="font-heading text-[30px] font-semibold leading-[1.2] text-on-surface">
        {title}
      </h1>
      <p className="mt-2 text-on-surface-variant">{description}</p>
    </header>
  );
}
