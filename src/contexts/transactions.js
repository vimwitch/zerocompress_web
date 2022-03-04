import { createContext } from 'react'
import { makeAutoObservable } from 'mobx'
import { compress, gasCost } from 'zerocompress'

// store the latest few blocks
export class Transactions {

  // Arrays of
  // { hash, input, ?compressed } all are strings
  latestProcessed = null
  txs = []
  actualGas = 0
  compressedGas = 0
  visibleTxs = []

  constructor() {
    makeAutoObservable(this)
  }

  load() {
    this.loadTransactions()
    setInterval(() => {
      this.loadTransactions()
    }, 5000)
    setInterval(() => {
      this.processTransaction()
    }, 1000)
  }

  async loadTransactions() {
    const res = await fetch(`/latest_transactions`)
    const { goerli, optimism } = await res.json()
    const txHashes = {}
    this.txs = [
      ...this.txs.slice(0, 100),
      ...optimism.map(tx => ({...tx, network: 'Optimism Mainnet'})),
      // ...goerli.map(tx => ({ ...tx, network: 'Goerli' }))
    ]
    .filter((tx) => {
      if (txHashes[tx.hash]) return false
      txHashes[tx.hash] = true
      return true
    })
    .sort((a, b) => {
      const blockSort = +(b.l1BlockNumber ?? b.blockNumber) - +(a.l1BlockNumber ?? a.blockNumber)
      if (blockSort !== 0) return blockSort
      return a.hash > b.hash ? 1 : -1
    })
    console.log(this.txs)
  }

  processTransaction() {
    if (this.txs.length === 0) return
    let index = this.txs.findIndex(tx => tx.hash === this.latestProcessed)
    if (index === -1) {
      index = this.txs.length - 1
    } else if (index === 0) {
      return
    } else {
      index--
    }
    console.log(index, this.txs.length)
    // compress this block
    const [func, data, padding] = compress(this.txs[index].input, {
      addressSubs: {
        '*': Math.floor(Math.random() * 2**24),
      }
    })
    this.latestProcessed = this.txs[index].hash
    const compressed = Array.isArray(data) ?
      `0x0ab241a0${data.join('').replace(/0x/g, '')}` :
      data
    this.txs[index] = {
      ...this.txs[index],
      processed: true,
      originalGas: gasCost(this.txs[index].input),
      compressedGas: gasCost(compressed),
      compressed,
    }
    this.actualGas += gasCost(this.txs[index].input)
    this.compressedGas += Math.min(this.txs[index].compressedGas, this.txs[index].originalGas)
    this.visibleTxs = this.txs
      .filter(tx => tx.processed)
      .slice(0, 5)
      console.log(this.visibleTxs)
  }

}

export default createContext(new Transactions())
