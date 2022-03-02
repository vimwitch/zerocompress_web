import React from 'react'
import './textarea.css'
import UIContext from '@appliedzkp/kit/interface'
import { observer } from 'mobx-react-lite'

export default observer(({ ...props }) => {
  const ui = React.useContext(UIContext)
  return (
    <textarea
      className={`_textarea ${ui.modeCssClass}`}
      {...props}
    />
  )
})
