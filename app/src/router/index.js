import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../views/Home.vue'
import Documentation from '../views/Documentation.vue'
import UserModels from '../views/UserModels.vue'
import Models from '../views/Models.vue'
import Collections from '../views/Collections.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    props: true
  },
  {
    path: '/sobre',
    name: 'About',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "about" */ '../views/About.vue')
  },
  {
    path: '/meusmodelos',
    name: 'UserModels',
    component: UserModels
  },
  {
    path: '/documentacao',
    name: 'Documentation',
    component: Documentation
  },
  {
    path: '/modelos',
    name: 'Models',
    component: Models
  },
  {
    path: '/colecoes',
    name: 'Collections',
    component: Collections
  },
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router
