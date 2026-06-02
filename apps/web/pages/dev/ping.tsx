import { usePingControllerPingV1 } from "@/api/generated/endpoints";

/**
 * Throwaway smoke page proving the contract pipeline end-to-end:
 *   Nest controller -> openapi.json -> Orval hook -> this component.
 *
 * Delete before Phase 2 (PHASE_1_TASKS.md, task O2).
 */
export default function DevPingPage() {
  const { data, isLoading, isError, error } = usePingControllerPingV1();

  return (
    <main style={{ padding: 32, fontFamily: "monospace" }}>
      <h1>Dev Ping</h1>
      <p>Fetched from the API via the Orval-generated TanStack Query hook.</p>
      {isLoading && <p>Loading…</p>}
      {isError && (
        <p data-testid="ping-error" style={{ color: "crimson" }}>
          Error: {error instanceof Error ? error.message : String(error)}
        </p>
      )}
      {data && (
        <pre data-testid="ping-result">{JSON.stringify(data, null, 2)}</pre>
      )}
    </main>
  );
}
