/**
 * Measures the number of `mongoose.Schema` instances Payload's MongoDB adapter builds for the
 * `test/_community` config, plus the process memory retained afterward.
 *
 * How it works: the adapter compiles every collection / version / nested-block schema in
 * `db.init()` on an *unopened* mongoose connection (no live MongoDB required — see
 * packages/db-mongodb/src/init.ts). We wrap `mongoose.Schema` in a Proxy to count every
 * instantiation, boot Payload with `disableDBConnect: true`, then report the totals.
 *
 * Run with:
 *   pnpm --filter payload exec tsx test/_community/measure-schemas.ts
 * or from the repo root with the same tsx invocation. Use --expose-gc for accurate heap numbers:
 *   node --expose-gc --import tsx test/_community/measure-schemas.ts
 */
import mongoose from 'mongoose'
import { getPayload } from 'payload'

const OriginalSchema = mongoose.Schema
let totalSchemas = 0

// Count every Schema instantiation without subclassing (a Proxy on `construct` keeps mongoose's
// deep generic types from being instantiated in this script).
const CountingSchema = new Proxy(OriginalSchema, {
  construct(target, args, newTarget) {
    totalSchemas += 1
    return Reflect.construct(target, args, newTarget) as object
  },
})
;(mongoose as { Schema: typeof OriginalSchema }).Schema = CountingSchema

// Attribute counts to each model the adapter registers (one per collection + one per _versions).
const perModel: { model: string; schemas: number }[] = []
const OriginalConnectionModel = mongoose.Connection.prototype.model
let lastCount = 0
const countingModel = function (
  this: mongoose.Connection,
  ...args: Parameters<typeof OriginalConnectionModel>
) {
  const modelName = typeof args[0] === 'string' ? args[0] : '(unknown)'
  perModel.push({ model: modelName, schemas: totalSchemas - lastCount })
  lastCount = totalSchemas
  return OriginalConnectionModel.apply(this, args)
}
;(mongoose.Connection.prototype as { model: typeof OriginalConnectionModel }).model =
  countingModel as typeof OriginalConnectionModel

const formatMebibytes = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MiB`

const main = async () => {
  const before = totalSchemas

  const { default: configPromise } = await import('./config.js')
  const config = await configPromise
  // `onInit` seeds data via the DB; skip it since we intentionally do not connect to MongoDB.
  delete (config as { onInit?: unknown }).onInit
  // Build every schema without connecting to MongoDB — init() still compiles the full schema tree.
  await getPayload({ config, disableDBConnect: true })

  const built = totalSchemas - before

  // Force GC if available (run node with --expose-gc) for a stable heap reading.
  if (typeof globalThis.gc === 'function') {
    globalThis.gc()
  }
  const memory = process.memoryUsage()

  console.log('\n================ Schema instance count ================')
  console.log(`Total mongoose.Schema instances built by one init: ${built.toLocaleString()}`)

  // init() builds the live schema and the _versions schema for a collection before registering the
  // version model, then registers the live model with nothing built in between — so a
  // `_foo_versions` delta reflects (live + version) combined. Merge the pair under the base slug.
  const byCollection = new Map<string, number>()
  for (const { model, schemas } of perModel) {
    const base = model.replace(/^_/, '').replace(/_versions$/, '')
    byCollection.set(base, (byCollection.get(base) ?? 0) + schemas)
  }
  console.log('\nSchemas built per collection (live + _versions combined):')
  for (const [collection, schemas] of [...byCollection.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${schemas.toLocaleString().padStart(9)}  ${collection}`)
  }

  console.log('\n================ Process memory ================')
  console.log(`  RSS:        ${formatMebibytes(memory.rss)}`)
  console.log(`  Heap total: ${formatMebibytes(memory.heapTotal)}`)
  console.log(`  Heap used:  ${formatMebibytes(memory.heapUsed)}`)
  if (typeof globalThis.gc !== 'function') {
    console.log('  (run with `node --expose-gc --import tsx ...` for a GC-stable heap reading)')
  }

  process.exit(0)
}

void main()
