import { getAssetFromKV } from '@cloudflare/kv-asset-handler'
import html from './html'
import React from 'react'
import ReactDOMServer from 'react-dom/server'
import Home from '../src/Home'
import UIContext, { Interface } from '@appliedzkp/kit/interface'

const OPTIMISM_NODE = 'https://opt-mainnet.g.alchemy.com/v2/wquJNw5twnWCHVfHU3cGyqKKkV50W9tJ'
const GOERLI_NODE = 'https://goerli.infura.io/v3/5b122dbc87ed4260bf9a2031e8a0e2aa'

// Enables edge cdn - https://developers.cloudflare.com/workers/learning/how-the-cache-works/
const DEBUG = false
const ENABLE_ASSET_CACHE = false
const ENABLE_SSR_CACHE = false // TODO: cache bust after deployment

addEventListener('fetch', (event) => {
  event.respondWith(generateResponse(event))
})

async function generateResponse(event) {
  // is it a request for ssr or a static asset?
  const isSSR = ! /.+\.[a-zA-Z]+$/.test(event.request.url)
  if (event.request.url.indexOf('sample_transactions') !== -1) {
    const transactions = await loadTransactions()
    const response = new Response(JSON.stringify(transactions))
    response.headers.set('content-type', 'application/json')
    return response
  } else if (event.request.url.indexOf('load_transaction') !== -1) {
    const match = event.request.url.match(/0x[a-fA-F0-9]{64}/)
    if (match === null) {
      const response = new Response('not found')
      response.headers.set('content-type', 'application/json')
      return response
    }
    const transactions = await loadTransactionById(match[0])
    const response = new Response(JSON.stringify(transactions))
    response.headers.set('content-type', 'application/json')
    return response
  } else if (event.request.url.indexOf('latest_transactions') !== -1) {
    const { optimism, goerli } = await loadBlocks()
    const goerliTransactions = goerli
      .map((block) => {
        return block.transactions.filter((tx) => typeof tx.input === 'string' && tx.input.length > 4)
      })
      .flat()
    const optimismTransactions = optimism
      .map((block) => {
        return block.transactions.filter((tx) => typeof tx.input === 'string' && tx.input.length > 4)
      })
      .flat()
    const response = new Response(JSON.stringify({
      optimism: optimismTransactions,
      goerli: goerliTransactions,
    }))
    response.headers.set('content-type', 'application/json')
    return response
  }
  if (!isSSR && ENABLE_ASSET_CACHE) {
    // take a peek in the cache and return if the url is there
    const response = await caches.default.match(event.request.url)
    if (DEBUG) {
      console.log(`Cache hit: ${event.request.url}`)
    }
    if (response) return response
  }
  return isSSR ? ssr(event) : staticAsset(event)
}

async function ssr(event) {
  try {
    const cookie = event.request.headers.get('Cookie')
    const iface = new Interface()
    if (typeof cookie === 'string' && cookie.indexOf('darkmode=true') !== -1) {
      // render in darkmode
      iface.setDarkmode(true)
    }
    const app = ReactDOMServer.renderToString(
      <UIContext.Provider value={iface}>
        <Home />
      </UIContext.Provider>
    )
    // use npm run
    const finalIndex = html
      .replace('<div id="root"></div>', `<div id="root">${app}</div>`)
    const response = new Response(finalIndex)
    response.headers.set('content-type', 'text/html')
    response.headers.set('Cache-Control', 'max-age=604800,s-maxage=604800,public')
    if (ENABLE_SSR_CACHE) {
      // cache the ssr html itself
      event.waitUntil(
        caches.default.put(event.request.url, new Response(finalIndex))
      )
    }
    return response
  } catch (err) {
    return new Response(err.toString(), {
      status: 500,
    })
  }
}

async function staticAsset(event) {
  // https://www.npmjs.com/package/@cloudflare/kv-asset-handler#optional-arguments
  const asset = await getAssetFromKV(event, {
    bypassCache: !ENABLE_ASSET_CACHE,
  })
  let body = asset.body
  if (ENABLE_ASSET_CACHE) {
    // put the asset in the cache
    // split the response stream, give one to the cache
    if (DEBUG) {
      console.log('Stream split')
    }
    const [b1, b2] = asset.body.tee()
    // cause the script to stay alive until this promise resolves
    event.waitUntil(
      caches.default.put(event.request.url, new Response(b1, asset))
    )
    body = b2
  }
  // build response from body
  const response = new Response(body, asset)
  response.headers.set('Referrer-Policy', 'unsafe-url')
  // tell browsers to cache if it's an svg
  // WARN: if we use anything other than svg we need to change this lol
  if (/.+\.svg$/.test(event.request.url)) {
    response.headers.set('Cache-Control', 'max-age=604800,s-maxage=604800,public')
  }
  return response
}

async function loadTransactionById(hash) {
  const [optimism, goerli]= await Promise.all([
    ethRequest(OPTIMISM_NODE, 'eth_getTransactionByHash', hash).catch(() => '{}'),
    ethRequest(GOERLI_NODE, 'eth_getTransactionByHash', hash).catch(() => '{}'),
  ])
  return { optimism, goerli }
}

async function loadTransactions() {
  let blockNumber = +(await ethRequest(OPTIMISM_NODE, 'eth_blockNumber'))
  let transaction
  while (!transaction) {
    const block = await ethRequest(
      OPTIMISM_NODE,
      'eth_getBlockByNumber',
      [`0x${(blockNumber--).toString(16)}`, true],
      {
        cacheTtl: 60*60,
      }
    )
    transaction = block.transactions.find((tx) => tx.input && tx.input.length > 74)
  }
  return transaction
}

async function loadBlocks() {
  const optimismBlockNum = +(await ethRequest(OPTIMISM_NODE, 'eth_blockNumber'))
  const goerliBlockNum = +(await ethRequest(GOERLI_NODE, 'eth_blockNumber'))
  const optimismBlocks = []
  const goerliBlocks = []
  for (let x = 0; x < 5; x++) {
    optimismBlocks.push(
      ethRequest(
        OPTIMISM_NODE,
        'eth_getBlockByNumber',
        [`0x${(optimismBlockNum-x).toString(16)}`, true],
        {
          cacheTtl: 60*60
        }
      )
    )
    goerliBlocks.push(
      ethRequest(
        GOERLI_NODE,
        'eth_getBlockByNumber',
        [`0x${(goerliBlockNum-x).toString(16)}`, true],
        {
          cacheTtl: 60*60
        }
      )
    )
  }
  return {
    optimism: (await Promise.all(optimismBlocks)),
    goerli: (await Promise.all(goerliBlocks)),
  }
}

async function ethRequest(node, method, params = [], cf = {}) {
  const id = Math.floor(Math.random() * 10000000000)
  const res = await fetch(node, {
    method: 'post',
    body: JSON.stringify({
      jsonrpc: '2.0',
      id,
      params: [params].flat(),
      method,
    }),
    cf: {
      cacheTtl: 3,
      cacheEverything: true,
      ...cf,
    }
  })
  const data = await res.json()
  return data.result
}
