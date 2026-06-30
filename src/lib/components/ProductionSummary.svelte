<script>
  import { PackageCheck } from '@lucide/svelte'

  export let items = []
  export let totalUnits = 0
  export let dailyBufferPalletShelves = 0
  export let formatNumber
</script>

<section class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
  <div class="mb-4 flex items-start justify-between gap-4">
    <div>
      <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Production Output</p>
      <h2 class="mt-1 text-xl font-semibold text-slate-950">{formatNumber(totalUnits)} units</h2>
    </div>
    <div class="flex h-10 w-10 items-center justify-center rounded-md bg-sky-50 text-sky-700">
      <PackageCheck size={19} />
    </div>
  </div>

  {#if items.length > 0}
    <div class="divide-y divide-slate-100">
      {#each items as item}
        <div class="grid grid-cols-[1fr_auto] gap-3 py-3">
          <p class="font-medium text-slate-900">{item.name}</p>
          <p class="font-semibold text-slate-950">{formatNumber(item.amount)}</p>
        </div>
      {/each}
    </div>
  {:else}
    <p class="rounded-md bg-slate-50 p-3 text-sm text-slate-500">Select products to see the total output for the chosen hours.</p>
  {/if}

  <div class="mt-4 grid gap-2 rounded-md bg-sky-50 p-3 text-sm">
    <p class="text-sky-900">Finished goods are picked up from storage at 02:00, so shelves cover only a temporary daily buffer.</p>
    <p class="font-semibold text-sky-950">Required Pallet Shelves for daily production buffer (until 02:00 pickup): {formatNumber(dailyBufferPalletShelves)}</p>
  </div>
</section>
