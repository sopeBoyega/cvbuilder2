type AppPageHeaderProps = {
  title: string;
  description: string;
};

export function AppPageHeader({ title, description }: AppPageHeaderProps) {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">
        {title}
      </h1>
      <p className="mt-2 text-sm leading-6 text-zinc-600">{description}</p>
    </section>
  );
}
