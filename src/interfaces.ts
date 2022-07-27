import { FunctionalModel } from 'functional-models/interfaces'
import { OrmModelFactory, OrmModel } from 'functional-models-orm/interfaces'

type MaybePromise<T> = Promise<T>|T
type App = {
  name: string,
  namespace: string,
  models: {
   readonly [name: string]: OrmModel<any>
  },
}

type Context = {
  readonly [anything: string]: any,
  config: Config,
  getOrmModelFactory: OrmModelFactoryGetter,
  customAppLoaders: {
    readonly [appPath: string]: AppLoader,
  },
  apps: {
    [namespace: string]: App,
  },
  getModels: () => readonly OrmModel<any>[],
  getModel: <
    T extends FunctionalModel,
    TModel extends OrmModel<T>=OrmModel<T>
  >(modelType: string, modelNamespace?: string) => TModel|undefined
}

type ContextBuilder = (context: Context) => MaybePromise<Context>

type AppLoaderResponse = {
  app: App,
  context: Context,
}

type AppLoader = (context: Context) => MaybePromise<AppLoaderResponse>

type OrmModelFactoryGetter = (context: Context) => MaybePromise<OrmModelFactory>

type LoadAppsInput = {
  config: Config,
  customContext?: any,
  ormModelFactoryGetter: OrmModelFactoryGetter,
  customAppLoaders?: {
    readonly [appPath: string]: AppLoader
  }
}

type Config = {
  projectName: string,
  appList: readonly string[],
}

export {
  MaybePromise,
  App,
  Context,
  ContextBuilder,
  AppLoaderResponse,
  AppLoader,
  LoadAppsInput,
  OrmModelFactoryGetter,
}

