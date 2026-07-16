import { derived, writable } from 'svelte/store'
import factoryData from '../../factory_data.json'

const STORAGE_VERSION = 2
const STORAGE_KEY = 'ba-production-planner-state'
const LEGACY_STORAGE_KEY = 'ba-production-planner-lines'
const workstationNames = Object.keys(factoryData.workstations)

function makeId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }

  return Date.now() + '-' + Math.random().toString(16).slice(2)
}

function makeUniqueId(candidate, usedIds) {
  let id = typeof candidate === 'string' && candidate.trim() ? candidate : makeId()

  while (usedIds.has(id)) {
    id = makeId()
  }

  usedIds.add(id)
  return id
}

function normalizeFactoryName(name, fallback) {
  const normalized = typeof name === 'string' ? name.trim() : ''
  return normalized || fallback
}

export function createLine(overrides = {}) {
  const workstation = factoryData.workstations[overrides.workstation]
    ? overrides.workstation
    : workstationNames[0]
  const products = factoryData.workstations[workstation]?.products ?? []
  const product = products.some((item) => item.name === overrides.product)
    ? overrides.product
    : products[0]?.name ?? ''

  return {
    id: typeof overrides.id === 'string' && overrides.id.trim() ? overrides.id : makeId(),
    workstation,
    product,
    quantity: Math.max(1, Number.parseInt(overrides.quantity, 10) || 1),
    hours: Math.min(168, Math.max(1, Number.parseInt(overrides.hours, 10) || 24)),
    skill: overrides.skill === 'max' ? 'max' : 'low',
  }
}

function normalizeLines(lines) {
  if (!Array.isArray(lines)) {
    return []
  }

  const usedIds = new Set()

  return lines.map((line) => {
    const normalized = createLine(line && typeof line === 'object' ? line : {})
    return { ...normalized, id: makeUniqueId(normalized.id, usedIds) }
  })
}

function createFactory(name = 'Factory 1', lines = [], id = makeId()) {
  return {
    id,
    name: normalizeFactoryName(name, 'Factory 1'),
    lines: normalizeLines(lines),
  }
}

function createInitialState(name = 'Factory 1', lines = []) {
  const factory = createFactory(name, lines)

  return {
    version: STORAGE_VERSION,
    activeFactoryId: factory.id,
    factories: [factory],
  }
}

export function migrateLegacyLines(lines) {
  return createInitialState('Main Factory', Array.isArray(lines) ? lines : [])
}

export function normalizeFactoriesState(value) {
  if (!value || typeof value !== 'object' || !Array.isArray(value.factories)) {
    return null
  }

  if (value.factories.length === 0) {
    return createInitialState()
  }

  const usedFactoryIds = new Set()
  const factories = value.factories.map((factory, index) => {
    const source = factory && typeof factory === 'object' ? factory : {}

    return {
      id: makeUniqueId(source.id, usedFactoryIds),
      name: normalizeFactoryName(source.name, 'Factory ' + (index + 1)),
      lines: normalizeLines(source.lines),
    }
  })
  const activeFactoryId = factories.some((factory) => factory.id === value.activeFactoryId)
    ? value.activeFactoryId
    : factories[0].id

  return {
    version: STORAGE_VERSION,
    activeFactoryId,
    factories,
  }
}

function readStorage(key) {
  try {
    const value = localStorage.getItem(key)
    return value === null ? null : JSON.parse(value)
  } catch {
    try {
      localStorage.removeItem(key)
    } catch {
      // Storage can be unavailable even when the API exists.
    }

    return null
  }
}

function loadState() {
  if (typeof localStorage === 'undefined') {
    return createInitialState()
  }

  const current = readStorage(STORAGE_KEY)
  const currentState = normalizeFactoriesState(current)

  if (currentState) {
    return currentState
  }

  if (Array.isArray(current)) {
    return migrateLegacyLines(current)
  }

  const legacy = readStorage(LEGACY_STORAGE_KEY)
  const legacyState = normalizeFactoriesState(legacy)

  if (legacyState) {
    return legacyState
  }

  if (Array.isArray(legacy)) {
    return migrateLegacyLines(legacy)
  }

  return createInitialState()
}

function persistState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    localStorage.removeItem(LEGACY_STORAGE_KEY)
  } catch {
    // Keep the calculator usable when storage is blocked or full.
  }
}

function updateActiveFactory(state, updateFactory) {
  const activeIndex = state.factories.findIndex((factory) => factory.id === state.activeFactoryId)

  if (activeIndex === -1) {
    return state
  }

  const factories = [...state.factories]
  factories[activeIndex] = updateFactory(factories[activeIndex])

  return { ...state, factories }
}

function createFactoriesStore() {
  const store = writable(loadState())

  if (typeof localStorage !== 'undefined') {
    store.subscribe(persistState)
  }

  return {
    subscribe: store.subscribe,
    selectFactory: (id) => store.update((state) => (
      state.factories.some((factory) => factory.id === id)
        ? { ...state, activeFactoryId: id }
        : state
    )),
    addFactory: (name) => store.update((state) => {
      const factory = createFactory(normalizeFactoryName(name, 'Factory ' + (state.factories.length + 1)))

      return {
        ...state,
        activeFactoryId: factory.id,
        factories: [...state.factories, factory],
      }
    }),
    renameActiveFactory: (name) => {
      const normalizedName = typeof name === 'string' ? name.trim() : ''

      if (!normalizedName) {
        return
      }

      store.update((state) => updateActiveFactory(state, (factory) => ({
        ...factory,
        name: normalizedName,
      })))
    },
    deleteActiveFactory: () => store.update((state) => {
      const activeIndex = state.factories.findIndex((factory) => factory.id === state.activeFactoryId)

      if (activeIndex === -1) {
        return state
      }

      if (state.factories.length === 1) {
        return createInitialState()
      }

      const factories = state.factories.filter((factory) => factory.id !== state.activeFactoryId)
      const nextFactory = factories[Math.min(activeIndex, factories.length - 1)]

      return {
        ...state,
        activeFactoryId: nextFactory.id,
        factories,
      }
    }),
    addLine: () => store.update((state) => updateActiveFactory(state, (factory) => ({
      ...factory,
      lines: [...factory.lines, createLine()],
    }))),
    removeLine: (id) => store.update((state) => updateActiveFactory(state, (factory) => ({
      ...factory,
      lines: factory.lines.filter((line) => line.id !== id),
    }))),
    updateLine: (id, updates) => store.update((state) => updateActiveFactory(state, (factory) => ({
      ...factory,
      lines: factory.lines.map((line) => (
        line.id === id ? createLine({ ...line, ...updates, id: line.id }) : line
      )),
    }))),
    resetActiveFactory: () => store.update((state) => updateActiveFactory(state, (factory) => ({
      ...factory,
      lines: [],
    }))),
  }
}

export const factoriesStore = createFactoriesStore()

export const activeFactory = derived(factoriesStore, (state) => (
  state.factories.find((factory) => factory.id === state.activeFactoryId) ?? state.factories[0]
))

export const productionLines = derived(activeFactory, (factory) => factory?.lines ?? [])
