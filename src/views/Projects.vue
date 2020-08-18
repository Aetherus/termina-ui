<template>
  <v-container>
    <v-alert :type="alert.type" dismissible v-model="showAlert">
      {{alert.message}}
    </v-alert>
    <v-row>
      <v-col cols="12">
        <v-form @submit.prevent="createProject">
          <v-container>
            <v-row>
              <v-col cols="12" md="3">
                <v-text-field v-model="newProject.name" label="项目名称" required
                  :error="!!errors.name" :error-messages="errors.name"/>
              </v-col>
              <v-col cols="12" md="7">
                <v-text-field v-model="newProject.description" label="项目描述" required
                  :error="!!errors.description" :error-messages="errors.description"/>
              </v-col>
              <v-col cols="12" md="2">
                <v-btn type="submit" color="success">创建项目</v-btn>
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
            项目一览
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
            :items="projects"
            item-key="id"
            :search="search"
          >
            <template v-slot:item.name="props">
              <v-edit-dialog
                :return-value.sync="props.item.name"
                @save="updateProject(props.item)"
              >{{ props.item.name }}
                <template v-slot:input>
                  <v-text-field
                    v-model="props.item.name"
                    label="Edit"
                    single-line
                    counter
                    ></v-text-field>
                </template>
              </v-edit-dialog>
            </template>
            <template v-slot:item.description="props">
              <v-edit-dialog
                :return-value.sync="props.item.description"
                @save="updateProject(props.item)"
              >{{ props.item.description }}
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
            <template v-slot:item.actions="props">
              <div>
                <v-btn text color="primary" :to="`/projects/${props.item.id}-${props.item.name}/terms`">词条</v-btn>

                <v-dialog v-model="props.item._copyDialog" persistent>
                  <template v-slot:activator="{on, attrs}">
                    <v-btn text color="success" v-bind="attrs" v-on="on">复制</v-btn>
                  </template>

                  <v-card>
                    <v-card-title>
                      <span class="headline">复制 - {{props.item.name}}</span>
                    </v-card-title>
                    <v-card-text>
                      <v-container>
                        <v-row>
                          <v-col cols="12">
                            <v-text-field v-model="copiedProjectName" label="新项目名称" required/>
                          </v-col>
                        </v-row>
                      </v-container>
                    </v-card-text>
                    <v-card-actions>
                      <v-spacer/>
                      <v-btn color="primary" @click="props.item._copyDialog = false">取消</v-btn>
                      <v-btn color="success" @click="copyProject(props.item)">复制</v-btn>
                    </v-card-actions>
                  </v-card>
                </v-dialog>

                <v-btn text color="error" @click="destroyProject(props.item)">删除</v-btn>
              </div>
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
function newProject() {
  return {
    name: '',
    description: ''
  }
}

export default {
  name: 'Projects',
  data() {
    return {
      channel: this.$socket.channel('project:all', {}),
      newProject: newProject(),
      projects: [],
      selected: [],
      search: "",
      copiedProjectName: null,
      alert: {
        type: 'success',
        message: null
      },
      errors: {},
      headers: [
        {text: '名称', value: 'name', sortable: true, align: 'start'},  
        {text: '描述', value: 'description', sortable: false, align: 'start'},
        {text: '', value: 'actions', sortable: false, align: 'start', filterable: false}
      ]
    }
  },

  methods: {
    destroyProject(project) {
      if (confirm("项目一旦删除无法恢复！你确定要删除？")) {
        this.channel.push('-project', project)
          .receive("ok", () => {
            this.alert = {type: 'success', message: '项目删除成功'}
          })
      }
    },
    createProject() {
      this.channel.push('+project', this.newProject)
        .receive("ok", () => {
          this.newProject = newProject()
          this.alert = {type: 'success', message: '项目创建成功'}
        })
        .receive("error", errors => this.errors = errors)
    },
    updateProject(project) {
      this.channel.push('^project', project)
        .receive("ok", () => {
          this.alert = {type: 'success', message: '项目修改成功'}
        })
        .receive("error", () => this.alert = {type: 'error', message: '项目名称已被使用'})
    },
    copyProject(project) {
      this.channel.push('~project', {original_id: project.id, new_name: this.copiedProjectName})
        .receive("ok", () => {
          this.copiedProjectName = null
          this.alert = {type: 'success', message: '项目复制成功'}
        })
        .receive("error", () => this.alert = {type: 'error', message: '项目名称已被使用'})
      project._copyDialog = false;
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
                .receive("ok", resp => this.projects = resp.projects)

    this.channel.on('+project', project => this.projects.push(project))
    this.channel.on('-project', project => this.projects = this.projects.filter(p => p.id != project.id))
    this.channel.on('^project', project => {
      this.projects = this.projects.filter(p => p.id != project.id)
      this.projects.push(project)
    })
  },

  beforeDestroy() {
    this.channel.leave()
  }
}
</script>
