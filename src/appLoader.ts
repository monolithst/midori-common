import { flow, get, flatten, merge } from 'lodash'
import { FunctionalModel } from 'functional-models/interfaces'
import { OrmModel } from 'functional-models-orm/interfaces'
import { orm } from 'functional-models-orm'
import { asyncReduce } from './functional'
import { 
  MaybePromise,
  App,
  Context,
  ContextBuilder,
  AppLoaderResponse,
  AppLoader,
  LoadAppsInput,
} from './interfaces'

const _contextBuilderWrapper = (contextBuilder: ContextBuilder) : ContextBuilder => async (context: Context) => {
  const result = await contextBuilder(context)
  if (!result) {
    return context
  }
  const merged : Context = merge(context, result)
  return merged
}

const _createModelGetter = (context: Context) => {
  const modelsByNamespace : {[s: string]: OrmModel<any>} = Object.entries(context.apps).reduce((acc: any, [appNamespace, app]:[string, App]) => {
    const modelsToNamespace = Object.entries(app.models).reduce((acc2: any, [name, model]: [string, OrmModel<any>]) => {
      const modelNamespace = `${appNamespace}.${name}`
      return merge(acc2, {[modelNamespace]: model})
    }, {})
    return merge(acc, modelsToNamespace)
  }, {})
  const modelsByName : {[s: string]: OrmModel<any>}= Object.values(modelsByNamespace).reduce((acc: any, model: OrmModel<any>) => {
    return merge(acc, {[model.getName()]: model})
  }, {})

  return (context: Context) => <
    T extends FunctionalModel,
    TModel extends OrmModel<T>=OrmModel<T>
  >(modelName: string, modelNamespace: string|undefined) => {
    if (modelNamespace) {
      return modelsByNamespace[modelNamespace]
    }

    return modelsByName[modelName]
  }
}

const _createModelsGetter = (context: Context) => {
  const allModels = Object.values(context.apps).map((app: App) => Object.values(app.models))
  return flatten(allModels) as readonly OrmModel<any>[]
}

const _mergeAppIntoContext = (context: Context, app: App): Context => {
  const withApps = merge(context, {
    apps: {
      [app.namespace]: app,
    },
  })
  const withGetModels = merge(withApps, {
    getModels: _createModelsGetter(context),
  })
  const finished : Context = merge(withApps, {
    getModel: _createModelGetter(withGetModels),
  })
  return finished
}

const _getAppLoader = (context: Context, appPath: string): AppLoader => {
  return get(context, `customAppLoaders.${appPath}`, _loadApp(appPath)) as AppLoader
}

const _loadApp = (appPath: string) : AppLoader => async (context: Context) => {
  const app = await import(appPath)
  return {
    app,
    context,
  }
}


const _loadApps = _contextBuilderWrapper(async (context: Context) => {
  return asyncReduce<string, Context>(context.config.appList, async (previousContext: Context, appNamespace: string) => {
    const appLoader = _getAppLoader(previousContext, appNamespace)
    const { context: newContext, app } = await appLoader(previousContext)
    return _mergeAppIntoContext(newContext, app)
  }, context)
})

const _getOrmModelFactory = (context: Context) => {
  const datastoreProvider = context.datastoreProvider
  return orm({
    datastoreProvider,
  }).BaseModel
}

const loadApp = (inputs: LoadAppsInput) => {
  const context : Context = {
    customAppLoaders: (inputs.customAppLoaders ? inputs.customAppLoaders : {}),
    getOrmModelFactory: inputs.ormModelFactoryGetter ? inputs.ormModelFactoryGetter : _getOrmModelFactory,
    apps: {},
    getModels: () => [],
    getModel: () => undefined,
    ...(inputs.customContext ? inputs.customContext : {}),
  }
  return _loadApps(context)
}

export {
  loadApp,
}
