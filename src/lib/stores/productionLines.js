import { writable } from 'svelte/store'
import factoryData from '../../factory_data.json'

const STORAGE_KEY = 'ba-production-planner-lines'
const workstationNames = Object.keys(factoryData.workstations)

function makeId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function createLine(overrides = {}) {
  const workstation = overrides.workstation ?? workstationNames[0]
  const product = overrides.product ?? factoryData.workstations[workstation]?.products[0]?.name ?? ''

  return {
    id: makeId(),
    workstation,
    product,
    quantity: 1,
    hours: 24,
    skill: 'low',
    ...overrides,
  }
}

function normalizeLine(line) {
  const workstation = factoryData.workstations[line?.workstation] ? line.workstation : workstationNames[0]
  const products = factoryData.workstations[workstation]?.products ?? []
  const product = products.some((item) => item.name === line?.product)
    ? line.product
    : products[0]?.name ?? ''

  return {
    ...createLine(),
    ...line,
    id: line?.id ?? makeId(),
    workstation,
    product,
    quantity: Math.max(1, Number.parseInt(line?.quantity, 10) || 1),
    hours: Math.min(168, Math.max(1, Number.parseInt(line?.hours, 10) || 24)),
    skill: line?.skill === 'max' ? 'max' : 'low',
  }
}

function loadLines() {
  if (typeof localStorage === 'undefined') {
    return [createLine()]
  }

  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))

    if (Array.isArray(saved) && saved.length > 0) {
      return saved.map(normalizeLine)
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY)
  }

  return [createLine()]
}

function createProductionLinesStore() {
  const store = writable(loadLines())

  if (typeof localStorage !== 'undefined') {
    store.subscribe((lines) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines))
    })
  }

  return {
    subscribe: store.subscribe,
    addLine: () => store.update((lines) => [...lines, createLine()]),
    removeLine: (id) => store.update((lines) => {
      const nextLines = lines.filter((line) => line.id !== id)
      return nextLines.length > 0 ? nextLines : [createLine()]
    }),
    updateLine: (id, updates) => store.update((lines) => lines.map((line) => {
      if (line.id !== id) {
        return line
      }

      return normalizeLine({ ...line, ...updates })
    })),
    reset: () => store.set([createLine()]),
  }
}

export const productionLines = createProductionLinesStore()
