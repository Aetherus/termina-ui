import Vue from 'vue'
import VueRouter from 'vue-router'
import Projects from '@/views/Projects.vue'
import Terms from '@/views/Terms.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    redirect: '/projects'
  },
  {
    path: '/projects',
    name: 'Projects',
    component: Projects
  },
  {
    path: '/projects/:slug/terms',
    name: 'Terms',
    component: Terms
  }
]

const router = new VueRouter({
  routes
})

export default router
