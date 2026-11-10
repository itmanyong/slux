import { signalBasicWrite } from "./signal/basic-write.js";
import { signalDraft } from "./signal/draft-immutable.js";
import { signalCollections } from "./signal/collections.js";
import { signalCustomEquals } from "./signal/custom-equals.js";
import { signalSpecialValues } from "./signal/special-values.js";
import { signalSubscribe } from "./signal/subscribe-lifecycle.js";
import { computedLazy } from "./computed/lazy-cache.js";
import { computedDynamicDeps } from "./computed/dynamic-deps.js";
import { computedEquals } from "./computed/equals-skip.js";
import { computedCycle } from "./computed/circular.js";
import { effectSyncRun } from "./effect/sync-run.js";
import { effectCleanup } from "./effect/cleanup.js";
import { effectUntracked } from "./effect/untracked-read.js";
import { effectError } from "./effect/error-aggregate.js";
import { batchMerge } from "./batch/merge.js";
import { batchNested } from "./batch/nested.js";
import { batchNotTransaction } from "./batch/not-transaction.js";
import { scopeOverride } from "./scope/override.js";
import { scopeFork } from "./scope/fork.js";
import { scopeSerialize } from "./scope/serialize.js";
import { scopeIsolation } from "./scope/isolation.js";

/** 展示顺序即左侧目录与右侧瀑布流的顺序。 */
export const demos = [
  signalBasicWrite,
  signalDraft,
  signalCollections,
  signalCustomEquals,
  signalSpecialValues,
  signalSubscribe,
  computedLazy,
  computedDynamicDeps,
  computedEquals,
  computedCycle,
  effectSyncRun,
  effectCleanup,
  effectUntracked,
  effectError,
  batchMerge,
  batchNested,
  batchNotTransaction,
  scopeOverride,
  scopeFork,
  scopeSerialize,
  scopeIsolation,
];
