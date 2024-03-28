import * as Qwik from "@builder.io/qwik";
import { MutationObserver, notifyManager } from "@tanstack/query-core";
import { useQueryClient } from "./QueryClientProvider";
import { noop, shouldThrowError } from "./utils";
import type {
  UseMutateAsyncFunction,
  UseMutationOptions,
  UseMutationResult,
} from "./types";
import type {
  DefaultError,
  MutateOptions,
  MutationObserverResult,
  QueryClient,
} from "@tanstack/query-core";

// HOOK

export function useMutation<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TContext = unknown,
>(
  options: UseMutationOptions<TData, TError, TVariables, TContext>,
  queryClient?: QueryClient,
): UseMutationResult<TData, TError, TVariables, TContext> {
  const client = useQueryClient(queryClient);

  const store = Qwik.useStore<{
    result: MutationObserverResult<TData, TError, TVariables, TContext>;
    mutateAsync: UseMutateAsyncFunction<TData, TError, TVariables, TContext>;
  }>({
    result: {} as MutationObserverResult<TData, TError, TVariables, TContext>,
    mutateAsync: async () => ({}) as TData,
  });

  const observerSig = Qwik.useSignal<
    Qwik.NoSerialize<MutationObserver<TData, TError, TVariables, TContext>>
  >(
    Qwik.noSerialize(
      new MutationObserver<TData, TError, TVariables, TContext>(
        client,
        options,
      ),
    ),
  );

  Qwik.useVisibleTask$(({ track }) => {
    observerSig.value?.setOptions(options);
    track(() => options);
  });

  Qwik.useVisibleTask$(({ cleanup }) => {
    const unsubscribe = observerSig.value?.subscribe(
      notifyManager.batchCalls((result) => {
        store.result = observerSig.value?.getCurrentResult()!;
        store.mutateAsync = result.mutate;
      }),
    );

    cleanup(() => {
      unsubscribe?.();
    });
  });

  const mutate = (
    variables: TVariables,
    mutateOptions?: MutateOptions<TData, TError, TVariables, TContext>,
  ) => {
    observerSig.value?.mutate(variables, mutateOptions).catch(noop);
  };

  if (
    store.result.error &&
    shouldThrowError(observerSig.value?.options.throwOnError, [
      store.result.error,
    ])
  ) {
    throw store.result.error;
  }

  return { ...store.result, mutate, mutateAsync: store.mutateAsync };
}
