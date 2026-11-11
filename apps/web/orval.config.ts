import { defineConfig } from "orval";

/**
 * One Orval project per HTTP service. Each reads the service's exported
 * OpenAPI document (`pnpm openapi`) and writes typed TanStack Query hooks to
 * src/api/generated/<service>/. All clients share the axios mutator, which
 * talks to the gateway on the same origin.
 *
 * Add a project here when a service gets its first endpoints.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const service = (name: string) => ({
  input: `../../services/${name}/openapi.json`,
  output: {
    target: `src/api/generated/${name}/endpoints.ts`,
    schemas: `src/api/generated/${name}/model`,
    client: "react-query" as const,
    httpClient: "axios" as const,
    mode: "split" as const,
    clean: true,
    override: {
      mutator: { path: "src/api/mutator/axios.ts", name: "customInstance" },
      query: { useQuery: true, signal: true },
    },
  },
});

export default defineConfig({
  // identity: service("identity"),   // Phase 1
});

