import Card from "../ui/Card";

type EmptyStateProps = {
  icon: string;
  title: string;
  description: string;
};

export default function EmptyState({
  icon,
  title,
  description,
}: EmptyStateProps) {
  return (
    <Card
      padding="lg"
      className="text-center"
    >
      <div className="mb-5 text-6xl">
        {icon}
      </div>

      <h3 className="text-3xl font-bold">
        {title}
      </h3>

      <p className="mt-4 opacity-70">
        {description}
      </p>
    </Card>
  );
}