

const app = async ({
  configurationPath='',
  postContext
}) => {
  const config = await configure(configurationPath)
  const context = await loadContext(config)

}

export default app
