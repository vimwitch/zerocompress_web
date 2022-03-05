import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import './home.css'

import Button from '@appliedzkp/kit/Button'
import Tooltip from '@appliedzkp/kit/Tooltip'
import Checkbox from '@appliedzkp/kit/Checkbox'
import Textarea from './components/Textarea'
import { observer } from 'mobx-react-lite'
import UIContext from '@appliedzkp/kit/interface'
import { compress, gasCost } from 'zerocompress'
import { parse } from './utils/parse-compressed'

const Spacer = () => <div style={{ width: '8px', height: '8px' }} />

const baseTxCost = 4414
const uniswapTx = '0x128acb08000000000000000000000000eb465b6c56758a1ccff6fa56aaee190646a597a0000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000005b3695d314000000000000000000000000000000000000000000000000000000000001341c9100000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000'

async function loadTransactionById(id) {
  const res = await fetch(`/load_transaction/${id}`)
  return res.json()
}

async function loadTransaction() {
  const res = await fetch('/sample_transactions')
  return res.json()
}

export default observer(() => {
  const { id } = useParams()
  useEffect(() => {
    ;(async () => {
      if (!id) return
      const { goerli, optimism } = await loadTransactionById(id)
      if (!goerli && !optimism) return
      if (goerli) {
        setInput({
          data: goerli.input,
          url: `https://goerli.etherscan.io/tx/${id}`,
        })
      } else if (optimism) {
        setInput({
          data: optimism.input,
          url: `https://optimistic.etherscan.io/tx/${id}`,
        })
      }
    })()
  }, [])
  const ui = React.useContext(UIContext)
  const [input, setInput] = useState({ data: '' })
  const [output, setOutput] = useState('0x')
  const [outputPadding, setOutputPadding] = useState(0)
  const [inputGas, setInputGas] = useState(0)
  const [outputGas, setOutputGas] = useState(0)
  const [showingVisual, setShowingVisual] = useState(false)
  useEffect(() => {
    const { data, url } = input
    if (data.length % 2 !== 0) return
    if (data.length === 0) {
      setInputGas(0)
      setOutputGas(0)
      setOutput('0x')
      setOutputPadding(0)
      return
    }
    setInputGas(gasCost(input.data))
    try {
      const [func, _data, padding] = compress(data, {
        addressSubs: {
          '*': Math.floor(Math.random() * 2**24),
        }
      })
      if (Array.isArray(_data)) {
        setOutput(`0x0ab241a0${_data.join('').replace(/0x/g, '')}`)
        setOutputPadding(padding)
        parse(`0x0ab241a0${_data.join('').replace(/0x/g, '')}`)
      } else {
        setOutput(_data)
        setOutputPadding(0)
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
        <div
          className="header5"
          style={{ cursor: 'pointer', userSelect: 'none' }}
          onClick={() => window.open('https://github.com/vimwitch/zerocompress#zerocompress-')}
        >
          zerocompress
        </div>
      </div>
      <Spacer />
      <div className="section-container" style={{ alignSelf: 'center',}}>
        <div style={{ display: 'flex' }}>
          <Button size="xsmall" onClick={async () => {
            const tx = await loadTransaction()
            setInput({
              data: tx.input,
              url: `https://optimistic.etherscan.io/tx/${tx.hash}`,
            })
            return 'Compressed!'
          }}>
            Recent TX
          </Button>
          <Spacer />
          <Button size="xsmall" onClick={() => setInput({ data: uniswapTx })}>
            Uniswap Swap
          </Button>
          <div style={{ flex: 1 }} />
          <Spacer />
          <Button size="xsmall" onClick={() => ui.setDarkmode(!ui.darkmode)}>
            {ui.darkmode ? 'Light' : 'Dark'}
          </Button>
        </div>
        <Spacer />
        <Textarea
          onChange={(e) => setInput({ data: e.target.value })}
          style={{ width: '100%' }}
          rows="16"
          value={input.data}
          placeholder="Enter some tx data or click a button above"
        />
        <Spacer />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            Gas cost original: {inputGas}
          </div>
          {input.url && (
            <Button size="xsmall" onClick={() => {
              window.open(input.url, '_blank')
            }}>
              View Transaction
            </Button>
          )}
        </div>
        <Spacer />
        {showingVisual &&
          <div className={`txdata ${ui.modeCssClass}`}>
            {parse(output, outputPadding).map((part, index) => (
              <span title={part.info} key={part.data+index}>
                <mark className="highlight" style={{ ...part.style, borderRadius: '4px', margin: '0px 1px' }}>
                  {part.data}
                </mark>
              </span>
            ))}
          </div>
        }
        {!showingVisual && (
          <div className={`txdata ${ui.modeCssClass}`}>
            {output}
          </div>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <Spacer />
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Checkbox onChange={setShowingVisual} />
              <Spacer />
              <span>Show visualizer</span>
            </div>
            <Spacer />
            <div>
              Gas cost compressed: {outputGas}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <Spacer />
            <div className="info-container">
              <div>Reduction: {inputGas === 0 ? 0 : Math.floor(100*(inputGas-outputGas)/inputGas)}%</div>
              <Spacer />
              <Tooltip text="Calldata gas savings" />
            </div>
            <Spacer />
            <div className="info-container">
              <div>Estimated tx cost reduction: {Math.floor(100*((inputGas+baseTxCost)-(outputGas+baseTxCost))/(inputGas+baseTxCost))}%</div>
              <Spacer />
              <Tooltip text="Transactions include more data such as signature and nonce. This estimate takes the calldata as a fraction of the total data." />
            </div>
          </div>
        </div>
      </div>
      <div style={{ flex: 1, minHeight: '20px' }} />
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        margin: '4px'
      }} onClick={() => window.open('https://medium.com/privacy-scaling-explorations')}>
        <Spacer />
        <img src={require('../assets/eth.svg')} height="24" width="auto" />
        <Spacer />
      </div>
    </div>
  )
})
