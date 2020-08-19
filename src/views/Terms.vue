<template>
  <v-container>
    <v-alert :type="alert.type" dismissible v-model="showAlert">
      {{alert.message}}
    </v-alert>
    <v-row>
      <v-col cols="12">
        <v-form @submit.prevent="createTerm">
          <v-container>
            <v-row>
              <v-col cols="12" md="2">
                <v-text-field v-model="newTerm.english" label="英文" required
                  :error="!!errors.english" :error-messages="errors.english"/>
              </v-col>
              <v-col cols="12" md="2">
                <v-text-field v-model="newTerm.chinese" label="中文" required
                  :error="!!errors.chinese" :error-messages="errors.chinese"/>
              </v-col>
              <v-col cols="12" md="2">
                <v-select v-model="newTerm.part_of_speech" :items="partsOfSpeech" label="词性" required
                  :error="!!errors.part_of_speech" :error-messages="errors.part_of_speech"/>
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field v-model="newTerm.description" label="解释" required
                  :error="!!errors.description" :error-messages="errors.description"/>
              </v-col>
              <v-col cols="12" md="2">
                <v-btn type="submit" color="success">创建词条</v-btn>
              </v-col>
            </v-row>
          </v-container>
        </v-form>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title>
            <v-btn class="mr-1" icon to="/projects">
              <v-icon>arrow_back</v-icon>
            </v-btn>
            <h3>{{$route | projectName}}</h3>
            <v-spacer/>
            <v-text-field
              v-model="search"
              append-icon="mdi-magnify"
              label="搜索"
              single-line
              hide-details
            />
          </v-card-title>

          <v-data-table
            :headers="headers"
            :items="terms"
            item-key="id"
            :search="search"
            disable-pagination
            hide-default-footer
            sort-by="english"
          >
            <template v-slot:item.english="props">
              <v-edit-dialog
                :return-value.sync="props.item.english"
                @save="updateTerm(props.item)"
              >
                <span style="text-decoration: underline dotted #1976d2">
                  {{ props.item.english }}
                </span>
                <template v-slot:input>
                  <v-text-field
                    v-model="props.item.english"
                    label="Edit"
                    single-line
                    counter
                    ></v-text-field>
                </template>
              </v-edit-dialog>
            </template>
            <template v-slot:item.chinese="props">
              <v-edit-dialog
                :return-value.sync="props.item.chinese"
                @save="updateTerm(props.item)"
              >
                <span style="text-decoration: underline dotted #1976d2">
                  {{ props.item.chinese }}
                </span>
                <template v-slot:input>
                  <v-text-field
                    v-model="props.item.chinese"
                    label="Edit"
                    single-line
                    counter
                    ></v-text-field>
                </template>
              </v-edit-dialog>
            </template>
            <template v-slot:item.part_of_speech="props">
              <v-edit-dialog
                :return-value.sync="props.item.part_of_speech"
                @save="updateTerm(props.item)"
              >
                <span style="text-decoration: underline dotted #1976d2">
                  {{ props.item.part_of_speech }}
                </span>
                <template v-slot:input>
                  <v-select
                    v-model="props.item.part_of_speech"
                    :items="partsOfSpeech"
                    label="Edit"
                  />
                </template>
              </v-edit-dialog>
            </template>
            <template v-slot:item.description="props">
              <v-edit-dialog
                :return-value.sync="props.item.description"
                @save="updateTerm(props.item)"
              >
                <span style="text-decoration: underline dotted #1976d2">
                  {{ props.item.description }}
                </span>
                <template v-slot:input>
                  <v-text-field
                    v-model="props.item.description"
                    label="Edit"
                    single-line
                    counter
                    ></v-text-field>
                </template>
              </v-edit-dialog>
            </template>
            <template slot="item.actions" slot-scope="props">
              <div>
                <v-btn text color="error" @click="destroyTerm(props.item)">删除</v-btn>
              </div>
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
function projectId(route) {
  return route.params['slug'].split('-', 2)[0];
}

function projectName(route) {
  return route.params['slug'].split('-', 2)[1];
}

function newTerm(projectId) {
  return {
    project_id: projectId,
    english: null,
    chinese: null,
    description: null
  }
}

export default {
  name: 'Terms',
  data() {
    return {
      channel: this.$socket.channel(`project:${projectId(this.$route)}`, {}),
      terms: [],
      newTerm: newTerm(projectId(this.$route)),
      selected: [],
      search: "",
      alert: {
        type: 'success',
        message: null
      },
      errors: {},
      headers: [
        {text: '英文', value: 'english', sortable: true, align: 'start'},  
        {text: '中文', value: 'chinese', sortable: true, align: 'start'},
        {text: '词性', value: 'part_of_speech', sortable: true, align: 'start'},
        {text: '解释', value: 'description', sortable: false, align: 'start'},
        {text: '', value: 'actions', sortable: false, align: 'start', filterable: false}
      ],
      partsOfSpeech: [
        '名词',
        '动词',
        '形容词',
        '其他'
      ]
    }
  },

  methods: {
    destroyTerm(term) {
      if (confirm("词条一旦删除无法恢复！你确定要删除？")) {
        this.channel.push('-term', term)
          .receive("ok", () => {
            this.alert = {type: 'success', message: '词条删除成功'}
          })
      }
    },
    createTerm() {
      this.channel.push('+term', this.newTerm)
        .receive("ok", () => {
          this.newTerm = newTerm(projectId(this.$route))
          this.alert = {type: 'success', message: '词条创建成功'}
        })
        .receive("error", errors => this.errors = errors)
    },
    updateTerm(term) {
      this.channel.push('^term', term)
        .receive("ok", () => {
          this.alert = {type: 'success', message: '词条修改成功'}
        })
        .receive("error", () => this.alert = {type: 'error', message: '词条创建失败'})
    }
  },

  computed: {
    showAlert: {
      get() {
        return !!this.alert.message
      },

      set(value) {
        if (!value) {
          this.alert.message = ''
        }
      }
    }
  },

  created() {
    this.channel.join()
                .receive("ok", resp => this.terms = resp.terms)

    this.channel.on('<terms', ({terms}) => this.terms = terms)
    this.channel.on('+term', term => this.terms.push(term))
    this.channel.on('-term', term => this.terms = this.terms.filter(t => t.id != term.id))
    this.channel.on('^term', term => {
      this.terms = this.terms.filter(t => t.id != term.id)
      this.terms.push(term)
    })
  },

  beforeDestroy() {
    this.channel.leave()
  },

  filters: {
    projectId,
    projectName
  }
}
</script>
