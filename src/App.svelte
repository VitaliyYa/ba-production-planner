<script>
  import { Plus, RotateCcw } from '@lucide/svelte'
  import factoryData from './factory_data.json'
  import EquipmentSummary from './lib/components/EquipmentSummary.svelte'
  import IngredientsSummary from './lib/components/IngredientsSummary.svelte'
  import LineRow from './lib/components/LineRow.svelte'
  import ProductionSummary from './lib/components/ProductionSummary.svelte'
  import { productionLines } from './lib/stores/productionLines'

  const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  })

  const numberFormatter = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  })

  const formatCurrency = (value) => currencyFormatter.format(value)
  const formatNumber = (value) => numberFormatter.format(value)

  const workstations = factoryData.workstations
  const piecesPerBox = factoryData.pieces_per_box
  const defaultPiecesPerBox = 500
  const palletShelfBoxCapacity = 60
  const dailyProductionBufferHours = 24

  function getWorkstation(line) {
    return workstations[line.workstation]
  }

  function getProduct(line) {
    return getWorkstation(line)?.products.find((product) => product.name === line.product)
  }

  function addAggregate(map, name, amount, extra = {}) {
    const current = map.get(name) ?? { name, amount: 0, ...extra }
    current.amount += amount
    map.set(name, current)
  }

  function getPiecesPerBox(name) {
    return piecesPerBox[name] ?? defaultPiecesPerBox
  }

  function countBoxes(items) {
    return items.reduce((sum, item) => sum + Math.ceil(item.amount / getPiecesPerBox(item.name)), 0)
  }

  function countPalletShelves(items) {
    return Math.ceil(countBoxes(items) / palletShelfBoxCapacity)
  }

  function buildEquipmentSummary(lines) {
    const equipment = new Map()

    for (const line of lines) {
      const workstation = getWorkstation(line)

      if (!workstation) {
        continue
      }

      for (const machine of workstation.setup_machines) {
        const current = equipment.get(machine.name) ?? {
          name: machine.name,
          price: machine.price,
          count: 0,
          totalCost: 0,
        }

        current.count += line.quantity
        current.totalCost += line.quantity * machine.price
        equipment.set(machine.name, current)
      }
    }

    const items = [...equipment.values()].sort((a, b) => a.name.localeCompare(b.name))
    const totalCost = items.reduce((sum, item) => sum + item.totalCost, 0)

    return { items, totalCost }
  }

  function buildProductionSummary(lines) {
    const products = new Map()

    for (const line of lines) {
      const product = getProduct(line)

      if (!product) {
        continue
      }

      const hourlyOutput = product.outputs[line.skill === 'max' ? 'max_skill' : 'low_skill']
      addAggregate(products, product.name, line.quantity * line.hours * hourlyOutput)
    }

    const items = [...products.values()].sort((a, b) => a.name.localeCompare(b.name))
    const totalUnits = items.reduce((sum, item) => sum + item.amount, 0)

    return { items, totalUnits }
  }

  function buildDailyProductionBufferSummary(lines) {
    const products = new Map()

    for (const line of lines) {
      const product = getProduct(line)

      if (!product) {
        continue
      }

      const hourlyOutput = product.outputs[line.skill === 'max' ? 'max_skill' : 'low_skill']
      const bufferHours = Math.min(line.hours, dailyProductionBufferHours)
      addAggregate(products, product.name, line.quantity * bufferHours * hourlyOutput)
    }

    const items = [...products.values()].sort((a, b) => a.name.localeCompare(b.name))

    return {
      items,
      palletShelves: countPalletShelves(items),
    }
  }

  function buildIngredientsSummary(lines) {
    const ingredients = new Map()

    for (const line of lines) {
      const product = getProduct(line)

      if (!product) {
        continue
      }

      for (const ingredient of product.ingredients) {
        addAggregate(ingredients, ingredient.name, line.quantity * line.hours * ingredient.amount)
      }
    }

    const items = [...ingredients.values()].sort((a, b) => a.name.localeCompare(b.name))
    const totalItems = items.reduce((sum, item) => sum + item.amount, 0)

    return { items, totalItems }
  }

  $: equipmentSummary = buildEquipmentSummary($productionLines)
  $: productionSummary = buildProductionSummary($productionLines)
  $: ingredientsSummary = buildIngredientsSummary($productionLines)
  $: dailyProductionBufferSummary = buildDailyProductionBufferSummary($productionLines)
  $: ingredientPalletShelves = countPalletShelves(ingredientsSummary.items)
</script>

<main class="min-h-screen bg-slate-50">
  <div class="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
    <header class="flex flex-col gap-4 border-b border-slate-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
      <div class="max-w-3xl">
        <p class="text-sm font-semibold uppercase tracking-wide text-emerald-700">{factoryData.main_category}</p>
        <h1 class="mt-2 text-3xl font-bold text-slate-950 sm:text-4xl">Big Ambitions Production Planner</h1>
        <p class="mt-3 text-base text-slate-600">Plan production lines, equipment investment, expected output, and ingredient orders for the selected work time.</p>
      </div>

      <div class="flex flex-wrap gap-3">
        <button
          class="inline-flex h-10 items-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100"
          type="button"
          on:click={productionLines.reset}
        >
          <RotateCcw size={16} />
          Reset
        </button>
        <button
          class="inline-flex h-10 items-center gap-2 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800"
          type="button"
          on:click={productionLines.addLine}
        >
          <Plus size={16} />
          Add Line
        </button>
      </div>
    </header>

    <section class="grid gap-4">
      <div class="flex flex-col gap-1">
        <h2 class="text-xl font-semibold text-slate-950">Factory Control</h2>
        <p class="text-sm text-slate-600">Each card represents one production setup. Configuration is saved automatically in this browser.</p>
      </div>

      <div class="grid gap-4">
        {#each $productionLines as line, index (line.id)}
          <LineRow
            {line}
            {index}
            {workstations}
            removable={$productionLines.length > 1}
            onUpdate={productionLines.updateLine}
            onRemove={productionLines.removeLine}
          />
        {/each}
      </div>
    </section>

    <section class="grid gap-4 lg:grid-cols-3">
      <EquipmentSummary
        items={equipmentSummary.items}
        totalCost={equipmentSummary.totalCost}
        {formatCurrency}
      />
      <ProductionSummary
        items={productionSummary.items}
        totalUnits={productionSummary.totalUnits}
        dailyBufferPalletShelves={dailyProductionBufferSummary.palletShelves}
        {formatNumber}
      />
      <IngredientsSummary
        items={ingredientsSummary.items}
        totalItems={ingredientsSummary.totalItems}
        palletShelves={ingredientPalletShelves}
        {formatNumber}
      />
    </section>
  </div>
</main>
