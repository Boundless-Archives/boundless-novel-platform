import type { Cosmetic } from "@/lib/cosmetics";

type Props = {
  name: string;
  nameColor?: Cosmetic | null;
  title?: Cosmetic | null;
  /** Put the title on its own line under the name. */
  stacked?: boolean;
  className?: string;
};

/*
 * A display name in the user's chosen colour, with their title next to
 * it. With nothing equipped it is just the name.
 */
export default function StyledName({
  name,
  nameColor,
  title,
  stacked = false,
  className = "",
}: Props) {
  const color =
    typeof nameColor?.style.color === "string"
      ? nameColor.style.color
      : undefined;

  return (
    <span className={className}>
      <span style={color ? { color } : undefined}>{name}</span>

      {title && (
        <span
          className={`${
            stacked ? "mt-0.5 block" : "ml-2 inline-block align-middle"
          } text-xs font-normal italic opacity-70`}
          style={{ color: "inherit" }}
        >
          {title.name}
        </span>
      )}
    </span>
  );
}
