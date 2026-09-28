import { useState } from "react";

import {
  benchFullAuras,
  type BenchResult,
} from "@/components/aura-maniac-prototype/prototype-gpu-bench";
import { Button } from "@/components/ui/button";

// PROTOTYPE, throwaway: measures the GPU time of each full Aura's shader on demand, and lists it.
export const PrototypeGpuBenchPanel = () => {
  const [results, setResults] = useState<BenchResult[] | null>(null);
  const [running, setRunning] = useState(false);

  const run = () => {
    setRunning(true);
    void benchFullAuras().then((measured) => {
      setResults(measured);
      setRunning(false);
    });
  };

  return (
    <section className="flex flex-col gap-4 rounded-card bg-surface p-6">
      <h2 className="text-xl font-extrabold">GPU, une image en 1024 × 1024</h2>
      <Button variant="outline" className="self-start" disabled={running} onClick={run}>
        Mesurer
      </Button>
      {results === null ? null : (
        <table data-gpu-bench className="w-96 font-mono text-sm tabular-nums">
          <tbody>
            {results.map(({ name, msPerFrame }) => (
              <tr key={name}>
                <td className="py-1">{name}</td>
                <td className="py-1 text-right">
                  {msPerFrame === null ? "indisponible" : `${msPerFrame.toFixed(3)} ms`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
};
