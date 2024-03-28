import * as React from "react";
import * as Qwik from "@builder.io/qwik";

import type { QueryClient } from "@tanstack/query-core";

export const QueryClientContext = Qwik.createContextId<QueryClient | undefined>(
  "QueryClientContext",
);

export const useQueryClient = (queryClient?: QueryClient) => {
  const client = Qwik.useContext(QueryClientContext);

  if (queryClient) {
    return queryClient;
  }

  if (!client) {
    throw new Error("No QueryClient set, use QueryClientProvider to set one");
  }

  return client;
};

export type QueryClientProviderProps = {
  client: QueryClient;
  children?: React.ReactNode;
};

export const QueryClientProvider = ({ client }: QueryClientProviderProps) => {
  Qwik.useContextProvider(QueryClientContext, client);

  Qwik.useVisibleTask$(({ cleanup }) => {
    client.mount();
    cleanup(() => {
      client.unmount();
    });
  });

  return <Qwik.Slot />;
};
