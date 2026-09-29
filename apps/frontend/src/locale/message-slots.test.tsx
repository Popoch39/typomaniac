import { render } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { withSlots } from "@/locale/message-slots";

describe("withSlots", () => {
  test("puts each element where its input stands, in the message's word order", () => {
    const { container } = render(
      <p>
        {withSlots(({ a, b }) => `${b} and ${a} are now Friends`, {
          a: <b>@ada</b>,
          b: <i>@alan</i>,
        })}
      </p>,
    );

    expect(container.innerHTML).toBe("<p><i>@alan</i> and <b>@ada</b> are now Friends</p>");
  });

  test("keeps a message without its element as it is", () => {
    const { container } = render(<p>{withSlots(() => "just now", { a: <b>@ada</b> })}</p>);

    expect(container.innerHTML).toBe("<p>just now</p>");
  });
});
