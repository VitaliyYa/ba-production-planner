<script>
  import { Pencil, Plus, Trash2 } from '@lucide/svelte'
  import { activeFactory, factoriesStore } from '../stores/factories'

  $: suggestedFactoryName = 'Factory ' + ($factoriesStore.factories.length + 1)

  function promptForName(message, initialValue) {
    const value = window.prompt(message, initialValue)

    if (value === null) {
      return null
    }

    const name = value.trim()

    if (!name) {
      window.alert('Factory name cannot be empty.')
      return null
    }

    return name
  }

  function addFactory() {
    const name = promptForName('Enter a name for the new factory:', suggestedFactoryName)

    if (name) {
      factoriesStore.addFactory(name)
    }
  }

  function renameFactory() {
    const name = promptForName('Rename factory:', $activeFactory?.name ?? '')

    if (name) {
      factoriesStore.renameActiveFactory(name)
    }
  }

  function deleteFactory() {
    if (!$activeFactory) {
      return
    }

    const lastFactoryNotice = $factoriesStore.factories.length === 1
      ? ' A new empty factory will be created.'
      : ''
    const confirmed = window.confirm(
      'Delete "' + $activeFactory.name + '"?' + lastFactoryNotice,
    )

    if (confirmed) {
      factoriesStore.deleteActiveFactory()
    }
  }
</script>

<div class="flex w-full min-w-0 items-center gap-2 sm:w-auto">
  <label class="min-w-0 flex-1 sm:w-48 sm:flex-none">
    <span class="sr-only">Active factory</span>
    <select
      class="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
      value={$factoriesStore.activeFactoryId}
      aria-label="Active factory"
      on:change={(event) => factoriesStore.selectFactory(event.currentTarget.value)}
    >
      {#each $factoriesStore.factories as factory (factory.id)}
        <option value={factory.id}>{factory.name}</option>
      {/each}
    </select>
  </label>

  <div class="inline-flex shrink-0 overflow-hidden rounded-md border border-slate-300 bg-white shadow-sm">
    <button
      class="inline-flex h-10 w-10 items-center justify-center text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-700 focus:z-10 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-600"
      type="button"
      aria-label="Create factory"
      title="Create factory"
      on:click={addFactory}
    >
      <Plus size={16} />
    </button>
    <button
      class="inline-flex h-10 w-10 items-center justify-center border-l border-slate-300 text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 focus:z-10 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-600"
      type="button"
      aria-label="Rename active factory"
      title="Rename factory"
      on:click={renameFactory}
    >
      <Pencil size={16} />
    </button>
    <button
      class="inline-flex h-10 w-10 items-center justify-center border-l border-slate-300 text-slate-600 transition hover:bg-red-50 hover:text-red-700 focus:z-10 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-red-600"
      type="button"
      aria-label="Delete active factory"
      title="Delete factory"
      on:click={deleteFactory}
    >
      <Trash2 size={16} />
    </button>
  </div>
</div>
