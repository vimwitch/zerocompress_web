const fs = require('fs').promises
const path = require('path')

;(async () => {
  const styleData = await fs.readFile(path.join(__dirname, '../build/styles.css'))
  const indexTemplate = (await fs.readFile(path.join(__dirname, '../build/index.html'))).toString()
  const finalIndex = indexTemplate.replace(
    '</head>',
    `
<style>
  ${styleData.toString().replace('\\', '\\\\')}
</style>
</head>
    `
  )
  await fs.writeFile(path.join(__dirname, '../worker/html.js'), `export default \`${finalIndex}\``)
})()
