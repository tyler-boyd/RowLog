import { Reducer } from "react"
import { combineReducers } from "redux"
import { WorkoutLog } from "./AppState"

type PayloadAction<T> = {
  type: string
  payload: T
}

type ActionCreator<T> = (payload: T) => PayloadAction<T>

interface GenericSlice<S, B extends string> {
  types: Record<string, string>
  actions: Record<B, ActionCreator<S | null>>
  reducer: Reducer<S | null | undefined, PayloadAction<S | null>>
}

type GenericSliceTypes = 'set'
function createGenericSlice<T>(prefix: string, children: Record<string, any> = {} as any): GenericSlice<T, GenericSliceTypes> {
  const types = {
    set: `SET_${prefix}`
  }
  const actions = {
    set: (payload: T | null) => ({type: types.set, payload}),
  }
  return {
    types,
    actions,
    reducer(state: T | null = null, action: PayloadAction<T | null>): T | null {
      if (action.type === types.set) {
        return action.payload
      }
      if (state === null) {
        return null
      }
      let hasChanged = false
      const newState: Partial<T> = {}
      Object.entries<any>(children).forEach(([key, reduc]) => {
        const prevState = state[key]
        const nextState = reduc(prevState, action)
        if (prevState !== nextState) {
          hasChanged = true
          newState[key] = nextState
        }
      });

      return hasChanged ? ({...state, ...newState}) as T : state as T
    }
  }
}

// interface GenericListSlice<T> {
//   types: {
//     set: string
//     add: string
//     update: string
//     remove: string
//   }
//   actions: {
//     set: ActionCreator<T[]>
//     add: ActionCreator<T>
//     update: ActionCreator<T>
//     remove: ActionCreator<T>
//   }
//   reducer: Reducer<T[], PayloadAction<any>>
// }
// function createGenericListSlice<T>(prefix: string, equal: (a: T, b: T) => boolean = (a: any, b: any) => a.id === b.id): GenericListSlice<T> {
//   const types = {
//     add: `ADD_${prefix}`,
//     update: `UPDATE_${prefix}`,
//     remove: `REMOVE_${prefix}`,
//     set: `SET_${prefix}S`,
//   }
//   const actions = {
//     add: (payload: T) => ({type: types.add, payload}),
//     update: (payload: T) => ({type: types.update, payload}),
//     remove: (payload: T) => ({type: types.remove, payload}),
//     set: (payload: T[]) => ({type: types.set, payload}),
//   }
//   return {
//     types,
//     actions,
//     reducer(state: T[] = [], action: PayloadAction<T>): T[] {
//       switch(action.type) {
//         case types.set:
//           return action.payload as unknown as T[]
//         case types.add:
//           return [...state.filter(old => !equal(old, action.payload)), action.payload]
//         case types.update:
//           return state.map(old => {
//             if (equal(old, action.payload)) return action.payload
//             return old
//           })
//         case types.remove:
//           return state.filter(old => !equal(old, action.payload))
//         default:
//           return state
//       }
//     }
//   }
// }

export const WorkoutLogSlice = createGenericSlice<WorkoutLog>('WORKOUT_LOG')

const rootReducer = combineReducers({
  workoutLog: WorkoutLogSlice.reducer,
})
export type RootState = ReturnType<typeof rootReducer>
export default rootReducer
