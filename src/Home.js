import React from 'react'
import './home.css'

import Button from './components/Button'
import ExampleSection from './components/ExampleSection'
import Tooltip from './components/Tooltip'
import { observer } from 'mobx-react-lite'
import UIContext from './contexts/interface'

const Spacer = () => <div style={{ width: '8px', height: '8px' }} />

export default observer(() => {
  const ui = React.useContext(UIContext)
  return (
    <div className={`container ${ui.modeCssClass}`}>
      <div className={`header ${ui.modeCssClass}`}>
        <div className="header5">
          Zerocompress
        </div>
      </div>
      <div style={{display: 'flex', justifyContent: 'center', margin: '8px'}}>
        <div className={`section-box ${ui.modeCssClass}`}>
          <div>An interactive demo.</div>
          <div style={{ width: '8px' }} />
          <Button size="xsmall" onClick={() => ui.setDarkmode(!ui.darkmode)}>
            {ui.darkmode ? 'Light' : 'Dark'}
          </Button>
        </div>
      </div>
    </div>
  )
})
