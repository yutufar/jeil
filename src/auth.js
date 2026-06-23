import Vue from 'vue'

const stored = () => {
  try { return JSON.parse(localStorage.getItem('jeil_user')) } catch { return null }
}

const state = Vue.observable({
  token: localStorage.getItem('jeil_token') || null,
  user:  stored(),
})

export const auth = {
  get token()     { return state.token },
  get user()      { return state.user },
  get isLoggedIn(){ return !!state.token },

  setAuth(token, user) {
    state.token = token
    state.user  = user
    localStorage.setItem('jeil_token', token)
    localStorage.setItem('jeil_user',  JSON.stringify(user))
  },

  clear() {
    state.token = null
    state.user  = null
    localStorage.removeItem('jeil_token')
    localStorage.removeItem('jeil_user')
  },
}
