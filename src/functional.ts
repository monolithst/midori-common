import { MaybePromise } from './interfaces'


type AsyncReduceFunc<T, TResult> = (result: TResult, item: T) => MaybePromise<TResult>

const asyncReduce = <T,TResult>(items: readonly T[], func: AsyncReduceFunc<T, TResult>, defaultValue={} as TResult) => {
  return items.reduce<MaybePromise<TResult>>(async (accP: MaybePromise<TResult>, item: T) => {
    const acc = await accP as TResult
    return func(acc, item)
  }, Promise.resolve(defaultValue as TResult))
}

export {
  asyncReduce
}
