/****************************************************************************
 * Copyright 2016 British Broadcasting Corporation
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 ****************************************************************************/
var path = require("path"),
    libRoot = [],
    testRoot = [];

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

// Paths to source files for test builds
testRoot.push(path.resolve("tests/specs"));
testRoot.push(path.resolve("tests/mocks"));
testRoot = testRoot.concat(libRoot);

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

      messageFactoryNode: {
        entry: './src/common/message/MessageFactory.js',
        output: {
          path: path.resolve("./build/lib"),
          filename: "MessageFactory.js",
          chunkFilename: "chunk-[name]-[chunkhash].js",
          library: 'MessageFactory',
          libraryTarget: 'commonjs2'
        },
        module: {
          loaders: []
        },
        resolve: {
          root: libRoot
        }
      },

      messengerNode: {
        entry: './src/common/messenger/Messenger.js',
        output: {
          path: path.resolve("./build/lib"),
          filename: "Messenger.js",
          chunkFilename: "chunk-[name]-[chunkhash].js",
          library: 'Messenger',
          libraryTarget: 'commonjs2'
        },
        module: {
          loaders: []
        },
        resolve: {
          root: libRoot
        }
      },

      lib_browserES3: {
        entry: './src/main_browser.es3.js',
        output: {
          path: path.resolve("dist/tmp/browser"),
          filename: "[name].es3.js",
          chunkFilename: "chunk-[name]-[chunkhash].js",
          library: 'cloudSync',
          libraryTarget: 'var'
        },
        module: {
          loaders: []
        },
        resolve: {
          root: libRoot
        }
      },

      lib_node: {
        entry: './src/main_node.js',
        output: {
          path: path.resolve("dist/node"),
          filename: "[name].js",
          chunkFilename: "chunk-[name]-[chunkhash].js",
          library: 'cloudSync',
          libraryTarget: 'var'
        },
        module: {
          loaders: []
        },
        resolve: {
          root: libRoot
        }
      },

      specs: {
        entry: "./tests/main.js",
        output: {
          path: path.resolve("build/tests/"),
          filename: "specs.js",
          chunkFilename: "chunk-[name]-[chunkhash].js"
        },
        module: {
          loaders: []
        },
        resolve: {
          root: testRoot
        }
      }
    },

    jasmine: {
      tests: {
        src: [],  // not needed because each test uses require() to load what it is testing
        options: {
          specs: "build/tests/specs.js",
          outfile: "build/tests/_specRunner.html",
          summary: true,
          keepRunner: true
        }
      }
    },

    watch: {
      scripts: {
        files: [
          'src/common/**/*.js',
          'src/client/**/*.js',
          'src/service/**/*.js',
          'tests/**/*.test.js',
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
      tests: {
        files: ['src/**/*.js', 'tests/**/*.test.js', 'Gruntfile.js'],
        tasks: ['build_tests'],
        options: {
          interrupt: true,
          event: 'all'
        }
      },
    },

    jsdoc : {
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

    plantuml: {

        // Create sequence diagrams from *.seqdiag files
        seqdiags: {
            src: ['./src/documentation/**/*.seqdiag'],
            dest: './doc/sequence_diagrams'
        },

        compdiags: {
            src: ['./src/documentation/**/*.compdiag'],
            dest: './doc/component_diagrams'
        }
    },

    // Typescript: JavaScript transpiler
    // (https://www.npmjs.com/package/grunt-ts)
    ts: {
        // Transile browser libs to ES3 (for legacy HbbTV devices)
        hbbtv1: {
            src: ['dist/tmp/browser/main.es3.js'],
            dest: 'dist/browser/main.es3.js',
            options: {
                module: 'system', //or commonjs
                target: 'es3',
                allowJs: true,
                removeComments: true
            }
        }
    }
    // TODO Transpile test builds and run tests with transpiled code

  });


  grunt.loadNpmTasks('grunt-webpack');
  grunt.loadNpmTasks('grunt-contrib-jasmine');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-jsdoc');
  grunt.loadNpmTasks('grunt-ts');
  grunt.loadNpmTasks('grunt-md');
  grunt.loadNpmTasks('grunt-plantuml');

  // default do nothing
  grunt.registerTask('default', ['build_lib', 'watch:scripts']);
  grunt.registerTask('test', ['build_tests', 'watch:tests']);

  grunt.registerTask('build_tests', ['build_lib', 'clean:tests', 'webpack:specs', 'jasmine:tests']);
  grunt.registerTask('build_lib', ['clean:dist', 'clean:build', 'webpack:messageFactoryNode', "webpack:messengerNode", 'webpack:lib_browser', 'webpack:lib_browser2', 'webpack:lib_browserES3', 'webpack:lib_node', "ts", "clean:tmp" ]);
  grunt.registerTask("doc", [ "jsdoc", "md", "plantuml" ]);

};
