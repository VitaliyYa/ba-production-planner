<script>
  import { Trash2 } from '@lucide/svelte'

  export let line
  export let index
  export let workstations
  export let removable = true
  export let onUpdate
  export let onRemove

  $: workstationNames = Object.keys(workstations)
  $: products = workstations[line.workstation]?.products ?? []

  function updateValue(field, value) {
    onUpdate(line.id, { [field]: value })
  }

  function updateWorkstation(value) {
    const firstProduct = workstations[value]?.products[0]?.name ?? ''
    onUpdate(line.id, { workstation: value, product: firstProduct })
  }
</script>

<article class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
  <div class="mb-4 flex items-start justify-between gap-3">
    <div>
      <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Production Line</p>
      <h2 class="mt-1 text-lg font-semibold text-slate-950">Line {index + 1}</h2>
    </div>

    <button
      class="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
      type="button"
      aria-label="Remove line {index + 1}"
      title="Remove line"
      disabled={!removable}
      on:click={() => onRemove(line.id)}
    >
      <Trash2 size={16} />
    </button>
  </div>

  <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
    <label class="grid gap-1.5">
      <span class="text-sm font-medium text-slate-700">Workstation</span>
      <select
        class="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
        value={line.workstation}
        on:change={(event) => updateWorkstation(event.currentTarget.value)}
      >
        {#each workstationNames as workstation}
          <option value={workstation}>{workstation}</option>
        {/each}
      </select>
    </label>

    <label class="grid gap-1.5">
      <span class="text-sm font-medium text-slate-700">Product</span>
      <select
        class="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
        value={line.product}
        on:change={(event) => updateValue('product', event.currentTarget.value)}
      >
        {#each products as product}
          <option value={product.name}>{product.name}</option>
        {/each}
      </select>
    </label>

    <label class="grid gap-1.5">
      <span class="text-sm font-medium text-slate-700">Lines</span>
      <input
        class="h-10 rounded-md border border-slate-300 px-3 text-sm text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
        type="number"
        min="1"
        step="1"
        value={line.quantity}
        on:input={(event) => updateValue('quantity', event.currentTarget.value)}
      />
    </label>

    <label class="grid gap-1.5">
      <span class="text-sm font-medium text-slate-700">Work Hours</span>
      <input
        class="h-10 rounded-md border border-slate-300 px-3 text-sm text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
        type="number"
        min="1"
        max="168"
        step="1"
        value={line.hours}
        on:input={(event) => updateValue('hours', event.currentTarget.value)}
      />
    </label>

    <fieldset class="grid gap-1.5">
      <legend class="text-sm font-medium text-slate-700">Worker Experience</legend>
      <div class="grid grid-cols-2 overflow-hidden rounded-md border border-slate-300 bg-slate-50 p-0.5">
        <label class="cursor-pointer">
          <input
            class="peer sr-only"
            type="radio"
            name="skill-{line.id}"
            checked={line.skill === 'low'}
            on:change={() => updateValue('skill', 'low')}
          />
          <span class="flex h-9 items-center justify-center rounded px-2 text-center text-xs font-semibold text-slate-600 peer-checked:bg-white peer-checked:text-slate-950 peer-checked:shadow-sm">Exp &lt; 100%</span>
        </label>

        <label class="cursor-pointer">
          <input
            class="peer sr-only"
            type="radio"
            name="skill-{line.id}"
            checked={line.skill === 'max'}
            on:change={() => updateValue('skill', 'max')}
          />
          <span class="flex h-9 items-center justify-center rounded px-2 text-center text-xs font-semibold text-slate-600 peer-checked:bg-white peer-checked:text-slate-950 peer-checked:shadow-sm">Exp = 100%</span>
        </label>
      </div>
    </fieldset>
  </div>
</article>
