import { notifyManager } from '@tanstack/query-core'
import { unstable_batchedUpdates } from './solidBatchedUpdates'

notifyManager.setBatchNotifyFunction(unstable_batchedUpdates)
