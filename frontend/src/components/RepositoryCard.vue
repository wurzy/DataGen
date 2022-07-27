<template>
  <div>
  <a href="https://github.com/wurzy/DataGen" class="github-card" data-github="wurzy/DataGen" style="max-width:310px">
    <h3>{{this.name}}</h3>
    <p>{{this.description}}</p>
    <span class="github-card__meta">
      <span class="github-card__language-icon" style="color: #F1E05A;">●</span> JavaScript
    </span>
    <span class="github-card__meta">
      <i class="fa fa-star" aria-hidden="true"></i>
      <span data-stars>
        {{ this.stars }}
      </span>
    </span>
    <span class="github-card__meta">
      <i class="fa fa-code-fork" aria-hidden="true"></i>
      <span data-forks>
        {{ this.forks }}
      </span>
    </span>
  </a>
  </div>
</template>

<script>
import axios from 'axios'

export default {
    name: "RepositoryCard",
    props: {
      repo: String
    },
    data(){
        return {
            forks: 0,
            stars: 0,
            gitDate: null,
            description: '',
            name: ''
        }
    },
    created(){
        let instance = axios.create()
        delete instance.defaults.headers.common['Authorization'];

        instance.get(this.repo)
            .then(data => {
                this.forks = data.data.forks
                this.stars = data.data.stargazers_count
                this.gitDate = new Date(data.data.updated_at)
                this.description = data.data.description
                this.name = data.data.name
                this.$emit('gitDate',this.gitDate)
            })
            .catch(e => console.log(e))
    }
}
</script>

<style>
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
}

.github-card {
  display: block;
  box-sizing: border-box;
  border: 1px solid #ccc;
  margin-bottom: 10px;
  padding: 20px;
  color: #555;
  text-decoration: none;
  font-size: 13px;
  flex: 1;
  min-width: 250px;
  max-width: 500px;
  margin-top: -50px;
  position: sticky;
  left: 50%;
  top: 50%;
}

.github-card > h3 {
  margin-top: 0;
  color: #4078c0;
  font-size: 15px;
}
.github-card__meta {
  margin-right: 20px;
}
.github-card__meta > i {
  font-size: 16px;
}
</style>