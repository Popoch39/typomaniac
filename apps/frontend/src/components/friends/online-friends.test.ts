import type { Presence } from "api";
import { describe, expect, test } from "vitest";

import type { Friend } from "@/api/friends";
import {
  type PresentFriend,
  presentFriends,
  sidebarFriendRows,
} from "@/components/friends/online-friends";

const friend = (handle: string): Friend => ({
  id: `${handle}-id`,
  handle,
  image: null,
  ornament: null,
});

const there = (handle: string, presence: PresentFriend["presence"]): PresentFriend => ({
  ...friend(handle),
  presence,
});

const presencesOf = (entries: [string, Presence][]) =>
  new Map(entries.map(([handle, presence]) => [`${handle}-id`, presence]));

const handles = (friends: readonly { handle: string }[]) => friends.map(({ handle }) => handle);

describe("the Friends who are there", () => {
  test("are those online or in a Duel, with their Presence, in the list's order", () => {
    const friends = ["ada", "alan", "grace", "linus"].map(friend);

    const present = presentFriends(
      friends,
      presencesOf([
        ["linus", "online"],
        ["alan", "in-duel"],
        ["grace", "offline"],
      ]),
    );

    expect(present).toEqual([there("alan", "in-duel"), there("linus", "online")]);
  });

  test("a Friend whose Presence is not told is offline", () => {
    expect(presentFriends([friend("ada")], new Map())).toEqual([]);
  });
});

describe("the sidebar's rows", () => {
  test("the Friends online first, then those in a Duel, each group in the list's order", () => {
    const present = [
      there("ada", "in-duel"),
      there("alan", "online"),
      there("grace", "in-duel"),
      there("linus", "online"),
    ];

    expect(handles(sidebarFriendRows(present).rows)).toEqual(["alan", "linus", "ada", "grace"]);
  });

  test("5 rows at most, counting all the Friends who are there", () => {
    const present = ["a", "b", "c", "d", "e", "f", "g"].map((handle) =>
      there(handle, handle === "a" ? "in-duel" : "online"),
    );

    const { rows, count } = sidebarFriendRows(present);

    expect(handles(rows)).toEqual(["b", "c", "d", "e", "f"]);
    expect(count).toBe(7);
  });

  test("none when no Friend is there", () => {
    expect(sidebarFriendRows([])).toEqual({ rows: [], count: 0 });
  });
});
