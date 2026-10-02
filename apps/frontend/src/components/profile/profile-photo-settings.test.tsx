import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ApiErrorBody } from "api";
import { toast as sonner } from "sonner";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { type Me, meQueryOptions } from "@/api/me";
import type { PhotoCrop } from "@/components/photo/photo-crop";
import type { PhotoTools } from "@/components/photo/photo-tools";
import { PhotoToolsContext } from "@/components/photo/photo-tools-context";
import { ProfilePhotoSettings } from "@/components/profile/profile-photo-settings";
import { Toaster } from "@/components/ui/sonner";
import { useLocaleStore } from "@/stores/locale-store";

const ada: Me = {
  id: "u1",
  name: "Ada Lovelace",
  email: "ada@example.com",
  image: "https://avatars.example.com/ada.png",
  hasPhoto: false,
  handle: "ada",
  rank: null,
  ornament: null,
  ornamentChoice: null,
  place: null,
};

const PHOTO_URL = "http://localhost:3000/api/photos/photo.webp";

// The browser's decoding, faked: every image file decodes at `size`, but "broken.png"; the framed
// square exported is the crop itself, read back by `exported`.
const fakeTools = (size = { width: 800, height: 600 }) => {
  const crops: PhotoCrop[] = [];
  const release = vi.fn();

  const tools: PhotoTools = {
    load: async (file) =>
      file.name === "broken.png"
        ? null
        : {
            ...size,
            src: "blob:photo",
            exportCrop: async (crop) => {
              crops.push(crop);

              return new Blob(["webp"], { type: "image/webp" });
            },
            release,
          },
  };

  return { tools, crops, release };
};

const image = (name: string, { type = "image/png", bytes = 16 } = {}) =>
  new File([new Uint8Array(bytes)], name, { type });

beforeEach(() => {
  useLocaleStore.setState({ locale: "en" });
});

// Sonner keeps its toasts past the test: they would take the next test's visible places.
afterEach(() => {
  vi.unstubAllGlobals();
  sonner.dismiss();
});

const renderSettings = ({ me = ada, tools = fakeTools().tools } = {}) => {
  const queryClient = new QueryClient();

  queryClient.setQueryData(meQueryOptions.queryKey, me);

  render(
    <QueryClientProvider client={queryClient}>
      <PhotoToolsContext value={tools}>
        <ProfilePhotoSettings me={me} />
      </PhotoToolsContext>
      <Toaster />
    </QueryClientProvider>,
  );

  return { user: userEvent.setup(), queryClient };
};

// The API answering with `body` and `status`, every call kept.
const stubApi = (body: Me | ApiErrorBody, status = 200) => {
  const fetch = vi.fn(async (_url: string, _init?: RequestInit) => Response.json(body, { status }));

  vi.stubGlobal("fetch", fetch);

  return fetch;
};

const chooser = () => screen.getByLabelText("Choose a Photo");

const frame = () => screen.getByRole("button", { name: "Photo framing" });

const frameShown = () => screen.queryByRole("button", { name: "Photo framing" }) !== null;

describe("ProfilePhotoSettings in English", () => {
  test("a chosen image is framed, then saved: it becomes the Avatar", async () => {
    const api = stubApi({ ...ada, hasPhoto: true, image: PHOTO_URL });
    const { tools, crops, release } = fakeTools();
    const { user, queryClient } = renderSettings({ tools });

    await user.upload(chooser(), image("ada.png"));
    expect(frame()).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Photo saved")).toBeInTheDocument();
    expect(crops).toEqual([{ x: 100, y: 0, side: 600, output: 600 }]);

    const [url, init] = api.mock.calls[0] ?? [];

    expect(url).toContain("/api/me/photo");
    expect(init?.method).toBe("PUT");
    expect(init?.body).toBeInstanceOf(FormData);
    expect(queryClient.getQueryData(meQueryOptions.queryKey)).toMatchObject({ image: PHOTO_URL });
    // Back to the settings, the image let go.
    expect(frameShown()).toBe(false);
    expect(release).toHaveBeenCalled();
  });

  test("the framing moves and zooms with the keyboard", async () => {
    stubApi({ ...ada, hasPhoto: true, image: PHOTO_URL });
    const { tools, crops } = fakeTools();
    const { user } = renderSettings({ tools });

    await user.upload(chooser(), image("ada.png"));
    frame().focus();
    await user.keyboard("{+}{+}{ArrowRight}");
    await user.click(screen.getByRole("button", { name: "Save" }));
    await screen.findByText("Photo saved");

    const [crop] = crops;

    expect(crop?.side).toBeLessThan(600);
    // The arrow moved the photo right: the frame shows more of its left.
    expect(crop?.x).toBeLessThan((800 - (crop?.side ?? 0)) / 2);
  });

  test("cancelling the framing sends nothing", async () => {
    const api = stubApi(ada);
    const { tools, release } = fakeTools();
    const { user } = renderSettings({ tools });

    await user.upload(chooser(), image("ada.png"));
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(frameShown()).toBe(false);
    expect(api).not.toHaveBeenCalled();
    expect(release).toHaveBeenCalled();
  });

  test("refuses, before framing, what the API would refuse", async () => {
    const { user } = renderSettings({ tools: fakeTools({ width: 100, height: 400 }).tools });

    await user.upload(chooser(), image("ada.png", { bytes: 5 * 1024 * 1024 + 1 }));
    expect(await screen.findByText("This image is over 5 MB.")).toBeInTheDocument();

    await user.upload(chooser(), image("ada.png"));
    expect(
      await screen.findByText("This image is too small: 128 px a side at least."),
    ).toBeInTheDocument();
    expect(frameShown()).toBe(false);
  });

  test("refuses an image of another format", async () => {
    renderSettings();

    fireEvent.change(chooser(), { target: { files: [image("ada.gif", { type: "image/gif" })] } });

    expect(
      await screen.findByText("This image isn't a JPEG, a PNG or a WebP."),
    ).toBeInTheDocument();
  });

  test("refuses an image that does not decode", async () => {
    const { user } = renderSettings();

    await user.upload(chooser(), image("broken.png"));

    expect(
      await screen.findByText("This image isn't a JPEG, a PNG or a WebP."),
    ).toBeInTheDocument();
    expect(frameShown()).toBe(false);
  });

  test("says why the API refused the Photo", async () => {
    stubApi({ error: { code: "TOO_MANY_REQUESTS", message: "slow down", requestId: "r1" } }, 429);
    const { user } = renderSettings();

    await user.upload(chooser(), image("ada.png"));
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(
      await screen.findByText("Too many Photos sent in a row: try again in a while."),
    ).toBeInTheDocument();
    // The framing stays, to try again.
    expect(frame()).toBeInTheDocument();
  });

  test("removes the Photo: only a Photo can be removed", async () => {
    const api = stubApi({ ...ada, hasPhoto: false });
    const { user } = renderSettings({ me: { ...ada, hasPhoto: true, image: PHOTO_URL } });

    expect(screen.getByLabelText("Change Photo")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Remove Photo" }));

    expect(await screen.findByText("Photo removed")).toBeInTheDocument();
    expect(api.mock.calls[0]?.[1]?.method).toBe("DELETE");
  });

  test("offers no removal without a Photo", () => {
    renderSettings();

    expect(screen.queryByRole("button", { name: "Remove Photo" })).not.toBeInTheDocument();
  });
});
