import React, { useEffect, useState } from 'react'
import './home.css'

import Button from './components/Button'
import Tooltip from './components/Tooltip'
import Textarea from './components/Textarea'
import { observer } from 'mobx-react-lite'
import UIContext from './contexts/interface'
import { compressSingle, gasCost } from 'zerocompress'

const Spacer = () => <div style={{ width: '8px', height: '8px' }} />

const baseTxCost = 4414
const uniswapTx = '0x128acb08000000000000000000000000eb465b6c56758a1ccff6fa56aaee190646a597a0000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000005b3695d314000000000000000000000000000000000000000000000000000000000001341c9100000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000'

async function loadTransaction() {
  const res = await fetch('/sample_transactions')
  return res.json()
}

export default observer(() => {
  const ui = React.useContext(UIContext)
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [inputGas, setInputGas] = useState(0)
  const [outputGas, setOutputGas] = useState(0)
  const [txUrl, setTxUrl] = useState('')
  useEffect(() => {
    if (input.length % 2 !== 0) return
    if (input.length === 0) {
      setInputGas(0)
      setOutputGas(0)
      setOutput('0x')
      return
    }
    setTxUrl(``)
    setInputGas(gasCost(input))
    try {
      const [func, data] = compressSingle(input, {
        addressSubs: {
          '*': Math.floor(Math.random() * 100000),
        }
      })
      if (Array.isArray(data)) {
        setOutput(`0x0ab241a0${data.join('').replace(/0x/g, '')}`)
      } else {
        setOutput(data)
      }
    } catch (e) {
      // do nothing
      console.log(e)
    }
  }, [input])
  useEffect(() => {
    if (output.length % 2 !== 0) return
    setOutputGas(gasCost(output))
  }, [output])
  return (
    <div className={`container ${ui.modeCssClass}`}>
      <div className={`header ${ui.modeCssClass}`}>
        <div className="header5">
          zerocompress
        </div>
      </div>
      <Spacer />
      <div style={{ alignSelf: 'center' }}>
        <div style={{ display: 'flex' }}>
          <Button size="xsmall" onClick={async () => {
            const tx = await loadTransaction()
            setInput(tx.input)
            setTxUrl(`https://optimistic.etherscan.io/tx/${tx.hash}`)
          }}>
            Recent TX
          </Button>
          <Spacer />
          <Button size="xsmall" onClick={() => setInput('0x'+Array(8+64*4).fill('0').join(''))}>
            Lots of Zeroes
          </Button>
          <Spacer />
          <Button size="xsmall" onClick={() => setInput(uniswapTx)}>
            Uniswap Swap
          </Button>
          <div style={{ flex: 1 }} />
          <Button size="xsmall" onClick={() => ui.setDarkmode(!ui.darkmode)}>
            {ui.darkmode ? 'Light' : 'Dark'}
          </Button>
        </div>
        <Spacer />
        <Textarea
          onChange={(e) => setInput(e.target.value)}
          style={{ width: '50vw' }}
          rows="16"
          value={input}
          placeholder="Enter some tx data or click a button above"
        />
        <Spacer />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            Gas cost original: {inputGas}
          </div>
          {txUrl && (
            <Button size="xsmall" onClick={() => {
              window.open(txUrl, '_blank')
            }}>
              View Transaction
            </Button>
          )}
        </div>
        <Spacer />
        <div className={`txdata ${ui.modeCssClass}`} style={{ maxWidth: '50vw', wordBreak: 'break-word' }}>
          {output}
        </div>
        <Spacer />
        <div>
          Gas cost compressed: {outputGas}
        </div>
        <Spacer />
        <div>
          Reduction: {inputGas === 0 ? 0 : Math.floor(100*(inputGas-outputGas)/inputGas)}%
        </div>
        <Spacer />
        <div>
          Estimated tx cost reduction: {Math.floor(100*((inputGas+baseTxCost)-(outputGas+baseTxCost))/(inputGas+baseTxCost))}%
        </div>
      </div>
    </div>
  )
})
