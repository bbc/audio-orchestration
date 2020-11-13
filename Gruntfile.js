/****************************************************************************
 * Copyright 2016 British Broadcasting Corporation
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 ****************************************************************************/
var path = require("path");
var libRoot = [];

// Paths to source files for library builds
libRoot.push(path.resolve("src/client"));
libRoot.push(path.resolve("src/common"));
libRoot.push(path.resolve("src/common/message"));
libRoot.push(path.resolve("src/common/message/impl"));
libRoot.push(path.resolve("src/common/messenger"));
// libRoot.push(path.resolve("src/common/messenger/messagingadapter"));
libRoot.push(path.resolve("src/common/topicparser"));
libRoot.push(path.resolve("src/common/util"));
libRoot.push(path.resolve("src/common/timeline"));
libRoot.push(path.resolve("src"));

module.exports = function(grunt) {

  grunt.initConfig({

    clean: {
      dist: "dist",
      build: "build",
      tests: "build/tests",
      tmp: "build/tmp"
    },

    webpack: {
      lib_browser: {
        entry: './src/client/CloudSyncKit.js',
        output: {
          path: path.resolve("dist/browser"),
          filename: "CloudSyncKit.js",
          chunkFilename: "chunk-[name]-[chunkhash].js",
          library: 'CloudSyncKit',
          libraryTarget: 'commonjs2'
        },
        module: {
          loaders: []
        },
        resolve: {
          root: libRoot
        }
      },

      lib_browser2: {
        entry: './src/client/CloudSynchroniser.js',
        output: {
          path: path.resolve("dist/browser"),
          filename: "CloudSynchroniser.js",
          chunkFilename: "chunk-[name]-[chunkhash].js",
          library: 'CloudSynchroniser',
          libraryTarget: 'commonjs2'
        },
        externals: {
          "dvbcss-clocks": true,
          "dvbcss-protocols": true,
        },
        module: {
          loaders: []
        },
        resolve: {
          root: libRoot
        }
      },
    },

    watch: {
      scripts: {
        files: [
          'src/common/**/*.js',
          'src/client/**/*.js',
          'Gruntfile.js'
        ],
        // Do not call watch here (e.g. do not call 'default').
        // Otherwise there will be two (three, four, ...) watch tasks running
        // after first (second, third ...) invokation of watch!
        // Consequently all attached tasks will be executed two (three, four, ...) times.
        tasks: ['build_lib'],
        options: {
          interrupt: true,
          event: 'all'
        }
      },
    },

    jsdoc: {
        // dist : {
        //     src: ['README.md', 'src/**/*.js', 'test/**/*.js'],
        //     options: {
        //         destination: 'doc'
        //     }
        // },
        msg: {
            src: [
              "src/common/message/readme.md",
              "src/common/message/impl/*.js",
              "src/common/message/*.js",
              "src/common/messenger/**/*.js"
            ],
            options: {
                destination: 'doc/message'
            }
        },
        clientLibrary: {
            src: [
              "src/client/readme.md",
              "src/client/*.js",
              "src/common/state/SyncTLElection.js"
            ],
            options: {
                destination: 'doc/clientlib'
            }
        },
        timeline: {
            src: ["src/common/timeline/*.js"],
            options: {
                destination: 'doc/timeline'
            }
        }
    },

    md: {
        posts: {
            src: 'src/readme.md',
            dest: 'doc/index.html',
            flatten: true
        }
    },
  });


  grunt.loadNpmTasks('grunt-webpack');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-jsdoc');
  grunt.loadNpmTasks('grunt-md');

  // default do nothing
  grunt.registerTask('default', ['build_lib', 'watch:scripts']);

  grunt.registerTask('build_lib', ['clean:dist', 'clean:build', 'webpack:lib_browser', 'webpack:lib_browser2', 'clean:tmp' ]);
  grunt.registerTask('doc', [ 'jsdoc', 'md' ]);

};
