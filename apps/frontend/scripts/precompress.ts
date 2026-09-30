import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { brotliCompress, constants, gzip } from "node:zlib";

// After `vite build`: a .br and a .gz next to every text file of dist/, compressed once at the
// highest level. nginx serves them as they are (`brotli_static`, `gzip_static`, deploy/nginx.conf)
// instead of compressing each response; a CDN that compresses on its own ignores them. Fonts and
// sounds are compressed already, and a file under 1 KB gains nothing.
const dist = fileURLToPath(new URL("../dist/", import.meta.url));

const compressible = /\.(?:js|css|html|svg|json|txt)$/;

const minBytes = 1024;

const brotliAsync = promisify(brotliCompress);

const gzipAsync = promisify(gzip);

const precompress = async (path: string) => {
  const content = await readFile(path);

  if (content.length < minBytes) {
    return;
  }

  const [br, gz] = await Promise.all([
    brotliAsync(content, {
      params: {
        [constants.BROTLI_PARAM_QUALITY]: constants.BROTLI_MAX_QUALITY,
        [constants.BROTLI_PARAM_SIZE_HINT]: content.length,
      },
    }),
    gzipAsync(content, { level: constants.Z_BEST_COMPRESSION }),
  ]);

  await Promise.all([writeFile(`${path}.br`, br), writeFile(`${path}.gz`, gz)]);
};

const files = await readdir(dist, { recursive: true });

await Promise.all(
  files.flatMap((file) => (compressible.test(file) ? [precompress(join(dist, file))] : [])),
);
