import service from 'utils/http'
import { AsyncThunk, createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { PostState, Post } from 'pages/types/blog.type'

type GenericAsyncThunk = AsyncThunk<unknown, unknown, any>
type PendingAction = ReturnType<GenericAsyncThunk['pending']>
type RejectedAction = ReturnType<GenericAsyncThunk['rejected']>
type FulfilledAction = ReturnType<GenericAsyncThunk['fulfilled']>

const initialState: PostState = {
  postList: [],
  editingPost: null,
  loading: false,
  currentRequestId: undefined
}
const blogReducer = createSlice({
  name: 'blogs',
  initialState,
  reducers: {
    editPost: (state, action: PayloadAction<string>) => {
      const getPostByID = state.postList.find((post) => post.id === action.payload) || null
      state.editingPost = getPostByID
    },
    deletePost: (state, action: PayloadAction<string>) => {
      const postID = state.postList.findIndex((post) => post.id === action.payload)
      if (postID !== -1) {
        state.postList.splice(postID, 1)
      }
    },
    cancelEditPost: (state) => {
      state.editingPost = null
    }
  },
  extraReducers(builder) {
    builder
      .addCase(getPostList.fulfilled, (state, action) => {
        state.postList = action.payload
      })
      .addCase(addPost.fulfilled, (state, action) => {
        state.postList.push(action.payload)
      })
      .addCase(updatePost.fulfilled, (state, action) => {
        state.postList.find((post, index) => {
          if (post.id === action.payload.id) {
            state.postList[index] = action.payload
            return true
          }
          return false
        })
        state.editingPost = null
      })
      .addCase(deletePost.fulfilled, (state, action) => {
        const postID = state.postList.findIndex((post) => post.id === action.payload)
        if (postID !== -1) {
          state.postList.splice(postID, 1)
        }
      })
      .addMatcher<PendingAction>(
        (action) => action.type.endsWith('/pending'),
        (state, action) => {
          state.loading = true
          state.currentRequestId = action.meta.requestId
        }
      )
      .addMatcher<RejectedAction>(
        (action) => action.type.endsWith('/rejected'),
        (state, action) => {
          console.log(action.meta.requestId)
          if (state.loading && state.currentRequestId === action.meta.requestId) {
            state.loading = false
            state.currentRequestId = undefined
          }
        }
      )
      .addMatcher<FulfilledAction>(
        (action) => action.type.endsWith('/fulfilled'),
        (state, action) => {
          console.log(action.meta.requestId)
          if (state.loading && state.currentRequestId === action.meta.requestId) {
            state.loading = false
            state.currentRequestId = undefined
          }
        }
      )
  }
})

export const getPostList = createAsyncThunk('blogs/getPostList', async (_, thunkAPI) => {
  const response = await service.getAPI<Post[]>('posts', {
    signal: thunkAPI.signal
  })
  return response
})

export const addPost = createAsyncThunk('blogs/addPost', async (body: Omit<Post, 'id'>, thunkAPI) => {
  const response = await service.postAPI<Post>('posts', body, {
    signal: thunkAPI.signal
  })
  return response
})
export const updatePost = createAsyncThunk('blogs/updatePost', async (body: Post, thunkAPI) => {
  const response = await service.putAPI<Post>(`posts/${body.id}`, body, {
    signal: thunkAPI.signal
  })
  return response
})
export const deletePost = createAsyncThunk('blogs/deletePost', async (id: string, thunkAPI) => {
  await service.deleteAPI(`posts/${id}`, {
    signal: thunkAPI.signal
  })
  return id
})
export default blogReducer
