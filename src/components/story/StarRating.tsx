"use client";

type Props = {
  value: number;
  onChange: (rating: number) => void;
};

export default function StarRating({
  value,
  onChange,
}: Props) {
  return (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="
            text-3xl
            transition
            hover:scale-110
            active:scale-95
          "
        >
          {star <= value ? "★" : "☆"}
        </button>
      ))}
    </div>
  );
}