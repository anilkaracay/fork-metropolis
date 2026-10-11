import { Icon } from "@/components/social/icon";

export function Wordmark() {
  return (
    <span className="fork-wordmark">
      <Icon name="fork" size={25} />
      <span>
        FORK<span className="wordmark-period">.</span>
      </span>
    </span>
  );
}
