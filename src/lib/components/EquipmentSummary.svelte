<script>
  import { Wrench } from '@lucide/svelte'

  export let items = []
  export let totalCost = 0
  export let formatCurrency
</script>

<section class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
  <div class="mb-4 flex items-start justify-between gap-4">
    <div>
      <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Required Equipment</p>
      <h2 class="mt-1 text-xl font-semibold text-slate-950">{formatCurrency(totalCost)}</h2>
    </div>
    <div class="flex h-10 w-10 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
      <Wrench size={19} />
    </div>
  </div>

  {#if items.length > 0}
    <div class="divide-y divide-slate-100">
      {#each items as item}
        <div class="grid grid-cols-[1fr_auto] gap-3 py-3">
          <div>
            <p class="font-medium text-slate-900">{item.name}</p>
            <p class="text-sm text-slate-500">{item.count} machines x {formatCurrency(item.price)}</p>
          </div>
          <p class="font-semibold text-slate-950">{formatCurrency(item.totalCost)}</p>
        </div>
      {/each}
    </div>
  {:else}
    <p class="rounded-md bg-slate-50 p-3 text-sm text-slate-500">Add a production line to calculate required machines.</p>
  {/if}
</section>
