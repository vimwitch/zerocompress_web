const BN = require('bn.js')

const reverse = (str) => str.split('').reverse().join('')

export function parse(data, padding) {
  let rawData = data.replace('0x', '').toLowerCase()
  const parts = []
  parts.push({
    data: '0x',
    style: { background: 'transparent' },
  })
  parts.push({
    info: 'Function identifier',
    data: rawData.slice(0, 8),
    style: { background: 'hotpink' },
  })
  const configByte = rawData.slice(8, 10)
  const bits = reverse(new BN(configByte, 16).toString(2, 8))
  // convert from big endian to little then make a number
  const dataByteLength = +new BN(reverse(bits.slice(1, 3)), 2).toString()
  const finalByteLength = +new BN(reverse(bits.slice(3, 5)), 2).toString()
  let dataLength = +new BN(reverse(bits.slice(5)), 2).toString()

  parts.push({
    info: 'Config byte',
    data: rawData.slice(8, 10),
    style: { background: 'plum' },
  })

  if (dataByteLength) {
    parts.push({
      info: 'Data section length',
      data: rawData.slice(10, 10 + dataByteLength * 2),
      style: { background: 'pink' }
    })
    dataLength = +new BN(rawData.slice(10, 10+dataByteLength*2), 16).toString()
  }

  parts.push({
    info: 'Final data length',
    data: rawData.slice(10 + dataByteLength*2, 10 + dataByteLength*2 + finalByteLength*2),
    style: { background: 'lightgreen' }
  })
  const start = 10 + dataByteLength*2 + finalByteLength*2
  parts.push({
    info: 'Compressed bit data',
    data: rawData.slice(start, start+dataLength * 2),
    style: { background: 'red' }
  })

  const uniqueStart = start + dataLength*2
  const hasTrailingByte = rawData.slice(-2) !== '00'

  for (let x = uniqueStart; x < rawData.length - (padding*2+(hasTrailingByte ? 2 : 0)); x+=2) {
    const byteNum = x/2
    const byte = rawData.slice(x, x+2)
    if (byte == '00') {
      // it's an opcode
      const opcode = new BN(rawData.slice(x+2, x+4), 16).toNumber()
      if (opcode === 0) {
        const zeroCount = new BN(rawData.slice(-2), 16).toNumber()
        parts.push({
          info: `Insert ${zeroCount} zero bytes`,
          data: rawData.slice(x, x+4),
          style: { background: 'gold', }
        })
        x += 2
        continue
      } else if (opcode >= 1 && opcode <= 224) {
        parts.push({
          info: `Insert ${opcode} zero bytes`,
          data: rawData.slice(x, x+4),
          style: { background: 'cyan', }
        })
        x += 2
        continue
      } else if (opcode >= 225 && opcode <= 241) {
        parts.push({
          info: `Insert ${opcode - 225} 0xFF bytes`,
          data: rawData.slice(x, x+4),
          style: { background: 'coral', }
        })
        x += 2
        continue
      } else if (opcode >= 242 && opcode <= 246) {
        const length = 1 + (opcode - 242)
        const id = new BN(rawData.slice(x+4, x+4+length*2), 16).toNumber()
        parts.push({
          info: `Address replacement ${id}`,
          data: rawData.slice(x, x+4+length*2),
          style: { background: 'chartreuse', }
        })
        x += 2 + length*2
        continue
      }

    } else {
      parts.push({
        info: 'A raw byte to insert',
        data: rawData.slice(x, x + 2),
        style: { background: 'magenta'}
      })
    }
  }
  if (hasTrailingByte) {
    parts.push({
      info: 'Padding',
      data: rawData.slice(-1*padding*2-2, -2),
      style: { background: 'lightblue'}
    })
  } else {
    parts.push({
      info: 'Padding',
      data: rawData.slice(-1*padding*2),
      style: { background: 'lightblue'}
    })
  }
  if (hasTrailingByte) {
    parts.push({
      info: 'Zero insertion amount',
      data: rawData.slice(-2),
      style: { background: 'gold'}
    })
  }

  // now iterate over the uniques array

  return parts

}
