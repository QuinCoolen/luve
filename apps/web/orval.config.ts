import { defineConfig } from "orval";

export default defineConfig({
  luve: {
    input: "../luve-api/openapi.json",
    output: {
      target: "src/api/generated/endpoints.ts",
      schemas: "src/api/generated/schemas",
      client: "react-query",
      httpClient: "axios",
      mode: "split",
      override: {
        mutator: { path: "src/api/mutator/axios.ts", name: "customInstance" },
        query: { useQuery: true, useInfinite: true, signal: true },
      },
    },
  },
});
