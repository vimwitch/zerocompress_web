import React from 'react'
import ReactDOM from 'react-dom'

import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import Home from './Home'
import './index.css'
import '@appliedzkp/kit/colors.css'
import UIContext from '@appliedzkp/kit/interface'
import TransactionContext from './contexts/transactions'

const RootApp = () => {
  const ui = React.useContext(UIContext)
  const txs = React.useContext(TransactionContext)
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      ui.load()
      txs.load()
    }
  }, [])
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/tx/:id" element={<Home />} />
      </Routes>
    </BrowserRouter>
  )
}

ReactDOM.hydrate(<RootApp />, document.getElementById('root'))
