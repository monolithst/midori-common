import { get, flow } from 'lodash'
import { Config } from './interfaces'

const _checkOrThrow = (config: any, key: string) => {
  if (!get(config, key)) {
    throw new Error(`Must include ${key} in configuration`)
  }
}

const _readConfig = async () => {
  return {}
}

const isValidConfig = (config: Config): config is Config => {
  _getOrThrow(config, 'projectName')
  _getOrThrow(config, 'dataProvider')
  return true
} 

const configure = ({
  configPath,
  configProcessors,
}: ConfigureInput) : Config => {
  const rawConfig = await _readConfig(configPath)
  const config = await (
    configProcessors 
      ? flow(configProcessors)(rawConfig) 
      : rawConfig
  )
  if (isValidConfig(config)) {
    return config
  }
  throw new Error(`Invalid configuration!`)
}

export {
  configure
}
