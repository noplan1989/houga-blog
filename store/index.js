import Vuex from 'vuex'
import * as api from '@/api'
import { uniq } from '@/lib/helpers'
import { POSTS_PER_PAGE } from '@/config/constant'

const createStore = () =>
  new Vuex.Store({
    state: {
      entities: {
        post: {},
        tag: {}
      },
      index: {
        post: {
          total: null,
          page: null,
          lastPage: null,
          ids: [],
          isFetching: false
        },
        tag: {
          total: null,
          page: null,
          lastPage: null,
          ids: [],
          isFetching: false
        }
      },
      postId: null,
      tagIds: [],
      tagId: null,
      error: null
    },
    getters: {
      posts(state) {
        return state.index.post.ids.map(id => state.entities.post[id])
      },
      post(state) {
        return state.postId ? state.entities.post[state.postId] : null
      },
      tagPosts(state) {
        return state.index.tag.ids.map(id => state.entities.post[id])
      },
      tags(state) {
        return state.tagIds.map(id => state.entities.tag[id])
      },
      tag(state) {
        return state.tagId ? state.entities.tag[state.tagId] : null
      }
    },
    actions: {
      async nuxtServerInit({ commit }) {
        try {
          const { items } = await api.fetchTags()

          commit('mergeTagEntities', { items })
          commit('setTagIds', { items })
        } catch (e) {
          commit('setNetwordError')
        }
      },
      async fetchPosts({ state, commit }, { page }) {
        if (state.index.post.isFetching) {
          return
        }

        commit('setIsFetching', { pageType: 'post' })

        try {
          const { total, items } = await api.fetchPosts(page)

          commit('clearIsFetching', { pageType: 'post' })
          commit('mergePostEntities', { items })
          commit('appendPostIds', { pageType: 'post', items })
          commit('setPage', { pageType: 'post', page })

          if (page === 1) {
            commit('setTotal', { pageType: 'post', total })
            commit('setLastPage', { pageType: 'post', total })
          }
        } catch (e) {
          commit('setNetwordError')
        }
      },
      async fetchPostsByTagId({ state, commit }, { id, page }) {
        if (state.index.tag.isFetching) {
          return
        }

        commit('setIsFetching', { pageType: 'tag' })

        try {
          const { total, items } = await api.fetchPostsByTagId(id, page)

          commit('clearIsFetching', { pageType: 'tag' })
          commit('mergePostEntities', { items })
          commit('appendPostIds', { pageType: 'tag', items })
          commit('setPage', { pageType: 'tag', page })

          if (page === 1) {
            commit('setTotal', { pageType: 'tag', total })
            commit('setLastPage', { pageType: 'tag', total })
          }
        } catch (e) {
          commit('setNetwordError')
        }
      },
      async fetchPost({ commit }, { id }) {
        try {
          const item = await api.fetchPost(id)

          commit('mergePostEntities', { items: [item] })
          commit('setPostId', { id: item.sys.id })
        } catch (e) {
          commit('setNetwordError')
        }
      }
    },
    mutations: {
      mergePostEntities(state, { items }) {
        state.entities.post = {
          ...state.entities.post,
          ...items.reduce((obj, item) => ({ ...obj, [item.sys.id]: item }), {})
        }
      },
      mergeTagEntities(state, { items }) {
        state.entities.tag = {
          ...state.entities.tag,
          ...items.reduce((obj, item) => ({ ...obj, [item.sys.id]: item }), {})
        }
      },
      appendPostIds(state, { pageType, items }) {
        state.index[pageType].ids = uniq([...state.index[pageType].ids, ...items.map(item => item.sys.id)])
      },
      clearPostIds(state, { pageType }) {
        state.index[pageType].ids = []
      },
      setTotal(state, { pageType, total }) {
        state.index[pageType].total = total
      },
      setPage(state, { pageType, page }) {
        state.index[pageType].page = page
      },
      setLastPage(state, { pageType, total }) {
        state.index[pageType].lastPage = Math.ceil(total / POSTS_PER_PAGE)
      },
      setIsFetching(state, { pageType }) {
        state.index[pageType].isFetching = true
      },
      clearIsFetching(state, { pageType }) {
        state.index[pageType].isFetching = false
      },
      setPostId(state, { id }) {
        state.postId = id
      },
      clearPostId(state) {
        state.postId = null
      },
      setTagIds(state, { items }) {
        state.tagIds = [...state.tagIds, ...items.map(item => item.sys.id)]
      },
      setTagId(state, { id }) {
        state.tagId = id
      },
      setNetwordError(state) {
        state.error = '通信の調子が悪いようで・・・'
      }
    }
  })

export default createStore
