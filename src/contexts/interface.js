import { createContext } from 'react'
import { makeAutoObservable } from 'mobx'

class Interface {
  // dark/light mode
  // interface viewport size
  darkmode = false
  modeCssClass = ''

  constructor() {
    makeAutoObservable(this)
  }

  loadSavedValue() {
    this.setDarkmode(!!localStorage.getItem('darkmode'))
  }

  setDarkmode(enabled) {
    this.darkmode = enabled
    if (enabled) {
      localStorage.setItem('darkmode', 'true')
      this.modeCssClass = 'dark'
    } else {
      localStorage.removeItem('darkmode')
      this.modeCssClass = ''
    }
  }

}

export default createContext(new Interface())
